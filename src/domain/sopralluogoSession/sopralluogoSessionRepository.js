/**
 * Repository sessioni sopralluogo — LocalStorage isolato.
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../utils/storage";

const CHIAVE = () => STORAGE_KEYS.sopralluogoSessions;
const CHIAVE_ATTIVA = () => STORAGE_KEYS.sopralluogoSessionAttiva;

/**
 * @returns {object[]}
 */
export function leggiSessioni() {
  const grezzo = leggiStorage(CHIAVE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} elenco
 * @returns {object[]}
 */
export function scriviSessioni(elenco = []) {
  const prossimo = Array.isArray(elenco) ? elenco : [];
  salvaStorage(CHIAVE(), prossimo);
  return prossimo;
}

/**
 * @param {object} sessione
 * @returns {object}
 */
export function upsertSessione(sessione) {
  if (!sessione?.id) throw new Error("Sessione senza id.");
  const elenco = leggiSessioni();
  const idx = elenco.findIndex((s) => s.id === sessione.id);
  const prossimo =
    idx >= 0
      ? elenco.map((s, i) => (i === idx ? sessione : s))
      : [...elenco, sessione];
  scriviSessioni(prossimo);
  return sessione;
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function trovaSessionePerId(id) {
  if (!id) return null;
  return leggiSessioni().find((s) => s.id === String(id)) || null;
}

/**
 * @returns {string|null}
 */
export function leggiIdSessioneAttiva() {
  const grezzo = leggiStorage(CHIAVE_ATTIVA(), null);
  return grezzo ? String(grezzo) : null;
}

/**
 * @param {string|null} id
 */
export function scriviIdSessioneAttiva(id) {
  salvaStorage(CHIAVE_ATTIVA(), id ? String(id) : null);
  return id;
}

/**
 * @returns {object[]}
 */
export function cancellaSessioni() {
  scriviIdSessioneAttiva(null);
  return scriviSessioni([]);
}
