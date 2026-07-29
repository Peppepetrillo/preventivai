/** @typedef {"personale"|"amministrativa"|"acquisti"|"telefonata"|"promemoria"|"altro"} CategoriaAttivita */

/** @typedef {"bassa"|"media"|"alta"} PrioritaAttivita */

/** @typedef {"da-fare"|"in-corso"|"completata"} StatoAttivita */

/**
 * @typedef {Object} Attivita
 * @property {string} id
 * @property {string} titolo
 * @property {string} descrizione
 * @property {CategoriaAttivita} categoria
 * @property {PrioritaAttivita} priorita
 * @property {StatoAttivita} stato
 * @property {string} data
 * @property {string} ora
 * @property {string=} clienteId
 * @property {string=} lavoroId
 * @property {boolean} reminder
 * @property {string} note
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const CATEGORIA_ATTIVITA = Object.freeze({
  PERSONALE: "personale",
  AMMINISTRATIVA: "amministrativa",
  ACQUISTI: "acquisti",
  TELEFONATA: "telefonata",
  PROMEMORIA: "promemoria",
  ALTRO: "altro",
});

export const CATEGORIE_ATTIVITA = Object.values(CATEGORIA_ATTIVITA);

export const PRIORITA_ATTIVITA = Object.freeze({
  BASSA: "bassa",
  MEDIA: "media",
  ALTA: "alta",
});

export const STATI_ATTIVITA = Object.freeze({
  DA_FARE: "da-fare",
  IN_CORSO: "in-corso",
  COMPLETATA: "completata",
});

export const ETICHETTE_CATEGORIA_ATTIVITA = Object.freeze({
  [CATEGORIA_ATTIVITA.PERSONALE]: "Personale",
  [CATEGORIA_ATTIVITA.AMMINISTRATIVA]: "Amministrativa",
  [CATEGORIA_ATTIVITA.ACQUISTI]: "Acquisti",
  [CATEGORIA_ATTIVITA.TELEFONATA]: "Telefonata",
  [CATEGORIA_ATTIVITA.PROMEMORIA]: "Promemoria",
  [CATEGORIA_ATTIVITA.ALTRO]: "Altro",
});
