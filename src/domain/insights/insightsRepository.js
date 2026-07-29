import { STORAGE_KEYS } from "../../app/storageKeys";
import { creaRepositoryLocale } from "../../repositories/localStorageRepository";
import {
  aggiornaInsight,
  creaInsight,
  filtraInsightPerStato,
  ordinaInsightPerPriorita,
} from "./insightDomain";

const repo = creaRepositoryLocale(STORAGE_KEYS.insights, []);

export function leggiInsights() {
  return repo.leggi();
}

export function salvaInsights(elenco = []) {
  return repo.salva(elenco);
}

/**
 * @param {Parameters<typeof creaInsight>[0]} input
 */
export function aggiungiInsight(input) {
  const insight = creaInsight(input);
  const elenco = [...leggiInsights(), insight];
  salvaInsights(elenco);
  return insight;
}

/**
 * @param {string} id
 * @param {Partial<import("./insightTypes").Insight>} modifiche
 */
export function aggiornaInsightPerId(id, modifiche = {}) {
  const elenco = leggiInsights();
  const idx = elenco.findIndex((item) => String(item.id) === String(id));
  if (idx < 0) return null;
  const aggiornato = aggiornaInsight(elenco[idx], modifiche);
  const prossimo = elenco.map((item, index) =>
    index === idx ? aggiornato : item
  );
  salvaInsights(prossimo);
  return aggiornato;
}

/**
 * @param {string} id
 */
export function trovaInsightPerId(id) {
  return leggiInsights().find((item) => String(item.id) === String(id)) || null;
}

/**
 * @param {{ stato?: string, priorita?: boolean }} [filtri]
 */
export function selezionaInsights(filtri = {}) {
  let elenco = leggiInsights();
  if (filtri.stato) {
    elenco = filtraInsightPerStato(elenco, filtri.stato);
  }
  if (filtri.priorita) {
    elenco = ordinaInsightPerPriorita(elenco);
  }
  return elenco;
}

export { creaInsight, aggiornaInsight };
