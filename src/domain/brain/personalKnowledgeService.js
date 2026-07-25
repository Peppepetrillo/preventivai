/**
 * Service conoscenze personali — CRUD solo.
 * NON crea conoscenze da osservazioni (richiede conferma utente, sprint futuri).
 */

import {
  aggiornaConoscenza as aggiornaNelRepository,
  contaConoscenze,
  creaConoscenza,
  eliminaConoscenza,
  elencaConoscenze as elencaDalRepository,
} from "./personalKnowledgeRepository";

/**
 * @param {object} conoscenza
 * @returns {object}
 */
export function aggiungiConoscenza(conoscenza = {}) {
  return creaConoscenza(conoscenza);
}

/**
 * @param {string} id
 * @param {object} patch
 * @returns {object|null}
 */
export function aggiornaConoscenza(id, patch = {}) {
  return aggiornaNelRepository(id, patch);
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function rimuoviConoscenza(id) {
  return eliminaConoscenza(id);
}

/**
 * @returns {object[]}
 */
export function elencaConoscenze() {
  return elencaDalRepository();
}

/**
 * @returns {number}
 */
export function contaConoscenzePersonali() {
  return contaConoscenze();
}
