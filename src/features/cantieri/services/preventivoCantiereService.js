/**
 * Adapter legacy: conversione Preventivo → Cantiere.
 * Delega al Workflow Service (accetta se necessario, poi converte).
 */

import {
  accettaPreventivo,
  convertiInCantiere,
  trovaCantiereCollegato as trovaCantiereWorkflow,
  STATI_PREVENTIVO,
  normalizzaStatoPreventivo,
} from "../../../domain/workflow";

export function trovaCantiereCollegato(preventivo) {
  return trovaCantiereWorkflow(preventivo);
}

/**
 * One-click legacy: se non ancora accettato, accetta e converte.
 * @param {object} preventivo
 */
export function convertiPreventivoInCantiere(preventivo) {
  if (!preventivo) {
    throw new Error("Preventivo non trovato.");
  }

  const stato = normalizzaStatoPreventivo(preventivo.stato);
  const giaCollegato = trovaCantiereCollegato(preventivo);

  if (giaCollegato) {
    const risultato = convertiInCantiere(preventivo.id);
    if (!risultato.success) {
      throw new Error(risultato.error || "Conversione non riuscita.");
    }
    return {
      cantiere: risultato.cantiere,
      creato: false,
      preventivo: risultato.preventivo,
    };
  }

  if (stato !== STATI_PREVENTIVO.ACCETTATO) {
    const accettazione = accettaPreventivo(preventivo.id);
    if (!accettazione.success) {
      throw new Error(accettazione.error || "Accettazione non riuscita.");
    }
  }

  const risultato = convertiInCantiere(preventivo.id);
  if (!risultato.success) {
    throw new Error(risultato.error || "Conversione non riuscita.");
  }

  return {
    cantiere: risultato.cantiere,
    creato: Boolean(risultato.creato),
    preventivo: risultato.preventivo,
  };
}

/** @deprecated Usa convertiPreventivoInCantiere */
export function creaCantierePerPreventivo(preventivo) {
  return convertiPreventivoInCantiere(preventivo);
}
