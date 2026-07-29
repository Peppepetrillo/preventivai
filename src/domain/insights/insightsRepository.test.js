import { describe, expect, it, beforeEach } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import {
  aggiungiInsight,
  aggiornaInsightPerId,
  leggiInsights,
  selezionaInsights,
} from "./insightsRepository";

describe("insightsRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea e persiste un insight", () => {
    const insight = aggiungiInsight({
      titolo: "Passaggio cavi difficile",
      problema: "Controsoffitto chiuso",
      soluzione: "Valutare passaggio esterno",
      priorita: "alta",
      cantiereId: "c1",
      cliente: "Rossi",
    });

    expect(insight.id).toBeTruthy();
    expect(leggiInsights()).toHaveLength(1);
    expect(leggiInsights()[0].titolo).toBe("Passaggio cavi difficile");
  });

  it("aggiorna un insight esistente", () => {
    const insight = aggiungiInsight({
      titolo: "Materiale mancante",
      problema: "Magnetotermico non in magazzino",
    });

    const aggiornato = aggiornaInsightPerId(insight.id, {
      stato: "risolto",
      soluzione: "Acquistato al grossista",
    });

    expect(aggiornato?.stato).toBe("risolto");
    expect(selezionaInsights({ stato: "risolto" })).toHaveLength(1);
  });

  it("usa la chiave storage dedicata", () => {
    aggiungiInsight({ titolo: "Test" });
    expect(localStorage.getItem(STORAGE_KEYS.insights)).toBeTruthy();
  });
});
