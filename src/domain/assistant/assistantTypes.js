/**
 * Assistente Sopralluogo — tipi e costanti.
 * Domande tecniche: nessuna quantità, nessun prezzo, nessun preventivo.
 */

/** Priorità domande. */
export const ASSISTANT_PRIORITA = Object.freeze({
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BASSA: "BASSA",
});

/** Stati risposta utente (non modificano il preventivo). */
export const ASSISTANT_RISPOSTA_STATO = Object.freeze({
  APERTA: "APERTA",
  RISPOSTA: "RISPOSTA",
  IGNORA: "IGNORA",
  NON_ORA: "NON_ORA",
});

/**
 * @typedef {Object} AssistantCondizioni
 * Stesso modello soft della Base Tecnica / Knowledge Input.
 * @property {string=} tipoImmobile
 * @property {string=} cucina
 * @property {boolean=} climatizzazione
 * @property {boolean=} predisposizioneFotovoltaico
 * @property {boolean=} [key]
 */

/**
 * @typedef {Object} AssistantDomanda
 * @property {string} id
 * @property {string} categoria
 * @property {string} domanda
 * @property {AssistantCondizioni} condizioniAttivazione
 * @property {"ALTA"|"MEDIA"|"BASSA"} priorita
 * @property {string[]} catalogoIds
 * @property {string|null=} schedaTecnicaId
 * @property {boolean=} enabled
 */

/**
 * @param {Partial<AssistantDomanda>} grezzo
 * @returns {AssistantDomanda}
 */
export function creaDomandaAssistente(grezzo = {}) {
  const id = String(grezzo.id || "").trim();
  if (!id) throw new Error("Domanda assistente senza id.");

  const domanda = String(grezzo.domanda || "").trim();
  if (!domanda) throw new Error(`Domanda ${id}: testo obbligatorio.`);

  const categoria = String(grezzo.categoria || "").trim();
  if (!categoria) throw new Error(`Domanda ${id}: categoria obbligatoria.`);

  const priorita = String(grezzo.priorita || ASSISTANT_PRIORITA.MEDIA);
  if (!Object.values(ASSISTANT_PRIORITA).includes(priorita)) {
    throw new Error(`Domanda ${id}: priorità non valida.`);
  }

  const catalogoIds = Array.isArray(grezzo.catalogoIds)
    ? grezzo.catalogoIds.map((c) => String(c).trim()).filter(Boolean)
    : [];

  const schedaTecnicaId = grezzo.schedaTecnicaId
    ? String(grezzo.schedaTecnicaId).trim()
    : null;

  return Object.freeze({
    id,
    categoria,
    domanda,
    condizioniAttivazione:
      grezzo.condizioniAttivazione &&
      typeof grezzo.condizioniAttivazione === "object"
        ? Object.freeze({ ...grezzo.condizioniAttivazione })
        : Object.freeze({}),
    priorita,
    catalogoIds: Object.freeze(catalogoIds),
    schedaTecnicaId,
    enabled: grezzo.enabled !== false,
  });
}
