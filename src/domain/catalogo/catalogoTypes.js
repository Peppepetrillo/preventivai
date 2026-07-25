/**
 * Catalogo — tipi e factory.
 */

import { CATALOGO_BY_ID, CATALOGO_LAVORAZIONI } from "./catalogoLavorazioni";

/**
 * @typedef {Object} SuggerimentoCatalogo
 * @property {string} id — ID Catalogo (es. QUADRO_ELETTRICO)
 * @property {number} quantita
 * @property {object=} meta — es. { moduli: 36 }
 */

/**
 * @param {string=} id
 * @returns {boolean}
 */
export function isCatalogoId(id) {
  if (!id || typeof id !== "string") return false;
  return Boolean(CATALOGO_BY_ID[id]);
}

/**
 * @param {Partial<SuggerimentoCatalogo>|string|object} grezzo
 * @returns {SuggerimentoCatalogo|null}
 */
export function creaSuggerimentoCatalogo(grezzo = {}) {
  if (typeof grezzo === "string") {
    // Retrocompat: stringa libera → risolto dal service, qui solo se è già un ID
    if (isCatalogoId(grezzo)) {
      return { id: grezzo, quantita: 1, meta: {} };
    }
    return null;
  }

  if (!grezzo || typeof grezzo !== "object") return null;

  const id = String(grezzo.id || grezzo.catalogoId || "").trim();
  if (!isCatalogoId(id)) return null;

  const quantitaRaw = Number(grezzo.quantita);
  const quantita =
    Number.isFinite(quantitaRaw) && quantitaRaw > 0 ? quantitaRaw : 1;

  return {
    id,
    quantita,
    meta:
      grezzo.meta && typeof grezzo.meta === "object" ? { ...grezzo.meta } : {},
  };
}

/**
 * @param {string} catalogoId
 * @returns {string}
 */
export function nomeDaCatalogo(catalogoId) {
  return CATALOGO_BY_ID[catalogoId]?.nome || catalogoId || "Lavorazione";
}

/**
 * @param {string} catalogoId
 * @returns {string}
 */
export function categoriaDaCatalogo(catalogoId) {
  return CATALOGO_BY_ID[catalogoId]?.categoria || "Lavorazioni";
}

/**
 * @param {string} catalogoId
 * @returns {string}
 */
export function unitaDaCatalogo(catalogoId) {
  return CATALOGO_BY_ID[catalogoId]?.unita || "cad";
}

/**
 * Report voci senza chiave listino.
 * @returns {Array<{ id: string, nome: string, categoria: string, motivo: string }>}
 */
export function elencaSenzaListino() {
  return CATALOGO_LAVORAZIONI.filter((v) => !v.chiaveListino).map((v) => ({
    id: v.id,
    nome: v.nome,
    categoria: v.categoria,
    motivo: "chiaveListino assente — prezzo non configurato nel Listino",
  }));
}
