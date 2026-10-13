#!/usr/bin/env python3
"""
exportar_datos.py · Kimeltun mapuzugun

Lee el Excel maestro (privado) y escribe en datos/*.json solo lo validado,
con la grafía normalizada a Azümchefe. El Excel nunca se sube al repositorio.

Uso:
    python scripts/exportar_datos.py RUTA/Mapuzugun_maestro.xlsx
    python scripts/exportar_datos.py RUTA/Mapuzugun_maestro.xlsx --minimo validada
    python scripts/exportar_datos.py RUTA/Mapuzugun_maestro.xlsx --informe informe.txt

Opciones:
    --minimo   validada | respaldada (por defecto) | una
               validada   = solo «Validada»
               respaldada = «Validada» y «Respaldada»
               una        = además «Una fuente»
               «Por confirmar» nunca se exporta.
    --salida   carpeta de destino (por defecto: datos/ junto a este repositorio)
    --informe  archivo de texto con los cambios de grafía y lo que quedó fuera.
               Guárdalo fuera del repositorio si contiene notas privadas.

Requiere: pip install openpyxl
"""
import argparse
import datetime
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("Falta openpyxl. Instálalo con: pip install openpyxl")

RAIZ_REPO = Path(__file__).resolve().parent.parent
NIVELES = {
    "validada": {"Validada"},
    "respaldada": {"Validada", "Respaldada"},
    "una": {"Validada", "Respaldada", "Una fuente"},
}
# Notas de «Uso por verificar» que dejan una fila fuera aunque esté validada
EXCLUIR_SI = ("dudoso", "no atestiguada", "falta la glosa")


# ---------------------------------------------------------------- grafía
VOCAL = "aeiouü"
NO_AZUMCHEFE = re.compile(r"[bdjvháéíóú]|c(?!h)|(?<!t)x|(?<![cs])h")
ESPANOL = {"que", "aunque", "tengo", "mau", "hay", "muy", "soy", "voy", "estoy", "hoy", "rey", "ley", "seis", "veinte"}
informe_grafia = Counter()
revisar_ng = Counter()


def _palabra_azumchefe(w):
    """Normaliza una palabra mapuzugun a Azümchefe.

    - Semivocal: i → y y u → w después de vocal, al final de sílaba
      (eimi → eymi, chumlei → chumley, leufü → lewfü). Se respeta -iñ / -in
      final (zuguiñ), como en la pestaña Sufijos.
    - No se tocan palabras que no pueden ser Azümchefe (letras b, c sin h,
      d, j, v, x sin t, tildes): suelen ser español u otra grafía.
    - «ng» no se cambia (kutxan-ge-lan, newen-gen son correctas): se avisa
      en el informe para revisar a mano.
    """
    original = w
    low = w.lower()
    if NO_AZUMCHEFE.search(low) or low in ESPANOL:
        return original
    if "ng" in low:
        revisar_ng[original] += 1
    chars = list(low)
    for k, ch in enumerate(chars):
        if ch not in "iu" or k == 0:
            continue
        prev = chars[k - 1]
        nxt = chars[k + 1] if k + 1 < len(chars) else ""
        if prev not in VOCAL or prev == ch:
            continue
        if ch == "i" and low[k:] in ("iñ", "in"):
            continue
        if nxt == "" or nxt not in VOCAL:
            if ch == "i" and nxt == "y":
                continue
            if ch == "u" and nxt == "w":
                continue
            chars[k] = "y" if ch == "i" else "w"
    nuevo = "".join(chars)
    # Recupera mayúscula inicial
    if original[:1].isupper():
        nuevo = nuevo[:1].upper() + nuevo[1:]
    if nuevo != original and nuevo.lower() != original.lower():
        informe_grafia[f"{original} → {nuevo}"] += 1
    return nuevo


def azumchefe(texto):
    """Aplica la normalización a un texto en mapuzugun, palabra por palabra.

    Los nombres propios (con mayúscula y que no van al inicio de frase)
    no se tocan.
    """
    if not texto:
        return ""
    texto = unicodedata.normalize("NFC", str(texto)).strip()
    partes = re.split(r"([A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)", texto)
    salida = []
    inicio_frase = True
    for p in partes:
        if re.fullmatch(r"[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+", p or ""):
            if p[:1].isupper() and not inicio_frase:
                salida.append(p)  # nombre propio
            else:
                salida.append(_palabra_azumchefe(p))
            inicio_frase = False
        else:
            salida.append(p)
            if re.search(r"[.!?¡¿«\"/\n]", p or ""):
                inicio_frase = True
    return "".join(salida)


# ---------------------------------------------------------------- limpieza
def limpio(v):
    if v is None:
        return ""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", str(v))).strip()


def sin_duplicados(significado):
    """«cara / rostro; Cara, rostro» → «cara / rostro»."""
    partes = [p.strip() for p in limpio(significado).split(";") if p.strip()]
    if not partes:
        return ""
    clave = lambda s: set(re.findall(r"\w+", s.lower()))
    primero = clave(partes[0])
    resto = [p for p in partes[1:] if not clave(p) <= primero]
    return "; ".join([partes[0]] + resto)


def leer(ws):
    filas = list(ws.iter_rows(values_only=True))
    cab = [limpio(c) for c in filas[0]]
    return [dict(zip(cab, f)) for f in filas[1:] if f and f[0]]


class Filtro:
    def __init__(self, minimo):
        self.aceptadas = NIVELES[minimo]
        self.fuera = Counter()

    def pasa(self, hoja, fila):
        val = limpio(fila.get("Validación"))
        nota = limpio(fila.get("Uso por verificar")).lower()
        if val not in self.aceptadas:
            self.fuera[f"{hoja}: {val or 'sin validación'}"] += 1
            return False
        if any(x in nota for x in EXCLUIR_SI):
            self.fuera[f"{hoja}: uso por verificar ({nota[:40]})"] += 1
            return False
        return True


def verificar(fila):
    return limpio(fila.get("Uso por verificar")) or None


# ---------------------------------------------------------------- hojas
def exportar_vocabulario(wb, f):
    out = []
    for r in leer(wb["Vocabulario"]):
        if not f.pasa("Vocabulario", r):
            continue
        contexto = limpio(r.get("Contexto de uso"))
        es = sin_duplicados(r.get("Significado / función"))
        if not es or "POR TRADUCIR" in contexto.upper():
            f.fuera["Vocabulario: sin traducción"] += 1
            continue
        out.append({
            "id": r["ID"],
            "mz": azumchefe(r.get("Forma")),
            "es": es,
            "tipo": limpio(r.get("Tipo gramatical")),
            "contexto": contexto.capitalize() if contexto.isupper() else contexto,
            "ejemplo": azumchefe(r.get("Ejemplo")) or None,
            "ejemplo_es": limpio(r.get("Traducción del ejemplo")) or None,
            "validacion": limpio(r.get("Validación")),
            "verificar": verificar(r),
        })
    return sorted(out, key=lambda x: x["mz"].lower())


def exportar_verbos(wb, f):
    filas = leer(wb["Verbos"])
    lemas, formas = {}, {}
    for r in filas:
        lema = azumchefe(r.get("Lema")).lower()
        forma = azumchefe(r.get("Forma registrada")).lower()
        if not lema or lema.endswith("-"):
            f.fuera["Verbos: lema incompleto"] += 1
            continue
        if not f.pasa("Verbos", r):
            continue
        es = sin_duplicados(r.get("Significado / función"))
        if forma == lema:
            if lema in lemas:
                continue
            raiz = azumchefe(r.get("Raíz")).lower()
            final = limpio(r.get("Final de raíz")).lower()
            if raiz.endswith("i"):
                final = "i"
            lemas[lema] = {
                "id": r["ID"],
                "mz": lema,
                "raiz": raiz,
                "final": final or ("consonante" if lema.endswith("ün") else "vocal"),
                "es": es,
                "transitividad": limpio(r.get("Transitividad")) or None,
                "campo": limpio(r.get("Campo semántico")) or None,
                "validacion": limpio(r.get("Validación")),
                "verificar": verificar(r),
            }
        else:
            formas.setdefault(lema, []).append({
                "id": r["ID"], "mz": forma, "es": es,
                "ejemplo": azumchefe(r.get("Ejemplo")) or None,
                "verificar": verificar(r),
            })
    for lema, lista in formas.items():
        if lema in lemas:
            lemas[lema]["formas"] = lista
    return sorted(lemas.values(), key=lambda x: x["mz"])


def exportar_sufijos(wb, f):
    out = []
    for r in leer(wb["Sufijos y gramática"]):
        if not f.pasa("Sufijos", r):
            continue
        out.append({
            "id": r["ID"],
            "morfema": limpio(r.get("Morfema")),
            "variantes": limpio(r.get("Variantes / otras grafías")) or None,
            "tipo": limpio(r.get("Tipo")) or None,
            "funcion": limpio(r.get("Función")),
            "modo": limpio(r.get("Modo")) or None,
            "persona": limpio(r.get("Persona")) or None,
            "numero": limpio(r.get("Número")) or None,
            "orden": limpio(r.get("Orden (casilla)")) or None,
            "segmentado": azumchefe(r.get("Ejemplo segmentado")) or None,
            "ejemplo": azumchefe(r.get("Ejemplo")) or None,
            "es": limpio(r.get("Traducción")) or None,
            "nota": limpio(r.get("Nota gramatical")) or None,
            "validacion": limpio(r.get("Validación")),
            "verificar": verificar(r),
        })
    return out


def exportar_expresiones(wb, f):
    out = []
    for r in leer(wb["Expresiones de la vida diaria"]):
        if not f.pasa("Expresiones", r):
            continue
        situacion = limpio(r.get("Situación"))
        if "POR CONFIRMAR" in situacion.upper():
            f.fuera["Expresiones: situación por confirmar"] += 1
            continue
        out.append({
            "id": r["ID"],
            "mz": azumchefe(r.get("Expresión")),
            "es": sin_duplicados(r.get("Significado")),
            "situacion": situacion or None,
            "registro": limpio(r.get("Registro")) or None,
            "ejemplo": azumchefe(r.get("Ejemplo / diálogo")) or None,
            "ejemplo_es": limpio(r.get("Traducción del ejemplo")) or None,
            "rapida": limpio(r.get("Lengua rápida")).lower() == "sí",
            "validacion": limpio(r.get("Validación")),
            "verificar": verificar(r),
        })
    return out


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="Exporta el Excel maestro a datos/*.json")
    ap.add_argument("maestro", help="Ruta al Excel maestro (.xlsx)")
    ap.add_argument("--minimo", choices=NIVELES, default="respaldada")
    ap.add_argument("--salida", default=str(RAIZ_REPO / "datos"))
    ap.add_argument("--informe", help="Archivo de texto con el detalle de cambios")
    a = ap.parse_args()

    maestro = Path(a.maestro).expanduser()
    if not maestro.exists():
        sys.exit(f"No encuentro el archivo: {maestro}")
    wb = openpyxl.load_workbook(maestro, read_only=True, data_only=True)
    f = Filtro(a.minimo)

    datos = {
        "vocabulario": exportar_vocabulario(wb, f),
        "verbos": exportar_verbos(wb, f),
        "sufijos": exportar_sufijos(wb, f),
        "expresiones": exportar_expresiones(wb, f),
    }
    salida = Path(a.salida)
    salida.mkdir(parents=True, exist_ok=True)
    for nombre, lista in datos.items():
        (salida / f"{nombre}.json").write_text(
            json.dumps(lista, ensure_ascii=False, indent=1), encoding="utf-8")
    meta = {
        "exportado": datetime.date.today().isoformat(),
        "grafemario": "Azümchefe",
        "criterio": sorted(NIVELES[a.minimo]),
        "conteos": {k: len(v) for k, v in datos.items()},
    }
    (salida / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"Exportado a {salida} (criterio: {', '.join(meta['criterio'])})")
    for k, v in meta["conteos"].items():
        print(f"  {k:12} {v:4} entradas")
    print(f"  Cambios de grafía: {sum(informe_grafia.values())} ({len(informe_grafia)} distintos)")
    print(f"  Palabras con «ng» para revisar: {len(revisar_ng)}")
    print(f"  Filas fuera: {sum(f.fuera.values())}")

    if a.informe:
        lineas = ["# Cambios de grafía (original → Azümchefe)"]
        lineas += [f"{k}  ×{n}" for k, n in sorted(informe_grafia.items())]
        lineas += ["", "# Palabras con «ng» (revisar: ¿velar nasal = g, o n + g?)"]
        lineas += [f"{k}  ×{n}" for k, n in sorted(revisar_ng.items())]
        lineas += ["", "# Filas que quedaron fuera"]
        lineas += [f"{k}: {n}" for k, n in f.fuera.most_common()]
        Path(a.informe).write_text("\n".join(lineas), encoding="utf-8")
        print(f"  Informe: {a.informe}")


if __name__ == "__main__":
    main()
