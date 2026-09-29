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


/* ---------- Adornos SVG (dibujos originales) ---------- */
const ADORNOS = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
<symbol id="copihue" viewBox="0 0 120 160"><path d="M60 158C58 120 40 90 20 60M40 90C60 70 70 50 68 20" stroke="#3E6B3A" stroke-width="3" fill="none"/>
<path d="M30 100c-18-4-24-16-22-28 12 2 22 12 22 28zM52 76c14-10 28-8 34 2-12 8-24 8-34-2zM36 82c-16-10-18-24-12-34 10 8 14 20 12 34z" fill="#3E6B3A"/>
<path d="M20 60c-8 4-18 0-20-10 6-2 12 0 16 4l2-8c4 2 6 8 2 14z" fill="#B3262E"/><path d="M8 48c2 6 8 10 12 12" stroke="#7A1418" stroke-width="1.5" fill="none"/>
<path d="M68 20c-2-10 4-18 14-20 4 10-2 18-8 20 6 2 10 6 10 12-8 2-14-4-16-12z" fill="#B3262E"/><circle cx="72" cy="30" r="2" fill="#F6F2E8"/></symbol>
<symbol id="pewen" viewBox="0 0 120 160"><path d="M58 160V40h4v120z" fill="#8A5A2B"/>
<g fill="#3E6B3A"><path d="M60 30C40 30 22 36 8 48c18-4 36-6 52-4zM60 30c20 0 38 6 52 18-18-4-36-6-52-4z"/><path d="M60 48C44 48 30 54 18 64c14-4 28-5 42-3zM60 48c16 0 30 6 42 16-14-4-28-5-42-3z"/><path d="M60 14c-12 0-22 4-30 10 10-2 20-3 30-2zM60 14c12 0 22 4 30 10-10-2-20-3-30-2z"/><path d="M60 0c-4 6-6 12-6 18h12c0-6-2-12-6-18z"/></g></symbol>
<symbol id="kultxug" viewBox="0 0 120 120"><ellipse cx="60" cy="60" rx="54" ry="54" fill="#E9D3A8" stroke="#8A5A2B" stroke-width="5"/><ellipse cx="60" cy="60" rx="44" ry="44" fill="none" stroke="#8A5A2B" stroke-width="1.5" stroke-dasharray="3 5"/>
<path d="M92 108l24 10" stroke="#8A5A2B" stroke-width="4" stroke-linecap="round"/><circle cx="118" cy="119" r="3" fill="#B3262E"/></symbol>
<symbol id="txegul" viewBox="0 0 140 150"><path d="M58 96l-4 50M74 96l6 50" stroke="#B3262E" stroke-width="3"/>
<path d="M30 70c0-20 20-34 44-30 22 4 36 20 34 40-16 14-40 20-60 14-12-4-18-12-18-24z" fill="#8C7B63"/><path d="M34 76c10 14 36 18 58 10-10 10-38 16-54 6z" fill="#fff"/>
<path d="M70 42c4-14 18-20 28-16 6 2 8 10 4 16l-8 6z" fill="#8C7B63"/><path d="M78 40c6-4 14-4 20 0" stroke="#16192B" stroke-width="10" stroke-linecap="round"/>
<path d="M102 32l18 4-16 4z" fill="#B3262E"/><path d="M84 28c-10-10-24-14-36-12" stroke="#16192B" stroke-width="2" fill="none"/><circle cx="92" cy="33" r="2.5" fill="#B3262E"/></symbol>
</svg>`;
function initAdornos() { document.body.insertAdjacentHTML('afterbegin', ADORNOS); }

/* ---------- Grafemarios ---------- */
const aUnificado = s => s.replace(/tx/g, 'tr').replace(/z/g, 'd').replace(/g/g, 'ng').replace(/q/g, 'g');
const aRagileo = s => s.replace(/tx/g, 'x').replace(/ü/g, 'v').replace(/ll/g, 'j');
function initGrafemario() {
  const c = $('#grafemas'); if (!c) return;
  const inp = $('#conv-in');
  const pinta = () => {
    const w = inp.value.toLowerCase();
    $('#conv-u').textContent = aUnificado(w) || '—';
    $('#conv-r').textContent = aRagileo(w) || '—';
  };
  inp.addEventListener('input', pinta); pinta();
  selector(c, b => { inp.value = b.dataset.w; pinta(); inp.focus(); });
}

/* ---------- Glosario breve para el chat ---------- */
const GLOSA = {
  'mari mari': 'saludo: diez y diez, las dos manos', mari: 'diez', lamgen: 'hermana o hermano (mujer–mujer, mujer–hombre)',
  peñi: 'hermano (entre hombres)', ñaña: 'mujer cercana', chacha: 'hombre cercano', papay: 'mujer mayor', chachay: 'hombre mayor',
  inche: 'yo', eimi: 'tú', fey: 'él / ella / elle', ka: 'también, y', kay: '¿y…? (suele ir con eimi)',
  chumleimi: 'chum (cómo) + le (estado) + imi (tú): ¿cómo estás?', chum: 'cómo',
  kümelkalen: 'küme (bueno) + le (estado) + n (yo): estoy bien', kümelkalelan: 'küme + le + la (no) + n: no estoy bien',
  txemolen: 'estoy bien de salud', ürkülen: 'ür + küle (estado) + n: tengo cansancio', kütxankülen: 'estoy con enfermedad',
  mañumkülen: 'estoy con gratitud', küme: 'bueno', pigen: 'pi (decir) + ge (me) + n: me dicen, me llamo',
  pigeimi: 'te dicen, te llamas (-imi: tú)', inei: 'quién', iney: 'quién', chew: 'dónde', mew: 'en (lugar)',
  mülen: 'müle (estar) + n (yo): estoy', müleimi: 'estás (-imi: tú)', mülei: 'está (-i: fey)', fachantü: 'hoy',
  feley: 'de acuerdo, así es', pewkayal: 'hasta luego', mañum: 'gracias', tañi: 'mi', tuwün: 'lugar de origen', küpan: 'linaje; venir',
  mapu: 'tierra, territorio', waria: 'ciudad', welu: 'pero', may: 'sí', txipantü: 'año', nien: 'tengo'
};
function glosar(texto) {
  const t = norm(texto), out = [];
  if (t.includes('mari mari')) out.push(['mari mari', GLOSA['mari mari'], 'kallfu']);
  t.split(' ').forEach(w => {
    if (!w || (w === 'mari' && t.includes('mari mari'))) return;
    if (GLOSA[w]) out.push([w, GLOSA[w], w === 'inche' ? 'inche' : w === 'eimi' ? 'eimi' : w === 'fey' ? 'fey' : 'kallfu']);
    else if (w.length > 4 && w.endsWith('imi')) out.push([w, 'termina en -imi: la acción la hace eimi (tú)', 'eimi']);
    else if (w.length > 3 && w.endsWith('n')) out.push([w, '¿termina en -n? podría ser inche (yo)', 'inche']);
  });
  return out.filter((x, i, a) => a.findIndex(y => y[0] === x[0]) === i);
}

/* ---------- Guía 1: chalin por mensajes ---------- */
function initChat() {
  const box = $('#wsp-msgs'); if (!box) return;
  const inp = $('#wsp-in'), sug = $('#wsp-sug'), expl = $('#wsp-explica'), gl = $('#wsp-glosa');
  const hora = () => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const ESTADOS = ['kümelkalen', 'kümelkalelan', 'txemolen', 'ürkülen', 'kütxankülen', 'mañumkülen', 'txemolelan', 'ürkülelan'];
  let nombre = '', paso = 0, fallos = 0, ocupado = false;
  const PASOS = [
    { ella: () => ['Mari mari lamgen!'], tarea: 'Responde el saludo.', sug: ['Mari mari lamgen', 'Mari mari peñi'],
      ok: t => t.includes('mari mari'),
      exp: () => '<p><b class="mz">Mari mari</b> es el saludo. <b class="mz">Mari</b> es «diez»: nos damos las dos manos.</p><p><b class="mz">Lamgen</b> se usa entre mujeres, o entre mujer y hombre. Entre hombres se dice <b class="mz">peñi</b>.</p>' },
    { ella: () => ['¿Chumleimi?'], tarea: 'Te pregunta cómo estás. Responde con una forma de estar.', sug: ['Kümelkalen', 'Ürkülen', 'Txemolen'],
      ok: t => ESTADOS.some(e => t.includes(e)),
      exp: t => { const e = ESTADOS.find(x => t.includes(x)); return `<p>Ella preguntó <b class="mz">chum-le-<span class="suf p-eimi">imi</span></b>: termina en <b>-imi</b> porque te habla a ti (eimi).</p><p>Tú respondiste <b class="mz">${e}</b>: ${GLOSA[e] || ''}. Termina en <b class="suf p-inche">-n</b> porque hablas de ti (inche).</p>`; } },
    { ella: () => [], tarea: 'Ahora pregúntale de vuelta: ¿y tú?', sug: ['¿Eimi kay?', '¿Chumleimi?'],
      ok: t => t.includes('eimi kay') || t.includes('chumleimi') || t.includes('eimi ka'),
      exp: () => '<p><b class="mz">¿Eimi kay?</b> = ¿y tú? <b class="mz">Kay</b> es una variación de <b class="mz">ka</b> que suele ir con eimi.</p>' },
    { ella: () => ['Inche ka kümelkalen.', '¿Inei pigeimi?'], tarea: 'Te pregunta tu nombre. Usa: Inche ___ pigen.', sug: ['Inche ___ pigen'],
      ok: t => /pigen/.test(t),
      antes: () => '<p><b class="mz">Inche ka kümelkalen</b>: yo también estoy bien. <b class="mz">Ka</b> = también.</p>',
      exp: t => { const m = t.match(/(?:inche )?(\S+) pigen/); nombre = m && m[1] !== 'inche' ? m[1][0].toUpperCase() + m[1].slice(1) : ''; return '<p><b class="mz">Pigen</b> = pi (decir) + ge (a mí) + <span class="suf p-inche">n</span> (inche). Literalmente «me dicen».</p>'; } },
    { ella: () => [`Feley${nombre ? ', ' + nombre : ''}. Inche Rayen pigen.`, '¿Chew müleimi fachantü?'], tarea: '¿Dónde estás hoy? Usa: ___ mew mülen.', sug: ['Santiago mew mülen', 'Ruka mew mülen'],
      ok: t => /\bmülen\b/.test(t),
      exp: () => '<p><b class="mz">Mew</b> marca el lugar (en). <b class="mz">Müle-<span class="suf p-inche">n</span></b>: estoy. Ella preguntó <b class="mz">müle-<span class="suf p-eimi">imi</span></b>: estás.</p>' },
    { ella: () => ['Inche Temuko mew mülen. Pewkayal lamgen!'], tarea: 'Despídete.', sug: ['Feley. Pewkayal lamgen', 'Mañum lamgen'],
      ok: t => /pewkayal|feley|mañum/.test(t),
      exp: () => '<p><b class="mz">Pewkayal</b>: hasta luego. <b class="mz">Feley</b>: de acuerdo, así es. <b class="mz">Mañum</b>: gracias.</p>' }
  ];
  const agrega = (html, quien) => { box.insertAdjacentHTML('beforeend', `<div class="msg ${quien}">${html}${quien !== 'sis' ? `<small>${hora()}</small>` : ''}</div>`); box.scrollTop = box.scrollHeight; };
  const escribe = (lineas, fin) => {
    ocupado = true;
    const sig = i => {
      if (i >= lineas.length) { ocupado = false; fin && fin(); return; }
      box.insertAdjacentHTML('beforeend', '<div class="escribiendo"><i></i><i></i><i></i></div>'); box.scrollTop = box.scrollHeight;
      setTimeout(() => { $('.escribiendo', box)?.remove(); agrega(lineas[i], 'ella'); setTimeout(() => sig(i + 1), 350); }, 900);
    };
    sig(0);
  };
  const muestraPaso = () => {
    const p = PASOS[paso];
    sug.innerHTML = p.sug.map(x => `<button type="button">${x}</button>`).join('');
    $('#wsp-tarea').textContent = p.tarea;
  };
  const avanza = () => {
    if (paso >= PASOS.length) {
      escribe(['Kümey! Pewkayal.'], () => { agrega('Terminaste el chalin. Reinícialo y prueba otras respuestas.', 'sis'); sug.innerHTML = ''; $('#wsp-tarea').textContent = '¡Kümey!'; });
      return;
    }
    const p = PASOS[paso];
    if (p.antes) expl.innerHTML = p.antes();
    escribe(p.ella(), muestraPaso);
  };
  const envia = () => {
    const txt = inp.value.trim(); if (!txt || ocupado) return;
    agrega(txt.replace(/</g, '&lt;'), 'yo'); inp.value = ''; gl.innerHTML = '';
    const t = norm(txt), p = PASOS[paso];
    if (p.ok(t)) { fallos = 0; expl.innerHTML = p.exp(t); paso++; setTimeout(avanza, 500); }
    else { fallos++; agrega(`Pista: ${p.tarea} ${fallos > 1 ? 'Toca una sugerencia si necesitas ayuda.' : ''}`, 'sis'); }
  };
  $('#wsp-env').addEventListener('click', envia);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') envia(); });
  inp.addEventListener('input', () => {
    gl.innerHTML = glosar(inp.value).map(([w, d, c]) => `<span class="gl" style="--c:var(--${c})"><b>${w}</b>: ${d}</span>`).join('');
  });
  sug.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; inp.value = b.textContent; inp.focus(); inp.dispatchEvent(new Event('input')); });
  $('#wsp-reinicia').addEventListener('click', () => { box.innerHTML = ''; paso = 0; fallos = 0; nombre = ''; expl.innerHTML = '<p>Aquí aparece la explicación de cada respuesta.</p>'; avanza(); });
  avanza();
}

/* ---------- Guía 1: de español a mapuzugun (estados) ---------- */
const ESTADOS_ES = [
  [/me siento bien|de [aá]nimo/, 'kümezuam', 'küle', 'me siento bien de ánimo', 'Planilla', false],
  [/bien de salud|\bsan[oa]\b|\bsane\b/, 'txemo', 'le', 'bien de salud', 'Guía 1', false],
  [/\bbien\b/, 'kümelka', 'le', 'bien', 'Guía 1', false],
  [/cansad|cansancio/, 'ür', 'küle', 'con cansancio', 'Guía 1', false],
  [/enferm/, 'kütxan', 'küle', 'con enfermedad', 'Guía 1', false],
  [/agradecid|gratitud/, 'mañum', 'küle', 'con gratitud', 'Guía 1', false],
  [/energ[ií]a|fuerza/, 'newen', 'küle', 'con energía (newen)', 'Planilla', false],
  [/content|feliz|alegr/, 'ayüw', 'küle', 'con alegría', 'Por verificar', true],
  [/trist/, 'weñag', 'küle', 'con tristeza', 'Por verificar', true]
];
function initTraductor() {
  const inp = $('#tr-in'); if (!inp) return;
  const out = $('#tr-salida');
  const traduce = () => {
    const t = norm(inp.value);
    if (!t) { out.innerHTML = ''; return; }
    const e = ESTADOS_ES.find(x => x[0].test(t));
    if (!e) { out.innerHTML = '<p class="fb no">Aún no tengo esa palabra. Prueba con: bien, bien de salud, cansado, enfermo, agradecido, con energía, contento, triste.</p>'; return; }
    const p = /(^| )(tú|tu|vos|estás|estas)( |$)/.test(t) ? 1 : /(^| )(él|el|ella|elle|está)( |$)/.test(t) ? 2 : 0;
    const neg = /\bno\b/.test(t), hoy = /\bhoy\b/.test(t);
    const suf = ['n', 'imi', 'i'][p], pron = ['Inche', 'Eimi', 'Fey'][p];
    const palabra = e[1] + e[2] + (neg ? 'la' : '') + suf;
    const verificar = e[5] || p > 0;
    out.innerHTML =
      `<div class="morf">${hoy ? '<span class="tiempo" data-t="hoy">fachantü</span>' : ''}<span data-t="raíz">${e[1]}</span><span data-t="estado">${e[2]}</span>` +
      (neg ? '<span class="neg" data-t="negación">la</span>' : '') + `<span class="pers p-${PERS[p]}" data-t="${PERS[p]}">${suf}</span></div>` +
      `<p class="tr-frase">${hoy ? 'Fachantü ' + pron.toLowerCase() : pron} ${palabra}.</p>` +
      `<p class="es">${['Yo', 'Tú', 'Él / ella / elle'][p]} ${neg ? 'no ' : ''}${['estoy', 'estás', 'está'][p]} ${e[3]}${hoy ? ', hoy' : ''}.</p>` +
      `<span class="fuente${verificar ? ' verif' : ''}">${verificar ? (e[5] ? 'Palabra por verificar con hablante' : 'Forma derivada: verificar con hablante') : 'Fuente: ' + e[4]}</span>`;
  };
  inp.addEventListener('input', traduce);
  $$('#tr-ej button').forEach(b => b.addEventListener('click', () => { inp.value = b.textContent; traduce(); }));
}

document.addEventListener('DOMContentLoaded', () => {
  initAdornos(); initGrafemario(); initChat(); initTraductor();
  initEjercicios(); initTeclado(); initVarios(); initChalin(); initEstados();
  initPresentacion(); initChecklist(); initEscena(); initConjugador(); initSemaforo(); initRueda();
});
