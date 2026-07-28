/**
 * Preventivo Workflow — stati, azioni, eventi timeline.
 * Valori persistiti in italiano (compatibilità archivio esistente).
 */

export const STATI_PREVENTIVO = Object.freeze({
  BOZZA: "Bozza",
  INVIATO: "Inviato",
  ACCETTATO: "Accettato",
  CONVERTITO: "Convertito",
  LAVORO_COMPLETATO: "Lavoro completato",
  RIFIUTATO: "Rifiutato",
  /** @deprecated Preferisci RIFIUTATO — mantenuto per dati legacy */
  ANNULLATO: "Annullato",
});

/** Alias canonici uppercase → valore persistito */
export const STATI_PREVENTIVO_CODICI = Object.freeze({
  BOZZA: STATI_PREVENTIVO.BOZZA,
  INVIATO: STATI_PREVENTIVO.INVIATO,
  ACCETTATO: STATI_PREVENTIVO.ACCETTATO,
  CONVERTITO: STATI_PREVENTIVO.CONVERTITO,
  LAVORO_COMPLETATO: STATI_PREVENTIVO.LAVORO_COMPLETATO,
  RIFIUTATO: STATI_PREVENTIVO.RIFIUTATO,
  ANNULLATO: STATI_PREVENTIVO.ANNULLATO,
});

export const AZIONI_PREVENTIVO = Object.freeze({
  INVIA: "invia",
  ACCETTA: "accetta",
  CONVERTI_CANTIERE: "converti_cantiere",
  APRI_CANTIERE: "apri_cantiere",
  ANNULLA: "annulla",
  RIFIUTA: "rifiuta",
});

export const EVENTI_WORKFLOW = Object.freeze({
  PREVENTIVO_CREATO: "preventivo_creato",
  PREVENTIVO_INVIATO: "preventivo_inviato",
  PREVENTIVO_ACCETTATO: "preventivo_accettato",
  CANTIERE_CREATO: "cantiere_creato",
  PREVENTIVO_ANNULLATO: "preventivo_annullato",
  PREVENTIVO_RIFIUTATO: "preventivo_rifiutato",
  PREVENTIVO_CONVERTITO: "preventivo_convertito",
  LAVORO_COMPLETATO: "lavoro_completato",
});

export const EVENTI_WORKFLOW_LABEL = Object.freeze({
  [EVENTI_WORKFLOW.PREVENTIVO_CREATO]: "Preventivo creato",
  [EVENTI_WORKFLOW.PREVENTIVO_INVIATO]: "Preventivo inviato",
  [EVENTI_WORKFLOW.PREVENTIVO_ACCETTATO]: "Preventivo accettato",
  [EVENTI_WORKFLOW.CANTIERE_CREATO]: "Cantiere creato",
  [EVENTI_WORKFLOW.PREVENTIVO_ANNULLATO]: "Preventivo annullato",
  [EVENTI_WORKFLOW.PREVENTIVO_RIFIUTATO]: "Preventivo rifiutato",
  [EVENTI_WORKFLOW.PREVENTIVO_CONVERTITO]: "Preventivo convertito",
  [EVENTI_WORKFLOW.LAVORO_COMPLETATO]: "Lavoro completato",
});

const ALIAS_STATO = Object.freeze({
  bozza: STATI_PREVENTIVO.BOZZA,
  inviato: STATI_PREVENTIVO.INVIATO,
  accettato: STATI_PREVENTIVO.ACCETTATO,
  convertito: STATI_PREVENTIVO.CONVERTITO,
  "lavoro completato": STATI_PREVENTIVO.LAVORO_COMPLETATO,
  lavoro_completato: STATI_PREVENTIVO.LAVORO_COMPLETATO,
  rifiutato: STATI_PREVENTIVO.RIFIUTATO,
  annullato: STATI_PREVENTIVO.RIFIUTATO,
  // Legacy: "Completato" storico = cantiere già creato
  completato: STATI_PREVENTIVO.CONVERTITO,
});

/**
 * True se lo stato è terminale (nessuna azione operativa).
 * @param {string=} stato
 */
export function isStatoPreventivoTerminale(stato) {
  const s = normalizzaStatoPreventivo(stato);
  return (
    s === STATI_PREVENTIVO.RIFIUTATO ||
    s === STATI_PREVENTIVO.ANNULLATO ||
    s === STATI_PREVENTIVO.LAVORO_COMPLETATO
  );
}

/**
 * Etichetta UI con indicatore colore (solo presentation).
 * @param {string=} stato
 * @returns {string}
 */
export function etichettaStatoPreventivo(stato) {
  const s = normalizzaStatoPreventivo(stato);
  switch (s) {
    case STATI_PREVENTIVO.BOZZA:
      return "🟡 Bozza";
    case STATI_PREVENTIVO.INVIATO:
      return "🔵 Inviato";
    case STATI_PREVENTIVO.ACCETTATO:
      return "🟢 Accettato";
    case STATI_PREVENTIVO.CONVERTITO:
      return "🟢 In cantiere";
    case STATI_PREVENTIVO.LAVORO_COMPLETATO:
      return "🏁 Lavoro completato";
    case STATI_PREVENTIVO.RIFIUTATO:
    case STATI_PREVENTIVO.ANNULLATO:
      return "🔴 Rifiutato";
    default:
      return s;
  }
}

/**
 * Normalizza stato legacy / case-insensitive al valore canonico.
 * @param {string=} stato
 * @returns {string}
 */
export function normalizzaStatoPreventivo(stato) {
  if (!stato) return STATI_PREVENTIVO.BOZZA;
  const grezzo = String(stato).trim();
  if (Object.values(STATI_PREVENTIVO).includes(grezzo)) {
    if (grezzo === STATI_PREVENTIVO.ANNULLATO) {
      return STATI_PREVENTIVO.RIFIUTATO;
    }
    return grezzo;
  }
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

  if (isStatoPreventivoTerminale(stato)) {
    if (
      stato === STATI_PREVENTIVO.LAVORO_COMPLETATO &&
      (cantiereCollegato || preventivo?.cantiereId)
    ) {
      azioni.push(AZIONI_PREVENTIVO.APRI_CANTIERE);
    }
    return azioni;
  }

  if (stato === STATI_PREVENTIVO.BOZZA) {
    azioni.push(AZIONI_PREVENTIVO.INVIA);
    azioni.push(AZIONI_PREVENTIVO.ACCETTA);
    azioni.push(AZIONI_PREVENTIVO.RIFIUTA);
    azioni.push(AZIONI_PREVENTIVO.ANNULLA);
    return azioni;
  }

  if (stato === STATI_PREVENTIVO.INVIATO) {
    azioni.push(AZIONI_PREVENTIVO.ACCETTA);
    azioni.push(AZIONI_PREVENTIVO.RIFIUTA);
    azioni.push(AZIONI_PREVENTIVO.ANNULLA);
    return azioni;
  }

  if (stato === STATI_PREVENTIVO.ACCETTATO) {
    if (cantiereCollegato || preventivo?.cantiereId) {
      azioni.push(AZIONI_PREVENTIVO.APRI_CANTIERE);
    } else {
      azioni.push(AZIONI_PREVENTIVO.CONVERTI_CANTIERE);
    }
    azioni.push(AZIONI_PREVENTIVO.RIFIUTA);
    azioni.push(AZIONI_PREVENTIVO.ANNULLA);
    return azioni;
  }

  if (stato === STATI_PREVENTIVO.CONVERTITO) {
    azioni.push(AZIONI_PREVENTIVO.APRI_CANTIERE);
    return azioni;
  }

  return azioni;
}
