import { describe, expect, it } from "vitest";

import { RULE_001, RULE_002, RULE_003 } from "./knowledgeRules";

describe("RULE_001 — Stima punti impianto", () => {
  it("stima 1 punto per mq quando mq è presente", () => {
    expect(RULE_001.execute({ mq: 85 })).toEqual({
      applicata: true,
      suggerimenti: [],
      dati: { puntiStimati: 85 },
    });
  });

  it("non applica se mq manca", () => {
    expect(RULE_001.execute({})).toEqual({
      applicata: false,
      suggerimenti: [],
      dati: {},
    });
  });
});

describe("RULE_002 — Quadro elettrico", () => {
  it("suggerisce Quadro 24 moduli se mq > 100", () => {
    expect(RULE_002.execute({ mq: 120 })).toMatchObject({
      applicata: true,
      suggerimenti: ["Quadro 24 moduli"],
      dati: { quadroSuggerito: "Quadro 24 moduli" },
    });
  });

  it("non applica se mq ≤ 100", () => {
    expect(RULE_002.execute({ mq: 100 }).applicata).toBe(false);
    expect(RULE_002.execute({ mq: 80 }).applicata).toBe(false);
  });
});

describe("RULE_003 — Quadro grande", () => {
  it("suggerisce Quadro 36 moduli se mq > 150", () => {
    expect(RULE_003.execute({ mq: 180 })).toMatchObject({
      applicata: true,
      suggerimenti: ["Quadro 36 moduli"],
      dati: { quadroSuggerito: "Quadro 36 moduli" },
    });
  });

  it("ha priorità superiore a RULE_002", () => {
    expect(RULE_003.priority).toBeGreaterThan(RULE_002.priority);
  });

  it("non applica se mq ≤ 150", () => {
    expect(RULE_003.execute({ mq: 150 }).applicata).toBe(false);
  });
});
