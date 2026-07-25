/**
 * Sessione Sopralluogo — tipi.
 * Isola Decision Memory / Assistente per preventivo o draft.
 */

/** Stati sessione. */
export const SESSIONE_STATO = Object.freeze({
  ATTIVA: "ATTIVA",
  CHIUSA: "CHIUSA",
});

/**
 * @typedef {Object} SopralluogoSession
 * @property {string} id
 * @property {string|null} preventivoId
 * @property {"ATTIVA"|"CHIUSA"} stato
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string[]} decisionIds
 */

/**
 * @param {Partial<SopralluogoSession>} grezzo
 * @returns {SopralluogoSession}
 */
export function creaSessioneSopralluogo(grezzo = {}) {
  const id = String(grezzo.id || "").trim();
  if (!id) throw new Error("Sessione sopralluogo senza id.");

  const stato = String(grezzo.stato || SESSIONE_STATO.ATTIVA);
  if (!Object.values(SESSIONE_STATO).includes(stato)) {
    throw new Error(`Sessione ${id}: stato non valido.`);
  }

  const now = Date.now();
  const decisionIds = Array.isArray(grezzo.decisionIds)
    ? grezzo.decisionIds.map((d) => String(d)).filter(Boolean)
    : [];

  return Object.freeze({
    id,
    preventivoId: grezzo.preventivoId
      ? String(grezzo.preventivoId)
      : null,
    stato,
    createdAt: Number(grezzo.createdAt) || now,
    updatedAt: Number(grezzo.updatedAt) || now,
    decisionIds: Object.freeze([...decisionIds]),
  });
}
