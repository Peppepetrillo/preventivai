/**
 * Knowledge Engine 2.0 — modello di ingresso basato su caratteristiche impianto.
 * Retrocompatibile con form legacy (extra.*, superficieMq, numeroLivelli).
 */

/** Tipi immobile supportati dal Brain. */
export const TIPI_IMMOBILE_KE = Object.freeze([
  "appartamento",
  "villa",
  "ufficio",
  "negozio",
  "garage",
  "altro",
]);

/** Tipologie cucina. */
export const CUCINA_TIPI = Object.freeze({
  STANDARD: "standard",
  INDUZIONE: "induzione",
});

/**
 * @typedef {Object} KnowledgeInput
 * @property {string} tipoImmobile
 * @property {number|null} mq
 * @property {number|null} numeroLocali
 * @property {number|null} numeroBagni
 * @property {number} livelli
 * @property {"standard"|"induzione"} cucina
 * @property {boolean} climatizzazione
 * @property {boolean} citofono
 * @property {boolean} videocitofono
 * @property {boolean} impiantoTv
 * @property {boolean} reteDati
 * @property {boolean} allarme
 * @property {boolean} videosorveglianza
 * @property {boolean} cancelloAutomatico
 * @property {boolean} predisposizioneFotovoltaico
 * @property {boolean} predisposizioneColonnina
 * @property {boolean} domotica
 * @property {string} livelloImpianto
 * @property {object} extra — mirror legacy per regole strutturali esistenti
 */

function leggiInteroPositivo(valore) {
  if (valore === null || valore === undefined || valore === "") return null;
  const n = Number(valore);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

function leggiBool(...candidati) {
  for (const c of candidati) {
    if (c === true || c === false) return Boolean(c);
  }
  return false;
}

/**
 * Costruisce l'input canonico KE 2.0 dal form UI / API.
 * @param {object} form
 * @returns {KnowledgeInput}
 */
export function creaKnowledgeInput(form = {}) {
  const extra = form.extra && typeof form.extra === "object" ? form.extra : {};
  const car =
    form.caratteristiche && typeof form.caratteristiche === "object"
      ? form.caratteristiche
      : {};

  const mqGrezzo = form.mq ?? form.superficieMq;
  let mq = null;
  if (mqGrezzo !== null && mqGrezzo !== undefined && mqGrezzo !== "") {
    const numero = Number(mqGrezzo);
    mq = Number.isFinite(numero) ? numero : null;
  }

  const livelliGrezzo = form.livelli ?? form.numeroLivelli ?? 1;
  const livelli = String(livelliGrezzo) === "4+" ? 4 : Number(livelliGrezzo);

  const cucinaGrezza = String(
    form.cucina ?? car.cucina ?? CUCINA_TIPI.STANDARD
  ).toLowerCase();
  const cucina =
    cucinaGrezza === CUCINA_TIPI.INDUZIONE
      ? CUCINA_TIPI.INDUZIONE
      : CUCINA_TIPI.STANDARD;

  const climatizzazione = leggiBool(
    form.climatizzazione,
    car.climatizzazione,
    extra.clima,
    extra.predisposizioneClima
  );
  const citofono = leggiBool(form.citofono, car.citofono, extra.citofono);
  const videocitofono = leggiBool(
    form.videocitofono,
    car.videocitofono,
    extra.videocitofono
  );
  const impiantoTv = leggiBool(
    form.impiantoTv,
    car.impiantoTv,
    extra.impiantoTv,
    extra.tv
  );
  const reteDati = leggiBool(
    form.reteDati,
    car.reteDati,
    extra.reteDati,
    extra.lan
  );
  const allarme = leggiBool(form.allarme, car.allarme, extra.allarme);
  const videosorveglianza = leggiBool(
    form.videosorveglianza,
    car.videosorveglianza,
    extra.videosorveglianza
  );
  const cancelloAutomatico = leggiBool(
    form.cancelloAutomatico,
    car.cancelloAutomatico,
    extra.cancelloAutomatico,
    extra.automazioneCancello
  );
  const predisposizioneFotovoltaico = leggiBool(
    form.predisposizioneFotovoltaico,
    car.predisposizioneFotovoltaico,
    extra.fotovoltaico,
    extra.predisposizioneFotovoltaico
  );
  const predisposizioneColonnina = leggiBool(
    form.predisposizioneColonnina,
    car.predisposizioneColonnina,
    extra.ricaricaAuto,
    extra.predisposizioneColonnina
  );
  const domotica = leggiBool(form.domotica, car.domotica, extra.domotica);

  return {
    mq,
    tipoImmobile: String(form.tipoImmobile || "").trim() || "",
    numeroLocali: leggiInteroPositivo(
      form.numeroLocali ?? car.numeroLocali
    ),
    numeroBagni: leggiInteroPositivo(form.numeroBagni ?? car.numeroBagni),
    livelli: Number.isFinite(livelli) ? livelli : 1,
    cucina,
    climatizzazione,
    citofono,
    videocitofono,
    impiantoTv,
    reteDati,
    allarme,
    videosorveglianza,
    cancelloAutomatico,
    predisposizioneFotovoltaico,
    predisposizioneColonnina,
    domotica,
    livelloImpianto: String(form.livelloImpianto || ""),
    // Mirror legacy: regole strutturali (RULE_004/005) e Brain extras
    extra: {
      ...extra,
      clima: climatizzazione,
      predisposizioneClima: climatizzazione,
      citofono,
      videocitofono,
      impiantoTv,
      reteDati,
      allarme,
      videosorveglianza,
      automazioneCancello: cancelloAutomatico,
      cancelloAutomatico,
      fotovoltaico: predisposizioneFotovoltaico,
      ricaricaAuto: predisposizioneColonnina,
      domotica,
    },
  };
}
