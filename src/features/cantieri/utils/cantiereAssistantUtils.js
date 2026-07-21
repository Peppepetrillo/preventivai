/**
 * Utility pure per l'assistente contestuale al cantiere.
 */

export const MAX_SUGGERIMENTI_CANTIERE = 4;

/**
 * Firma dei dati rilevanti del cantiere per aggiornare i suggerimenti.
 * @param {object=} cantiere
 * @returns {string}
 */
export function firmaCantierePerAssistant(cantiere) {
  if (!cantiere || typeof cantiere !== "object") return "";

  const checklist = Array.isArray(cantiere.checklist)
    ? cantiere.checklist
        .map((voce) => `${voce?.id}:${voce?.completata ? 1 : 0}`)
        .join(",")
    : "";

  return [
    cantiere.id,
    cantiere.stato,
    cantiere.tipoLavoro || cantiere.origine || "",
    Array.isArray(cantiere.foto) ? cantiere.foto.length : 0,
    String(cantiere.note || "").trim().length,
    Array.isArray(cantiere.materiali) ? cantiere.materiali.length : 0,
    checklist,
  ].join("|");
}

/**
 * Seleziona al massimo 4 card già ordinate dal service.
 * @param {{ cards?: object[] }|null|undefined} payload
 * @returns {object[]}
 */
export function selezionaCardCantiere(payload) {
  const cards = Array.isArray(payload?.cards) ? payload.cards : [];
  return cards.filter(Boolean).slice(0, MAX_SUGGERIMENTI_CANTIERE);
}

/**
 * Etichetta azione primaria contestuale al cantiere.
 * @param {object=} card
 * @returns {string}
 */
export function etichettaAzioneCantiere(card) {
  switch (card?.tipo) {
    case "documentazione":
      return "Aggiungi foto";
    case "nota":
      return "Aggiungi nota";
    case "economico":
      return "Segna saldo";
    case "durata":
    case "materiale":
    case "checklist":
    default:
      return "Apri dettagli";
  }
}
