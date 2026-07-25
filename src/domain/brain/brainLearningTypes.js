/**
 * PreventivAI Brain — tipi learning (Pattern → Conoscenza Personale).
 * Il Brain propone; l'utente decide. Nessun learning automatico.
 */

import { creaIdBrain } from "./brainTypes";

export const BRAIN_KNOWLEDGE_ORIGINE = Object.freeze({
  BRAIN: "brain",
  MANUALE: "manuale",
});

export const BRAIN_DECISION_BY = Object.freeze({
  UTENTE: "utente",
});

/**
 * @typedef {Object} BrainLearningResult
 * @property {boolean} success
 * @property {object=} pattern
 * @property {object=} conoscenza
 * @property {string=} error
 * @property {boolean=} alreadyDecided
 * @property {boolean=} conoscenzaEsistente
 */

/**
 * Costruisce una Personal Knowledge a partire da un pattern accettato.
 * NON attiva il Knowledge Engine (Sprint 14D).
 *
 * @param {object} pattern
 * @returns {object}
 */
export function creaConoscenzaDaPattern(pattern = {}) {
  const suggerimento =
    pattern.suggerimento && typeof pattern.suggerimento === "object"
      ? { ...pattern.suggerimento }
      : {};
  const condizioni =
    pattern.condizioni && typeof pattern.condizioni === "object"
      ? { ...pattern.condizioni }
      : {};

  return {
    id: creaIdBrain("pk"),
    createdAt: Date.now(),
    titolo: pattern.nome || "Conoscenza da pattern",
    categoria: pattern.categoria || "Generale",
    descrizione: suggerimento.testo || "",
    origine: BRAIN_KNOWLEDGE_ORIGINE.BRAIN,
    patternId: pattern.id || "",
    affidabilita: Number(pattern.affidabilita) || 0,
    osservazioni: Number(pattern.osservazioni) || 0,
    payload: {
      condizioni,
      suggerimento,
      fingerprint: pattern.fingerprint || "",
    },
  };
}
