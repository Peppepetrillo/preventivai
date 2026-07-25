/**
 * Learning Service — l'utente trasforma un Pattern in Conoscenza Personale.
 * Il Brain NON decide da solo. Nessun collegamento al Knowledge Engine (14D).
 */

import {
  BRAIN_DECISION_BY,
  BRAIN_KNOWLEDGE_ORIGINE,
  creaConoscenzaDaPattern,
} from "./brainLearningTypes";
import { BRAIN_PATTERN_STATI } from "./brainPatternTypes";
import * as patternService from "./brainPatternService";
import * as personalKnowledgeService from "./personalKnowledgeService";
import * as personalKnowledgeRepository from "./personalKnowledgeRepository";

/**
 * Pattern ancora da confermare (nuovo | proposto).
 * @returns {object[]}
 */
export function ottieniPatternDaConfermare() {
  return patternService.ottieniPattern().filter(
    (p) =>
      p.stato === BRAIN_PATTERN_STATI.NUOVO ||
      p.stato === BRAIN_PATTERN_STATI.PROPOSTO
  );
}

/**
 * @param {string} patternId
 * @returns {object|null}
 */
export function trovaConoscenzaPerPattern(patternId) {
  if (!patternId) return null;
  return (
    personalKnowledgeService.elencaConoscenze().find(
      (k) =>
        String(k.patternId) === String(patternId) &&
        k.origine === BRAIN_KNOWLEDGE_ORIGINE.BRAIN
    ) || null
  );
}

/**
 * @returns {object[]}
 */
export function elencaConoscenzeDalBrain() {
  return personalKnowledgeService
    .elencaConoscenze()
    .filter((k) => k.origine === BRAIN_KNOWLEDGE_ORIGINE.BRAIN);
}

/**
 * @returns {number}
 */
export function contaConoscenzeDalBrain() {
  return elencaConoscenzeDalBrain().length;
}

/**
 * Statistiche learning per Dashboard.
 * @returns {object}
 */
export function statisticheLearning() {
  const patterns = patternService.ottieniPattern();
  const daConfermare = patterns.filter(
    (p) =>
      p.stato === BRAIN_PATTERN_STATI.NUOVO ||
      p.stato === BRAIN_PATTERN_STATI.PROPOSTO
  ).length;

  return {
    daConfermare,
    accettati: patterns.filter(
      (p) => p.stato === BRAIN_PATTERN_STATI.ACCETTATO
    ).length,
    rifiutati: patterns.filter(
      (p) => p.stato === BRAIN_PATTERN_STATI.RIFIUTATO
    ).length,
    conoscenzeDalBrain: contaConoscenzeDalBrain(),
  };
}

/**
 * Accetta un pattern → crea Personal Knowledge (senza duplicati).
 *
 * @param {string} patternId
 * @param {{ decisionBy?: string }=} opzioni
 * @returns {import("./brainLearningTypes").BrainLearningResult}
 */
export function accettaPattern(patternId, opzioni = {}) {
  const snapshotPatterns = patternService.ottieniPattern().map((p) => ({ ...p }));
  const snapshotKnowledge = personalKnowledgeService
    .elencaConoscenze()
    .map((k) => ({ ...k }));

  try {
    const patterns = patternService.ottieniPattern();
    const pattern = patterns.find((p) => String(p.id) === String(patternId));
    if (!pattern) {
      return { success: false, error: "pattern_non_trovato" };
    }

    if (pattern.stato === BRAIN_PATTERN_STATI.RIFIUTATO) {
      return {
        success: false,
        error: "pattern_gia_rifiutato",
        pattern,
        alreadyDecided: true,
      };
    }

    let conoscenza = trovaConoscenzaPerPattern(pattern.id);
    let conoscenzaEsistente = Boolean(conoscenza);

    if (pattern.stato === BRAIN_PATTERN_STATI.ACCETTATO && conoscenza) {
      return {
        success: true,
        pattern,
        conoscenza,
        alreadyDecided: true,
        conoscenzaEsistente: true,
      };
    }

    if (!conoscenza) {
      conoscenza = personalKnowledgeService.aggiungiConoscenza(
        creaConoscenzaDaPattern(pattern)
      );
      conoscenzaEsistente = false;
    }

    const aggiornato = patternService.aggiornaPattern(pattern.id, {
      stato: BRAIN_PATTERN_STATI.ACCETTATO,
      decisionAt: Date.now(),
      decisionBy: opzioni.decisionBy || BRAIN_DECISION_BY.UTENTE,
      motivoRifiuto: null,
    });

    if (!aggiornato) {
      throw new Error("aggiornamento_pattern_fallito");
    }

    return {
      success: true,
      pattern: aggiornato,
      conoscenza,
      conoscenzaEsistente,
      alreadyDecided: false,
    };
  } catch (errore) {
    patternService.sostituisciTuttiPattern(snapshotPatterns);
    personalKnowledgeRepository.scriviConoscenze(snapshotKnowledge);
    return {
      success: false,
      error: errore?.message || "accettazione_fallita",
    };
  }
}

/**
 * Rifiuta un pattern — nessuna conoscenza creata.
 *
 * @param {string} patternId
 * @param {{ decisionBy?: string, motivoRifiuto?: string }=} opzioni
 * @returns {import("./brainLearningTypes").BrainLearningResult}
 */
export function rifiutaPattern(patternId, opzioni = {}) {
  const snapshotPatterns = patternService.ottieniPattern().map((p) => ({ ...p }));

  try {
    const pattern = patternService
      .ottieniPattern()
      .find((p) => String(p.id) === String(patternId));
    if (!pattern) {
      return { success: false, error: "pattern_non_trovato" };
    }

    if (pattern.stato === BRAIN_PATTERN_STATI.ACCETTATO) {
      return {
        success: false,
        error: "pattern_gia_accettato",
        pattern,
        alreadyDecided: true,
      };
    }

    if (pattern.stato === BRAIN_PATTERN_STATI.RIFIUTATO) {
      return {
        success: true,
        pattern,
        alreadyDecided: true,
      };
    }

    const aggiornato = patternService.aggiornaPattern(pattern.id, {
      stato: BRAIN_PATTERN_STATI.RIFIUTATO,
      decisionAt: Date.now(),
      decisionBy: opzioni.decisionBy || BRAIN_DECISION_BY.UTENTE,
      motivoRifiuto: opzioni.motivoRifiuto
        ? String(opzioni.motivoRifiuto)
        : null,
    });

    if (!aggiornato) {
      throw new Error("aggiornamento_pattern_fallito");
    }

    return { success: true, pattern: aggiornato, alreadyDecided: false };
  } catch (errore) {
    patternService.sostituisciTuttiPattern(snapshotPatterns);
    return {
      success: false,
      error: errore?.message || "rifiuto_fallito",
    };
  }
}

/** Solo test: ripristina conoscenze (non tocca pattern). */
export function __resetLearningTestHooks() {
  personalKnowledgeRepository.resetConoscenze();
}
