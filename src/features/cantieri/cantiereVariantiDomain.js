import { normalizzaNumero } from "../../utils/preventivi";

export const TIPI_VARIANTE = ["aggiunta", "rimozione"];

/**
 * Totale lavorazioni (prezzo × quantità), senza IVA/sconto.
 * Usato come fallback quando manca preventivoOriginaleTotale.
 */
export function calcolaTotaleLavorazioni(lavorazioni = []) {
  return (Array.isArray(lavorazioni) ? lavorazioni : []).reduce(
    (acc, item) =>
      acc + normalizzaNumero(item?.prezzo) * normalizzaNumero(item?.quantita),
    0
  );
}

/**
 * Snapshot del preventivo iniziale sul cantiere (immutabile di fatto).
 * @param {object=} cantiere
 * @returns {number}
 */
export function risolviPreventivoOriginaleTotale(cantiere) {
  if (!cantiere || typeof cantiere !== "object") return 0;
  const salvato = Number(cantiere.preventivoOriginaleTotale);
  if (Number.isFinite(salvato)) return salvato;
  return calcolaTotaleLavorazioni(cantiere.lavorazioniOrigine || []);
}

/**
 * @param {object=} variante
 * @returns {number} Segnato: aggiunta +, rimozione −
 */
export function importoSegnatoVariante(variante) {
  if (!variante || typeof variante !== "object") return 0;
  const totale = normalizzaNumero(variante.totale);
  if (variante.tipo === "rimozione") return -Math.abs(totale);
  return Math.abs(totale);
}

/**
 * @param {object=} cantiere
 * @returns {{
 *   preventivoOriginale: number,
 *   deltaVarianti: number,
 *   totaleAggiornato: number,
 *   numeroVarianti: number,
 *   varianti: object[]
 * }}
 */
export function riepilogoEconomicoCantiere(cantiere) {
  const varianti = Array.isArray(cantiere?.varianti) ? cantiere.varianti : [];
  const preventivoOriginale = risolviPreventivoOriginaleTotale(cantiere);
  const deltaVarianti = varianti.reduce(
    (acc, variante) => acc + importoSegnatoVariante(variante),
    0
  );

  return {
    preventivoOriginale,
    deltaVarianti,
    totaleAggiornato: preventivoOriginale + deltaVarianti,
    numeroVarianti: varianti.length,
    varianti,
  };
}

/**
 * Crea una variante di cantiere (aggiunta o rimozione).
 * @param {{
 *   tipo?: string,
 *   descrizione?: string,
 *   categoria?: string,
 *   quantita?: number|string,
 *   prezzoUnitario?: number|string,
 *   note?: string,
 * }} dati
 */
export function creaVarianteCantiere(dati = {}) {
  const tipo =
    String(dati.tipo || "aggiunta").toLowerCase() === "rimozione"
      ? "rimozione"
      : "aggiunta";
  const quantita = Math.max(normalizzaNumero(dati.quantita, 1), 0);
  const prezzoUnitario = Math.max(normalizzaNumero(dati.prezzoUnitario), 0);
  const totale = quantita * prezzoUnitario;
  const descrizione = String(dati.descrizione || "").trim();

  if (!descrizione) {
    throw new Error("Inserisci la descrizione della variante.");
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data: new Date().toLocaleDateString("it-IT"),
    tipo,
    descrizione,
    categoria: String(dati.categoria || "").trim(),
    quantita,
    prezzoUnitario,
    totale,
    note: String(dati.note || "").trim(),
  };
}
