/**
 * Assistente Decision Flow — tipi.
 * Le decisioni NON modificano automaticamente KE / Proposal / pricing.
 */

/** Stati del ciclo di vita decisione. */
export const DECISION_STATO = Object.freeze({
  RICEVUTA: "RICEVUTA",
  PROPOSTA: "PROPOSTA",
  CONFERMATA: "CONFERMATA",
  IGNORATA: "IGNORATA",
});

/** Origine decisione. */
export const DECISION_ORIGINE = Object.freeze({
  ASSISTENTE_SOPRALLUOGO: "ASSISTENTE_SOPRALLUOGO",
});

/** Tipi azione proposta (nessun prezzo). */
export const DECISION_AZIONE_TIPO = Object.freeze({
  AGGIORNA_QUANTITA: "AGGIORNA_QUANTITA",
});

/**
 * @typedef {Object} AssistantAzioneProposta
 * @property {"AGGIORNA_QUANTITA"} tipo
 * @property {string} catalogoId
 * @property {number} quantita
 * @property {string=} etichetta
 */

/**
 * @typedef {Object} AssistantDecisione
 * @property {string} id
 * @property {string} domandaId
 * @property {string|number} risposta
 * @property {"RICEVUTA"|"PROPOSTA"|"CONFERMATA"|"IGNORATA"} stato
 * @property {"ASSISTENTE_SOPRALLUOGO"} origine
 * @property {number} timestamp
 * @property {AssistantAzioneProposta|null=} azione
 * @property {string=} messaggioProposta
 */

/**
 * @param {Partial<AssistantDecisione>} grezzo
 * @returns {AssistantDecisione}
 */
export function creaDecisione(grezzo = {}) {
  const id = String(grezzo.id || "").trim();
  if (!id) throw new Error("Decisione senza id.");

  const domandaId = String(grezzo.domandaId || "").trim();
  if (!domandaId) throw new Error(`Decisione ${id}: domandaId obbligatorio.`);

  const stato = String(grezzo.stato || DECISION_STATO.RICEVUTA);
  if (!Object.values(DECISION_STATO).includes(stato)) {
    throw new Error(`Decisione ${id}: stato non valido.`);
  }

  const origine = String(
    grezzo.origine || DECISION_ORIGINE.ASSISTENTE_SOPRALLUOGO
  );
  if (!Object.values(DECISION_ORIGINE).includes(origine)) {
    throw new Error(`Decisione ${id}: origine non valida.`);
  }

  let azione = null;
  if (grezzo.azione && typeof grezzo.azione === "object") {
    azione = Object.freeze(creaAzioneProposta(grezzo.azione));
  }

  return Object.freeze({
    id,
    domandaId,
    risposta: grezzo.risposta,
    stato,
    origine,
    timestamp: Number(grezzo.timestamp) || Date.now(),
    azione,
    messaggioProposta: grezzo.messaggioProposta
      ? String(grezzo.messaggioProposta)
      : null,
  });
}

/**
 * @param {Partial<AssistantAzioneProposta>} grezzo
 * @returns {AssistantAzioneProposta}
 */
export function creaAzioneProposta(grezzo = {}) {
  const tipo = String(grezzo.tipo || "").trim();
  if (!Object.values(DECISION_AZIONE_TIPO).includes(tipo)) {
    throw new Error(`Azione: tipo non valido (${tipo}).`);
  }

  const catalogoId = String(grezzo.catalogoId || "").trim();
  if (!catalogoId) throw new Error("Azione: catalogoId obbligatorio.");

  // Nessun prezzo: solo quantità
  if (
    grezzo.prezzo != null ||
    grezzo.prezzoUnitario != null ||
    grezzo.totale != null
  ) {
    throw new Error("Azione: i prezzi non sono ammessi nell'assistente.");
  }

  const quantita = Number(grezzo.quantita);
  if (!Number.isFinite(quantita) || quantita < 0) {
    throw new Error("Azione: quantità non valida.");
  }

  return Object.freeze({
    tipo,
    catalogoId,
    quantita,
    etichetta: grezzo.etichetta ? String(grezzo.etichetta) : catalogoId,
  });
}

/**
 * Parsing risposta numerica (es. "3", "3 pezzi").
 * @param {unknown} risposta
 * @returns {number|null}
 */
export function parsificaQuantitaRisposta(risposta) {
  if (typeof risposta === "number" && Number.isFinite(risposta)) {
    return risposta >= 0 ? risposta : null;
  }
  const testo = String(risposta ?? "").trim();
  if (!testo) return null;
  const match = testo.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const n = Number(String(match[1]).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
