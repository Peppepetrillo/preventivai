import { PRIORITA_INSIGHT, STATI_INSIGHT } from "./insightTypes";

/**
 * @param {{ titolo: string, problema?: string, soluzione?: string, priorita?: string, stato?: string, cantiereId?: string, cliente?: string }} input
 * @returns {import("./insightTypes").Insight}
 */
export function creaInsight({
  titolo,
  problema = "",
  soluzione = "",
  priorita = PRIORITA_INSIGHT.MEDIA,
  stato = STATI_INSIGHT.APERTO,
  cantiereId = "",
  cliente = "",
} = {}) {
  const oggi = new Date().toLocaleDateString("it-IT");
  return {
    id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    titolo: String(titolo || "").trim(),
    problema: String(problema || "").trim(),
    soluzione: String(soluzione || "").trim(),
    priorita: Object.values(PRIORITA_INSIGHT).includes(priorita)
      ? priorita
      : PRIORITA_INSIGHT.MEDIA,
    stato: Object.values(STATI_INSIGHT).includes(stato)
      ? stato
      : STATI_INSIGHT.APERTO,
    data: oggi,
    cantiereId: cantiereId ? String(cantiereId) : "",
    cliente: String(cliente || "").trim(),
    creatoIl: oggi,
    aggiornatoIl: oggi,
  };
}

/**
 * @param {import("./insightTypes").Insight} insight
 * @param {Partial<import("./insightTypes").Insight>} modifiche
 */
export function aggiornaInsight(insight, modifiche = {}) {
  return {
    ...insight,
    ...modifiche,
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
  };
}

/**
 * @param {import("./insightTypes").Insight[]} elenco
 * @param {string} [stato]
 */
export function filtraInsightPerStato(elenco = [], stato) {
  if (!stato) return elenco;
  return elenco.filter((item) => item.stato === stato);
}

/**
 * @param {import("./insightTypes").Insight[]} elenco
 */
export function ordinaInsightPerPriorita(elenco = []) {
  const peso = {
    [PRIORITA_INSIGHT.ALTA]: 0,
    [PRIORITA_INSIGHT.MEDIA]: 1,
    [PRIORITA_INSIGHT.BASSA]: 2,
  };
  return [...elenco].sort(
    (a, b) => (peso[a.priorita] ?? 9) - (peso[b.priorita] ?? 9)
  );
}
