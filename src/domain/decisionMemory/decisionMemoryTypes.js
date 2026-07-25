/**
 * Decision Memory — tipi.
 * Memoria delle scelte elettricista: nessun prezzo.
 * sessionId obbligatorio per isolamento tra preventivi.
 */

/** Stati persistiti in memoria. */
export const MEMORY_STATO = Object.freeze({
  CONFERMATA: "CONFERMATA",
  MODIFICATA: "MODIFICATA",
  IGNORATA: "IGNORATA",
});

/** Origine. */
export const MEMORY_ORIGINE = Object.freeze({
  ASSISTENTE_SOPRALLUOGO: "ASSISTENTE_SOPRALLUOGO",
});

/** Tipi azione memorizzati. */
export const MEMORY_AZIONE_TIPO = Object.freeze({
  AGGIORNA_QUANTITA: "AGGIORNA_QUANTITA",
});

/**
 * @typedef {Object} DecisionMemoryRecord
 * @property {string} id
 * @property {string} sessionId
 * @property {string|null} preventivoId
 * @property {string} domandaId
 * @property {string} catalogoId
 * @property {number|null} valorePrecedente
 * @property {number|string|null} valoreScelto
 * @property {string} tipoAzione
 * @property {"CONFERMATA"|"MODIFICATA"|"IGNORATA"} stato
 * @property {"ASSISTENTE_SOPRALLUOGO"} origine
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @param {Partial<DecisionMemoryRecord>} grezzo
 * @returns {DecisionMemoryRecord}
 */
export function creaRecordMemoria(grezzo = {}) {
  const id = String(grezzo.id || "").trim();
  if (!id) throw new Error("Decision Memory: id obbligatorio.");

  const sessionId = String(grezzo.sessionId || "").trim();
  if (!sessionId) {
    throw new Error(`Memoria ${id}: sessionId obbligatorio.`);
  }

  const domandaId = String(grezzo.domandaId || "").trim();
  if (!domandaId) throw new Error(`Memoria ${id}: domandaId obbligatorio.`);

  const catalogoId = String(grezzo.catalogoId || "").trim();
  if (!catalogoId) throw new Error(`Memoria ${id}: catalogoId obbligatorio.`);

  const stato = String(grezzo.stato || "");
  if (!Object.values(MEMORY_STATO).includes(stato)) {
    throw new Error(`Memoria ${id}: stato non valido.`);
  }

  const tipoAzione = String(
    grezzo.tipoAzione || MEMORY_AZIONE_TIPO.AGGIORNA_QUANTITA
  );
  if (!Object.values(MEMORY_AZIONE_TIPO).includes(tipoAzione)) {
    throw new Error(`Memoria ${id}: tipoAzione non valido.`);
  }

  const origine = String(
    grezzo.origine || MEMORY_ORIGINE.ASSISTENTE_SOPRALLUOGO
  );
  if (!Object.values(MEMORY_ORIGINE).includes(origine)) {
    throw new Error(`Memoria ${id}: origine non valida.`);
  }

  // Nessun prezzo
  if (
    grezzo.prezzo != null ||
    grezzo.prezzoUnitario != null ||
    grezzo.totale != null
  ) {
    throw new Error("Decision Memory: i prezzi non sono ammessi.");
  }

  const now = Date.now();
  return Object.freeze({
    id,
    sessionId,
    preventivoId: grezzo.preventivoId
      ? String(grezzo.preventivoId)
      : null,
    domandaId,
    catalogoId,
    valorePrecedente:
      grezzo.valorePrecedente === null || grezzo.valorePrecedente === undefined
        ? null
        : Number(grezzo.valorePrecedente),
    valoreScelto:
      grezzo.valoreScelto === null || grezzo.valoreScelto === undefined
        ? null
        : grezzo.valoreScelto,
    tipoAzione,
    stato,
    origine,
    createdAt: Number(grezzo.createdAt) || now,
    updatedAt: Number(grezzo.updatedAt) || now,
  });
}
