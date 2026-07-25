import { describe, expect, it } from "vitest";

import {
  KNOWLEDGE_LAYER,
  KNOWLEDGE_LAYER_WEIGHT,
  KNOWLEDGE_ORIGINE,
  confrontaLayer,
  ordinaPerPrioritaKnowledge,
  prioritaEffettiva,
} from "./knowledgePriorityService";

describe("knowledgePriorityService", () => {
  it("Base > Personali > Community", () => {
    expect(KNOWLEDGE_LAYER_WEIGHT.BASE).toBeGreaterThan(
      KNOWLEDGE_LAYER_WEIGHT.PERSONALI
    );
    expect(KNOWLEDGE_LAYER_WEIGHT.PERSONALI).toBeGreaterThan(
      KNOWLEDGE_LAYER_WEIGHT.COMMUNITY
    );
    expect(confrontaLayer(KNOWLEDGE_LAYER.BASE, KNOWLEDGE_LAYER.PERSONALI)).toBeLessThan(
      0
    );
  });

  it("prioritaEffettiva somma layer e priority relativa", () => {
    const base = prioritaEffettiva({
      layer: KNOWLEDGE_LAYER.BASE,
      priority: 300,
    });
    const personale = prioritaEffettiva({
      layer: KNOWLEDGE_LAYER.PERSONALI,
      priority: 9999,
    });
    expect(base).toBeGreaterThan(personale);
  });

  it("ordina Base prima delle Personali anche con priority relativa alta", () => {
    const ordinate = ordinaPerPrioritaKnowledge([
      {
        id: "PK",
        layer: KNOWLEDGE_LAYER.PERSONALI,
        priority: 999,
        knowledgeOrigine: KNOWLEDGE_ORIGINE.BRAIN,
      },
      {
        id: "BASE",
        layer: KNOWLEDGE_LAYER.BASE,
        priority: 1,
        knowledgeOrigine: KNOWLEDGE_ORIGINE.BASE,
      },
    ]);
    expect(ordinate.map((r) => r.id)).toEqual(["BASE", "PK"]);
  });
});
