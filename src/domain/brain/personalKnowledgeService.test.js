import { beforeEach, describe, expect, it } from "vitest";

import {
  aggiungiConoscenza,
  aggiornaConoscenza,
  contaConoscenzePersonali,
  elencaConoscenze,
  rimuoviConoscenza,
} from "./personalKnowledgeService";
import { resetConoscenze } from "./personalKnowledgeRepository";

describe("personalKnowledgeService", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConoscenze();
  });

  it("espone CRUD conoscenze personali senza learning", () => {
    const voce = aggiungiConoscenza({
      titolo: "Preferenza quadro 24",
      categoria: "Quadro elettrico",
    });

    expect(contaConoscenzePersonali()).toBe(1);
    expect(elencaConoscenze()[0].id).toBe(voce.id);

    aggiornaConoscenza(voce.id, { descrizione: "Sotto 150 mq" });
    expect(elencaConoscenze()[0].descrizione).toBe("Sotto 150 mq");

    expect(rimuoviConoscenza(voce.id)).toBe(true);
    expect(contaConoscenzePersonali()).toBe(0);
  });
});
