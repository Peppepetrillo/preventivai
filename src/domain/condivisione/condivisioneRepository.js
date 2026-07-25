/**
 * Repository Condivisioni — LocalStorage isolato.
 * Chiave: preventivai.condivisioni
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../utils/storage";
import { creaCondivisioneModel } from "./condivisioneTypes";

const CHIAVE = () => STORAGE_KEYS.condivisioni;

/**
 * @returns {object[]}
 */
export function leggiTutteCondivisioni() {
  const grezzo = leggiStorage(CHIAVE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} elenco
 * @returns {object[]}
 */
export function scriviTutteCondivisioni(elenco = []) {
  const prossimo = Array.isArray(elenco) ? elenco : [];
  salvaStorage(CHIAVE(), prossimo);
  return prossimo;
}

/**
 * @param {string|number} preventivoId
 * @returns {object[]}
 */
export function leggiCondivisioniPerPreventivo(preventivoId) {
  return leggiTutteCondivisioni()
    .filter((c) => String(c.preventivoId) === String(preventivoId))
    .sort((a, b) => (Number(b.data) || 0) - (Number(a.data) || 0));
}

/**
 * @param {object} condivisione
 * @returns {object}
 */
export function inserisciCondivisione(condivisione) {
  const voce = creaCondivisioneModel(condivisione);
  const elenco = [voce, ...leggiTutteCondivisioni()];
  scriviTutteCondivisioni(elenco);
  return voce;
}

/**
 * @param {string} id
 * @param {object} patch
 * @returns {object|null}
 */
export function aggiornaCondivisione(id, patch = {}) {
  const elenco = leggiTutteCondivisioni();
  const indice = elenco.findIndex((c) => String(c.id) === String(id));
  if (indice < 0) return null;
  const aggiornata = creaCondivisioneModel({
    ...elenco[indice],
    ...patch,
    id: elenco[indice].id,
    preventivoId: elenco[indice].preventivoId,
  });
  elenco[indice] = aggiornata;
  scriviTutteCondivisioni(elenco);
  return aggiornata;
}

/** Reset (test). */
export function resetCondivisioni() {
  scriviTutteCondivisioni([]);
}
