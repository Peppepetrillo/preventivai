/**
 * Repository decisioni Assistente Sopralluogo (in-memory, sessione).
 */

/** @type {Map<string, object>} */
const store = new Map();

/**
 * @param {object} decisione
 * @returns {object}
 */
export function salvaDecisione(decisione) {
  if (!decisione?.id) throw new Error("Decisione senza id.");
  store.set(decisione.id, decisione);
  return decisione;
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function trovaDecisionePerId(id) {
  if (!id) return null;
  return store.get(String(id)) || null;
}

/**
 * @param {string} domandaId
 * @returns {object|null} ultima decisione per domanda
 */
export function trovaUltimaDecisionePerDomanda(domandaId) {
  if (!domandaId) return null;
  let ultima = null;
  for (const d of store.values()) {
    if (d.domandaId !== domandaId) continue;
    if (!ultima || d.timestamp >= ultima.timestamp) ultima = d;
  }
  return ultima;
}

/**
 * @returns {object[]}
 */
export function elencaDecisioni() {
  return [...store.values()].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function eliminaDecisione(id) {
  return store.delete(String(id));
}

/**
 * Solo per test.
 */
export function resetDecisioni() {
  store.clear();
}
