/**
 * Base Tecnica PreventivAI — tipi e costanti.
 *
 * Conoscenza tecnica pura: nessuna quantità, nessun prezzo, nessun preventivo.
 * Schede spiegabili: origine, motivazione, verifiche, affidabilità.
 */

/** Categorie sezioni Base Tecnica. */
export const BASE_TECNICA_CATEGORIE = Object.freeze({
  PUNTI_IMPIANTO: "PUNTI_IMPIANTO",
  CUCINA: "CUCINA",
  CLIMATIZZAZIONE: "CLIMATIZZAZIONE",
  CITOFONIA: "CITOFONIA",
  TV: "TV",
  RETE_DATI: "RETE_DATI",
  ALLARME: "ALLARME",
  VIDEOSORVEGLIANZA: "VIDEOSORVEGLIANZA",
  CANCELLO: "CANCELLO",
  FOTOVOLTAICO: "FOTOVOLTAICO",
  COLONNINA_RICARICA: "COLONNINA_RICARICA",
  DOMOTICA: "DOMOTICA",
  QUADRI_ELETTRICI: "QUADRI_ELETTRICI",
});

/** Priorità tecnica (impatto impianto / sicurezza). */
export const BASE_TECNICA_PRIORITA = Object.freeze({
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BASSA: "BASSA",
});

/** Origine della conoscenza. */
export const BASE_TECNICA_ORIGINE_TIPO = Object.freeze({
  NORMATIVA: "NORMATIVA",
  BUONA_PRATICA: "BUONA_PRATICA",
  ESPERIENZA_PREVENTIVAI: "ESPERIENZA_PREVENTIVAI",
});

/** Affidabilità della scheda (spiegabilità). */
export const BASE_TECNICA_AFFIDABILITA = Object.freeze({
  ALTO: "ALTO",
  MEDIO: "MEDIO",
  BASSO: "BASSO",
});

/**
 * @typedef {Object} BaseTecnicaOrigine
 * @property {"NORMATIVA"|"BUONA_PRATICA"|"ESPERIENZA_PREVENTIVAI"} tipo
 * @property {string=} riferimento
 */

/**
 * @typedef {Object} BaseTecnicaCondizioni
 * @property {string=} tipoImmobile
 * @property {string=} cucina
 * @property {boolean=} climatizzazione
 * @property {boolean=} citofono
 * @property {boolean=} videocitofono
 * @property {boolean=} impiantoTv
 * @property {boolean=} reteDati
 * @property {boolean=} allarme
 * @property {boolean=} videosorveglianza
 * @property {boolean=} cancelloAutomatico
 * @property {boolean=} predisposizioneFotovoltaico
 * @property {boolean=} predisposizioneColonnina
 * @property {boolean=} domotica
 * @property {number=} mqMin
 * @property {number=} mqMax
 * @property {number=} livelliMin
 */

/**
 * @typedef {Object} SchedaTecnica
 * @property {string} id
 * @property {string} categoria
 * @property {string} titolo
 * @property {string} descrizione
 * @property {BaseTecnicaCondizioni} condizioni
 * @property {string[]} catalogoIds
 * @property {"ALTA"|"MEDIA"|"BASSA"} priorita
 * @property {string} noteTecniche
 * @property {BaseTecnicaOrigine} origine
 * @property {string} motivazione — perché esiste / perché suggerita
 * @property {string[]} verificheProfessionista
 * @property {"ALTO"|"MEDIO"|"BASSO"} livelloAffidabilita
 * @property {boolean=} enabled
 */

/**
 * @param {Partial<SchedaTecnica>} grezzo
 * @returns {SchedaTecnica}
 */
export function creaSchedaTecnica(grezzo = {}) {
  const id = String(grezzo.id || "").trim();
  if (!id) {
    throw new Error("Scheda tecnica senza id.");
  }

  const categoria = String(grezzo.categoria || "").trim();
  if (!Object.values(BASE_TECNICA_CATEGORIE).includes(categoria)) {
    throw new Error(`Categoria Base Tecnica non valida: ${categoria}`);
  }

  const priorita = String(grezzo.priorita || BASE_TECNICA_PRIORITA.MEDIA);
  if (!Object.values(BASE_TECNICA_PRIORITA).includes(priorita)) {
    throw new Error(`Priorità Base Tecnica non valida: ${priorita}`);
  }

  const titolo = String(grezzo.titolo || "").trim();
  if (!titolo) {
    throw new Error(`Scheda ${id}: titolo obbligatorio.`);
  }

  const descrizione = String(grezzo.descrizione || "").trim();
  if (!descrizione) {
    throw new Error(`Scheda ${id}: descrizione obbligatoria.`);
  }

  const motivazione = String(grezzo.motivazione || "").trim();
  if (!motivazione) {
    throw new Error(`Scheda ${id}: motivazione obbligatoria.`);
  }

  const origineGrezza =
    grezzo.origine && typeof grezzo.origine === "object" ? grezzo.origine : {};
  const origineTipo = String(origineGrezza.tipo || "").trim();
  if (!Object.values(BASE_TECNICA_ORIGINE_TIPO).includes(origineTipo)) {
    throw new Error(
      `Scheda ${id}: origine.tipo non valida (NORMATIVA | BUONA_PRATICA | ESPERIENZA_PREVENTIVAI).`
    );
  }

  const livelloAffidabilita = String(grezzo.livelloAffidabilita || "").trim();
  if (!Object.values(BASE_TECNICA_AFFIDABILITA).includes(livelloAffidabilita)) {
    throw new Error(
      `Scheda ${id}: livelloAffidabilita non valido (ALTO | MEDIO | BASSO).`
    );
  }

  if (!Array.isArray(grezzo.verificheProfessionista)) {
    throw new Error(`Scheda ${id}: verificheProfessionista deve essere un array.`);
  }
  const verificheProfessionista = grezzo.verificheProfessionista
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  if (verificheProfessionista.length === 0) {
    throw new Error(`Scheda ${id}: almeno una verifica professionista.`);
  }

  const catalogoIds = Array.isArray(grezzo.catalogoIds)
    ? grezzo.catalogoIds.map((c) => String(c).trim()).filter(Boolean)
    : [];

  const riferimento = String(origineGrezza.riferimento || "").trim();

  return Object.freeze({
    id,
    categoria,
    titolo,
    descrizione,
    condizioni:
      grezzo.condizioni && typeof grezzo.condizioni === "object"
        ? Object.freeze({ ...grezzo.condizioni })
        : Object.freeze({}),
    catalogoIds: Object.freeze(catalogoIds),
    priorita,
    noteTecniche: String(grezzo.noteTecniche || "").trim(),
    origine: Object.freeze({
      tipo: origineTipo,
      ...(riferimento ? { riferimento } : {}),
    }),
    motivazione,
    verificheProfessionista: Object.freeze(verificheProfessionista),
    livelloAffidabilita,
    enabled: grezzo.enabled !== false,
  });
}

/**
 * @param {object} condizioni
 * @param {object} input
 * @returns {boolean}
 */
export function condizioniSchedaSoddisfatte(condizioni = {}, input = {}) {
  if (!condizioni || typeof condizioni !== "object") return true;

  if (condizioni.tipoImmobile != null) {
    if (input.tipoImmobile !== condizioni.tipoImmobile) return false;
  }

  if (condizioni.cucina != null) {
    if (input.cucina !== condizioni.cucina) return false;
  }

  const flagKeys = [
    "climatizzazione",
    "citofono",
    "videocitofono",
    "impiantoTv",
    "reteDati",
    "allarme",
    "videosorveglianza",
    "cancelloAutomatico",
    "predisposizioneFotovoltaico",
    "predisposizioneColonnina",
    "domotica",
  ];

  for (const chiave of flagKeys) {
    if (condizioni[chiave] === undefined) continue;
    if (Boolean(input[chiave]) !== Boolean(condizioni[chiave])) return false;
  }

  const mq = input.mq ?? input.superficieMq;
  if (condizioni.mqMin != null) {
    if (mq === null || mq === undefined || Number(mq) < condizioni.mqMin) {
      return false;
    }
  }
  if (condizioni.mqMax != null) {
    if (mq === null || mq === undefined || Number(mq) > condizioni.mqMax) {
      return false;
    }
  }

  if (condizioni.livelliMin != null) {
    const livelli = Number(input.livelli);
    if (!Number.isFinite(livelli) || livelli < condizioni.livelliMin) {
      return false;
    }
  }

  return true;
}
