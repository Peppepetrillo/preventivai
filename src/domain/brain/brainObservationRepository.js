/**
 * Repository osservazioni Brain — LocalStorage isolato, no cloud sync.
 * Chiave: preventivai.brain.observations
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../utils/storage";

const CHIAVE = () => STORAGE_KEYS.brainObservations;

/**
 * @returns {object[]}
 */
export function leggiOsservazioni() {
  const grezzo = leggiStorage(CHIAVE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} elenco
 * @returns {object[]}
 */
export function scriviOsservazioni(elenco = []) {
  const prossimo = Array.isArray(elenco) ? elenco : [];
  salvaStorage(CHIAVE(), prossimo);
  return prossimo;
}

/**
 * @param {object} osservazione
 * @returns {object}
 */
export function inserisciOsservazione(osservazione) {
  const elenco = leggiOsservazioni();
  const prossimo = [osservazione, ...elenco];
  scriviOsservazioni(prossimo);
  return osservazione;
}

/**
 * @returns {number}
 */
export function contaOsservazioniRepository() {
  return leggiOsservazioni().length;
}

/** @returns {object[]} */
export function cancellaTutteOsservazioni() {
  return scriviOsservazioni([]);
}
