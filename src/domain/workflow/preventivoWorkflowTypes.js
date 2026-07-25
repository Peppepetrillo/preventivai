/**
 * Preventivo Workflow — stati, azioni, eventi timeline.
 * Valori persistiti in italiano (compatibilità archivio esistente).
 */

export const STATI_PREVENTIVO = Object.freeze({
  BOZZA: "Bozza",
  INVIATO: "Inviato",
  ACCETTATO: "Accettato",
  CONVERTITO: "Convertito",
  ANNULLATO: "Annullato",
});

/** Alias canonici uppercase → valore persistito */
export const STATI_PREVENTIVO_CODICI = Object.freeze({
  BOZZA: STATI_PREVENTIVO.BOZZA,
  INVIATO: STATI_PREVENTIVO.INVIATO,
  ACCETTATO: STATI_PREVENTIVO.ACCETTATO,
  CONVERTITO: STATI_PREVENTIVO.CONVERTITO,
  ANNULLATO: STATI_PREVENTIVO.ANNULLATO,
});

export const AZIONI_PREVENTIVO = Object.freeze({
  INVIA: "invia",
  ACCETTA: "accetta",
  CONVERTI_CANTIERE: "converti_cantiere",
  APRI_CANTIERE: "apri_cantiere",
  ANNULLA: "annulla",
});

export const EVENTI_WORKFLOW = Object.freeze({
  PREVENTIVO_CREATO: "preventivo_creato",
  PREVENTIVO_INVIATO: "preventivo_inviato",
  PREVENTIVO_ACCETTATO: "preventivo_accettato",
  CANTIERE_CREATO: "cantiere_creato",
  PREVENTIVO_ANNULLATO: "preventivo_annullato",
  PREVENTIVO_CONVERTITO: "preventivo_convertito",
});

export const EVENTI_WORKFLOW_LABEL = Object.freeze({
  [EVENTI_WORKFLOW.PREVENTIVO_CREATO]: "Preventivo creato",
  [EVENTI_WORKFLOW.PREVENTIVO_INVIATO]: "Preventivo inviato",
  [EVENTI_WORKFLOW.PREVENTIVO_ACCETTATO]: "Preventivo accettato",
  [EVENTI_WORKFLOW.CANTIERE_CREATO]: "Cantiere creato",
  [EVENTI_WORKFLOW.PREVENTIVO_ANNULLATO]: "Preventivo annullato",
  [EVENTI_WORKFLOW.PREVENTIVO_CONVERTITO]: "Preventivo convertito",
});

const ALIAS_STATO = Object.freeze({
  bozza: STATI_PREVENTIVO.BOZZA,
  inviato: STATI_PREVENTIVO.INVIATO,
  accettato: STATI_PREVENTIVO.ACCETTATO,
  convertito: STATI_PREVENTIVO.CONVERTITO,
  annullato: STATI_PREVENTIVO.ANNULLATO,
  // Legacy
  completato: STATI_PREVENTIVO.CONVERTITO,
});

/**
 * Normalizza stato legacy / case-insensitive al valore canonico.
 * @param {string=} stato
 * @returns {string}
 */
export function normalizzaStatoPreventivo(stato) {
  if (!stato) return STATI_PREVENTIVO.BOZZA;
  const grezzo = String(stato).trim();
  if (Object.values(STATI_PREVENTIVO).includes(grezzo)) return grezzo;
  const alias = ALIAS_STATO[grezzo.toLowerCase()];
  return alias || STATI_PREVENTIVO.BOZZA;
}

/**
 * @param {string=} tipo
 * @param {object=} payload
 * @returns {object}
 */
export function creaEventoWorkflow(tipo, payload = {}) {
  return {
    id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tipo,
    label: EVENTI_WORKFLOW_LABEL[tipo] || String(tipo),
    at: payload.at || Date.now(),
    by: payload.by || null,
    preventivoId: payload.preventivoId ?? null,
    cantiereId: payload.cantiereId ?? null,
    meta: payload.meta && typeof payload.meta === "object" ? payload.meta : {},
  };
}

/**
 * Azioni disponibili in base allo stato (puro).
 * @param {object} preventivo
 * @param {{ cantiereCollegato?: object|null }=} contesto
 * @returns {string[]}
 */
export function calcolaAzioniDisponibili(
  preventivo,
  { cantiereCollegato = null } = {}
) {
  const stato = normalizzaStatoPreventivo(preventivo?.stato);
  const azioni = [];

  if (stato === STATI_PREVENTIVO.ANNULLATO) {
    return azioni;
  }

  if (stato === STATI_PREVENTIVO.BOZZA) {
    azioni.push(AZIONI_PREVENTIVO.INVIA);
    azioni.push(AZIONI_PREVENTIVO.ACCETTA);
    azioni.push(AZIONI_PREVENTIVO.ANNULLA);
    return azioni;
  }

  if (stato === STATI_PREVENTIVO.INVIATO) {
    azioni.push(AZIONI_PREVENTIVO.ACCETTA);
    azioni.push(AZIONI_PREVENTIVO.ANNULLA);
    return azioni;
  }

  if (stato === STATI_PREVENTIVO.ACCETTATO) {
    if (cantiereCollegato || preventivo?.cantiereId) {
      azioni.push(AZIONI_PREVENTIVO.APRI_CANTIERE);
    } else {
      azioni.push(AZIONI_PREVENTIVO.CONVERTI_CANTIERE);
    }
    azioni.push(AZIONI_PREVENTIVO.ANNULLA);
    return azioni;
  }

  if (stato === STATI_PREVENTIVO.CONVERTITO) {
    azioni.push(AZIONI_PREVENTIVO.APRI_CANTIERE);
    return azioni;
  }

  return azioni;
}
