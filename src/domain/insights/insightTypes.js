/** @typedef {"bassa"|"media"|"alta"} PrioritaInsight */

/** @typedef {"aperto"|"in-lavorazione"|"risolto"|"archiviato"} StatoInsight */

/**
 * Insight di campo — osservazioni operative raccolte sul lavoro.
 * @typedef {Object} Insight
 * @property {string} id
 * @property {string} titolo
 * @property {string} problema
 * @property {string} soluzione
 * @property {PrioritaInsight} priorita
 * @property {StatoInsight} stato
 * @property {string} data
 * @property {string=} cantiereId
 * @property {string=} cliente
 * @property {string=} creatoIl
 * @property {string=} aggiornatoIl
 */

export const PRIORITA_INSIGHT = Object.freeze({
  BASSA: "bassa",
  MEDIA: "media",
  ALTA: "alta",
});

export const STATI_INSIGHT = Object.freeze({
  APERTO: "aperto",
  IN_LAVORAZIONE: "in-lavorazione",
  RISOLTO: "risolto",
  ARCHIVIATO: "archiviato",
});
