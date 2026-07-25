/**
 * Repository Catalogo — lettura del registro canonico.
 * Oggi: statico in-memory. Predisposto a override locale futuri.
 */

import {
  CATALOGO_BY_ID,
  CATALOGO_BY_CHIAVE_LISTINO,
  CATALOGO_LAVORAZIONI,
} from "./catalogoLavorazioni";

/**
 * @returns {ReadonlyArray<object>}
 */
export function leggiCatalogo() {
  return CATALOGO_LAVORAZIONI;
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function trovaPerId(id) {
  if (!id) return null;
  return CATALOGO_BY_ID[String(id)] || null;
}

/**
 * @param {string} chiaveListino
 * @returns {object|null}
 */
export function trovaPerChiaveListino(chiaveListino) {
  if (!chiaveListino) return null;
  const catalogoId = CATALOGO_BY_CHIAVE_LISTINO[String(chiaveListino)];
  return catalogoId ? CATALOGO_BY_ID[catalogoId] || null : null;
}

/**
 * @returns {number}
 */
export function contaCatalogo() {
  return CATALOGO_LAVORAZIONI.length;
}
