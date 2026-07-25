/**
 * Repository Decision Memory — LocalStorage isolato (no cloud).
 * Accesso sempre scoped per sessionId e/o preventivoId.
 */

import { STORAGE_KEYS } from "../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../utils/storage";

const CHIAVE = () => STORAGE_KEYS.decisionMemory;

/**
 * @returns {object[]}
 */
export function leggiMemoria() {
  const grezzo = leggiStorage(CHIAVE(), []);
  return Array.isArray(grezzo) ? grezzo : [];
}

/**
 * @param {object[]} elenco
 * @returns {object[]}
 */
export function scriviMemoria(elenco = []) {
  const prossimo = Array.isArray(elenco) ? elenco : [];
  salvaStorage(CHIAVE(), prossimo);
  return prossimo;
}

/**
 * Filtra record per scope (sessionId e/o preventivoId). Almeno uno obbligatorio.
 * @param {{ sessionId?: string|null, preventivoId?: string|null }} scope
 * @returns {object[]}
 */
export function filtraMemoriaPerScope(scope = {}) {
  const sessionId = scope.sessionId ? String(scope.sessionId) : null;
  const preventivoId = scope.preventivoId ? String(scope.preventivoId) : null;
  if (!sessionId && !preventivoId) {
    throw new Error(
      "Decision Memory: recupero senza sessionId/preventivoId non consentito."
    );
  }

  return leggiMemoria().filter((r) => {
    if (sessionId && String(r.sessionId) === sessionId) return true;
    if (preventivoId && r.preventivoId && String(r.preventivoId) === preventivoId) {
      return true;
    }
    return false;
  });
}

/**
 * @param {object} record
 * @returns {object}
 */
export function upsertMemoria(record) {
  if (!record?.id) throw new Error("Record memoria senza id.");
  if (!record.sessionId) throw new Error("Record memoria senza sessionId.");

  const elenco = leggiMemoria();
  const idx = elenco.findIndex((r) => r.id === record.id);
  let prossimo;
  if (idx >= 0) {
    prossimo = [...elenco];
    prossimo[idx] = record;
  } else {
    // Dedup per (sessionId, catalogoId)
    const filtrato = elenco.filter(
      (r) =>
        !(
          String(r.sessionId) === String(record.sessionId) &&
          r.catalogoId === record.catalogoId
        )
    );
    prossimo = [...filtrato, record];
  }
  scriviMemoria(prossimo);
  return record;
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function trovaMemoriaPerId(id) {
  if (!id) return null;
  return leggiMemoria().find((r) => r.id === String(id)) || null;
}

/**
 * @param {string} catalogoId
 * @param {{ sessionId?: string|null, preventivoId?: string|null }} scope
 * @returns {object|null}
 */
export function trovaMemoriaPerCatalogo(catalogoId, scope = {}) {
  if (!catalogoId) return null;
  const candidati = filtraMemoriaPerScope(scope)
    .filter((r) => r.catalogoId === catalogoId)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return candidati[0] || null;
}

/**
 * @param {string} domandaId
 * @param {{ sessionId?: string|null, preventivoId?: string|null }} scope
 * @returns {object|null}
 */
export function trovaMemoriaPerDomanda(domandaId, scope = {}) {
  if (!domandaId) return null;
  const candidati = filtraMemoriaPerScope(scope)
    .filter((r) => r.domandaId === domandaId)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return candidati[0] || null;
}

/**
 * @returns {object[]}
 */
export function cancellaMemoria() {
  return scriviMemoria([]);
}
