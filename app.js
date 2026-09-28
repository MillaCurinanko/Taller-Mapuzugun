/* Kimeltun mapuzugun · lógica compartida */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const PERS = ['inche', 'eimi', 'fey'];
const PERS_ES = ['yo', 'tú', 'él / ella / elle'];

/* ---------- Verbos del taller (Kimeltun 3) ---------- */
const VERBOS = [
  ['zugun', 'hablar', 'zugu', 'n', ['hablé', 'hablaste', 'habló']],
  ['allkütun', 'escuchar', 'allkütu', 'n', ['escuché', 'escuchaste', 'escuchó']],
  ['azümün', 'entender', 'azüm', 'ün', ['entendí', 'entendiste', 'entendió']],
  ['küpan', 'venir', 'küpa', 'n', ['vine', 'viniste', 'vino']],
  ['amun', 'ir', 'amu', 'n', ['fui', 'fuiste', 'fue']],
  ['txipan', 'salir', 'txipa', 'n', ['salí', 'saliste', 'salió']],
  ['mülen', 'estar', 'müle', 'n', ['estoy', 'estás', 'está']],
  ['küzawün', 'trabajar', 'küzaw', 'ün', ['trabajé', 'trabajaste', 'trabajó']],
  ['ülkantun', 'cantar', 'ülkantu', 'n', ['canté', 'cantaste', 'cantó']],
  ['putun', 'tomar, beber', 'putu', 'n', ['tomé', 'tomaste', 'tomó']],
  ['pigen', 'llamarse (me llaman)', 'pige', 'n', ['me llamo', 'te llamas', 'se llama']]
];
const sufijo = (v, p) => [v[3], 'imi', 'i'][p];
const forma = (v, p) => v[2] + sufijo(v, p);
const formaHTML = (v, p) => `<span class="raiz">${v[2]}</span><span class="suf p-${PERS[p]}">${sufijo(v, p)}</span>`;

/* ---------- Rakin ---------- */
const UNI = ['', 'kiñe', 'epu', 'küla', 'meli', 'kechu', 'kayu', 'reqle', 'pura', 'aylla'];
function rakin(n) {
  n = parseInt(n, 10);
  if (!n || n < 1 || n > 999) return '';
  const c = Math.floor(n / 100), d = Math.floor((n % 100) / 10), u = n % 10, p = [];
  if (c) p.push(c === 1 ? 'pataka' : UNI[c] + ' pataka');
  if (d) p.push(d === 1 ? 'mari' : UNI[d] + ' mari');
  if (u) p.push(UNI[u]);
  return p.join(' ');
}

/* ---------- Normalización de respuestas ---------- */
const norm = s => (s || '').toLowerCase().normalize('NFC').replace(/[¿?¡!.,;:«»"“”()]/g, ' ').replace(/\s+/g, ' ').trim();
const sinU = s => norm(s).replace(/ü/g, 'u').replace(/ñ/g, 'n');
function evaluar(valor, respuestas) {
  const lista = respuestas.split('|').map(norm);
  if (lista.includes(norm(valor))) return 'ok';
  if (lista.map(sinU).includes(sinU(valor))) return 'casi';
  return 'mal';
}

/* ---------- Ejercicios con revisión ---------- */
function initEjercicios() {
  $$('.ej').forEach(ej => {
    const fb = $('.fb', ej);
    $('.revisar', ej)?.addEventListener('click', () => {
      const campos = $$('[data-r]', ej);
      let ok = 0, casi = 0;
      campos.forEach(c => {
        c.classList.remove('ok', 'mal', 'casi');
        const r = evaluar(c.value, c.dataset.r);
        c.classList.add(r);
        if (r === 'ok') ok++; if (r === 'casi') casi++;
      });
      let t = `${ok} de ${campos.length} correctas.`;
      if (casi) t += ` ${casi} casi: revisa la ü o la ñ.`;
      if (ok === campos.length) t = `¡Kümey! ${campos.length} de ${campos.length}.`;
      fb.textContent = t;
      fb.className = 'fb ' + (ok === campos.length ? 'bien' : 'no');
    });
    $('.ver', ej)?.addEventListener('click', () => {
      $$('[data-r]', ej).forEach(c => {
        if (c.classList.contains('ok')) return;
        const primera = c.dataset.r.split('|')[0];
        if (c.tagName === 'SELECT') c.value = primera; else c.value = primera;
        c.classList.remove('mal', 'casi'); c.classList.add('visto');
      });
      fb.textContent = 'Respuestas a la vista. Léelas en voz alta.'; fb.className = 'fb';
    });
  });

  /* Opción múltiple: data-ok en el botón correcto, data-fb en el grupo */
  $$('.opc').forEach(g => {
    g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const fb = g.nextElementSibling;
      const bien = b.hasAttribute('data-ok');
      b.classList.remove('ok', 'mal'); void b.offsetWidth;
      b.classList.add(bien ? 'ok' : 'mal');
      if (fb && fb.classList.contains('fb')) {
        fb.textContent = bien ? (g.dataset.fb || '¡Kümey!') : 'Welulay: prueba otra opción.';
        fb.className = 'fb ' + (bien ? 'bien' : 'no');
      }
    });
  });
}

/* ---------- Teclado ü / ñ ---------- */
function initTeclado() {
  const t = document.createElement('div');
  t.className = 'teclado'; t.setAttribute('aria-label', 'Letras especiales');
  t.innerHTML = '<button type="button">ü</button><button type="button">ñ</button>';
  document.body.append(t);
  let activo = null;
  document.addEventListener('focusin', e => {
    if (e.target.matches('input[type=text],input:not([type]),textarea')) { activo = e.target; t.classList.add('activo'); }
  });
  document.addEventListener('focusout', () => setTimeout(() => {
    if (!t.contains(document.activeElement) && !document.activeElement?.matches('input,textarea')) t.classList.remove('activo');
  }, 150));
  t.addEventListener('mousedown', e => e.preventDefault());
  t.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !activo) return;
    const i = activo.selectionStart ?? activo.value.length;
    activo.value = activo.value.slice(0, i) + b.textContent + activo.value.slice(activo.selectionEnd ?? i);
    activo.focus(); activo.setSelectionRange(i + 1, i + 1);
    activo.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/* ---------- Pequeños componentes ---------- */
function initVarios() {
  $$('.carta').forEach(c => c.addEventListener('click', () => c.classList.toggle('girada')));
  $$('[data-alterna]').forEach(b => b.addEventListener('click', () => {
    const d = $(b.dataset.alterna); d.classList.toggle('ver-es');
    b.textContent = d.classList.contains('ver-es') ? 'Ocultar traducción' : 'Mostrar traducción';
  }));
  $$('.imprimir').forEach(b => b.addEventListener('click', () => window.print()));
  window.addEventListener('beforeprint', () => $$('details').forEach(d => d.open = true));
  const aqui = location.pathname.split('/').pop() || 'index.html';
  $$('.cab nav a').forEach(a => { if (a.getAttribute('href') === aqui) a.setAttribute('aria-current', 'page'); });
}

/* Selector genérico de botones (aria-pressed) */
function selector(cont, alElegir) {
  cont.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', cont).forEach(x => x.setAttribute('aria-pressed', x === b));
    alElegir(b);
  });
}

/* ---------- Guía 1: saludos ---------- */
function initChalin() {
  const c = $('#chalin-elige'); if (!c) return;
  const out = $('#chalin-salida'), desc = $('#chalin-desc');
  selector(c, b => {
    out.textContent = 'Mari mari ' + b.dataset.s;
    desc.textContent = b.dataset.d;
    out.classList.remove('nuevo'); void out.offsetWidth; out.classList.add('nuevo');
  });
}

/* ---------- Guía 1: formas de estar (-le / -küle, -la) ---------- */
function initEstados() {
  const c = $('#estados'); if (!c) return;
  const tira = $('#estado-tira'), tr = $('#estado-tr'), neg = $('#estado-neg');
  let actual = null;
  function pinta() {
    if (!actual) return;
    const [raiz, est, es, esNo] = actual.dataset.m.split('|');
    const n = neg.checked;
    tira.innerHTML = `<span data-t="raíz">${raiz}</span><span data-t="estado">${est}</span>` +
      (n ? '<span class="neg" data-t="negación">la</span>' : '') + '<span class="pers" data-t="inche">n</span>';
    tr.innerHTML = `<span class="mz">${raiz}${est}${n ? 'la' : ''}n</span> <span class="es">${n ? esNo : es}</span>`;
  }
  selector(c, b => { actual = b; if (!b.dataset.m.split('|')[3]) neg.checked = false; neg.disabled = !b.dataset.m.split('|')[3]; pinta(); });
  neg.addEventListener('change', pinta);
  $('button', c).click();
}

/* ---------- Guía 1: constructor de presentación ---------- */
function initPresentacion() {
  const f = $('#pres-form'); if (!f) return;
  const v = id => (f.elements[id].value.trim() || '______');
  function pinta() {
    const edad = f.elements.edad.value, r = rakin(edad) || '______';
    const partes = [
      ['Mari mari kom pu che.', 'Hola a todas las personas.'],
      [`Inche ${v('nombre')} pigen.`, `Me llamo ${v('nombre')}.`],
      [`Inche ${r} txipantü nien.`, `Tengo ${edad || '___'} años.`],
      [`Tañi tuwün ${v('tuwun')} ${f.elements.tipo.value} mew.`, `Vengo de ${v('tuwun')}.`],
      [`Tañi küpan ${v('kupan')}.`, `Mi linaje es ${v('kupan')}.`],
      [`Fachantü ${v('mulen')} mew mülen.`, `Hoy vivo en ${v('mulen')}.`],
      [`Fachantü ${f.elements.estado.value}.`, 'Hoy ' + f.elements.estado.selectedOptions[0].dataset.es + '.'],
      ['Fey mütem. Mañum.', 'Eso no más. Gracias.']
    ];
    $('#pres-salida').innerHTML = partes.map(p => `<li><span class="mz">${p[0]}</span><span class="es">${p[1]}</span></li>`).join('');
    $('#pres-rakin').textContent = rakin(edad) ? `${edad} = ${rakin(edad)}` : '';
  }
  f.addEventListener('input', pinta); pinta();
  $('#pres-copiar').addEventListener('click', e => {
    navigator.clipboard.writeText($$('#pres-salida .mz').map(x => x.textContent).join(' '));
    e.target.textContent = 'Copiado'; setTimeout(() => e.target.textContent = 'Copiar texto', 1500);
  });
}

/* Lista de revisión automática sobre un texto libre */
function initChecklist() {
  $$('[data-check]').forEach(ta => {
    const lista = $(ta.dataset.check);
    const revisa = () => {
      const t = norm(ta.value);
      $$('li', lista).forEach(li => li.classList.toggle('hecho', li.dataset.k.split('|').some(k => t.includes(k))));
    };
    ta.addEventListener('input', revisa);
  });
}

/* ---------- Guía 2: escena inche / eimi / fey ---------- */
function initEscena() {
  const e = $('#escena'); if (!e) return;
  let habla = 0, oye = 1;
  const pinta = () => {
    $$('.persona', e).forEach((p, i) => {
      const rol = i === habla ? 0 : i === oye ? 1 : 2;
      p.style.setProperty('--c', `var(--${PERS[rol]})`);
      p.classList.toggle('habla', i === habla);
      $('.rol', p).innerHTML = `${PERS[rol].toUpperCase()}<small>${['la persona que habla', 'a quien le hablo', 'de quien hablo'][rol]}</small>`;
      $('.burbuja', p)?.remove();
      if (i === habla) p.insertAdjacentHTML('afterbegin', `<span class="burbuja">Inche küpan</span>`);
    });
    $('#escena-texto').innerHTML = `Habla <b>${'ABC'[habla]}</b> y le habla a <b>${'ABC'[oye]}</b>. ${'ABC'[3 - habla - oye]} no participa: es <span class="chip p-fey">fey</span>.`;
    $$('#escena-habla button').forEach((b, i) => b.setAttribute('aria-pressed', i === habla));
    $$('#escena-oye button').forEach((b, i) => { b.setAttribute('aria-pressed', i === oye); b.disabled = i === habla; });
  };
  $('#escena-habla').addEventListener('click', ev => {
    const i = $$('#escena-habla button').indexOf(ev.target.closest('button')); if (i < 0) return;
    habla = i; if (oye === habla) oye = (habla + 1) % 3; pinta();
  });
  $('#escena-oye').addEventListener('click', ev => {
    const i = $$('#escena-oye button').indexOf(ev.target.closest('button')); if (i < 0 || i === habla) return;
    oye = i; pinta();
  });
  pinta();
}

/* ---------- Guía 2: máquina de conjugar ---------- */
function initConjugador() {
  const sel = $('#conj-verbos'); if (!sel) return;
  sel.innerHTML = VERBOS.map((v, i) => `<button type="button" aria-pressed="${i === 0}">${v[0]}</button>`).join('');
  const pinta = i => {
    const v = VERBOS[i];
    $('#conj-raiz').innerHTML = `<span class="mz">${v[0]}</span> <span class="es">${v[1]}</span>: quitamos la terminación y queda la raíz <b class="mz">${v[2]}-</b>` +
      (v[3] === 'ün' ? ' (termina en consonante, por eso inche lleva <b>-ün</b>)' : ' (termina en vocal)');
    $('#conj-filas').innerHTML = PERS.map((p, k) =>
      `<div class="conj-fila p-${p}"><span class="chip">${p}</span><span class="forma">${formaHTML(v, k)}</span><span class="es">${v[4][k]}</span></div>`).join('');
  };
  selector(sel, b => pinta($$('button', sel).indexOf(b)));
  pinta(0);
  const t = $('#tabla-verbos');
  if (t) t.innerHTML = VERBOS.map(v => `<tr><td><b class="mz">${v[0]}</b><br><span class="es">${v[1]}</span></td>` +
    PERS.map((p, k) => `<td><span class="mz">${formaHTML(v, k)}</span><br><span class="es">${v[4][k]}</span></td>`).join('') + '</tr>').join('');
}

/* ---------- Guía 2: semáforo ---------- */
function initSemaforo() {
  const s = $('#semaforo'); if (!s) return;
  let actual, puntos = 0, total = 0, racha = 0, espera = false;
  const nueva = () => {
    const v = VERBOS[Math.floor(Math.random() * VERBOS.length)], p = Math.floor(Math.random() * 3);
    actual = { v, p }; espera = false;
    $('#sem-palabra').textContent = forma(v, p);
    $('#sem-fb').textContent = '¿Quién hace la acción?'; $('#sem-fb').className = 'fb';
  };
  const responde = k => {
    if (espera) return; espera = true; total++;
    const { v, p } = actual, bien = k === p;
    if (bien) { puntos++; racha++; } else racha = 0;
    $('#sem-palabra').innerHTML = formaHTML(v, p);
    $('#sem-fb').innerHTML = (bien ? '¡Kümey! ' : 'Welulay. ') +
      `<span class="chip p-${PERS[p]}">${PERS[p]}</span> ${forma(v, p)} = ${v[4][p]}. Termina en <b>-${sufijo(v, p)}</b>.`;
    $('#sem-fb').className = 'fb ' + (bien ? 'bien' : 'no');
    $('#sem-marcador').textContent = `${puntos} de ${total} · racha: ${racha}`;
    setTimeout(nueva, bien ? 1600 : 3000);
  };
  $$('#semaforo .sem-botones button').forEach((b, k) => b.addEventListener('click', () => responde(k)));
  document.addEventListener('keydown', e => { if (['1', '2', '3'].includes(e.key) && !e.target.matches('input,textarea')) responde(+e.key - 1); });
  nueva();
}

/* ---------- Guía 2: rueda de nombres ---------- */
function initRueda() {
  const f = $('#rueda'); if (!f) return;
  const pinta = () => {
    const a = f.elements.a.value.trim() || '______', b = f.elements.b.value.trim() || '______';
    $('#rueda-salida').innerHTML = [
      ['A dice', 0, `Inche ${a} pige`, 'Yo me llamo ' + a],
      ['B le responde a A', 1, `Eimi ${a} pige`, 'Tú te llamas ' + a],
      ['B presenta a A al grupo', 2, `Fey ${a} pige`, 'Se llama ' + a],
      ['B dice su nombre', 0, `Inche ${b} pige`, 'Yo me llamo ' + b]
    ].map(([q, p, t, es]) => `<div class="conj-fila p-${PERS[p]}"><span class="chip">${PERS[p]}</span><span class="forma" style="font-size:1.4rem">${t}<span class="suf p-${PERS[p]}">${['n', 'imi', 'i'][p]}</span></span><span class="es">${q}: ${es}</span></div>`).join('');
  };
  f.addEventListener('input', pinta); pinta();
}

document.addEventListener('DOMContentLoaded', () => {
  initEjercicios(); initTeclado(); initVarios(); initChalin(); initEstados();
  initPresentacion(); initChecklist(); initEscena(); initConjugador(); initSemaforo(); initRueda();
});
