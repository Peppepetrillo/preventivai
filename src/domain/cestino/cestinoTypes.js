/**
 * Soft-delete / Cestino (UX-7.1).
 * deletedAt assente = attivo; deletedAt presente = nel Cestino.
 */

export const TIPI_CESTINO = Object.freeze({
  cliente: "cliente",
  cantiere: "cantiere",
  preventivo: "preventivo",
});

export const FILTRI_CESTINO = Object.freeze({
  tutti: "tutti",
  clienti: "clienti",
  cantieri: "cantieri",
  preventivi: "preventivi",
});

/**
 * @param {unknown} record
 * @returns {boolean}
 */
export function isRecordCestinato(record) {
  if (!record || typeof record !== "object") return false;
  const raw = record.deletedAt;
  if (raw == null || raw === "") return false;
  return true;
}

/**
 * @param {unknown[]} elenco
 * @returns {object[]}
 */
export function filtraRecordAttivi(elenco) {
  if (!Array.isArray(elenco)) return [];
  return elenco.filter((item) => !isRecordCestinato(item));
}

/**
 * @param {unknown[]} elenco
 * @returns {object[]}
 */
export function filtraRecordCestinati(elenco) {
  if (!Array.isArray(elenco)) return [];
  return elenco.filter((item) => isRecordCestinato(item));
}

/**
 * @returns {string} ISO timestamp
 */
export function creaDeletedAtIso(now = Date.now()) {
  return new Date(now).toISOString();
}

/**
 * Rimuove deletedAt senza alterare gli altri campi.
 * @param {object} record
 * @returns {object}
 */
export function senzaDeletedAt(record) {
  if (!record || typeof record !== "object") return record;
  const resto = { ...record };
  delete resto.deletedAt;
  return resto;
}
