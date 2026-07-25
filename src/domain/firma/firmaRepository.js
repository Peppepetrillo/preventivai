/**
 * Repository Firme — LocalStorage isolato.
 * Chiave: preventivai.firme
 * Non modifica i preventivi.
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../utils/storage";
import { creaFirmaModel } from "./firmaTypes";

const CHIAVE = () => STORAGE_KEYS.firme;

/**
 * @returns {object[]}
 */
export function leggiTutteFirme() {
  const grezzo = leggiStorage(CHIAVE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} elenco
 * @returns {object[]}
 */
export function scriviTutteFirme(elenco = []) {
  const prossimo = Array.isArray(elenco) ? elenco : [];
  salvaStorage(CHIAVE(), prossimo);
  return prossimo;
}

/**
 * @param {string|number} preventivoId
 * @returns {object|null}
 */
export function trovaFirmaPerPreventivo(preventivoId) {
  return (
    leggiTutteFirme().find(
      (f) => String(f.preventivoId) === String(preventivoId)
    ) || null
  );
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function trovaFirma(id) {
  return leggiTutteFirme().find((f) => String(f.id) === String(id)) || null;
}

/**
 * Inserisce o sostituisce la firma del preventivo (una per preventivo).
 * @param {object} firma
 * @returns {object}
 */
export function upsertFirma(firma) {
  const voce = creaFirmaModel(firma);
  const elenco = leggiTutteFirme().filter(
    (f) => String(f.preventivoId) !== String(voce.preventivoId)
  );
  scriviTutteFirme([voce, ...elenco]);
  return voce;
}

/**
 * @param {string|number} preventivoId
 * @returns {boolean}
 */
export function eliminaFirmaPerPreventivo(preventivoId) {
  const elenco = leggiTutteFirme();
  const prossimo = elenco.filter(
    (f) => String(f.preventivoId) !== String(preventivoId)
  );
  if (prossimo.length === elenco.length) return false;
  scriviTutteFirme(prossimo);
  return true;
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function eliminaFirma(id) {
  const elenco = leggiTutteFirme();
  const prossimo = elenco.filter((f) => String(f.id) !== String(id));
  if (prossimo.length === elenco.length) return false;
  scriviTutteFirme(prossimo);
  return true;
}

/** Reset (test). */
export function resetFirme() {
  scriviTutteFirme([]);
}
