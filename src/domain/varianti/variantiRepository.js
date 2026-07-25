/**
 * Repository Varianti — LocalStorage isolato.
 * Chiave: preventivai.varianti
 * Non tocca preventivi né il totale salvato sul preventivo.
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../utils/storage";
import { creaVarianteModel } from "./variantiTypes";

const CHIAVE = () => STORAGE_KEYS.varianti;
const CHIAVE_TIMELINE = () => STORAGE_KEYS.variantiTimeline;

/**
 * @returns {object[]}
 */
export function leggiTutteVarianti() {
  const grezzo = leggiStorage(CHIAVE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} elenco
 * @returns {object[]}
 */
export function scriviTutteVarianti(elenco = []) {
  const prossimo = Array.isArray(elenco) ? elenco : [];
  salvaStorage(CHIAVE(), prossimo);
  return prossimo;
}

/**
 * @param {string|number} cantiereId
 * @returns {object[]}
 */
export function leggiVariantiPerCantiere(cantiereId) {
  return leggiTutteVarianti().filter(
    (v) => String(v.cantiereId) === String(cantiereId)
  );
}

/**
 * @param {string|number} id
 * @returns {object|null}
 */
export function trovaVariante(id) {
  return (
    leggiTutteVarianti().find((v) => String(v.id) === String(id)) || null
  );
}

/**
 * @param {object} variante
 * @returns {object}
 */
export function inserisciVariante(variante) {
  const voce = creaVarianteModel(variante);
  const elenco = [voce, ...leggiTutteVarianti()];
  scriviTutteVarianti(elenco);
  return voce;
}

/**
 * @param {string|number} id
 * @param {object} patch
 * @returns {object|null}
 */
export function aggiornaVariante(id, patch = {}) {
  const elenco = leggiTutteVarianti();
  const indice = elenco.findIndex((v) => String(v.id) === String(id));
  if (indice < 0) return null;

  const aggiornata = creaVarianteModel({
    ...elenco[indice],
    ...patch,
    id: elenco[indice].id,
    cantiereId: elenco[indice].cantiereId,
    aggiornatoAt: Date.now(),
  });
  elenco[indice] = aggiornata;
  scriviTutteVarianti(elenco);
  return aggiornata;
}

/**
 * @param {string|number} id
 * @returns {boolean}
 */
export function eliminaVariante(id) {
  const elenco = leggiTutteVarianti();
  const prossimo = elenco.filter((v) => String(v.id) !== String(id));
  if (prossimo.length === elenco.length) return false;
  scriviTutteVarianti(prossimo);
  return true;
}

/**
 * @returns {object[]}
 */
export function leggiTimelineVarianti() {
  const grezzo = leggiStorage(CHIAVE_TIMELINE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} eventi
 */
export function scriviTimelineVarianti(eventi = []) {
  salvaStorage(CHIAVE_TIMELINE(), Array.isArray(eventi) ? eventi : []);
  return eventi;
}

/** Reset (test). */
export function resetVarianti() {
  scriviTutteVarianti([]);
  scriviTimelineVarianti([]);
}
