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
    const acc = $('.acciones', ej);
    if (acc && $('.revisar', ej) && !$('.reintentar', ej)) {
      acc.insertAdjacentHTML('beforeend', '<button class="btn sec reintentar" type="button">Volver a intentar</button>');
      $('.reintentar', ej).addEventListener('click', () => {
        $$('[data-r]', ej).forEach(c => { c.value = ''; c.classList.remove('ok', 'mal', 'casi', 'visto'); });
        fb.textContent = ''; fb.className = 'fb';
        $('[data-r]', ej)?.focus();
      });
    }
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
      [`Fachantü mülen ${v('mulen')} mew.`, `Hoy vivo en ${v('mulen')}.`],
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

/* ---------- Banco de verbos (planilla Vocabulario) ---------- */
const BANCO_TXT = `Movimiento:amun=ir;amutun=irse;küpan=venir;küpalün=traer;akun=llegar (aquí);puwün=llegar (allá);tuwün=venir de;konün=entrar;txipan=salir;püran=subir;nagün=bajar;wiñon=volver;rupan=pasar (hacia acá);rumen=pasar (hacia allá);miawün=andar;txekan=caminar;lefün=correr;rügkün=saltar;weyelün=nadar;yen=llevar;yemen=ir a buscar;fülün=acercarse;matukelün=apurarse;ügümün=esperar;tügün=quedarse quieto
Comunicación:zugun=hablar;nütxamün=narrar;nütxamkan=conversar;ramtun=preguntar;llowzugun=responder;mütxümün=llamar;pigen=llamarse;allkütun=escuchar;nüküfün=callarse;mañumün=agradecer;gülamtun=aconsejar;koylatun=mentir;chalintukun=saludar (dejando saludo)
Conocimiento:chillkatun=estudiar;kimün=saber;kimeltun=enseñar;kimuwün=conocerse;rakizuamün=pensar;azümün=entender;tukulpan=recordar;goyman=olvidar;feyentun=creer
Percepción:pen=ver, encontrar;azkintun=mirar;kintun=buscar;pegelün=mostrar;ñamün=perder;petun=encontrar (lo perdido);ellkan=esconder;wefün=aparecer
Afecto:poyen=amar, estimar;zuamün=necesitar;ayen=reír;ayekan=divertirse;güman=llorar;weñagkün=estar triste;illkun=enojarse;yewün=avergonzarse;llikan=tener miedo;kümentun=gustar;kümezuamün=sentirse bien
Estado:mülen=estar;felen=estar así;gen=ser;nien=tener;mogen=vivir
Trabajo:zewman=hacer;küzawün=trabajar;pepikan=preparar;kellun=ayudar;elün=dejar, poner;künun=dejar hecho;werkün=enviar;llitun=comenzar;afün=acabar;wechun=terminar
Intercambio:elun=dar;llowün=recibir;wiñoltun=devolver;gillan=comprar;fenzen=vender;txafkintun=intercambiar;aretun=pedir prestado;arelün=prestar
Ruka:liftun=limpiar;küchan=lavar;lepün=barrer;nülan=abrir;rakümün=cerrar;takun=tapar, cubrir
Descanso:ürkütun=descansar;ürkün=cansarse;umawtun=dormir;kuzun=acostarse;pewman=soñar;txepen=despertar
Comida:putun=beber;güñün=tener hambre;wüywün=tener sed;afümün=cocer;zewmayalün=cocinar;masan=amasar;kofken=hacer pan;kofketun=comer pan;mürketun=comer harina tostada;kagkatun=asar;wazkün=hervir;kotün=tostar;chafün=pelar;katxün=cortar;chaytun=colar
Campo:ketxan=arar;tukun=sembrar, poner;anümün=plantar;püramün=cosechar;witxukon=regar;rügan=cavar;challwan=pescar;mamülltun=hacer leña
Telar y arte:füwün=hilar;güren=tejer;witxalün=tejer en telar;wizün=trabajar la greda;rütxan=trabajar la platería
Salud:kütxantun=enfermarse;txemon=sanarse;chafon=toser;müñetun=bañarse;arofün=sudar
Espiritual:gellipun=rogar;gillatun=hacer rogativa;yamün=respetar;ülkantun=cantar
Vida social:purun=bailar;kültxugtun=tocar kültxug;txawün=reunirse;wewün=ganar;awkantun=jugar;wirarün=gritar`;
const CONSONANTE = /[^aeiouü]/;
const BANCO = BANCO_TXT.split('\n').flatMap(l => {
  const [cat, lista] = l.split(':');
  return lista.split(';').map(x => {
    const [v, es] = x.split('=');
    const cons = v.endsWith('ün') && CONSONANTE.test(v.at(-3));
    const core = VERBOS.find(k => k[0] === v);
    return core || [v, es, cons ? v.slice(0, -2) : v.slice(0, -1), cons ? 'ün' : 'n', null, cat];
  }).map(k => (k[5] = k[5] || cat, k));
});
/* Español: pretérito para acciones, presente para estados */
const ESTADO_MZ = ['mülen', 'felen', 'gen', 'nien', 'mogen', 'kimün', 'zuamün', 'poyen', 'güñün', 'wüywün', 'llikan', 'kümezuamün'];
const ES_FIJO = {
  kümentun: ['me gusta', 'te gusta', 'le gusta'], weñagkün: ['estoy triste', 'estás triste', 'está triste'],
  kimuwün: ['me conocí con alguien', 'te conociste con alguien', 'se conoció con alguien'], kütxantun: ['me enfermé', 'te enfermaste', 'se enfermó']
};
const PRET_IRR = { ir: ['fui', 'fuiste', 'fue'], venir: ['vine', 'viniste', 'vino'], traer: ['traje', 'trajiste', 'trajo'], hacer: ['hice', 'hiciste', 'hizo'],
  dar: ['di', 'diste', 'dio'], ver: ['vi', 'viste', 'vio'], andar: ['anduve', 'anduviste', 'anduvo'], reír: ['reí', 'reíste', 'rio'], creer: ['creí', 'creíste', 'creyó'],
  mentir: [0, 0, 'mintió'], dormir: [0, 0, 'durmió'], divertir: [0, 0, 'divirtió'], hervir: [0, 0, 'hirvió'], pedir: [0, 0, 'pidió'] };
const PRES_IRR = { estar: ['estoy', 'estás', 'está'], ser: ['soy', 'eres', 'es'], tener: ['tengo', 'tienes', 'tiene'], saber: ['sé', 'sabes', 'sabe'], sentir: ['siento', 'sientes', 'siente'] };
function conjugaEs(mz, glosa) {
  if (ES_FIJO[mz]) return ES_FIJO[mz];
  const g = glosa.split(',')[0].trim(), partes = g.split(' ');
  let inf = partes[0]; const resto = partes.slice(1).join(' ');
  const refl = /(ar|er|ir|ír)se$/.test(inf); if (refl) inf = inf.slice(0, -2);
  const raiz = inf.slice(0, -2), term = inf.slice(-2);
  let f;
  if (ESTADO_MZ.includes(mz)) {
    f = PRES_IRR[inf] || (term === 'ar' ? ['o', 'as', 'a'] : ['o', 'es', 'e']).map(x => raiz + x);
  } else {
    const irr = PRET_IRR[inf];
    if (irr && irr[0]) f = irr;
    else {
      if (term === 'ar') {
        const r1 = raiz.replace(/c$/, 'qu').replace(/g$/, 'gu').replace(/z$/, 'c');
        f = [r1 + 'é', raiz + 'aste', raiz + 'ó'];
      } else f = [raiz + 'í', raiz + 'iste', raiz + 'ió'];
      if (irr) f[2] = irr[2];
    }
  }
  return f.map((x, i) => (refl ? ['me ', 'te ', 'se '][i] : '') + x + (resto ? ' ' + resto : ''));
}
const esPersona = (v, p) => v[4] ? v[4][p] : conjugaEs(v[0], v[1])[p];

function pintaVerbo(v) {
  $('#conj-raiz').innerHTML = `<span class="mz" style="font-size:1.3rem">${v[0]}</span> <span class="es">${v[1]}</span>. Raíz <b class="mz">${v[2]}-</b>` +
    (v[3] === 'ün' ? ': termina en consonante, por eso inche lleva <b>-ün</b>.' : ': termina en vocal.');
  $('#conj-filas').innerHTML = PERS.map((p, k) =>
    `<div class="conj-fila p-${p}"><span class="chip">${p}</span><span class="forma">${formaHTML(v, k)}</span><span class="es">${esPersona(v, k)}</span></div>`).join('');
}
function initConjugador() {
  const banco = $('#banco');
  const t = $('#tabla-verbos');
  if (t) t.innerHTML = VERBOS.filter(v => v[0] !== 'pigen').map(v => `<tr><td><b class="mz">${v[0]}</b><br><span class="es">${v[1]}</span></td>` +
    PERS.map((p, k) => `<td><span class="mz">${formaHTML(v, k)}</span><br><span class="es">${v[4][k]}</span></td>`).join('') + '</tr>').join('');
  if (!banco) return;
  const cats = ['Todos', ...new Set(BANCO.map(v => v[5]))];
  let cat = 'Todos';
  $('#banco-cats').innerHTML = cats.map(c => `<button type="button" aria-pressed="${c === cat}">${c}</button>`).join('');
  const pinta = () => {
    const q = norm($('#banco-busca').value);
    const lista = BANCO.filter(v => (cat === 'Todos' || v[5] === cat) && (!q || norm(v[0]).includes(q) || norm(v[1]).includes(q)));
    banco.innerHTML = lista.map(v => `<button type="button" data-v="${v[0]}">${v[0]}<small>${v[1]}</small></button>`).join('') || '<span class="es">No hay verbos con esa búsqueda.</span>';
    $('#banco-cuenta').textContent = `${lista.length} verbos`;
  };
  selector($('#banco-cats'), b => { cat = b.textContent; pinta(); });
  $('#banco-busca').addEventListener('input', pinta);
  selector(banco, b => pintaVerbo(BANCO.find(v => v[0] === b.dataset.v)));
  pinta(); pintaVerbo(BANCO[0]); banco.querySelector('button').setAttribute('aria-pressed', 'true');
}

/* ---------- Semáforo con todos los verbos ---------- */
function initSemaforo() {
  const s = $('#semaforo'); if (!s) return;
  let actual, puntos = 0, total = 0, racha = 0, espera = false;
  const nueva = () => {
    const v = BANCO[Math.floor(Math.random() * BANCO.length)], p = Math.floor(Math.random() * 3);
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
      `<span class="chip p-${PERS[p]}">${PERS[p]}</span> ${forma(v, p)} = ${esPersona(v, p)}. Termina en <b>-${sufijo(v, p)}</b>.`;
    $('#sem-fb').className = 'fb ' + (bien ? 'bien' : 'no');
    $('#sem-marcador').textContent = `${puntos} de ${total} · racha: ${racha}`;
    setTimeout(nueva, bien ? 1600 : 3200);
  };
  $$('#semaforo .sem-botones button').forEach((b, k) => b.addEventListener('click', () => responde(k)));
  document.addEventListener('keydown', e => { if (['1', '2', '3'].includes(e.key) && !e.target.matches('input,textarea,select')) responde(+e.key - 1); });
  nueva();
}


/* ---------- Ejercicios que cambian ("Otras preguntas") ---------- */
const azar = (a, n) => [...a].sort(() => Math.random() - .5).slice(0, n);
const SITUACIONES = [
  ['Le preguntas a tu lamgen cómo está.', 'chumleimi'], ['Le preguntas a tu peñi cómo está.', 'chumleimi'], ['Le preguntas a la kimelfe cómo está.', 'chumleimi'],
  ['Preguntas cómo está tu mamá.', 'chumlei'], ['Preguntas cómo está tu papá.', 'chumlei'], ['Preguntas cómo está la papay, que no está aquí.', 'chumlei'],
  ['Respondes que tú estás bien.', 'kümelkalen'], ['Te preguntan por ti y estás bien.', 'kümelkalen'],
  ['Respondes que ella está bien.', 'kümelkalei'], ['Te preguntan por tu chaw y está bien.', 'kümelkalei']];
const GENERADORES = {
  chum: () => azar(SITUACIONES, 4).map(([t, r]) => `<li>${t} <select data-r="${r}"><option value="">—</option><option>chumleimi</option><option>chumlei</option><option>kümelkalen</option><option>kümelkalei</option></select></li>`),
  terminacion: () => azar(BANCO, 8).map((v, i) => { const p = i % 3; return `<li><span class="mz">${['Inche', 'Eimi', 'Fey'][p]} ${v[2]}</span><input class="corto" data-r="${sufijo(v, p)}" aria-label="terminación"> <span class="es">${esPersona(v, p)}.</span></li>`; }),
  quien: () => azar(BANCO, 8).map(v => { const p = Math.floor(Math.random() * 3); return `<li><span class="mz">${forma(v, p)}</span> <input class="medio" data-r="${PERS[p]}" aria-label="persona"> <span class="es solo-web" hidden>${esPersona(v, p)}</span></li>`; }),
  rakin: () => {
    const a = azar([...Array(98).keys()].map(x => x + 11), 5).map(n => `<li>${n} <input class="largo" data-r="${rakin(n)}"></li>`);
    const b = azar([...Array(89).keys()].map(x => x + 11), 3).map(n => `<li><span class="mz">${rakin(n)}</span> <input class="corto" data-r="${n}"></li>`);
    return [...a, '</ol><h3>¿Qué número es?</h3><ol>', ...b];
  }
};
function initGeneradores() {
  $$('.ej[data-gen]').forEach(ej => {
    const ol = $('ol', ej), tipo = ej.dataset.gen;
    const genera = () => {
      $$('ol ~ h3, ol ~ ol', ej).forEach(x => x.remove());
      ol.outerHTML = '<ol>' + GENERADORES[tipo]().join('') + '</ol>';
      const fb = $('.fb', ej); fb.textContent = ''; fb.className = 'fb';
    };
    ej.dataset.listo || $('.acciones', ej).insertAdjacentHTML('beforeend', '<button class="btn sec otras" type="button">Otras preguntas</button>');
    ej.dataset.listo = 1;
    $('.otras', ej).addEventListener('click', () => { genera(); });
  });
}

/* ---------- Conjuga tú (ejercicio generado) ---------- */
function initConjuga() {
  const ol = $('#conjuga-lista'); if (!ol) return;
  const genera = () => {
    const usados = [...BANCO].sort(() => Math.random() - .5).slice(0, 6);
    ol.innerHTML = usados.map((v, i) => {
      const p = i % 3;
      return `<li><span class="chip p-${PERS[p]}">${PERS[p]}</span> + <span class="mz">${v[0]}</span> <span class="es">(${v[1]})</span><br><input class="medio" data-r="${forma(v, p)}" aria-label="${PERS[p]} ${v[0]}"></li>`;
    }).join('');
    $('#conjuga .fb').textContent = '';
  };
  $('#conjuga-otros').addEventListener('click', genera);
  genera();
}

/* ---------- Pigei con posesivo ---------- */
function initPigei() {
  const q = $('#pg-quien'); if (!q) return;
  let forma = null;
  const pinta = () => {
    const [mz, es] = q.value.split('|'), n = $('#pg-nombre').value.trim() || '______';
    $('#pg-pregunta').innerHTML = `¿Inei pige<span class="suf p-fey">i</span> tami ${mz}? <span class="es" style="font-size:1rem;font-weight:400">¿Cómo se llama tu ${es}?</span>`;
    if (forma === null) { $('#pg-salida').innerHTML = '<p class="es">Elige la forma del verbo.</p>'; return; }
    const bien = forma === 2, suf = ['n', 'imi', 'i'][forma];
    $('#pg-salida').innerHTML = `<p class="frase-grande">Tañi ${mz} ${n} pige<span class="suf p-${PERS[forma]}">${suf}</span>.</p>` +
      (bien ? `<p class="fb bien">¡Kümey! Tu ${es} no está en la conversación: es fey, por eso termina en -i. <span class="es">Mi ${es} se llama ${n}.</span></p>`
            : `<p class="fb no">Revisa: ${forma === 0 ? '-n es para inche (yo).' : '-imi es para eimi, la persona a quien le hablas.'} Tu ${es} es fey.</p>`);
  };
  q.addEventListener('change', pinta); $('#pg-nombre').addEventListener('input', pinta);
  selector($('#pg-forma'), b => { forma = $$('#pg-forma button').indexOf(b); pinta(); });
  pinta();
}

/* ---------- Guía 1: rakin ---------- */
function initRakin() {
  const g = $('#numeros'); if (!g) return;
  g.innerHTML = UNI.slice(1).concat('mari').map((w, i) => `<div class="numero"><b>${i + 1}</b><span>${w}</span></div>`).join('');
  const r = $('#rk-rango'), n = $('#rk-num');
  const pinta = v => {
    v = Math.max(1, Math.min(999, parseInt(v, 10) || 1));
    const c = Math.floor(v / 100), d = Math.floor((v % 100) / 10), u = v % 10, partes = [], cuenta = [];
    if (c) { partes.push(`<span class="cen" data-t="${c}×100">${c === 1 ? 'pataka' : UNI[c] + ' pataka'}</span>`); cuenta.push(c * 100); }
    if (d) { partes.push(`<span class="dec" data-t="${d}×10">${d === 1 ? 'mari' : UNI[d] + ' mari'}</span>`); cuenta.push(d * 10); }
    if (u) { partes.push(`<span class="uni" data-t="+${u}">${UNI[u]}</span>`); cuenta.push(u); }
    $('#rk-salida').innerHTML = `<div class="morf">${partes.join('')}</div><p class="frase-grande">${v} = ${rakin(v)}</p><p class="es">${cuenta.join(' + ')} = ${v}</p>`;
  };
  r.addEventListener('input', () => { n.value = r.value; pinta(r.value); });
  n.addEventListener('input', () => { if (n.value <= 199) r.value = n.value; pinta(n.value); });
  pinta(37);
}

/* ---------- Símbolos: lukutuwe (3) y waglen ---------- */
const SIMBOLOS = "<svg xmlns='http://www.w3.org/2000/svg' style='display:none'><symbol id='luku1' viewBox='0 0 225 360'><path fill-rule='evenodd' d='M111 273 98 322 125 322ZM4 315 4 340 13 340 16 331 21 331 21 345 17 346 17 359 56 359 56 346 51 345 51 331 55 330 57 332 59 340 68 340 68 315 43 315 41 313 41 269 103 268 110 238 112 237 120 268 182 269 182 313 180 315 155 315 155 340 164 340 167 331 172 331 172 345 167 347 167 359 206 359 206 346 202 345 203 330 207 331 210 340 219 340 219 315 194 315 192 313 192 256 127 257 124 253 112 207 98 255 96 257 31 256 31 313 29 315ZM79 0 79 17 92 18 92 42 83 42 83 27 53 27 53 38 73 39 73 69 66 69 66 48 36 48 36 59 56 60 56 96 48 96 48 67 19 67 19 78 40 79 40 120 9 120 10 95 29 96 29 105 15 106 15 112 34 112 34 87 0 87 0 126 103 126 105 128 78 233 76 235 41 234 41 190 43 188 68 188 68 163 59 163 57 171 55 173 51 172 51 158 56 157 56 144 17 144 17 157 21 158 21 172 16 172 13 163 4 163 4 188 29 188 31 190 31 246 84 246 110 143 112 142 139 246 192 247 192 190 194 188 219 188 219 163 210 163 207 172 203 173 202 158 206 157 206 144 167 144 167 157 172 158 172 172 167 172 164 163 155 163 155 188 180 188 182 190 182 234 147 235 145 233 119 127 223 127 224 87 189 87 189 112 208 112 208 106 194 105 194 96 213 95 214 120 184 121 183 79 204 78 204 67 175 67 175 96 167 96 167 60 187 59 187 48 157 48 157 69 151 70 150 39 170 38 170 27 140 27 141 42 132 43 131 18 144 17 144 0Z'/></symbol><symbol id='luku2' viewBox='0 0 224 360'><path fill-rule='evenodd' d='M90 0 89 50 86 47 78 19 49 19 49 38 68 38 70 40 79 80 75 81 61 56 34 56 34 76 54 76 75 107 75 110 71 114 53 97 25 97 25 118 50 118 51 140 5 141 5 167 83 167 84 169 59 239 34 238 35 227 55 227 55 189 47 189 44 209 34 210 33 176 22 176 22 209 12 210 11 184 0 184 0 227 16 228 16 255 55 256 45 269 16 269 16 300 0 301 0 343 11 343 11 319 13 317 20 317 22 319 22 359 33 359 33 318 42 317 43 346 55 346 55 301 35 301 34 289 89 288 96 270 99 267 124 267 134 288 189 289 188 301 168 301 168 346 180 346 179 319 181 317 189 317 190 359 201 359 201 319 203 317 210 317 212 319 212 343 223 343 223 301 207 300 207 269 178 269 168 256 207 255 207 228 223 227 223 184 212 184 211 210 201 209 201 176 190 176 189 210 180 210 176 189 168 189 168 227 188 227 189 238 164 239 139 168 218 167 218 141 173 141 171 139 173 118 198 118 198 97 170 97 154 113 151 114 148 110 148 107 169 76 189 76 189 56 162 56 148 81 144 80 153 40 155 38 174 38 174 19 145 19 137 47 134 50 133 0Z'/></symbol><symbol id='luku3' viewBox='0 0 225 360'><path fill-rule='evenodd' d='M112 239 89 298 136 298ZM6 309 6 336 21 336 23 330 31 345 30 347 21 347 21 359 53 359 53 347 42 346 48 332 53 331 54 336 75 336 86 309 40 309 39 279 79 278 111 212 113 211 146 278 186 279 185 309 139 309 150 336 171 336 172 331 175 330 177 332 183 346 172 347 172 359 204 359 204 347 194 346 200 332 202 330 204 336 219 336 219 309 202 308 202 266 152 266 112 187 75 264 73 266 23 266 23 308ZM99 84 99 99 126 99 126 84ZM20 20 21 31 35 55 31 56 18 39 1 39 1 140 108 141 108 150 67 233 39 232 39 205 69 204 81 179 80 172 63 172 50 187 48 186 57 167 60 166 60 151 21 151 21 166 24 168 29 185 27 187 24 187 21 184 16 172 0 173 0 204 23 205 23 246 72 246 112 165 153 246 202 246 202 205 224 204 224 172 209 172 204 184 201 187 198 187 196 185 201 168 204 166 204 151 165 151 165 166 168 167 177 186 173 186 162 172 145 172 144 179 156 204 186 205 186 232 158 233 117 150 117 141 224 140 224 39 207 39 194 56 191 56 190 54 204 31 204 20 153 20 139 40 135 40 135 37 152 9 152 0 73 0 73 9 90 37 90 40 86 40 72 20ZM59 77 94 76 95 54 130 54 131 76 166 77 166 106 131 107 130 129 95 129 94 107 59 106Z'/></symbol><symbol id='waglen' viewBox='0 0 549 554'><path fill-rule='evenodd' d='M158 0 158 162 6 164 114 276 0 391 158 392 158 553 273 441 386 553 386 391 388 389 548 389 440 281 548 167 388 167 387 6 277 114ZM177 45 277 140 367 51 369 53 369 185 504 186 414 280 503 370 368 371 367 507 274 414 177 508 176 372 45 371 139 277 50 183 176 182Z'/></symbol></svg>";
function initAdornos() { document.body.insertAdjacentHTML('afterbegin', SIMBOLOS); }

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
    { ella: () => [`Feley${nombre ? ', ' + nombre : ''}. Inche Rayen pigen.`, '¿Chew müleimi fachantü?'], tarea: '¿Dónde estás hoy? Usa: Inche mülen ___ mew.', sug: ['Inche mülen Santiago mew', 'Mülen ruka mew'],
      ok: t => /\bmülen\b/.test(t),
      exp: () => '<p><b class="mz">Mew</b> marca el lugar (en) y se suele decir al final: mülen Santiago mew. <b class="mz">Müle-<span class="suf p-inche">n</span></b>: estoy. Ella preguntó <b class="mz">müle-<span class="suf p-eimi">imi</span></b>: estás.</p>' },
    { ella: () => ['Inche mülen Temuko mew. Pewkayal lamgen!'], tarea: 'Despídete.', sug: ['Feley. Pewkayal lamgen', 'Mañum lamgen'],
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

/* =================== GUÍA 3: TAÑI, TAMI, ÑI =================== */
const POS = [['tañi', 'mi', 'mis'], ['tami', 'tu', 'tus'], ['ñi', 'su', 'sus']];
const COSAS = [['ruka', 'casa', 'casas', 'f'], ['txewa', 'perro', 'perros', 'm'], ['ñarki', 'gato', 'gatos', 'm'], ['ñuke', 'madre', 'madres', 'f'],
  ['chaw', 'padre', 'padres', 'm'], ['lamgen', 'hermana o hermano', 'hermanas o hermanos', 'm'], ['wenüy', 'amiga o amigo', 'amigas o amigos', 'm'],
  ['üy', 'nombre', 'nombres', 'm'], ['reñma', 'familia', 'familias', 'f'], ['logko', 'cabeza', 'cabezas', 'f'], ['namun', 'pie', 'pies', 'm']];
function initPosesivos() {
  const per = $('#pos-persona'); if (!per) return;
  let p = 0, c = 0;
  $('#pos-cosa').innerHTML = COSAS.map((x, i) => `<button type="button" aria-pressed="${i === 0}">${x[0]}</button>`).join('');
  const pinta = () => {
    const x = COSAS[c];
    $('#pos-salida').innerHTML = `<p class="frase-pos"><span class="pos p-${PERS[p]}">${POS[p][0]}</span> ${x[0]}</p>` +
      `<p class="es" style="font-size:1.3rem">${POS[p][1]} ${x[1]}</p>` +
      (p === 2 ? `<p class="nota" style="margin-top:.6rem">También se dice <b class="mz">fey tañi ${x[0]}</b>. El <b>ta</b> es optativo: tañi o ñi, tami o mi.</p>` : '');
  };
  selector(per, b => { p = $$('button', per).indexOf(b); pinta(); });
  selector($('#pos-cosa'), b => { c = $$('#pos-cosa button').indexOf(b); pinta(); });
  pinta();
}
function initPuKe() {
  const per = $('#pk-persona'); if (!per) return;
  let p = 0;
  const pinta = () => {
    const x = COSAS[+$('#pk-cosa').value], pl = $('#pk-pu').checked, adj = $('#pk-kume').checked;
    const partes = [`<span class="pers p-${PERS[p]}" data-t="${PERS[p]}">${POS[p][0]}</span>`];
    if (pl && !adj) partes.push('<span class="neg" data-t="plural">pu</span>');
    if (adj) partes.push('<span data-t="bueno">küme</span>');
    if (pl && adj) partes.push('<span class="neg" data-t="plural">ke</span>');
    partes.push(`<span data-t="${x[1]}">${x[0]}</span>`);
    const frase = [POS[p][0], pl && !adj ? 'pu' : '', adj ? 'küme' : '', pl && adj ? 'ke' : '', x[0]].filter(Boolean).join(' ');
    const bueno = x[3] === 'f' ? (pl ? 'buenas' : 'buena') : (pl ? 'buenos' : 'bueno');
    $('#pk-salida').innerHTML = `<div class="morf" style="margin-top:1rem">${partes.join('')}</div><p class="frase-pos">${frase}</p>` +
      `<p class="es" style="font-size:1.3rem">${pl ? POS[p][2] : POS[p][1]} ${pl ? x[2] : x[1]}${adj ? ' ' + bueno : ''}</p>` +
      `<p>${pl ? (adj ? '<b class="mz">ke</b> pluraliza y va entre el adjetivo y el sustantivo.' : '<b class="mz">pu</b> pluraliza y va antes del sustantivo.') : 'Una sola cosa: no se agrega pu ni ke.'}</p>`;
  };
  $('#pk-cosa').innerHTML = COSAS.slice(0, 7).map((x, i) => `<option value="${i}">${x[0]} (${x[1]})</option>`).join('');
  selector(per, b => { p = $$('button', per).indexOf(b); pinta(); });
  ['#pk-cosa', '#pk-pu', '#pk-kume'].forEach(q => $(q).addEventListener('change', pinta));
  pinta();
}
/* Ordenar palabras */
const ORDENAR = [
  ['Inche mülen waria mew', 'Estoy en la ciudad.'], ['Tañi ñuke mülei Santiago mew', 'Mi madre está en Santiago.'],
  ['Inche mülen tami ruka mew', 'Estoy en tu casa.'], ['Fey tañi peñi amui waria mew', 'Su hermano fue a la ciudad.'],
  ['Inche kimeltun mapuzugun mew', 'Enseñé en mapuzugun.'], ['Tami txewa txipai', 'Tu perro salió.'], ['Tañi pu ñarki mülei ruka mew', 'Mis gatos están en la casa.']];
function initOrdenar() {
  const z = $('#ordenar'); if (!z) return;
  let i = 0;
  const nueva = () => {
    const [f, es] = ORDENAR[i % ORDENAR.length];
    $('#ord-es').textContent = es;
    $('#ord-frase').innerHTML = ''; $('#ord-frase').className = 'orden-frase';
    $('#ord-palabras').innerHTML = azar(f.split(' '), 99).map(w => `<button type="button" class="palabra">${w}</button>`).join('');
    $('#ord-fb').textContent = ''; $('#ord-fb').className = 'fb';
  };
  z.addEventListener('click', e => {
    const b = e.target.closest('.palabra'); if (!b) return;
    (b.parentElement.id === 'ord-palabras' ? $('#ord-frase') : $('#ord-palabras')).append(b);
  });
  $('#ord-revisar').addEventListener('click', () => {
    const f = $$('#ord-frase .palabra').map(b => b.textContent).join(' '), bien = f === ORDENAR[i % ORDENAR.length][0];
    $('#ord-frase').className = 'orden-frase ' + (bien ? 'ok' : 'mal');
    $('#ord-fb').textContent = bien ? '¡Müna kümey!' : 'Müna weza. Recuerda: el verbo va antes y mew queda al final.';
    $('#ord-fb').className = 'fb ' + (bien ? 'bien' : 'no');
  });
  $('#ord-reintentar').addEventListener('click', nueva);
  $('#ord-otra').addEventListener('click', () => { i++; nueva(); });
  nueva();
}

/* ---------- Awkantun en dupla: 10 preguntas ---------- */
const P = (p, t) => `<span class="chip p-${p}">${p}</span> ${t}`;
const QUIZ = [
  ['q01', P('inche', '· ___ ruka'), 'mi casa', ['tañi ruka', 'tami ruka', 'ñi ruka'], 'Tañi = mi: lo que es de quien habla (inche).'],
  ['q02', P('eimi', '· ___ ñuke'), 'tu madre', ['tami ñuke', 'tañi ñuke', 'ñi ñuke'], 'Tami = tu: lo que es de quien escucha (eimi).'],
  ['q03', P('fey', '· ___ txewa'), 'su perro', ['ñi txewa', 'tami txewa', 'tami pu txewa'], 'Ñi = su: lo que es de quien no participa (fey). También se dice fey tañi txewa.'],
  ['q04', P('eimi', '· ___ üy'), 'tu nombre', ['tami üy', 'tañi üy', 'ñi üy'], 'Tami = tu. Üy = nombre.'],
  ['q05', P('inche', '· ___ reñma'), 'mi familia', ['tañi reñma', 'tami reñma', 'ñi reñma'], 'Tañi = mi. Reñma = familia.'],
  ['q06', 'Tami chaw ülkantui', '¿Qué significa?', ['Tu padre cantó', 'Mi padre cantó', 'Tu padre cantaste'], 'Tami = tu (el padre es de eimi). -i: quien canta es fey, el padre.'],
  ['q07', 'Tañi ñuke küzawi', '¿Quién trabajó?', ['mi madre (fey)', 'yo (inche)', 'tú (eimi)'], 'La terminación -i indica fey: trabajó la madre. Tañi solo dice de quién es la madre.'],
  ['q08', 'Inche mülen tami ruka mew', '¿De quién es la ruka?', ['de eimi (tú)', 'de inche (yo)', 'de fey'], 'Tami = tu: la casa es de eimi. Mülen (-n) dice que quien está es inche.'],
  ['q09', '¿Cómo se dice «mis perros»?', '', ['tañi pu txewa', 'pu tañi txewa', 'tañi txewa pu'], 'Pu pluraliza y va justo antes del sustantivo.'],
  ['q10', '¿Cómo se dice «mis gatos buenos»?', '', ['tañi küme ke ñarki', 'tañi ke küme ñarki', 'tañi küme ñarki ke'], 'Con adjetivo, ke pluraliza entre el adjetivo y el sustantivo: küme ke ñarki.'],
  ['q11', '¿Qué significa «pichi ke che»?', '', ['niñes (varios niños)', 'un niño', 'gente grande'], 'Pichi (chico) + ke (plural) + che (persona). Pichiche es un niño.'],
  ['q12', '¿Cuál es la forma más usada?', 'Estoy en la ciudad.', ['Inche mülen waria mew', 'Inche waria mew mülen', 'Mew waria inche mülen'], 'Se suele decir primero el verbo y dejar mew al final: mülen waria mew.'],
  ['q13', '¿Inei pigei tami ñuke?', 'Elige la mejor respuesta', ['Tañi ñuke Javiera pigei', 'Tami ñuke Javiera pigen', 'Tañi ñuke Javiera pigeimi'], 'Respondes con tañi (es tu madre) y pigei, porque tu madre es fey.'],
  ['q14', 'Tami txewa txipai', '¿Qué significa?', ['Tu perro salió', 'Mi perro salió', 'Tu perro saliste'], 'Tami = tu. Txipai (-i): quien sale es fey, el perro.'],
  ['q15', 'Fey tañi ñarki putui ko', '¿Qué significa?', ['Su gato tomó agua', 'Tu gato tomó agua', 'Mi gato tomé agua'], 'Fey tañi = su. Putui (-i): quien toma es fey, el gato.'],
  ['q16', 'Tami namun', '¿Qué significa?', ['tu pie', 'mi cabeza', 'tu cabeza'], 'Tami = tu; namun = pie. Logko es cabeza.'],
  ['q17', 'Tañi logko', '¿Qué significa?', ['mi cabeza', 'tu cabeza', 'mi pie'], 'Tañi = mi; logko = cabeza.'],
  ['q18', 'Si escuchas «mi chaw»…', '¿qué significa?', ['tu padre', 'mi padre', 'su padre'], 'El ta es optativo: mi es la forma corta de tami (tu). No es el «mi» del español.'],
  ['q19', '¿Cómo se dice «tus gatos»?', '', ['tami pu ñarki', 'tañi pu ñarki', 'tami ñarki pu'], 'Tami = tu; pu pluraliza antes del sustantivo.'],
  ['q20', '¿Chumlei tami ñuke?', '¿Qué significa?', ['¿Cómo está tu madre?', '¿Cómo estás, madre?', '¿Dónde está tu madre?'], 'Chum-le-i: cómo está (fey). Tami ñuke: tu madre.'],
  ['q21', 'Tañi ñuke mülei Santiago mew', '¿Qué significa?', ['Mi madre está en Santiago', 'Tu madre está en Santiago', 'Mi madre estoy en Santiago'], 'Tañi = mi. Mülei (-i): quien está es fey, la madre.']
];
const quizPorId = id => QUIZ.find(q => q[0] === id);
const SESION = new URLSearchParams(location.search).get('sesion') || 'kimeltun-4';
function numMz(n) { return n === 0 ? '0' : rakin(n); }
function initQuiz() {
  const caja = $('#quiz'); if (!caja) return;
  let preg = [], i = 0, resp = [], dupla = '';
  const cuerpo = $('.quiz-cuerpo', caja);
  const abre = () => { caja.classList.add('abierto'); document.body.style.overflow = 'hidden'; caja.requestFullscreen?.().catch(() => {}); };
  const cierra = () => { caja.classList.remove('abierto'); document.body.style.overflow = ''; if (document.fullscreenElement) document.exitFullscreen(); };
  const barra = () => { $('.barra i', caja).style.width = (i / 10 * 100) + '%'; $('#quiz-cont').textContent = i < 10 ? `${rakin(i + 1)} · ${i + 1} / 10` : ''; };
  const muestra = () => {
    barra();
    const q = preg[i], ops = azar(q[3], 3);
    cuerpo.innerHTML = `<div class="q-num">Ramtun ${rakin(i + 1)}</div><div class="q-texto">${q[1]}${q[2] ? `<span class="es">${q[2]}</span>` : ''}</div>` +
      `<div class="q-opciones">${ops.map((o, k) => `<button type="button" data-o="${o}"><b>${'ABC'[k]}</b>${o}</button>`).join('')}</div><div id="q-fb"></div>`;
    let respondida = false;
    $('.q-opciones', cuerpo).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || respondida) return;
      respondida = true;
      const bien = b.dataset.o === q[3][0];
      resp.push({ id: q[0], elegida: b.dataset.o, correcta: q[3][0], ok: bien });
      $$('.q-opciones button', cuerpo).forEach(x => { x.disabled = true; if (x.dataset.o === q[3][0]) x.classList.add('ok'); });
      if (!bien) b.classList.add('mal');
      $('#q-fb').innerHTML = `<div class="q-fb ${bien ? 'bien' : 'no'}"><h4>${bien ? '¡Müna kümey!' : 'Müna weza'}</h4><p>${bien ? '' : `La respuesta era <b>${q[3][0]}</b>. `}${q[4]}</p>` +
        `<button class="btn" type="button" id="q-sig">${i < 9 ? 'Siguiente →' : 'Ver resultado'}</button></div>`;
      $('#q-sig').focus();
      $('#q-sig').addEventListener('click', () => { i++; i < 10 ? muestra() : final(); });
    });
  };
  const final = () => {
    barra();
    const pts = resp.filter(r => r.ok).length;
    let img, anim, frase, es, cred = '';
    if (pts >= 9) { img = 'img/afafan.png'; anim = 'a-afafan'; frase = 'Müna kümey amulei tami mapuzugun. ¡Kiñe afafan tati!'; es = 'Va muy bien tu mapuzugun. ¡Un afafan!'; cred = '<p class="credito-img">Imagen: Fiestoforo</p>'; }
    else if (pts >= 5) { img = 'img/feley.png'; anim = 'a-feley'; frase = 'Feley, küme txipay. Petu mülei mi pepikawal tufachi zugü mew.'; es = 'Bien, salió bien. ¡Aún debes prepararte para este tema!'; }
    else { img = 'img/fotx.png'; anim = 'a-fotx'; frase = 'Fotxü anai'; es = '¡Pucha! Repasa la guía y vuelve a intentarlo.'; }
    cuerpo.innerHTML = `<div class="resultado"><img class="${anim}" src="${img}" alt="">${cred}` +
      `<div class="puntaje">${numMz(pts)}<small>${pts} de 10 · ${dupla}</small></div><p class="frase">${frase}</p><p class="es">${es}</p>` +
      `<div class="acciones"><button class="btn" id="q-rev">Pellelu take tankun<small>Revisar respuestas</small></button><button class="btn sec" id="q-otra">Ka kiñe<small>Otra vez</small></button><button class="btn sec" id="q-fin">Fey mütem<small>Eso nada más</small></button></div>` +
      `<p class="registro" id="q-reg"></p></div>`;
    botonesFinal();
    registra(pts);
  };
  const revision = () => {
    cuerpo.innerHTML = `<div class="revision"><h2>Pellelu take tankun</h2><ol>${resp.map((r, k) => { const q = quizPorId(r.id);
      return `<li><b>${rakin(k + 1)}.</b> <span class="mz">${q[1]}</span> ${q[2] ? `<span class="es">${q[2]}</span>` : ''}<br>` +
        (r.ok ? `<span class="buena">✔ ${r.correcta}</span>` : `<span class="tuya">✘ Elegiste: ${r.elegida}</span><br><span class="buena">✔ Correcta: ${r.correcta}</span>`) +
        `<br><span class="es">${q[4]}</span></li>`; }).join('')}</ol>` +
      `<div class="acciones"><button class="btn sec" id="q-otra">Ka kiñe<small>Otra vez</small></button><button class="btn sec" id="q-fin">Fey mütem<small>Eso nada más</small></button></div></div>`;
    botonesFinal(); cuerpo.scrollTop = 0; caja.scrollTop = 0;
  };
  const botonesFinal = () => {
    $('#q-rev')?.addEventListener('click', revision);
    $('#q-otra')?.addEventListener('click', empieza);
    $('#q-fin')?.addEventListener('click', cierra);
  };
  const registra = pts => {
    const url = window.REGISTRO_URL, reg = $('#q-reg');
    if (!url) { reg.textContent = 'Registro en línea no configurado.'; return; }
    fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ sesion: SESION, dupla, puntaje: pts, respuestas: resp }) })
      .then(() => reg.textContent = 'Resultado registrado.').catch(() => reg.textContent = 'No se pudo registrar (revisa la conexión).');
  };
  const empieza = () => { preg = azar(QUIZ, 10); i = 0; resp = []; abre(); muestra(); };
  $('#quiz-llitun').addEventListener('click', () => {
    dupla = $('#quiz-dupla').value.trim();
    if (!dupla) { $('#quiz-dupla').focus(); $('#quiz-aviso').textContent = 'Escriban un nombre para su dupla.'; return; }
    $('#quiz-aviso').textContent = ''; empieza();
  });
  $('#quiz-cerrar').addEventListener('click', cierra);
}

/* ---------- Panel de resultados (kimelfe) ---------- */
function initPanel() {
  const zona = $('#panel'); if (!zona) return;
  const inp = $('#panel-sesion'); inp.value = SESION;
  const carga = async () => {
    const url = window.REGISTRO_URL;
    if (!url) { $('#panel-estado').textContent = 'Falta pegar la URL del registro en config.js.'; return; }
    $('#panel-estado').textContent = 'Cargando…';
    try {
      const datos = await (await fetch(url + '?sesion=' + encodeURIComponent(inp.value.trim()))).json();
      pinta(datos);
      $('#panel-estado').textContent = `Actualizado: ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch (e) { $('#panel-estado').textContent = 'No se pudieron leer los resultados.'; }
  };
  const pinta = datos => {
    const pts = datos.map(d => +d.puntaje);
    if (!pts.length) { $('#panel-datos').innerHTML = '<p>Aún no hay resultados para esta sesión.</p>'; return; }
    const prom = pts.reduce((a, b) => a + b, 0) / pts.length, max = Math.max(...pts), min = Math.min(...pts);
    const dist = [...Array(11)].map((_, k) => pts.filter(p => p === k).length), top = Math.max(...dist);
    const porP = {};
    datos.forEach(d => (d.respuestas || []).forEach(r => {
      const x = porP[r.id] ||= { n: 0, mal: 0, errores: {} };
      x.n++; if (!r.ok) { x.mal++; x.errores[r.elegida] = (x.errores[r.elegida] || 0) + 1; }
    }));
    const filas = Object.entries(porP).sort((a, b) => b[1].mal / b[1].n - a[1].mal / a[1].n);
    $('#panel-datos').innerHTML =
      `<div class="tablero">
        <div class="dato"><small>Duplas</small><b>${pts.length}</b><span>${numMz(pts.length)}</span></div>
        <div class="dato" style="--c:var(--choz)"><small>Promedio</small><b>${prom.toFixed(1).replace('.', ',')}</b><span>≈ ${numMz(Math.round(prom))}</span></div>
        <div class="dato" style="--c:var(--fey)"><small>Puntaje máximo</small><b>${max}</b><span>${numMz(max)}</span></div>
        <div class="dato" style="--c:var(--copihue)"><small>Puntaje más bajo</small><b>${min}</b><span>${numMz(min)}</span></div>
      </div>
      <h3 style="margin-top:2rem">Distribución de puntajes</h3>
      <div class="barras">${dist.map(n => `<div style="height:${top ? n / top * 100 : 0}%"><span>${n || ''}</span></div>`).join('')}</div>
      <div class="barras-et">${dist.map((_, k) => `<span>${k}</span>`).join('')}</div>
      <h3 style="margin-top:2rem">Dónde se equivocaron más</h3>
      <div class="tabla-wrap"><table><tr><th>Pregunta</th><th>Errores</th><th></th><th>Respuesta incorrecta más elegida</th></tr>
      ${filas.map(([id, x]) => { const q = quizPorId(id) || [id, id, '']; const peor = Object.entries(x.errores).sort((a, b) => b[1] - a[1])[0];
        return `<tr><td><span class="mz">${q[1]}</span> <span class="es">${q[2] || ''}</span></td><td>${x.mal} de ${x.n}</td><td><div class="err-barra"><i style="width:${x.mal / x.n * 100}%"></i></div></td><td>${peor ? `${peor[0]} (${peor[1]})` : '—'}</td></tr>`; }).join('')}
      </table></div>
      <h3 style="margin-top:2rem">Duplas</h3>
      <div class="tabla-wrap"><table><tr><th>Dupla</th><th>Puntaje</th><th>Hora</th></tr>
      ${datos.slice().sort((a, b) => b.puntaje - a.puntaje).map(d => `<tr><td>${String(d.dupla).replace(/</g, '&lt;')}</td><td><b class="mz">${numMz(+d.puntaje)}</b> (${d.puntaje})</td><td>${new Date(d.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td></tr>`).join('')}
      </table></div>`;
  };
  $('#panel-cargar').addEventListener('click', carga);
  let t = null;
  $('#panel-auto').addEventListener('change', e => { clearInterval(t); if (e.target.checked) t = setInterval(carga, 15000); });
  carga();
}

document.addEventListener('DOMContentLoaded', () => {
  initAdornos(); initGeneradores(); initGrafemario(); initChat(); initTraductor();
  initEjercicios(); initTeclado(); initVarios(); initChalin(); initEstados();
  initPresentacion(); initChecklist(); initEscena(); initConjugador(); initSemaforo(); initConjuga(); initPigei(); initRakin();
  initPosesivos(); initPuKe(); initOrdenar(); initQuiz(); initPanel();
});
