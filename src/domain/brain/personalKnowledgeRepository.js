/**
 * Repository conoscenze personali Brain — LocalStorage isolato, no cloud sync.
 * Chiave: preventivai.brain.personalKnowledge
 * Solo CRUD: nessun apprendimento automatico.
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../utils/storage";
import { creaIdBrain } from "./brainTypes";

const CHIAVE = () => STORAGE_KEYS.brainPersonalKnowledge;

/**
 * @returns {object[]}
 */
export function leggiConoscenze() {
  const grezzo = leggiStorage(CHIAVE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} elenco
 * @returns {object[]}
 */
export function scriviConoscenze(elenco = []) {
  const prossimo = Array.isArray(elenco) ? elenco : [];
  salvaStorage(CHIAVE(), prossimo);
  return prossimo;
}

/**
 * @param {object} conoscenza
 * @returns {object}
 */
export function creaConoscenza(conoscenza = {}) {
  const voce = {
    id: conoscenza.id || creaIdBrain("pk"),
    createdAt: conoscenza.createdAt || Date.now(),
    titolo: conoscenza.titolo || "",
    categoria: conoscenza.categoria || "",
    descrizione: conoscenza.descrizione || "",
    origine: conoscenza.origine ? String(conoscenza.origine) : "manuale",
    patternId: conoscenza.patternId ? String(conoscenza.patternId) : null,
    affidabilita:
      conoscenza.affidabilita === null || conoscenza.affidabilita === undefined
        ? null
        : Number(conoscenza.affidabilita) || 0,
    osservazioni:
      conoscenza.osservazioni === null || conoscenza.osservazioni === undefined
        ? null
        : Number(conoscenza.osservazioni) || 0,
    payload:
      conoscenza.payload && typeof conoscenza.payload === "object"
        ? conoscenza.payload
        : {},
  };
  const elenco = [voce, ...leggiConoscenze()];
  scriviConoscenze(elenco);
  return voce;
}

/**
 * @param {string} id
 * @param {object} patch
 * @returns {object|null}
 */
export function aggiornaConoscenza(id, patch = {}) {
  const elenco = leggiConoscenze();
  const indice = elenco.findIndex((voce) => String(voce.id) === String(id));
  if (indice < 0) return null;

  const aggiornata = {
    ...elenco[indice],
    ...patch,
    id: elenco[indice].id,
    updatedAt: Date.now(),
  };
  elenco[indice] = aggiornata;
  scriviConoscenze(elenco);
  return aggiornata;
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function eliminaConoscenza(id) {
  const elenco = leggiConoscenze();
  const prossimo = elenco.filter((voce) => String(voce.id) !== String(id));
  if (prossimo.length === elenco.length) return false;
  scriviConoscenze(prossimo);
  return true;
}

/**
 * @returns {object[]}
 */
export function elencaConoscenze() {
  return leggiConoscenze();
}

/**
 * @returns {number}
 */
export function contaConoscenze() {
  return leggiConoscenze().length;
}

/** Reset locale (test). */
export function resetConoscenze() {
  return scriviConoscenze([]);
}
