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

/* ---------- Bandas de witxal a los costados ---------- */
function initAdornos() { document.body.insertAdjacentHTML('afterbegin', '<div class="witxal-lado izq" aria-hidden="true"></div><div class="witxal-lado der" aria-hidden="true"></div>'); }

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
  initAdornos(); initGeneradores(); initGrafemario(); initChat(); initTraductor();
  initEjercicios(); initTeclado(); initVarios(); initChalin(); initEstados();
  initPresentacion(); initChecklist(); initEscena(); initConjugador(); initSemaforo(); initConjuga(); initPigei(); initRakin();
});
