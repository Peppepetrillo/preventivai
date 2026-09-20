import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { creaRepositoryLocale } from "./localStorageRepository";

const operaiRepository = creaRepositoryLocale(
  STORAGE_KEYS.operai,
  STORAGE_FALLBACKS[STORAGE_KEYS.operai]
);

/**
 * @returns {object[]}
 */
export function leggiOperaiTutti() {
  const elenco = operaiRepository.leggi();
  return Array.isArray(elenco) ? elenco : [];
}

/**
 * @param {{ includiDisattivi?: boolean }=} opzioni
 * @returns {object[]}
 */
export function leggiOperai(opzioni = {}) {
  const tutti = leggiOperaiTutti();
  if (opzioni.includiDisattivi) return tutti;
  return tutti.filter((voce) => voce?.attivo !== false);
}

/**
 * @param {object[]} operai
 */
export function salvaOperai(operai) {
  return operaiRepository.salva(Array.isArray(operai) ? operai : []);
}

/**
 * @param {string|number} id
 * @param {{ includiDisattivi?: boolean }=} opzioni
 */
export function trovaOperaio(id, opzioni = { includiDisattivi: true }) {
  const elenco = opzioni.includiDisattivi
    ? leggiOperaiTutti()
    : leggiOperai();
  return elenco.find((voce) => String(voce?.id) === String(id)) || null;
}
