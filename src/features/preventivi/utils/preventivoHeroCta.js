import {
  AZIONI_PREVENTIVO,
  EVENTI_WORKFLOW,
  EVENTI_WORKFLOW_LABEL,
  STATI_PREVENTIVO,
  normalizzaStatoPreventivo,
} from "../../../domain/workflow";

export const HERO_CTA = Object.freeze({
  MODIFICA: "modifica",
  INVIA_DI_NUOVO: "invia_di_nuovo",
  ACCETTA: "accetta",
  CONVERTI_CANTIERE: "converti_cantiere",
  APRI_CANTIERE: "apri_cantiere",
  SEGNA_INVIATO: "segna_inviato",
  CONDIVIDI: "condividi",
});

const MAP_HERO_A_AZIONE = Object.freeze({
  [HERO_CTA.CONVERTI_CANTIERE]: AZIONI_PREVENTIVO.CONVERTI_CANTIERE,
  [HERO_CTA.APRI_CANTIERE]: AZIONI_PREVENTIVO.APRI_CANTIERE,
  [HERO_CTA.ACCETTA]: AZIONI_PREVENTIVO.ACCETTA,
  [HERO_CTA.SEGNA_INVIATO]: AZIONI_PREVENTIVO.INVIA,
});

/** Label eventi timeline solo UI (non modifica eventi persistiti). */
const EVENTI_WORKFLOW_LABEL_UI = Object.freeze({
  [EVENTI_WORKFLOW.PREVENTIVO_CONVERTITO]: "Diventato cantiere",
  [EVENTI_WORKFLOW.CANTIERE_CREATO]: "Cantiere creato",
  [EVENTI_WORKFLOW.PREVENTIVO_ANNULLATO]: "Non accettato",
  [EVENTI_WORKFLOW.PREVENTIVO_RIFIUTATO]: "Non accettato",
  [EVENTI_WORKFLOW.LAVORO_COMPLETATO]: "Lavoro finito",
});

/**
 * Etichetta badge stato senza emoji (solo UI).
 * @param {string=} stato
 */
export function etichettaStatoUi(stato) {
  const s = normalizzaStatoPreventivo(stato);
  switch (s) {
    case STATI_PREVENTIVO.BOZZA:
      return "Bozza";
    case STATI_PREVENTIVO.INVIATO:
      return "Inviato";
    case STATI_PREVENTIVO.ACCETTATO:
      return "Accettato";
    case STATI_PREVENTIVO.CONVERTITO:
      return "In cantiere";
    case STATI_PREVENTIVO.LAVORO_COMPLETATO:
      return "Lavoro finito";
    case STATI_PREVENTIVO.RIFIUTATO:
    case STATI_PREVENTIVO.ANNULLATO:
      return "Non accettato";
    default:
      return s;
  }
}

/**
 * Label evento cronologia per UI (ignora label legacy salvate come "Preventivo convertito").
 * @param {string=} tipo
 * @param {string=} labelSalvata
 */
export function etichettaEventoWorkflowUi(tipo, labelSalvata) {
  if (tipo && EVENTI_WORKFLOW_LABEL_UI[tipo]) {
    return EVENTI_WORKFLOW_LABEL_UI[tipo];
  }
  const grezzo = String(labelSalvata || "").trim();
  if (/convertito/i.test(grezzo)) return "Diventato cantiere";
  if (/annullato|rifiutato/i.test(grezzo)) return "Non accettato";
  if (tipo && EVENTI_WORKFLOW_LABEL[tipo]) return EVENTI_WORKFLOW_LABEL[tipo];
  return grezzo || String(tipo || "");
}

/**
 * Titolo principale del preventivo in header.
 * @param {object} preventivo
 * @param {object[]} lavorazioni
 */
export function titoloPreventivoHeader(preventivo, lavorazioni = []) {
  if (preventivo?.tipoLavoro) {
    return String(preventivo.tipoLavoro).trim();
  }
  const prima = lavorazioni?.[0]?.nome;
  if (prima) return String(prima).trim();
  return preventivo?.numero || `PREV-${preventivo?.id}`;
}

/**
 * Sottotitolo descrittivo (numero + riepilogo lavorazioni).
 * @param {object} preventivo
 * @param {object[]} lavorazioni
 */
export function sottotitoloPreventivoHeader(preventivo, lavorazioni = []) {
  const numero = preventivo?.numero || `PREV-${preventivo?.id}`;
  const n = Array.isArray(lavorazioni) ? lavorazioni.length : 0;
  if (n <= 1) return numero;
  return `${numero} · ${n} lavorazioni`;
}

/**
 * Risolve la CTA primaria hero in base a stato e azioni workflow.
 * @param {{ stato: string, azioniDisponibili: string[], cantiereCollegatoId?: string|null }} params
 * @returns {{ id: string, label: string } | null}
 */
export function risolviHeroCta({
  stato,
  azioniDisponibili = [],
  cantiereCollegatoId = null,
}) {
  const s = normalizzaStatoPreventivo(stato);
  const azioni = Array.isArray(azioniDisponibili) ? azioniDisponibili : [];

  if (
    azioni.includes(AZIONI_PREVENTIVO.APRI_CANTIERE) &&
    cantiereCollegatoId
  ) {
    return { id: HERO_CTA.APRI_CANTIERE, label: "Apri cantiere" };
  }

  if (azioni.includes(AZIONI_PREVENTIVO.CONVERTI_CANTIERE)) {
    return { id: HERO_CTA.CONVERTI_CANTIERE, label: "Inizia cantiere" };
  }

  if (s === STATI_PREVENTIVO.BOZZA) {
    return { id: HERO_CTA.CONDIVIDI, label: "Condividi preventivo" };
  }

  if (s === STATI_PREVENTIVO.INVIATO && azioni.includes(AZIONI_PREVENTIVO.ACCETTA)) {
    return { id: HERO_CTA.ACCETTA, label: "Cliente ha accettato" };
  }

  if (s === STATI_PREVENTIVO.INVIATO) {
    return { id: HERO_CTA.INVIA_DI_NUOVO, label: "Condividi di nuovo" };
  }

  if (azioni.includes(AZIONI_PREVENTIVO.INVIA)) {
    return { id: HERO_CTA.SEGNA_INVIATO, label: "Segna come inviato" };
  }

  return null;
}

/**
 * True se i nuovi pagamenti vanno registrati nel cantiere (non sul preventivo).
 * Solo UI — non modifica dominio.
 * @param {{ stato?: string, cantiereId?: string|number|null }=} preventivo
 * @param {string|number|null=} cantiereCollegatoId
 */
export function isPagamentiSuCantiere(preventivo, cantiereCollegatoId = null) {
  const s = normalizzaStatoPreventivo(preventivo?.stato);
  if (
    s === STATI_PREVENTIVO.CONVERTITO ||
    s === STATI_PREVENTIVO.LAVORO_COMPLETATO
  ) {
    return true;
  }
  if (preventivo?.cantiereId || cantiereCollegatoId) return true;
  return false;
}

/**
 * Azioni workflow secondarie (esclude quella già in hero).
 * @param {string[]} azioniDisponibili
 * @param {string | null | undefined} heroId
 * @returns {string[]}
 */
export function filtraAzioniSecondarie(azioniDisponibili = [], heroId) {
  const azioni = Array.isArray(azioniDisponibili) ? azioniDisponibili : [];
  const esclusa = heroId ? MAP_HERO_A_AZIONE[heroId] : null;
  if (!esclusa) return azioni;
  return azioni.filter((azione) => azione !== esclusa);
}
