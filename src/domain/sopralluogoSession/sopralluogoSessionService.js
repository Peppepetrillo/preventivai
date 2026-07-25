/**
 * Service sessioni sopralluogo.
 * Ogni Preventivo Intelligente lavora su una sessione isolata.
 */

import { creaIdBrain } from "../brain/brainTypes";
import {
  creaSessioneSopralluogo,
  SESSIONE_STATO,
} from "./sopralluogoSessionTypes";
import * as repo from "./sopralluogoSessionRepository";

/**
 * @param {{ preventivoId?: string|null, id?: string }=} opzioni
 * @returns {object}
 */
export function creaNuovaSessione(opzioni = {}) {
  const now = Date.now();
  const sessione = creaSessioneSopralluogo({
    id: opzioni.id || creaIdBrain("sop"),
    preventivoId: opzioni.preventivoId ?? null,
    stato: SESSIONE_STATO.ATTIVA,
    createdAt: now,
    updatedAt: now,
    decisionIds: [],
  });
  repo.upsertSessione(sessione);
  repo.scriviIdSessioneAttiva(sessione.id);
  return sessione;
}

/**
 * Restituisce la sessione attiva, creandola se assente.
 * @param {{ preventivoId?: string|null }=} opzioni
 * @returns {object}
 */
export function assicuratiSessioneAttiva(opzioni = {}) {
  const attiva = ottieniSessioneAttiva();
  if (attiva && attiva.stato === SESSIONE_STATO.ATTIVA) {
    if (
      opzioni.preventivoId &&
      !attiva.preventivoId
    ) {
      return collegaPreventivoASessione(attiva.id, opzioni.preventivoId);
    }
    return attiva;
  }
  return creaNuovaSessione(opzioni);
}

/**
 * @returns {object|null}
 */
export function ottieniSessioneAttiva() {
  const id = repo.leggiIdSessioneAttiva();
  if (!id) return null;
  const sessione = repo.trovaSessionePerId(id);
  return sessione || null;
}

/**
 * @param {string} sessionId
 * @returns {object|null}
 */
export function ottieniSessione(sessionId) {
  return repo.trovaSessionePerId(sessionId);
}

/**
 * @param {string} sessionId
 * @returns {object|null}
 */
export function chiudiSessione(sessionId) {
  const esistente = repo.trovaSessionePerId(sessionId);
  if (!esistente) return null;

  const chiusa = creaSessioneSopralluogo({
    ...esistente,
    stato: SESSIONE_STATO.CHIUSA,
    updatedAt: Date.now(),
    decisionIds: [...(esistente.decisionIds || [])],
  });
  repo.upsertSessione(chiusa);

  if (repo.leggiIdSessioneAttiva() === sessionId) {
    repo.scriviIdSessioneAttiva(null);
  }
  return chiusa;
}

/**
 * Chiude la sessione attiva (se presente) e ne apre una nuova.
 * @param {{ preventivoId?: string|null }=} opzioni
 * @returns {object}
 */
export function nuovaSessioneSopralluogo(opzioni = {}) {
  const attiva = ottieniSessioneAttiva();
  if (attiva?.stato === SESSIONE_STATO.ATTIVA) {
    chiudiSessione(attiva.id);
  }
  return creaNuovaSessione(opzioni);
}

/**
 * @param {string} sessionId
 * @param {string} decisionId
 * @returns {object|null}
 */
export function aggiungiDecisionIdASessione(sessionId, decisionId) {
  const esistente = repo.trovaSessionePerId(sessionId);
  if (!esistente || !decisionId) return esistente;

  const ids = esistente.decisionIds || [];
  if (ids.includes(String(decisionId))) return esistente;

  const aggiornata = creaSessioneSopralluogo({
    ...esistente,
    decisionIds: [...ids, String(decisionId)],
    updatedAt: Date.now(),
  });
  return repo.upsertSessione(aggiornata);
}

/**
 * @param {string} sessionId
 * @param {string} preventivoId
 * @returns {object|null}
 */
export function collegaPreventivoASessione(sessionId, preventivoId) {
  const esistente = repo.trovaSessionePerId(sessionId);
  if (!esistente) return null;

  const aggiornata = creaSessioneSopralluogo({
    ...esistente,
    preventivoId: String(preventivoId),
    updatedAt: Date.now(),
    decisionIds: [...(esistente.decisionIds || [])],
  });
  return repo.upsertSessione(aggiornata);
}

/**
 * Scope obbligatorio per Decision Memory: sessionId e/o preventivoId.
 * @param {{ sessionId?: string|null, preventivoId?: string|null }=} scope
 * @returns {{ sessionId: string|null, preventivoId: string|null }}
 */
export function normalizzaScopeMemoria(scope = {}) {
  const sessionId = scope.sessionId ? String(scope.sessionId) : null;
  const preventivoId = scope.preventivoId ? String(scope.preventivoId) : null;
  if (!sessionId && !preventivoId) {
    throw new Error(
      "Scope Decision Memory obbligatorio: serve sessionId o preventivoId."
    );
  }
  return { sessionId, preventivoId };
}

export function elencaSessioniSopralluogo() {
  return repo.leggiSessioni();
}

export function resetSessioniSopralluogo() {
  return repo.cancellaSessioni();
}
