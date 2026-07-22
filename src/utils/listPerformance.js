/**
 * Limita gli elementi renderizzati inizialmente per liste grandi (RC-3).
 */
export const PAGINA_LISTA_DEFAULT = 80;

/**
 * @template T
 * @param {T[]} elenco
 * @param {number} limite
 * @returns {T[]}
 */
export function limitaElencoVisibile(elenco, limite = PAGINA_LISTA_DEFAULT) {
  if (!Array.isArray(elenco)) return [];
  if (!Number.isFinite(limite) || limite <= 0) return elenco;
  return elenco.slice(0, limite);
}
