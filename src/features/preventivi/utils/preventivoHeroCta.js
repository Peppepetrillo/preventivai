import {
  AZIONI_PREVENTIVO,
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
});

const MAP_HERO_A_AZIONE = Object.freeze({
  [HERO_CTA.CONVERTI_CANTIERE]: AZIONI_PREVENTIVO.CONVERTI_CANTIERE,
  [HERO_CTA.APRI_CANTIERE]: AZIONI_PREVENTIVO.APRI_CANTIERE,
  [HERO_CTA.ACCETTA]: AZIONI_PREVENTIVO.ACCETTA,
  [HERO_CTA.SEGNA_INVIATO]: AZIONI_PREVENTIVO.INVIA,
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
      return "Lavoro completato";
    case STATI_PREVENTIVO.RIFIUTATO:
    case STATI_PREVENTIVO.ANNULLATO:
      return "Rifiutato";
    default:
      return s;
  }
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
    return { id: HERO_CTA.MODIFICA, label: "Modifica preventivo" };
  }

  if (s === STATI_PREVENTIVO.INVIATO) {
    return { id: HERO_CTA.INVIA_DI_NUOVO, label: "Invia di nuovo" };
  }

  if (azioni.includes(AZIONI_PREVENTIVO.INVIA)) {
    return { id: HERO_CTA.SEGNA_INVIATO, label: "Segna inviato" };
  }

  if (azioni.includes(AZIONI_PREVENTIVO.ACCETTA)) {
    return { id: HERO_CTA.ACCETTA, label: "Accetta" };
  }

  return null;
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
