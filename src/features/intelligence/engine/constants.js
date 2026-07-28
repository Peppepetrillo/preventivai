/** Priorità: numero più basso = più importante. */
export const PRIORITA = Object.freeze({
  MATERIALE: 10,
  CHECKLIST: 20,
  PAGAMENTI: 30,
  VARIANTI: 40,
  FOTO: 50,
  PREVENTIVO_INVIATO: 60,
});

/** Giorni dopo cui un preventivo inviato genera reminder. */
export const GIORNI_PREVENTIVO_INVIATO = 7;

export const MAX_SUGGERIMENTI = 3;

export const SESSION_STORAGE_KEY = "preventivai:intelligence:session";
