/**
 * Repository Base Tecnica — lettura schede.
 * Oggi: statico in-memory. Predisposto a override futuro.
 */

import {
  BASE_TECNICA_BY_ID,
  BASE_TECNICA_SCHEDE,
  BASE_TECNICA_SEZIONI,
} from "./baseTecnicaData";

/**
 * @returns {ReadonlyArray<object>}
 */
export function leggiSchede() {
  return BASE_TECNICA_SCHEDE;
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function trovaPerId(id) {
  if (!id) return null;
  return BASE_TECNICA_BY_ID[String(id)] || null;
}

/**
 * @param {string} categoria
 * @returns {object[]}
 */
export function trovaPerCategoria(categoria) {
  if (!categoria) return [];
  return BASE_TECNICA_SCHEDE.filter(
    (s) => s.categoria === categoria && s.enabled !== false
  );
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function leggiSezioni() {
  return BASE_TECNICA_SEZIONI;
}

/**
 * @returns {number}
 */
export function contaSchede() {
  return BASE_TECNICA_SCHEDE.length;
}
