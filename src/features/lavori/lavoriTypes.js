/** @typedef {"cantiere"|"intervento"|"sopralluogo"|"manutenzione"} TipoLavoro */

/** @typedef {"programmato"|"in-corso"|"completato"} StatoLavoro */

/**
 * Tipologie di lavoro supportate dall'agenda.
 * I cantieri esistenti senza campo esplicito sono trattati come `cantiere`.
 */
export const TIPO_LAVORO = Object.freeze({
  CANTIERE: "cantiere",
  INTERVENTO: "intervento",
  SOPRALLUOGO: "sopralluogo",
  MANUTENZIONE: "manutenzione",
});

export const TIPI_LAVORO = Object.values(TIPO_LAVORO);
