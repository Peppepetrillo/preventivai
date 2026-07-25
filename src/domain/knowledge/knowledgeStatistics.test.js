import { describe, expect, it } from "vitest";

import { KNOWLEDGE_CATEGORIES } from "./knowledgeCategories";
import { knowledgeRules } from "./knowledgeRules";
import {
  getNumeroRegole,
  getRegoleAttive,
  getRegoleDisattivate,
  getRegolePerCategoria,
} from "./knowledgeStatistics";

describe("knowledgeCategories", () => {
  it("espone 12 categorie Knowledge Base ordinate", () => {
    expect(KNOWLEDGE_CATEGORIES).toHaveLength(12);
    expect(KNOWLEDGE_CATEGORIES).toEqual([
      "Immobile",
      "Punti impianto",
      "Quadro elettrico",
      "Distribuzione",
      "Serie civile",
      "Climatizzazione",
      "Domotica",
      "Illuminazione",
      "Rete dati",
      "Sicurezza",
      "Fotovoltaico",
      "Ricarica Auto",
    ]);
  });

  it("non contiene duplicati", () => {
    expect(new Set(KNOWLEDGE_CATEGORIES).size).toBe(
      KNOWLEDGE_CATEGORIES.length
    );
  });
});

describe("knowledgeStatistics", () => {
  it("conta il numero totale di regole", () => {
    expect(getNumeroRegole()).toBe(7);
    expect(getNumeroRegole(knowledgeRules)).toBe(knowledgeRules.length);
  });

  it("raggruppa le regole per categoria includendo le vuote", () => {
    const perCategoria = getRegolePerCategoria();

    expect(perCategoria["Punti impianto"]).toBe(1);
    expect(perCategoria["Quadro elettrico"]).toBe(2);
    expect(perCategoria.Climatizzazione).toBe(1);
    expect(perCategoria.Domotica).toBe(1);
    expect(perCategoria.Distribuzione).toBe(1);
    expect(perCategoria.Immobile).toBe(1);
    expect(perCategoria["Serie civile"]).toBe(0);
    expect(perCategoria.Fotovoltaico).toBe(0);
    expect(Object.keys(perCategoria)).toEqual(
      expect.arrayContaining(KNOWLEDGE_CATEGORIES)
    );
  });

  it("separa regole attive e disattivate", () => {
    expect(getRegoleAttive()).toHaveLength(7);
    expect(getRegoleDisattivate()).toHaveLength(0);

    const miste = [
      { id: "A", enabled: true },
      { id: "B", enabled: false },
      { id: "C" },
    ];

    expect(getRegoleAttive(miste).map((r) => r.id)).toEqual(["A", "C"]);
    expect(getRegoleDisattivate(miste).map((r) => r.id)).toEqual(["B"]);
  });

  it("ogni regola ha metadati Knowledge Base", () => {
    knowledgeRules.forEach((regola) => {
      expect(regola.id).toBeTruthy();
      expect(regola.nome).toBeTruthy();
      expect(regola.descrizione).toBeTruthy();
      expect(KNOWLEDGE_CATEGORIES).toContain(regola.categoria);
      expect(Array.isArray(regola.tags)).toBe(true);
      expect(regola.tags.length).toBeGreaterThan(0);
      expect(regola.version).toBeTruthy();
      expect(regola.fonte).toBeTruthy();
      expect(typeof regola.enabled).toBe("boolean");
      expect(Number.isFinite(regola.priority)).toBe(true);
      expect(typeof regola.execute).toBe("function");
    });
  });
});
