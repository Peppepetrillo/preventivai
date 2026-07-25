import { describe, expect, it } from "vitest";

import { RULE_001, RULE_002, RULE_003, RULE_008 } from "./knowledgeRules";
import { CATALOGO_IDS } from "./knowledgeCatalogRefs";

describe("RULE_001 — Stima punti impianto", () => {
  it("stima 1 punto per mq quando mq è presente", () => {
    expect(RULE_001.execute({ mq: 85 })).toEqual({
      applicata: true,
      suggerimenti: [
        { id: CATALOGO_IDS.PUNTO_IMPIANTO, quantita: 85, meta: {} },
      ],
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
  it("suggerisce QUADRO_ELETTRICO 24 moduli se mq > 100", () => {
    expect(RULE_002.execute({ mq: 120 })).toMatchObject({
      applicata: true,
      suggerimenti: [
        { id: CATALOGO_IDS.QUADRO_ELETTRICO, quantita: 1, meta: { moduli: 24 } },
      ],
      dati: {
        quadroSuggerito: CATALOGO_IDS.QUADRO_ELETTRICO,
        quadroModuli: 24,
      },
    });
  });

  it("non applica se mq ≤ 100", () => {
    expect(RULE_002.execute({ mq: 100 }).applicata).toBe(false);
    expect(RULE_002.execute({ mq: 80 }).applicata).toBe(false);
  });
});

describe("RULE_003 — Quadro grande", () => {
  it("suggerisce QUADRO_ELETTRICO 36 moduli se mq > 150", () => {
    expect(RULE_003.execute({ mq: 180 })).toMatchObject({
      applicata: true,
      suggerimenti: [
        { id: CATALOGO_IDS.QUADRO_ELETTRICO, quantita: 1, meta: { moduli: 36 } },
      ],
      dati: {
        quadroSuggerito: CATALOGO_IDS.QUADRO_ELETTRICO,
        quadroModuli: 36,
      },
    });
  });

  it("ha priorità superiore a RULE_002", () => {
    expect(RULE_003.priority).toBeGreaterThan(RULE_002.priority);
  });

  it("non applica se mq ≤ 150", () => {
    expect(RULE_003.execute({ mq: 150 }).applicata).toBe(false);
  });
});

describe("RULE_008 — Quadro 12 moduli appartamento ≤100 mq", () => {
  it("suggerisce QUADRO_12_MODULI per appartamento 60 mq", () => {
    expect(
      RULE_008.execute({ mq: 60, tipoImmobile: "appartamento" })
    ).toMatchObject({
      applicata: true,
      suggerimenti: [
        {
          id: CATALOGO_IDS.QUADRO_12_MODULI,
          quantita: 1,
          meta: { moduli: 12 },
        },
      ],
      dati: {
        quadroSuggerito: CATALOGO_IDS.QUADRO_12_MODULI,
        quadroModuli: 12,
      },
    });
  });

  it("include il limite 100 mq compreso", () => {
    expect(
      RULE_008.execute({ mq: 100, tipoImmobile: "appartamento" }).applicata
    ).toBe(true);
  });

  it("non applica oltre 100 mq o su altri immobili", () => {
    expect(
      RULE_008.execute({ mq: 101, tipoImmobile: "appartamento" }).applicata
    ).toBe(false);
    expect(
      RULE_008.execute({ mq: 60, tipoImmobile: "villa" }).applicata
    ).toBe(false);
    expect(
      RULE_008.execute({ mq: 60, tipoImmobile: "ufficio" }).applicata
    ).toBe(false);
  });

  it("non codifica alcun prezzo nella regola", () => {
    const esito = RULE_008.execute({
      mq: 60,
      tipoImmobile: "appartamento",
    });
    const json = JSON.stringify(esito);
    expect(json).not.toMatch(/350|prezzo|price/i);
    expect(esito.suggerimenti[0]).toEqual({
      id: CATALOGO_IDS.QUADRO_12_MODULI,
      quantita: 1,
      meta: { moduli: 12 },
    });
  });
});
