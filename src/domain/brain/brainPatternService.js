/**
 * Pattern Service — analizza osservazioni e persiste pattern proposti.
 * NON crea Conoscenze Personali. NON modifica il Knowledge Engine.
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../utils/storage";
import { elencaOsservazioni } from "./brainObservationService";
import {
  calcolaStatistichePattern,
  eseguiPatternEngine,
} from "./brainPatternEngine";
import {
  BRAIN_PATTERN_STATI,
  creaBrainPattern,
} from "./brainPatternTypes";

const CHIAVE = () => STORAGE_KEYS.brainPatterns;

/**
 * @returns {object[]}
 */
export function ottieniPattern() {
  const grezzo = leggiStorage(CHIAVE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} patterns
 * @returns {object[]}
 */
function persistiPattern(patterns = []) {
  const elenco = Array.isArray(patterns) ? patterns : [];
  salvaStorage(CHIAVE(), elenco);
  return elenco;
}

/**
 * Analizza le osservazioni, produce pattern e li unisce allo store
 * preservando stati accettato/rifiutato per fingerprint uguale.
 *
 * @param {object[]=} osservazioni
 * @returns {{ patterns: object[] }}
 */
export function analizzaOsservazioni(osservazioni) {
  const source =
    osservazioni === undefined ? elencaOsservazioni() : osservazioni || [];
  const { patterns: rilevati } = eseguiPatternEngine(source);
  const esistenti = ottieniPattern();
  const mappaEsistenti = new Map(
    esistenti
      .filter((p) => p?.fingerprint)
      .map((p) => [p.fingerprint, p])
  );

  const uniti = rilevati.map((pattern) => {
    const precedente = mappaEsistenti.get(pattern.fingerprint);
    if (!precedente) {
      return creaBrainPattern({
        ...pattern,
        stato: BRAIN_PATTERN_STATI.NUOVO,
      });
    }

    const statoConservato =
      precedente.stato === BRAIN_PATTERN_STATI.ACCETTATO ||
      precedente.stato === BRAIN_PATTERN_STATI.RIFIUTATO
        ? precedente.stato
        : BRAIN_PATTERN_STATI.PROPOSTO;

    return creaBrainPattern({
      ...pattern,
      id: precedente.id,
      createdAt: precedente.createdAt,
      stato: statoConservato,
      decisionAt: precedente.decisionAt ?? null,
      decisionBy: precedente.decisionBy ?? null,
      motivoRifiuto: precedente.motivoRifiuto ?? null,
    });
  });

  // Conserva accettati/rifiutati non più rilevati (storico)
  esistenti.forEach((vecchio) => {
    if (
      vecchio.stato !== BRAIN_PATTERN_STATI.ACCETTATO &&
      vecchio.stato !== BRAIN_PATTERN_STATI.RIFIUTATO
    ) {
      return;
    }
    const ancoraPresente = uniti.some(
      (p) => p.fingerprint === vecchio.fingerprint
    );
    if (!ancoraPresente) {
      uniti.push(creaBrainPattern(vecchio));
    }
  });

  persistiPattern(uniti);
  return { patterns: uniti };
}

/**
 * @returns {number}
 */
export function contaPattern() {
  return ottieniPattern().length;
}

/**
 * Aggiorna un pattern per id (merge patch).
 * @param {string} id
 * @param {object} patch
 * @returns {object|null}
 */
export function aggiornaPattern(id, patch = {}) {
  const elenco = ottieniPattern();
  const indice = elenco.findIndex((p) => String(p.id) === String(id));
  if (indice < 0) return null;

  const aggiornato = creaBrainPattern({
    ...elenco[indice],
    ...patch,
    id: elenco[indice].id,
  });
  elenco[indice] = aggiornato;
  persistiPattern(elenco);
  return aggiornato;
}

/**
 * Sostituisce l'intero store pattern (rollback / test).
 * @param {object[]} patterns
 * @returns {object[]}
 */
export function sostituisciTuttiPattern(patterns = []) {
  return persistiPattern(
    (Array.isArray(patterns) ? patterns : []).map((p) => creaBrainPattern(p))
  );
}

/**
 * @returns {object}
 */
export function statistichePattern() {
  return calcolaStatistichePattern(ottieniPattern());
}

/** Reset store pattern (test). */
export function resetPattern() {
  return persistiPattern([]);
}
