/* Kimeltun mapuzugun · Guía 4 (resumen). Usa app.js (rakin, azar, norm, BANCO, VERBOS, QUIZ, conjugaEs). */

/* ---------- Personas: color + forma ---------- */
const P3 = ['inche', 'eymi', 'fey'];
const FIG = { inche: '●', eymi: '■', fey: '▲' };
const PRON = [['inche', 'eymi', 'fey'], ['iñchiw', 'eymu', 'feyegu'], ['iñchiñ', 'eymün', 'feyegün']];
const PRON_ES = [['yo', 'tú', 'él / ella'], ['nosotros dos', 'ustedes dos', 'ellos dos'], ['nosotros', 'ustedes', 'ellos']];
const NUM_ES = ['singular', 'dual', 'plural'];
/* Chip con forma repetida según el número: ● singular, ●● dual, ●●● plural */
const chipP = (p, n = 0, txt) => `<span class="chip p-${P3[p]}"><span class="fig">${FIG[P3[p]].repeat(n + 1)}</span> ${txt ?? PRON_ES[n][p]}</span>`;

/* ---------- Conjugación por reglas (pestaña Sufijos del maestro) ---------- */
const FIN = {
  ind: { v: [['n', 'ymi', 'y'], ['yu', 'ymu', 'ygu'], ['iñ', 'ymün', 'ygün']], c: [['ün', 'imi', 'i'], ['iyu', 'imu', 'igu'], ['iyiñ', 'imün', 'igün']] },
  cond: { v: [['li', 'lmi', 'le'], ['liyu', 'lmu', 'legu'], ['liyiñ', 'lmün', 'legün']], c: [['li', 'ülmi', 'le'], ['liyu', 'ülmu', 'legu'], ['liyiñ', 'ülmün', 'legün']] },
  imp: { v: [['chi', 'ge', 'pe'], ['yu', 'mu', 'pe egu'], ['iñ', 'mün', 'pe egün']] }
};
const MODO_ES = { ind: 'indicativo', cond: 'condicional (si…)', imp: 'imperativo (orden)' };
/* v = { raiz, final: 'vocal' | 'consonante' }. Devuelve null si la combinación no se arma por regla. */
function conj(v, { p, n = 0, modo = 'ind', neg = false, fut = false, fu = false }) {
  let st = v.raiz, cons = v.final === 'consonante';
  if (v.final === 'i') return null;
  if (modo === 'imp') {
    if (cons) return null;
    if (neg) return p === 1 ? st + 'kil' + ['ge', 'mu', 'mün'][n] : null;
    return st + FIN.imp.v[n][p];
  }
  if (modo === 'cond') {
    if (neg) { st += 'no'; cons = false; }
    return st + FIN.cond[cons ? 'c' : 'v'][n][p];
  }
  if (neg) { st += 'la'; cons = false; }
  if (fu) { st += 'fu'; cons = false; }
  if (fut) { st += st.endsWith('a') ? 'ya' : 'a'; cons = false; }
  let f = FIN.ind[cons ? 'c' : 'v'][n][p];
  if (f === 'iñ' && st.endsWith('a')) f = 'yiñ';   // zugulayiñ, amuayiñ
  return st + f;
}
/* Versión con colores: raíz + sufijos + persona */
function conjHTML(v, o) {
  const f = conj(v, o); if (!f) return '—';
  return `<span class="raiz">${v.raiz}</span><span class="suf p-${P3[o.p]}">${f.slice(v.raiz.length)}</span>`;
}

/* ---------- Verbos: núcleo del taller + datos/verbos.json ---------- */
const NUCLEO = VERBOS.filter(v => v[0] !== 'pigen').map(v => ({ mz: v[0], es: v[1], raiz: v[2], final: v[3] === 'ün' ? 'consonante' : 'vocal', esF: v[4] }));
let DATOS_VERBOS = [], DATOS_VOCAB = [];
const glosa = es => { const g = (es || '').split(/[;/(]/)[0].replace(/["«»]/g, '').trim(); return g.charAt(0).toLowerCase() + g.slice(1); };
async function cargaDatos() {
  try {
    const [vb, vc] = await Promise.all(['datos/verbos.json', 'datos/vocabulario.json'].map(u => fetch(u).then(r => r.ok ? r.json() : [])));
    DATOS_VERBOS = vb.filter(v => v.validacion === 'Validada' && !v.verificar && v.final !== 'i' && v.raiz && glosa(v.es) && glosa(v.es).length <= 28 && v.mz.length > 2)
      .map(v => ({ mz: v.mz, es: glosa(v.es), raiz: v.raiz, final: v.final }));
    DATOS_VOCAB = vc.filter(v => v.validacion === 'Validada' && !v.verificar && /^[a-zñü]+$/.test(v.mz) && glosa(v.es).length < 30 && v.contexto);
  } catch (e) { /* sin datos: se usa el banco de app.js */ }
}
const verbosBasico = () => NUCLEO;
const verbosAvanzado = () => {
  const extra = DATOS_VERBOS.length ? DATOS_VERBOS : BANCO.map(v => ({ mz: v[0], es: v[1], raiz: v[2], final: v[3] === 'ün' ? 'consonante' : 'vocal' }));
  const vistos = new Set(NUCLEO.map(v => v.mz));
  return [...NUCLEO, ...extra.filter(v => !vistos.has(v.mz) && v.final === 'vocal')];
};
const esDe = (v, p) => v.esF ? v.esF[p] : null;

/* ---------- Bancos de preguntas ----------
   Cada ítem: { id, t: texto, s: subtítulo, o: [correcta, distractor, distractor], p: pista, e: explicación, n: 'b' | 'a' }
   Ítems sin pronombre: se lee la terminación, no el pronombre. */
const F = (p, n = 0) => `<span class="fig p-${P3[p]}" aria-hidden="true">${FIG[P3[p]].repeat(n + 1)}</span>`;
const PISTA_PERS = 'Mira la terminación: ● -n (inche), ■ -ymi (eymi), ▲ -y (fey). Tras consonante: -ün, -imi, -i.';

const BANCO_G4 = {
  presentarse: [
    { id: 'pr01', n: 'b', t: '«¿Iney pigeymi?»', s: 'Te preguntan tu nombre. ¿Qué respondes?', o: ['Ana pigen', 'Ana pigeymi', 'Ana pigey'], p: 'Hablas de ti: busca la terminación de inche ●.', e: 'Pige-n: -n es inche ●. Pigen = me dicen, me llamo.' },
    { id: 'pr02', n: 'b', t: 'Quieres saber el nombre de tu lamgen.', s: '¿Cómo le preguntas?', o: ['¿Iney pigeymi?', '¿Iney pigey?', '¿Iney pigen?'], p: 'Le hablas directo a ella: eymi ■.', e: 'Pige-ymi: -ymi es eymi ■, la persona a quien le hablas.' },
    { id: 'pr03', n: 'b', t: '«¿Chumten txipantü nieymi?»', s: 'Tienes 25 años.', o: ['Epu mari kechu txipantü nien', 'Kechu mari epu txipantü nien', 'Epu mari kechu txipantü nieymi'], p: 'Primero las decenas: epu mari = 20. Y hablas de ti ●.', e: 'Epu mari (2 × 10) + kechu (5) = 25. Nie-n: tengo.' },
    { id: 'pr04', n: 'b', t: 'Llegas a una reunión con mucha gente.', s: '¿Cómo saludas a todos?', o: ['Mari mari kom pu che', 'Mari mari peñi', 'Pewkayal kom pu che'], p: 'Kom = todos; pu che = las personas.', e: 'Mari mari kom pu che: hola a todas las personas. Pewkayal es para despedirse.' },
    { id: 'pr05', n: 'b', t: '«Mülen Santiago mew»', s: '¿Qué significa?', o: ['Estoy en Santiago', 'Estás en Santiago', 'Está en Santiago'], p: 'Müle-n: ¿qué persona termina en -n?', e: '-n es inche ●: estoy. Mew marca el lugar y va al final.' },
    { id: 'pr06', n: 'b', t: 'Estoy en Ñuñoa.', s: '¿Cuál es el orden más usado?', o: ['Mülen Ñuñoa mew', 'Ñuñoa mew mülen', 'Mew Ñuñoa mülen'], p: 'El verbo va antes y mew queda al final.', e: 'Se suele decir primero el verbo y dejar al final el lugar con mew: mülen Ñuñoa mew.' },
    { id: 'pr07', n: 'b', t: 'Te confunden con otra persona.', s: 'Di: «No me llamo Pedro».', o: ['Pedro pigelan', 'Pedro pigelay', 'Pedro lapigen'], p: 'La negación -la- va entre la raíz y la persona.', e: 'Pige-la-n: -la- niega y -n dice que eres tú ●. Pigelay sería «no se llama».' },
    { id: 'pr08', n: 'b', t: '«¿Chumleymi?»', s: 'Estás con cansancio.', o: ['Ürkülen', 'Ürküleymi', 'Ürküley'], p: 'Respondes por ti: ●.', e: 'Ür-küle-n: ür (cansancio) + küle (estado, tras consonante) + n (inche).' },
    { id: 'pr09', n: 'b', t: 'Te vas de la clase.', s: '¿Qué dices?', o: ['Pewkayal', 'Mari mari', '¿Chumleymi?'], p: 'Es una despedida.', e: 'Pewkayal: hasta luego (nos veremos).' },
    { id: 'pr10', n: 'b', t: '«Tañi tuwün Temuko mew»', s: '¿Qué dice?', o: ['Soy de Temuko (mi origen)', 'Vivo hoy en Temuko', 'Mi hermano es de Temuko'], p: 'Tuwün = lugar de origen.', e: 'Tañi tuwün: mi origen, de dónde vengo. Para donde vives hoy se usa mülen.' },
    { id: 'pr11', n: 'b', t: '«¿Eymi kay?» «Inche ka kümelkalen.»', s: '¿Qué significa la respuesta?', o: ['Yo también estoy bien', 'Tú también estás bien', 'Yo no estoy bien'], p: 'Ka = también.', e: 'Inche ka kümelkale-n: yo también estoy bien. Kümelkalelan sería «no estoy bien».' },
    { id: 'pr12', n: 'b', t: 'Tienes un perro.', s: '¿Cómo lo dices?', o: ['Kiñe txewa nien', 'Kiñe txewa nieymi', 'Kiñe txewa niey'], p: 'Hablas de ti ●.', e: 'Nie-n: tengo. Un objeto con cantidad suele ir antes del verbo: kiñe txewa nien.' },
    { id: 'pr13', n: 'b', t: 'No tienes gato.', s: '¿Cómo lo dices?', o: ['Nielan ñarki', 'Nielay ñarki', 'Nien ñarki'], p: '-la- niega. ¿Quién no tiene?', e: 'Nie-la-n: no tengo. Nielay sería «no tiene» (fey ▲).' },
    { id: 'pr14', n: 'b', t: '«¿Chew müleymi?»', s: '¿Qué te preguntan?', o: ['¿Dónde estás (vives)?', '¿Cómo estás?', '¿De dónde eres?'], p: 'Chew = dónde. Müle- = estar.', e: 'Chew müle-ymi: dónde estás tú ■. Chum = cómo.' },
    { id: 'pr15', n: 'a', t: 'Presentas a tus dos hermanos, Ana y Luis.', s: '«Ellos dos se llaman Ana y Luis.»', o: ['Ana ka Luis pigeygu', 'Ana ka Luis pigeymu', 'Ana ka Luis pigeyu'], p: 'Ellos dos = feyegu ▲▲: -ygu.', e: 'Pige-ygu: 3ª persona dual. -yu es nosotros dos y -ymu ustedes dos.' },
    { id: 'pr16', n: 'a', t: '«¿Iney pigeymu?»', s: '¿A quién(es) le preguntan?', o: ['A dos personas (eymu)', 'A una persona (eymi)', 'A más de dos (eymün)'], p: 'La m es de 2ª persona; la u marca dual.', e: '-y-m-u: indicativo + 2ª persona + dual. A más de dos sería pigeymün.' },
    { id: 'pr17', n: 'a', t: 'Nos presentamos en grupo (más de dos).', s: '«Nosotros estamos en Santiago.»', o: ['Iñchiñ müleiñ Santiago mew', 'Iñchiw müleyu Santiago mew', 'Eymün müleymün Santiago mew'], p: 'Iñchiñ ●●● = nosotros (más de dos).', e: 'Müle-iñ: 1ª plural. También se oye müleyiñ. Iñchiw / -yu es «nosotros dos».' },
    { id: 'pr18', n: 'a', t: 'Mañana irás a Temuko.', s: 'Di: «Mañana iré a Temuko».', o: ['Wüle amuan Temuko mew', 'Wüle amun Temuko mew', 'Wüle amuaymi Temuko mew'], p: 'El futuro es -a- antes de la persona.', e: 'Amu-a-n: iré. Amun (sin -a-) se lee «fui».' },
    { id: 'pr19', n: 'a', t: '«Zugufun»', s: '¿Qué matiz tiene -fu-?', o: ['Había hablado (algo se interrumpió o ya no sigue)', 'Hablaré', 'Si es que hablara'], p: '-fu- mira hacia atrás.', e: '-fu-: pasado interrumpido o imperfecto. Zugufun = había hablado. Con futuro, zuguafun se acerca al condicional.' },
    { id: 'pr20', n: 'a', t: '«Zuguafun»', s: '¿Qué significa?', o: ['Si es que hablara / hablaría', 'Había hablado', 'Hablaré'], p: 'Futuro -a- + -fu-.', e: '-afu- junta futuro y -fu-: se parece al condicional (si es que hablara).' },
    { id: 'pr21', n: 'a', t: 'Una guía que sirve para aprender mapuzugun.', s: '¿Cómo la describes?', o: ['kimmapuzuguam', 'kimmapuzuguael', 'kimmapuzugun'], p: '-am indica para qué sirve algo.', e: '-am = función de algo (kimmapuzuguam). -ael = motivo de la propia acción (kimmapuzuguael).' },
    { id: 'pr22', n: 'a', t: 'Explicas tu motivo: vienes para aprender mapuzugun.', s: '¿Qué forma usas?', o: ['kimmapuzuguael', 'kimmapuzuguam', 'kimmapuzuguafiel'], p: 'Es el motivo de tu propia acción.', e: '-ael = motivo de la propia acción. -am = para qué sirve algo. -afiel = dirigido a otra persona.' },
    { id: 'pr23', n: 'a', t: 'Dos personas se presentan.', s: '«Nosotros dos somos solteros.»', o: ['Kuñifal ga iñchiw kay', 'Kuñifal ga eymu kay', 'Kuñifal ga feyegün kay'], p: 'Nosotros dos = iñchiw ●●.', e: 'Iñchiw = nosotros dos; eymu = ustedes dos; feyegün = ellos (más de dos). Basado en un ejemplo del maestro (MU 100).' }
  ],
  preguntas: [
    { id: 'pq01', n: 'b', t: 'Le preguntas a tu ñuke cómo está ella.', s: 'Le hablas directo.', o: ['¿Chumleymi, ñuke?', '¿Chumley tami ñuke?', '¿Chumlen, ñuke?'], p: 'Le hablas a ella: eymi ■.', e: 'Chum-le-ymi: cómo estás tú. Chumley tami ñuke sería preguntarle a otra persona por su madre.' },
    { id: 'pq02', n: 'b', t: 'Le preguntas a tu amiga cómo está su madre.', s: '', o: ['¿Chumley tami ñuke?', '¿Chumleymi tami ñuke?', '¿Chumley tañi ñuke?'], p: 'La madre no está en la conversación: fey ▲. Y es de tu amiga: tami.', e: 'Chum-le-y: cómo está (fey). Tami ñuke: tu madre.' },
    { id: 'pq03', n: 'b', t: '«¿Chumley tami chaw?»', s: 'Tu padre está bien.', o: ['Kümelkaley tañi chaw', 'Kümelkalen tañi chaw', 'Kümelkaley tami chaw'], p: 'Tu padre es fey ▲, y es tuyo: tañi.', e: 'Kümelka-le-y: está bien (fey). Respondes con tañi porque es tu padre.' },
    { id: 'pq04', n: 'b', t: '«¿Chumley tami lamgen?»', s: 'Tu hermana está con cansancio.', o: ['Ürküley', 'Ürkülen', 'Ürküleymi'], p: 'Hablas de ella: ▲.', e: 'Ür-küle-y: está con cansancio. Ür termina en consonante, por eso lleva -küle-.' },
    { id: 'pq05', n: 'b', t: 'Estoy trabajando.', s: 'küzaw- (trabajar) + estado', o: ['Küzawkülen', 'Küzawlen', 'Küzawkülan'], p: 'Raíz en vocal → -le-; raíz en consonante → -küle-.', e: 'Küzaw termina en consonante: küzaw-küle-n. Con raíz en vocal sería zugu-le-n.' },
    { id: 'pq06', n: 'b', t: '«¿Chew müley tami ruka?»', s: '¿Qué preguntan?', o: ['¿Dónde está tu casa?', '¿Cómo está tu casa?', '¿Quién está en tu casa?'], p: 'Chew = dónde.', e: 'Chew = dónde. Müle-y: está (fey). Tami ruka: tu casa.' },
    { id: 'pq07', n: 'b', t: '«¿Chumten txipantü niey tami ñuke?»', s: '¿Qué preguntan?', o: ['¿Cuántos años tiene tu madre?', '¿Cuántos años tienes?', '¿Cómo se llama tu madre?'], p: 'Chumten = cuánto. Nie-y: tiene (fey).', e: 'Chumten txipantü = cuántos años. Nie-y: tiene ella.' },
    { id: 'pq08', n: 'b', t: '«Kümelkalelay tañi ñarki»', s: '¿Qué significa?', o: ['Mi gato no está bien', 'Mi gato está bien', 'Tu gato no está bien'], p: '-la- = no. Tañi = mi.', e: 'Kümelka-le-la-y: no está bien (fey). Tañi ñarki: mi gato.' },
    { id: 'pq09', n: 'b', t: '¿Qué palabra pregunta «dónde»?', s: '', o: ['chew', 'chum', 'iney'], p: 'Chew müleymi = ¿dónde estás?', e: 'Chew = dónde; chum = cómo; iney = quién; chem = qué; chumten = cuánto.' },
    { id: 'pq10', n: 'b', t: '¿Qué palabra pregunta «quién»?', s: '', o: ['iney', 'chem', 'chew'], p: '¿Iney pigeymi? = ¿quién te dicen? (¿cómo te llamas?)', e: 'Iney = quién. Chem = qué. Chew = dónde.' },
    { id: 'pq11', n: 'b', t: '«¿Iney pigey tami ñuke?»', s: 'Elige la mejor respuesta.', o: ['Tañi ñuke Javiera pigey', 'Tami ñuke Javiera pigen', 'Tañi ñuke Javiera pigeymi'], p: 'Es tu madre (tañi) y no está en la conversación (▲).', e: 'Respondes con tañi (es tu madre) y pigey, porque tu madre es fey ▲.' },
    { id: 'pq12', n: 'b', t: 'Hoy no estás bien.', s: '«Fachantü …»', o: ['Fachantü kümelkalelan', 'Fachantü kümelkalelay', 'Fachantü kümelkalen'], p: '-la- antes de la persona ●.', e: 'Kümelka-le-la-n: no estoy bien. Fachantü = hoy.' },
    { id: 'pq13', n: 'b', t: '«¿Chumgelu?»', s: '¿Qué preguntan?', o: ['¿Por qué?', '¿Cuándo?', '¿Cuánto?'], p: 'Sirve para pedir una razón.', e: 'Chumgelu = por qué.' },
    { id: 'pq14', n: 'a', t: 'Saludas a dos personas a la vez.', s: '¿Cómo les preguntas cómo están?', o: ['¿Chumleymu?', '¿Chumleymi?', '¿Chumleymün?'], p: 'Dos personas a quienes hablas: eymu ■■.', e: 'Chum-le-y-m-u: 2ª persona dual. A más de dos: chumleymün.' },
    { id: 'pq15', n: 'a', t: '«¿Chumleymu?»', s: 'Tú y tu lamgen están bien.', o: ['Kümelkaleyu', 'Kümelkaleymu', 'Kümelkalen'], p: 'Respondes por ustedes dos: iñchiw ●●.', e: 'Kümelka-le-yu: nosotros dos estamos bien.' },
    { id: 'pq16', n: 'a', t: '«¿Chumleygün tami pu lamgen?»', s: 'Tus hermanos (más de dos) están bien.', o: ['Kümelkaleygün', 'Kümelkaleyu', 'Kümelkaleymün'], p: 'Ellos, más de dos: feyegün ▲▲▲.', e: 'Kümelka-le-ygün: 3ª plural. Como ya está pu, el verbo también puede quedar en singular: kümelkaley.' },
    { id: 'pq17', n: 'a', t: '«¿Chew amuaymi wüle?»', s: 'Mañana irás a la ciudad.', o: ['Amuan waria mew', 'Amun waria mew', 'Amuaymi waria mew'], p: 'Respondes por ti ● y en futuro (-a-).', e: 'Amu-a-n: iré. Wüle = mañana.' },
    { id: 'pq18', n: 'a', t: 'Di: «No iré».', s: 'amu- (ir) + negación + futuro', o: ['Amulayan', 'Amuanla', 'Amukilan'], p: 'Antes del futuro, la negación queda la + ya.', e: 'Amu-la-ya-n: no iré. -kil- es la negación del imperativo.' },
    { id: 'pq19', n: 'a', t: '¿Qué negación va con cada modo?', s: 'Indicativo · condicional · imperativo', o: ['-la- · -no- · -kil-', '-kil- · -la- · -no-', '-no- · -kil- · -la-'], p: 'Amulan (no fui), amunoli (si no voy), amukilge (¡no vayas!).', e: 'Indicativo -la-, condicional -no- (o -nu-), imperativo -kil-.' },
    { id: 'pq20', n: 'a', t: '«Amuli»', s: '¿Qué significa?', o: ['Si voy', 'Fui', 'Iré'], p: '-li es la 1ª persona del condicional.', e: 'Amu-li: si voy (si es que voy). Amun: fui. Amuan: iré.' },
    { id: 'pq21', n: 'a', t: 'Di: «Si no voy…»', s: 'amu- + condicional + negación', o: ['Amunoli', 'Amulali', 'Amukilli'], p: 'El condicional niega con -no-.', e: 'Amu-no-li: si no voy.' },
    { id: 'pq22', n: 'a', t: '«Petu kimlafiñ»', s: '¿Qué significa?', o: ['Todavía no lo sé', 'Ya lo sé', 'No lo supe nunca'], p: 'Petu = todavía. -la- = no.', e: 'Petu + verbo = todavía. Kim-la-fi-ñ: no lo sé (fi: 3ª persona como objeto). Ejemplo del maestro (S128).' }
  ],
  gutxam: [
    { id: 'gb01', n: 'b', t: 'Rayen: «¡Mari mari lamgen!»', s: '¿Qué responde Antü?', o: ['¡Mari mari lamgen!', 'Pewkayal lamgen', '¿Iney pigeymi?'], p: 'Primero se devuelve el saludo.', e: 'Al saludo se responde con el mismo saludo: mari mari.' },
    { id: 'gb02', n: 'b', t: 'Rayen: «¿Chumleymi?»', s: '¿Qué responde Antü?', o: ['Kümelkalen, ¿eymi kay?', 'Kümelkaleymi, ¿eymi kay?', 'Kümelkaley, ¿inche kay?'], p: 'Antü habla de sí ● y luego pregunta por ella ■.', e: 'Kümelkale-n: estoy bien. ¿Eymi kay?: ¿y tú?' },
    { id: 'gb03', n: 'b', t: 'Rayen: «Inche ka kümelkalen. ¿Iney pigeymi?»', s: '¿Qué responde Antü?', o: ['Inche Antü pigen', 'Inche Antü pigey', 'Eymi Antü pigeymi'], p: 'Antü dice su nombre ●.', e: 'Inche ___ pige-n: me llamo ___.' },
    { id: 'gb12', n: 'b', t: 'Rayen: «¿Chew tuwimi?»', s: 'Antü es de Temuko.', o: ['Tañi tuwün Temuko mew', 'Tami tuwün Temuko mew', 'Temuko mew tuwimi'], p: 'Tuwün = origen. Es el origen de Antü: tañi.', e: 'Tañi tuwün Temuko mew: mi origen es Temuko.' },
    { id: 'gb04', n: 'b', t: 'Rayen: «¿Chew müleymi fachantü?»', s: 'Antü vive en Santiago.', o: ['Mülen Santiago mew', 'Müley Santiago mew', 'Müleymi Santiago mew'], p: 'Antü habla de sí ●.', e: 'Müle-n Santiago mew: estoy (vivo) en Santiago.' },
    { id: 'gb05', n: 'b', t: 'Rayen: «¿Chumten txipantü nieymi?»', s: 'Antü tiene 30 años.', o: ['Küla mari txipantü nien', 'Küla mari txipantü nieymi', 'Mari küla txipantü nien'], p: '30 = 3 × 10.', e: 'Küla mari = 30 (mari küla sería 13). Nie-n: tengo.' },
    { id: 'gb06', n: 'b', t: 'Rayen: «¿Iney pigey tami ñuke?»', s: 'La madre de Antü se llama Rosa.', o: ['Tañi ñuke Rosa pigey', 'Tami ñuke Rosa pigey', 'Tañi ñuke Rosa pigen'], p: 'Es su madre (tañi) y no está ahí (▲).', e: 'Tañi ñuke: mi madre. Pige-y: se llama (fey).' },
    { id: 'gb07', n: 'b', t: 'Rayen: «¿Chumley tami ñuke?»', s: 'La madre de Antü está bien.', o: ['Kümelkaley', 'Kümelkalen', 'Kümelkaleymi'], p: 'Hablan de la madre: fey ▲.', e: 'Kümelka-le-y: está bien (ella).' },
    { id: 'gb08', n: 'b', t: 'Rayen: «¿Nieymi txewa?»', s: 'Antü tiene un perro.', o: ['May, kiñe txewa nien', 'May, kiñe txewa nieymi', 'May, kiñe txewa niey'], p: 'May = sí. Antü habla de sí ●.', e: 'Nie-n: tengo. May = sí.' },
    { id: 'gb09', n: 'b', t: 'Rayen: «¿Nieymi ñarki?»', s: 'Antü no tiene gato.', o: ['Nielan ñarki', 'Nielay ñarki', 'Nien ñarki'], p: '-la- = no, y la persona es ●.', e: 'Nie-la-n: no tengo.' },
    { id: 'gb10', n: 'b', t: 'Antü cuenta: «Tañi chaw küzawi waria mew».', s: '¿Qué entiende Rayen?', o: ['El padre de Antü trabajó en la ciudad', 'El padre de Rayen trabajó en la ciudad', 'Antü trabajó en la ciudad'], p: 'Tañi = de quien habla. -i (tras consonante) = fey.', e: 'Tañi chaw: el padre de quien habla (Antü). Küzaw-i: trabajó él.' },
    { id: 'gb11', n: 'b', t: 'Rayen: «¡Pewkayal lamgen!»', s: '¿Qué responde Antü?', o: ['Feley, pewkayal', 'Mari mari', '¿Chumleymi?'], p: 'Es una despedida.', e: 'Feley = de acuerdo, así es. Pewkayal = hasta luego.' },
    { id: 'ga01', n: 'a', t: 'Rayen saluda a Antü y a su lamgen: «¿Chumleymu?»', s: 'Los dos están bien. ¿Qué responde Antü?', o: ['Kümelkaleyu', 'Kümelkalen', 'Kümelkaleymu'], p: 'Antü responde por los dos: iñchiw ●●.', e: 'Kümelka-le-yu: nosotros dos estamos bien.' },
    { id: 'ga02', n: 'a', t: 'Rayen: «¿Chew amuaymu wüle?»', s: 'Mañana los dos irán a la ciudad.', o: ['Amuayu waria mew', 'Amuan waria mew', 'Amuaymu waria mew'], p: 'Futuro -a- + nosotros dos ●●.', e: 'Amu-a-yu: iremos (los dos).' },
    { id: 'ga03', n: 'a', t: 'Rayen: «¡Küpage!»', s: '¿Qué le pide a Antü?', o: ['¡Ven!', 'Viniste', 'Vendré'], p: '-ge es el imperativo de 2ª persona.', e: 'Küpa-ge: ¡ven! (imperativo).' },
    { id: 'ga04', n: 'a', t: 'Antü: «Amulayan, küzawan».', s: '¿Qué dice?', o: ['No iré, voy a trabajar', 'No fui, trabajé', 'Si no voy, trabajaré'], p: 'la + ya = negación antes del futuro.', e: 'Amu-la-ya-n: no iré. Küzaw-a-n: trabajaré.' },
    { id: 'ga05', n: 'a', t: 'Rayen: «¡Amukilge!»', s: '¿Qué le dice?', o: ['¡No vayas!', 'No fuiste', 'Si no vas'], p: 'El imperativo niega con -kil-.', e: 'Amu-kil-ge: ¡no vayas!' },
    { id: 'ga06', n: 'a', t: 'Antü: «Amufun Temuko mew, welu…»', s: '¿Qué matiz tiene?', o: ['Fui (o iba) a Temuko, pero algo cambió', 'Iré a Temuko', 'Si fuera a Temuko'], p: '-fu- = pasado interrumpido.', e: '-fu- marca algo pasado que se interrumpió o ya no sigue. Welu = pero.' },
    { id: 'ga07', n: 'a', t: '«Müchay konle müten antü, amuayu.»', s: '¿Qué significa?', o: ['Apenas se entre el sol, nos iremos los dos', 'El sol se entró y nos fuimos', 'Si no se entra el sol, iremos'], p: '-le = condicional (cuando / si); -a-yu = futuro, nosotros dos.', e: 'Kon-le: cuando se entre. Amu-a-yu: iremos los dos. Ejemplo del maestro (S115).' },
    { id: 'ga08', n: 'a', t: 'Rayen muestra una guía para aprender mapuzugun.', s: '¿Cómo la llama?', o: ['Kimmapuzuguam', 'Kimmapuzuguael', 'Kimmapuzugualu'], p: 'Es algo que sirve para…', e: '-am = para qué sirve algo. -ael = motivo de la propia acción.' },
    { id: 'ga09', n: 'a', t: 'Rayen: «¿Chumleygün tami pu peñi?»', s: 'Los hermanos de Antü (más de dos) están bien.', o: ['Kümelkaleygün', 'Kümelkaleyu', 'Kümelkaleymün'], p: 'Ellos, más de dos ▲▲▲.', e: 'Kümelka-le-ygün: están bien (ellos). Con pu, también se puede dejar en singular: kümelkaley.' },
    { id: 'ga10', n: 'a', t: 'Antü: «Mañumeyu mi zugufiel.»', s: '¿Qué le dice a Rayen?', o: ['Te agradezco lo que me dijiste', 'Me agradeciste lo que dije', 'Gracias por hablarle a él'], p: 'Mi … -fiel: lo que tú me dijiste.', e: 'Mañum-e-yu: yo te agradezco. Mi zugufiel: lo que tú me hablaste. Frase de hablantes del maestro.' },
    { id: 'ga11', n: 'a', t: 'Antü se despide de todo el grupo.', s: '', o: ['Pewkayal kom pu che', 'Pewkayal lamgen', 'Mari mari kom pu che'], p: 'Kom pu che = todas las personas.', e: 'Pewkayal kom pu che: hasta luego a todos.' },
    { id: 'ga12', n: 'a', t: 'Rayen: «Müleyiñ kelluafiel tüfachi püchiche.»', s: '¿Qué dice?', o: ['Debemos ayudar a este niño', 'Ayudamos a este niño', 'Este niño nos ayudará'], p: 'Müleyiñ + -afiel: «hay que / debemos».', e: 'Müle-yiñ + kellu-a-fiel: debemos ayudarlo. Ejemplo del maestro (S127).' }
  ]
};

/* ---------- Generadores ---------- */
function itemPersonaBasico() {
  const v = azar(verbosBasico(), 1)[0], p = Math.floor(Math.random() * 3), neg = Math.random() < .3;
  const o = [0, 1, 2].map(k => conj(v, { p: k, neg }));
  const es = esDe(v, p);
  return { id: `gen:pb:${v.mz}:${p}${neg ? 'n' : ''}`, n: 'b', t: `${chipP(p)} ${neg ? '<b>no</b> + ' : '+ '}<span class="mz">${v.raiz}-</span> <span class="es">(${v.es})</span>`,
    s: es ? (neg ? 'Con negación' : `«${es[0].toUpperCase() + es.slice(1)}»`) : '¿Qué forma corresponde?', o: [o[p], ...o.filter((_, k) => k !== p)],
    p: (neg ? 'La negación -la- va antes de la persona. ' : '') + PISTA_PERS,
    e: `${neg ? v.raiz + '-la-' : v.raiz + '-'}${o[p].slice((v.raiz + (neg ? 'la' : '')).length)}: ${['-n / -ün es inche ●', '-ymi / -imi es eymi ■', '-y / -i es fey ▲'][p]}${v.final === 'consonante' && !neg ? '. La raíz termina en consonante.' : '.'}` };
}
function itemQuienBasico() {
  const v = azar(verbosBasico(), 1)[0], p = Math.floor(Math.random() * 3);
  const f = conj(v, { p });
  const opc = [0, 1, 2].map(k => `<span class="fig" style="color:var(--${P3[k]})">${FIG[P3[k]]}</span> ${['inche (yo)', 'eymi (tú)', 'fey (él, ella)'][k]}`);
  return { id: `gen:qb:${v.mz}:${p}`, n: 'b', t: `<span class="mz">${f}</span>`, s: '¿Quién hace la acción?', o: [opc[p], ...opc.filter((_, k) => k !== p)],
    p: PISTA_PERS, e: `${f} = ${esDe(v, p) || v.es}. Termina en -${f.slice(v.raiz.length)}: ${PRON[0][p]}.` };
}
const MODOS_AV = [
  { modo: 'ind' }, { modo: 'ind', neg: true }, { modo: 'ind', fut: true }, { modo: 'ind', fu: true }, { modo: 'ind', neg: true, fut: true },
  { modo: 'cond' }, { modo: 'cond', neg: true }, { modo: 'imp' }, { modo: 'imp', neg: true }
];
const etiquetaModo = o => [MODO_ES[o.modo], o.fut && 'futuro -a-', o.fu && '-fu-', o.neg && 'negación'].filter(Boolean).join(' · ');
function itemConjAvanzado() {
  for (let intento = 0; intento < 20; intento++) {
    const v = azar(verbosAvanzado(), 1)[0], m = azar(MODOS_AV, 1)[0];
    let p = Math.floor(Math.random() * 3), n = Math.floor(Math.random() * 3);
    if (m.modo === 'imp' && m.neg) p = 1;
    const ok = conj(v, { ...m, p, n }); if (!ok) continue;
    /* Distractores: misma raíz y modo, otra persona o número */
    const otros = [];
    for (const [pp, nn] of azar([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], 9)) {
      const f = conj(v, { ...m, p: m.modo === 'imp' && m.neg ? 1 : pp, n: nn });
      if (f && f !== ok && !otros.includes(f)) otros.push(f);
      if (otros.length === 2) break;
    }
    if (otros.length < 2) continue;
    return { id: `gen:ca:${v.mz}:${m.modo}${m.neg ? 'n' : ''}${m.fut ? 'a' : ''}${m.fu ? 'f' : ''}:${p}${n}`, n: 'a',
      t: `${chipP(p, n)} + <span class="mz">${v.raiz}-</span> <span class="es">(${v.es})</span>`, s: etiquetaModo(m), o: [ok, ...otros],
      p: `Persona: ${PRON[n][p]} (${NUM_ES[n]}). ${m.modo === 'ind' ? 'Indicativo: -n, -ymi, -y · dual -yu, -ymu, -ygu · plural -iñ, -ymün, -ygün.' : m.modo === 'cond' ? 'Condicional: -li, -lmi, -le · dual -liyu, -lmu, -legu · plural -liyiñ, -lmün, -legün.' : 'Imperativo: -chi, -ge, -pe · dual -yu, -mu, pe egu · plural -iñ, -mün, pe egün.'}`,
      e: `${ok}: ${PRON[n][p]}, ${etiquetaModo(m)}. Forma armada con las reglas de la pestaña Sufijos: verifícala con hablante.` };
  }
  return itemPersonaBasico();
}

/* Mezcla de lo antiguo: guía 3, rakin y vocabulario del maestro */
function itemsAntiguos(k) {
  const g3 = azar(QUIZ, 3).map(q => ({ id: q[0], n: 'b', t: q[1], s: q[2], o: q[3], p: 'Recuerda la guía 3: tañi (mío), tami (tuyo), ñi (suyo). La terminación dice quién hace la acción.', e: q[4], viejo: 'Guía 3' }));
  const n = 11 + Math.floor(Math.random() * 88);
  const mal = [...new Set([n + 10 > 99 ? n - 10 : n + 10, (n % 10) * 10 + Math.floor(n / 10), n + 1, n - 1].filter(x => x > 0 && x !== n).map(rakin))];
  const rk = { id: `gen:rk:${n}`, n: 'b', t: `${n}`, s: '¿Cómo se dice este número?', o: [rakin(n), ...mal.slice(0, 2)], p: 'Primero las decenas (… mari), después las unidades.', e: `${n} = ${rakin(n)}.`, viejo: 'Guía 1' };
  const vocab = [];
  if (DATOS_VOCAB.length > 10) {
    const w = azar(DATOS_VOCAB, 1)[0];
    const mismos = DATOS_VOCAB.filter(x => x.contexto === w.contexto && glosa(x.es) !== glosa(w.es));
    const dis = azar(mismos.length >= 2 ? mismos : DATOS_VOCAB.filter(x => x !== w), 2).map(x => glosa(x.es));
    if (dis.length === 2) vocab.push({ id: `voc:${w.id}`, n: 'b', t: `<span class="mz">${w.mz}</span>`, s: '¿Qué significa?', o: [glosa(w.es), ...dis], p: `Es una palabra del tema «${w.contexto.toLowerCase()}».`, e: `${w.mz} = ${w.es}.${w.ejemplo ? ` <span class="mz">${w.ejemplo}</span>${w.ejemplo_es ? ` (${w.ejemplo_es})` : ''}` : ''}`, viejo: 'Vocabulario' });
  }
  return azar([...g3, rk, ...vocab], k);
}

/* ---------- Armar cada actividad: 10 preguntas ---------- */
const ACTIVIDADES = {
  presentarse: { nombre: 'Presentarse', fig: '●' },
  conjugacion: { nombre: 'Conjugación y posesivos', fig: '■' },
  preguntas: { nombre: 'Preguntas y estados', fig: '▲' },
  gutxam: { nombre: 'Gütxam: un diálogo', fig: '●■▲' }
};
function armar(act, nivel) {
  const filtra = b => b.filter(x => x.n === (nivel === 'intermedio' ? 'a' : 'b'));
  const basicos = b => b.filter(x => x.n === 'b');
  let lista;
  if (act === 'conjugacion') {
    const gen = nivel === 'intermedio'
      ? [...Array(5)].map(itemConjAvanzado).concat([itemPersonaBasico(), itemQuienBasico()])
      : [...Array(4)].map(itemPersonaBasico).concat([...Array(3)].map(itemQuienBasico));
    const pos = azar(QUIZ, 1).map(q => ({ id: q[0], n: 'b', t: q[1], s: q[2], o: q[3], p: 'Tañi = de quien habla; tami = de quien escucha; ñi = de quien no participa.', e: q[4] }));
    lista = [...gen, ...pos, ...itemsAntiguos(2)];
  } else if (act === 'gutxam') {
    /* El diálogo va en orden; en intermedio se mezclan turnos básicos */
    const b = BANCO_G4.gutxam;
    const sel = nivel === 'intermedio' ? azar(filtra(b), 8).concat(azar(basicos(b), 2)) : azar(basicos(b), 10);
    lista = sel.sort((x, y) => b.indexOf(x) - b.indexOf(y));
    return lista.slice(0, 10);
  } else {
    const b = BANCO_G4[act];
    lista = nivel === 'intermedio' ? [...azar(filtra(b), 6), ...azar(basicos(b), 2)] : azar(basicos(b), 8);
    lista = [...lista, ...itemsAntiguos(2)];
  }
  /* Evita repetir el mismo texto y entrega 10 */
  const vistos = new Set();
  lista = lista.filter(x => !vistos.has(x.t + x.s) && vistos.add(x.t + x.s));
  while (lista.length < 10) lista.push(act === 'conjugacion' && nivel === 'intermedio' ? itemConjAvanzado() : itemPersonaBasico());
  return azar(lista.slice(0, 10), 10);
}

/* ---------- Motor del awkantun (dos intentos, pista antes de la respuesta) ---------- */
const SESION_G4 = new URLSearchParams(location.search).get('sesion') || 'guia-4';
const textoPlano = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' ').trim(); };
function initAwkantun() {
  const caja = $('#quiz'); if (!caja || !$('#g4-actividades')) return;
  const cuerpo = $('.quiz-cuerpo', caja);
  let preg = [], i = 0, resp = [], dupla = '', act = '', nivel = 'basico';
  const abre = () => { caja.classList.add('abierto'); document.body.style.overflow = 'hidden'; caja.requestFullscreen?.().catch(() => {}); };
  const cierra = () => { caja.classList.remove('abierto'); document.body.style.overflow = ''; if (document.fullscreenElement) document.exitFullscreen(); };
  const barra = () => { $('.barra i', caja).style.width = (i / 10 * 100) + '%'; $('#quiz-cont').textContent = i < 10 ? `${ACTIVIDADES[act].nombre} · ${i + 1} / 10` : ACTIVIDADES[act].nombre; };
  const muestra = () => {
    barra();
    const q = preg[i], ops = azar(q.o, 3);
    cuerpo.innerHTML = `<div class="q-num">Ramtun ${rakin(i + 1)}${q.viejo ? ` <span class="q-viejo">repaso · ${q.viejo}</span>` : ''}</div>` +
      `<div class="q-texto">${q.t}${q.s ? `<span class="es">${q.s}</span>` : ''}</div>` +
      `<div class="q-opciones">${ops.map((o, k) => `<button type="button" data-k="${q.o.indexOf(o)}"><b>${'ABC'[k]}</b>${o}</button>`).join('')}</div><div id="q-fb" aria-live="polite"></div>`;
    let intentos = 0, elegidas = [];
    $('.q-opciones', cuerpo).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      intentos++;
      const bien = b.dataset.k === '0';
      elegidas.push(q.o[+b.dataset.k]);
      if (!bien && intentos === 1) {
        b.classList.add('mal'); b.disabled = true;
        $('#q-fb').innerHTML = `<div class="q-fb pista"><h4>Pista</h4><p>${q.p}</p><p class="es">Tienen un segundo intento.</p></div>`;
        return;
      }
      resp.push({ id: q.id, t: textoPlano(q.t + (q.s ? ' · ' + q.s : '')).slice(0, 140), elegida: elegidas[0], correcta: q.o[0], ok: bien, intento: intentos });
      $$('.q-opciones button', cuerpo).forEach(x => { x.disabled = true; if (x.dataset.k === '0') x.classList.add('ok'); });
      if (!bien) b.classList.add('mal');
      const tit = bien ? (intentos === 1 ? '¡Müna kümey!' : 'Kümey, con pista') : 'Müna weza';
      $('#q-fb').innerHTML = `<div class="q-fb ${bien ? 'bien' : 'no'}"><h4>${tit}</h4><p>${bien ? '' : `La respuesta era <b>${q.o[0]}</b>. `}${q.e}</p>` +
        `<button class="btn" type="button" id="q-sig">${i < 9 ? 'Siguiente →' : 'Ver resultado'}</button></div>`;
      $('#q-sig').focus();
      $('#q-sig').addEventListener('click', () => { i++; i < 10 ? muestra() : final(); });
    });
  };
  const final = () => {
    barra();
    const pts = resp.filter(r => r.ok && r.intento === 1).length, conPista = resp.filter(r => r.ok && r.intento === 2).length;
    let img, anim, frase, es, cred = '';
    if (pts >= 9) { img = 'img/afafan.png'; anim = 'a-afafan'; frase = 'Müna kümey amuley tami mapuzugun. ¡Kiñe afafan tati!'; es = 'Va muy bien tu mapuzugun. ¡Un afafan!'; cred = '<p class="credito-img">Imagen: Fiestoforo</p>'; }
    else if (pts >= 5) { img = 'img/feley.png'; anim = 'a-feley'; frase = 'Feley, küme txipay. Petu müley mi pepikawal tufachi zugü mew.'; es = 'Bien, salió bien. ¡Aún debes prepararte para este tema!'; }
    else { img = 'img/fotx.png'; anim = 'a-fotx'; frase = 'Fotxü anay'; es = '¡Pucha! Repasa la guía y vuelve a intentarlo.'; }
    cuerpo.innerHTML = `<div class="resultado"><img class="${anim}" src="${img}" alt="">${cred}` +
      `<div class="puntaje">${numMz(pts)}<small>${pts} de 10 al primer intento${conPista ? ` · ${conPista} más con pista` : ''} · ${dupla}</small></div><p class="frase">${frase}</p><p class="es">${es}</p>` +
      `<div class="acciones"><button class="btn" id="q-rev">Pellelu take tankun<small>Revisar respuestas</small></button><button class="btn sec" id="q-otra">Ka kiñe<small>Otra vez</small></button><button class="btn sec" id="q-fin">Fey mütem<small>Eso nada más</small></button></div>` +
      `<p class="registro" id="q-reg"></p></div>`;
    botones(); registra(pts, conPista);
  };
  const revision = () => {
    cuerpo.innerHTML = `<div class="revision"><h2>Pellelu take tankun</h2><ol>${resp.map((r, k) => { const q = preg[k];
      return `<li><b>${rakin(k + 1)}.</b> <span class="mz">${q.t}</span> ${q.s ? `<span class="es">${q.s}</span>` : ''}<br>` +
        (r.ok ? `<span class="buena">✔ ${r.correcta}${r.intento === 2 ? ' (con pista)' : ''}</span>` : `<span class="tuya">✘ Eligieron: ${r.elegida}</span><br><span class="buena">✔ Correcta: ${r.correcta}</span>`) +
        `<br><span class="es">${q.e}</span></li>`; }).join('')}</ol>` +
      `<div class="acciones"><button class="btn sec" id="q-otra">Ka kiñe<small>Otra vez</small></button><button class="btn sec" id="q-fin">Fey mütem<small>Eso nada más</small></button></div></div>`;
    botones(); cuerpo.scrollTop = 0; caja.scrollTop = 0;
  };
  const botones = () => { $('#q-rev')?.addEventListener('click', revision); $('#q-otra')?.addEventListener('click', empieza); $('#q-fin')?.addEventListener('click', cierra); };
  const registra = (pts, conPista) => {
    const url = window.REGISTRO_URL, reg = $('#q-reg');
    if (!url) { reg.textContent = 'Registro en línea no configurado.'; return; }
    fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ sesion: SESION_G4, actividad: act, nivel, dupla, puntaje: pts, con_pista: conPista, respuestas: resp }) })
      .then(() => reg.textContent = 'Resultado registrado.').catch(() => reg.textContent = 'No se pudo registrar (revisa la conexión).');
  };
  const empieza = () => { preg = armar(act, nivel); i = 0; resp = []; abre(); muestra(); };
  selector($('#g4-nivel'), b => {
    nivel = b.dataset.nivel;
    $('#g4-aviso').hidden = nivel !== 'intermedio';
    $('#g4-nivel-desc').hidden = nivel === 'intermedio';
  });
  $('#g4-actividades').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    dupla = $('#quiz-dupla').value.trim();
    if (!dupla) { $('#quiz-dupla').focus(); $('#quiz-aviso').textContent = 'Escriban un nombre para su dupla.'; return; }
    $('#quiz-aviso').textContent = ''; act = b.dataset.act; empieza();
  });
  $('#quiz-cerrar').addEventListener('click', cierra);
}

/* ---------- Tabla de conjugación: verbos clave con traducción ---------- */
/* [mz, raíz, consonante?, glosa, indicativo yo/tú/fey, condicional (si…) yo/tú/fey] */
const CLAVE = [
  ['zugun', 'zugu', 0, 'hablar', ['hablé', 'hablaste', 'habló'], ['hablo', 'hablas', 'habla']],
  ['allkütun', 'allkütu', 0, 'escuchar', ['escuché', 'escuchaste', 'escuchó'], ['escucho', 'escuchas', 'escucha']],
  ['azümün', 'azüm', 1, 'entender', ['entendí', 'entendiste', 'entendió'], ['entiendo', 'entiendes', 'entiende']],
  ['küpan', 'küpa', 0, 'venir', ['vine', 'viniste', 'vino'], ['vengo', 'vienes', 'viene']],
  ['amun', 'amu', 0, 'ir', ['fui', 'fuiste', 'fue'], ['voy', 'vas', 'va']],
  ['txipan', 'txipa', 0, 'salir', ['salí', 'saliste', 'salió'], ['salgo', 'sales', 'sale']],
  ['mülen', 'müle', 0, 'estar, vivir', ['estoy', 'estás', 'está'], ['estoy', 'estás', 'está']],
  ['nien', 'nie', 0, 'tener', ['tengo', 'tienes', 'tiene'], ['tengo', 'tienes', 'tiene']],
  ['pigen', 'pige', 0, 'llamarse', ['me llamo', 'te llamas', 'se llama'], ['me llamo', 'te llamas', 'se llama']],
  ['kimün', 'kim', 1, 'saber', ['sé', 'sabes', 'sabe'], ['sé', 'sabes', 'sabe']],
  ['küzawün', 'küzaw', 1, 'trabajar', ['trabajé', 'trabajaste', 'trabajó'], ['trabajo', 'trabajas', 'trabaja']],
  ['chillkatun', 'chillkatu', 0, 'estudiar', ['estudié', 'estudiaste', 'estudió'], ['estudio', 'estudias', 'estudia']],
  ['ülkantun', 'ülkantu', 0, 'cantar', ['canté', 'cantaste', 'cantó'], ['canto', 'cantas', 'canta']],
  ['putun', 'putu', 0, 'beber', ['tomé', 'tomaste', 'tomó'], ['tomo', 'tomas', 'toma']],
  ['kellun', 'kellu', 0, 'ayudar', ['ayudé', 'ayudaste', 'ayudó'], ['ayudo', 'ayudas', 'ayuda']],
  ['ramtun', 'ramtu', 0, 'preguntar', ['pregunté', 'preguntaste', 'preguntó'], ['pregunto', 'preguntas', 'pregunta']],
  ['pen', 'pe', 0, 'ver', ['vi', 'viste', 'vio'], ['veo', 'ves', 've']],
  ['txekan', 'txeka', 0, 'caminar', ['caminé', 'caminaste', 'caminó'], ['camino', 'caminas', 'camina']],
  ['umawtun', 'umawtu', 0, 'dormir', ['dormí', 'dormiste', 'durmió'], ['duermo', 'duermes', 'duerme']],
  ['ürkütun', 'ürkütu', 0, 'descansar', ['descansé', 'descansaste', 'descansó'], ['descanso', 'descansas', 'descansa']],
  ['ayen', 'aye', 0, 'reír', ['reí', 'reíste', 'rio'], ['río', 'ríes', 'ríe']],
  ['güman', 'güma', 0, 'llorar', ['lloré', 'lloraste', 'lloró'], ['lloro', 'lloras', 'llora']],
  ['mañumün', 'mañum', 1, 'agradecer', ['agradecí', 'agradeciste', 'agradeció'], ['agradezco', 'agradeces', 'agradece']]
];
const SUF_TC = {
  ind: [['n', 'ymi', 'y'], ['ün', 'imi', 'i']],
  cond: [['li', 'lmi', 'le'], ['li', 'ülmi', 'le']]
};
function initTablaConj() {
  const sel = $('#tc-verbo'); if (!sel) return;
  let modo = 'ind';
  sel.innerHTML = CLAVE.map((v, k) => `<option value="${k}">${v[0]} · ${v[3]}</option>`).join('');
  const pinta = () => {
    const [mz, raiz, cons, , esInd, esCond] = CLAVE[+sel.value], neg = $('#tc-neg').checked;
    const marca = neg ? (modo === 'ind' ? 'la' : 'no') : '';
    const suf = SUF_TC[modo][cons && !neg ? 1 : 0];
    const es = modo === 'ind' ? esInd : esCond;
    $('#tc-tabla').innerHTML = P3.map((p, k) =>
      `<tr><th class="p-${p}" style="background:var(--c)"><span class="fig">${FIG[p]}</span> ${p}</th>` +
      `<td><b class="mz"><span class="raiz">${raiz}</span>${marca ? `<span class="neg-m">${marca}</span>` : ''}<span class="suf p-${p}">${suf[k]}</span></b></td>` +
      `<td class="es">${modo === 'cond' ? 'si ' : ''}${neg ? 'no ' : ''}${es[k]}</td></tr>`).join('');
    $('#tc-nota').innerHTML = modo === 'ind'
      ? `Raíz <b class="mz">${raiz}-</b>${cons ? ' termina en consonante: -ün, -imi, -i.' : ' termina en vocal: -n, -ymi, -y.'}${neg ? ' Con -la- la palabra sigue en vocal.' : ''}`
      : `Condicional: <b class="mz">-li, -lmi, -le</b> (si…). ${neg ? 'Se niega con <b class="mz">-no-</b>, no con -la-.' : ''} Formas armadas con las reglas del maestro: verifícalas con un hablante.`;
  };
  selector($('#tc-modo'), b => { modo = b.dataset.modo; pinta(); });
  sel.addEventListener('change', pinta); $('#tc-neg').addEventListener('change', pinta);
  pinta();
}

/* ---------- Formas de estar ---------- */
/* [raíz, -le / -küle, complemento en español, nota] */
const ESTADOS4 = [
  ['kümelka', 'le', 'bien'], ['txemo', 'le', 'bien de salud'], ['ür', 'küle', 'con cansancio'], ['kütxan', 'küle', 'con enfermedad'],
  ['mañum', 'küle', 'con gratitud'], ['newen', 'küle', 'con energía (newen)'], ['kümezuam', 'küle', 'de buen ánimo'],
  ['tun', 'küle', 'tranquila/o, en paz'], ['küzaw', 'küle', 'trabajando'], ['zugu', 'le', 'hablando']
];
const ESTAR = ['estoy', 'estás', 'está'];
function initEstados4() {
  const lista = $('#es-lista'); if (!lista) return;
  let e = 0, p = 0;
  lista.innerHTML = ESTADOS4.map((x, k) => `<button type="button" aria-pressed="${k === 0}">${x[0]}${x[1]}n</button>`).join('');
  const pinta = () => {
    const [raiz, est, es] = ESTADOS4[e], neg = $('#es-neg').checked, suf = ['n', 'ymi', 'y'][p];
    $('#es-salida').innerHTML = `<div class="morf"><span data-t="${raiz === 'zugu' || raiz === 'küzaw' ? 'verbo' : 'palabra'}">${raiz}</span><span data-t="estado">${est}</span>` +
      (neg ? '<span class="neg" data-t="negación">la</span>' : '') + `<span class="pers p-${P3[p]}" data-t="${P3[p]}">${suf}</span></div>` +
      `<p class="tr-frase">${['Inche', 'Eymi', 'Fey'][p]} ${raiz}${est}${neg ? 'la' : ''}${suf}.</p>` +
      `<p class="es">${['Yo', 'Tú', 'Él / ella'][p]} ${neg ? 'no ' : ''}${ESTAR[p]} ${es}.</p>` +
      `<p class="es" style="font-size:1rem">${est === 'le' ? `${raiz} termina en vocal: lleva -le-.` : `${raiz} termina en consonante: lleva -küle-.`}</p>`;
  };
  selector(lista, b => { e = $$('button', lista).indexOf(b); pinta(); });
  selector($('#es-persona'), b => { p = $$('#es-persona button').indexOf(b); pinta(); });
  $('#es-neg').addEventListener('change', pinta);
  $('#es-tabla').innerHTML = '<tr><th>Forma</th><th>Significa</th><th>Negación</th></tr>' +
    ESTADOS4.map(([r, s, es]) => `<tr><td class="mz">${r}${s}n</td><td>estoy ${es}</td><td class="mz">${r}${s}lan</td></tr>`).join('');
  pinta();
}

/* ---------- Memorice ---------- */
const MEM = [
  ['¿Chumleymi?', '¿Cómo estás?'], ['¿Eymi kay?', '¿Y tú?'], ['Inche ka kümelkalen', 'Yo también estoy bien'],
  ['¿Chumley tami ñuke?', '¿Cómo está tu madre?'], ['¿Kümelkaleymi?', '¿Estás bien?'], ['¿Iney pigeymi?', '¿Cómo te llamas?'],
  ['¿Chew müleymi?', '¿Dónde estás (vives)?'], ['¿Chew tuwimi?', '¿De dónde eres?'], ['¿Chumten txipantü nieymi?', '¿Cuántos años tienes?'],
  ['kümelkalen', 'estoy bien'], ['kümelkalelan', 'no estoy bien'], ['txemolen', 'estoy bien de salud'], ['ürkülen', 'estoy con cansancio'],
  ['kütxankülen', 'estoy con enfermedad'], ['mañumkülen', 'estoy con gratitud'], ['newenkülen', 'estoy con energía'],
  ['kümezuamkülen', 'estoy de buen ánimo'], ['tunkülen', 'estoy tranquila/o'], ['küzawkülen', 'estoy trabajando'],
  ['Mañum', 'Gracias'], ['Feley', 'De acuerdo, así es'], ['Pewkayal', 'Hasta luego']
];
const MEM_INICIAL = [0, 1, 2, 3, 9, 10, 11, 12, 13, 14];
function initMemorice() {
  const caja = $('#mem-elige'); if (!caja) return;
  let elegidas;
  try { elegidas = JSON.parse(localStorage.getItem('g4-memorice')); } catch (e) { elegidas = null; }
  if (!Array.isArray(elegidas) || !elegidas.length) elegidas = [...MEM_INICIAL];
  const guarda = () => { try { localStorage.setItem('g4-memorice', JSON.stringify(elegidas)); } catch (e) {} };
  const pintaLista = () => {
    caja.innerHTML = MEM.map(([mz, es], k) => `<button type="button" aria-pressed="${elegidas.includes(k)}" data-k="${k}"><b>${mz}</b><small>${es}</small></button>`).join('');
    $('#mem-cuenta').textContent = `${elegidas.length} de 10 elegidas${elegidas.length < 4 ? ' · elige al menos 4 para jugar' : ''}`;
  };
  caja.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    const k = +b.dataset.k;
    if (elegidas.includes(k)) elegidas = elegidas.filter(x => x !== k);
    else if (elegidas.length < 10) elegidas.push(k);
    else { $('#mem-cuenta').textContent = 'Ya tienes 10. Quita una para elegir otra.'; return; }
    guarda(); pintaLista();
  });
  pintaLista();
  const juego = $('#mem-juego');
  const jugar = () => {
    if (elegidas.length < 4) return;
    const cartas = azar(elegidas.flatMap(k => [{ k, t: MEM[k][0], mz: true }, { k, t: MEM[k][1], mz: false }]), 99);
    let abiertas = [], pares = 0, intentos = 0, bloqueo = false;
    juego.innerHTML = `<p class="marcador" id="mem-marca">Encuentra cada palabra con su traducción.</p><div class="mem-tablero">${cartas.map((c, i) =>
      `<button type="button" class="mem-carta${c.mz ? ' mz-c' : ''}" data-i="${i}" aria-label="Carta ${i + 1}"><span class="dorso"><svg viewBox="0 0 549 554" aria-hidden="true"><use href="#waglen"/></svg></span><span class="cara-m">${c.t}</span></button>`).join('')}</div>`;
    $('.mem-tablero', juego).addEventListener('click', ev => {
      const b = ev.target.closest('.mem-carta'); if (!b || bloqueo || b.classList.contains('vuelta')) return;
      b.classList.add('vuelta'); abiertas.push(b);
      if (abiertas.length < 2) return;
      intentos++;
      const [a, c] = abiertas.map(x => cartas[+x.dataset.i]);
      if (a.k === c.k && a.mz !== c.mz) {
        abiertas.forEach(x => x.classList.add('par')); abiertas = []; pares++;
        $('#mem-marca').innerHTML = `<b class="mz">${MEM[a.k][0]}</b> = ${MEM[a.k][1]}. Dilo en voz alta.`;
        if (pares === elegidas.length) $('#mem-marca').innerHTML = `¡Müna kümey! Terminaste en ${intentos} intentos (${rakin(intentos)}). Ahora prueba la ronda rápida, sin mirar las cartas.`;
      } else {
        bloqueo = true;
        setTimeout(() => { abiertas.forEach(x => x.classList.remove('vuelta')); abiertas = []; bloqueo = false; }, 1100);
      }
    });
  };
  const ronda = () => {
    if (elegidas.length < 4) return;
    const orden = azar(elegidas, 99).concat(azar(elegidas, 99)).slice(0, 10);
    let i = 0, ok = 0;
    const muestra = () => {
      if (i >= orden.length) {
        juego.innerHTML = `<div class="mem-ronda"><p class="frase-grande">${ok} de ${orden.length}</p><p>${ok >= 8 ? '¡Müna kümey! Ya las tienes.' : 'Feley. Juega otra vez el memorice y vuelve a la ronda.'}</p></div>`;
        return;
      }
      const k = orden[i], haciaMz = i % 2 === 0;
      const ops = azar([k, ...azar(elegidas.filter(x => x !== k), 2)], 3);
      juego.innerHTML = `<div class="mem-ronda"><p class="es">${i + 1} / ${orden.length} · ${haciaMz ? '¿Cómo se dice en mapuzugun?' : '¿Qué significa?'}</p>` +
        `<p class="frase-grande">${haciaMz ? MEM[k][1] : MEM[k][0]}</p><div class="opc">${ops.map(x => `<button type="button" data-k="${x}">${haciaMz ? MEM[x][0] : MEM[x][1]}</button>`).join('')}</div><p class="fb" id="mem-fb"></p></div>`;
      $('.opc', juego).addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b || b.disabled) return;
        const bien = +b.dataset.k === k; if (bien) ok++;
        $$('.opc button', juego).forEach(x => { x.disabled = true; if (+x.dataset.k === k) x.classList.add('ok'); });
        if (!bien) b.classList.add('mal');
        $('#mem-fb').innerHTML = `${bien ? '¡Kümey!' : 'Welulay.'} <b class="mz">${MEM[k][0]}</b> = ${MEM[k][1]}.`;
        $('#mem-fb').className = 'fb ' + (bien ? 'bien' : 'no');
        setTimeout(() => { i++; muestra(); }, bien ? 1300 : 2600);
      });
    };
    muestra();
  };
  $('#mem-jugar').addEventListener('click', jugar);
  $('#mem-ronda').addEventListener('click', ronda);
}

/* ---------- Tarjeta «Mi presentación» ---------- */
const ANIMAL_ES = { txewa: ['un perro', 'perro', 'Mi perro'], ñarki: ['un gato', 'gato', 'Mi gato'], achawall: ['una gallina', 'gallina', 'Mi gallina'], kawellu: ['un caballo', 'caballo', 'Mi caballo'] };
function initTarjeta() {
  const f = $('#tj-form'); if (!f) return;
  const val = k => (f.elements[k].value || '').trim();
  const lineas = () => {
    const edad = val('edad'), r = rakin(edad);
    const l = [['Mari mari kom pu che.', 'Hola a todas las personas.']];
    l.push([`Inche ${val('nombre') || '______'} pigen.`, `Me llamo ${val('nombre') || '______'}.`]);
    if (r) l.push([`${r[0].toUpperCase() + r.slice(1)} txipantü nien.`, `Tengo ${edad} años.`]);
    if (val('tuwun')) l.push([`Tañi tuwün ${val('tuwun')} mew.`, `Soy de ${val('tuwun')}.`]);
    if (val('mulen')) l.push([`Fachantü mülen ${val('mulen')} mew.`, `Hoy vivo en ${val('mulen')}.`]);
    const est = f.elements.estado; l.push([`Fachantü ${est.value}.`, `Hoy ${est.selectedOptions[0].dataset.es}.`]);
    if (val('nuke')) l.push([`Tañi ñuke ${val('nuke')} pigey.`, `Mi madre se llama ${val('nuke')}.`]);
    if (val('mascota')) l.push([f.elements.tiene.value === 'si' ? `Kiñe ${val('mascota')} nien.` : `Nielan ${val('mascota')}.`, f.elements.tiene.value === 'si' ? `Tengo ${ANIMAL_ES[val('mascota')][0]}.` : `No tengo ${ANIMAL_ES[val('mascota')][1]}.`]);
    const tiene = val('mascota') && f.elements.tiene.value === 'si';
    $('#tj-mascota-nombre').hidden = !tiene;
    if (tiene && val('mascotaNombre')) l.push([`Tañi ${val('mascota')} ${val('mascotaNombre')} pigey.`, `${ANIMAL_ES[val('mascota')][2]} se llama ${val('mascotaNombre')}.`]);
    l.push(['Fey mütem. Mañum.', 'Eso no más. Gracias.']);
    return l;
  };
  const pinta = () => {
    $('#tj-salida').innerHTML = `<div class="tj-cab"><svg viewBox="0 0 549 554" aria-hidden="true"><use href="#waglen"/></svg><b>Tañi chalin</b></div>` +
      `<ol>${lineas().map(([mz, es]) => `<li><span class="mz">${mz}</span><span class="es">${es}</span></li>`).join('')}</ol>`;
  };
  f.addEventListener('input', pinta); f.addEventListener('change', pinta); pinta();
  $('#tj-copiar').addEventListener('click', e => {
    navigator.clipboard?.writeText(lineas().map(x => x[0]).join(' '));
    e.target.textContent = 'Copiado'; setTimeout(() => e.target.textContent = 'Copiar texto', 1500);
  });
  $('#tj-descargar').addEventListener('click', () => {
    const l = lineas(), W = 1080, H = 260 + l.length * 118, c = document.createElement('canvas');
    c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#0A2D8F'; x.fillRect(0, 0, W, 150);
    x.fillStyle = '#B3262E'; x.fillRect(0, 150, W, 10);
    ['#C62828', '#1E63D6', '#2E7D32'].forEach((col, k) => { x.fillStyle = col; x.fillRect(W - 210 + k * 60, 55, 40, 40); });
    x.fillStyle = '#fff'; x.font = '800 54px "Alegreya Sans", sans-serif'; x.fillText('Tañi chalin', 60, 95);
    x.font = '400 26px "Alegreya", serif'; x.fillText('Kimeltun mapuzugun', 62, 132);
    l.forEach(([mz, es], k) => {
      const y = 240 + k * 118;
      x.fillStyle = '#0A2D8F'; x.font = '800 44px "Alegreya Sans", sans-serif'; x.fillText(mz, 60, y, W - 120);
      x.fillStyle = '#5A6078'; x.font = 'italic 30px "Alegreya", serif'; x.fillText(es, 60, y + 42, W - 120);
    });
    x.strokeStyle = '#0A2D8F'; x.lineWidth = 12; x.strokeRect(6, 6, W - 12, H - 12);
    const a = document.createElement('a');
    a.download = `mi-presentacion-${(val('nombre') || 'mapuzugun').toLowerCase().replace(/[^a-zñü0-9]+/g, '-')}.png`;
    a.href = c.toDataURL('image/png'); a.click();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAwkantun(); initTarjeta(); initTablaConj(); initEstados4(); initMemorice();
  cargaDatos().then(() => document.dispatchEvent(new Event('g4-datos')));
});
