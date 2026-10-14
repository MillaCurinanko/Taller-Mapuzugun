/**
 * Registro del awkantun · Kimeltun mapuzugun
 *
 * Cómo actualizarlo (la URL de config.js no cambia):
 * 1. Abre la planilla del registro → Extensiones → Apps Script.
 * 2. Reemplaza todo el código por este archivo y guarda.
 * 3. Implementar → Administrar implementaciones → lápiz (editar) →
 *    Versión: «Nueva versión» → Implementar.
 *
 * Qué hace:
 * - Guarda cada resultado en la hoja «Respuestas». Las columnas antiguas
 *   (fecha, sesion, dupla, puntaje, errores, respuestas) se mantienen y se
 *   agregan solas las nuevas: actividad, nivel, con_pista.
 * - Autocorrección: el puntaje se vuelve a calcular aquí a partir de las
 *   respuestas (aciertos al primer intento), no se confía en el que manda
 *   el celular. «errores» guarda los id de las preguntas falladas.
 * - doGet filtra por ?sesion=, ?actividad= y ?nivel= para el panel, y solo
 *   entrega datos si recibe la clave correcta (?clave=). Así nadie más puede
 *   ver los resultados, aunque encuentre resultados.html.
 */

/* ▼▼▼ CAMBIA ESTA CLAVE por una tuya (sin espacios). Es la que escribirás en el panel. ▼▼▼ */
const CLAVE = 'kimeltun';

const HOJA = 'Respuestas';
const COLUMNAS = ['fecha', 'sesion', 'dupla', 'puntaje', 'errores', 'respuestas', 'actividad', 'nivel', 'con_pista'];

function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  const cab = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
  COLUMNAS.forEach(c => {
    if (!cab.includes(c)) { cab.push(c); sh.getRange(1, cab.length).setValue(c); }
  });
  return { sh, cab };
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const resp = Array.isArray(d.respuestas) ? d.respuestas.slice(0, 20) : [];
    const primero = r => r.ok === true && (r.intento || 1) === 1;
    const fila = {
      fecha: new Date(),
      sesion: String(d.sesion || '').slice(0, 60),
      dupla: String(d.dupla || '').slice(0, 40),
      puntaje: resp.length ? resp.filter(primero).length : Number(d.puntaje) || 0,
      errores: resp.filter(r => !r.ok).map(r => r.id).join(', '),
      respuestas: JSON.stringify(resp),
      actividad: String(d.actividad || '').slice(0, 30),
      nivel: String(d.nivel || '').slice(0, 20),
      con_pista: resp.filter(r => r.ok === true && r.intento === 2).length
    };
    const { sh, cab } = hoja_();
    sh.appendRow(cab.map(c => (c in fila ? fila[c] : '')));
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!CLAVE || CLAVE === 'cambia-esta-clave' || p.clave !== CLAVE) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'clave' })).setMimeType(ContentService.MimeType.JSON);
  }
  const { sh, cab } = hoja_();
  const n = sh.getLastRow() - 1;
  const filas = n > 0 ? sh.getRange(2, 1, n, cab.length).getValues() : [];
  const datos = filas
    .map(f => Object.fromEntries(cab.map((c, i) => [c, f[i]])))
    .filter(o => (!p.sesion || String(o.sesion) === p.sesion) &&
                 (!p.actividad || String(o.actividad) === p.actividad) &&
                 (!p.nivel || String(o.nivel) === p.nivel))
    .map(o => {
      let r = [];
      try { r = JSON.parse(o.respuestas || '[]'); } catch (err) { r = []; }
      return { ...o, respuestas: r, puntaje: Number(o.puntaje) || 0, con_pista: Number(o.con_pista) || 0 };
    });
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(ContentService.MimeType.JSON);
}
