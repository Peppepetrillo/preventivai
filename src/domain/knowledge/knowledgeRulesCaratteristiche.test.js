import { describe, expect, it } from "vitest";

import { CATALOGO_IDS } from "./knowledgeCatalogRefs";
import { CUCINA_TIPI } from "./knowledgeInputTypes";
import {
  RULE_020,
  RULE_021,
  RULE_022,
  RULE_023,
  RULE_024,
  RULE_025,
  RULE_026,
  RULE_027,
  RULE_028,
  RULE_029,
  RULE_030,
  RULE_031,
  knowledgeRulesCaratteristiche,
} from "./knowledgeRulesCaratteristiche";

function assertSoloCatalogoId(esito) {
  expect(esito.applicata).toBe(true);
  for (const s of esito.suggerimenti) {
    expect(s).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        quantita: expect.any(Number),
      })
    );
    expect(s).not.toHaveProperty("prezzo");
    expect(s).not.toHaveProperty("prezzoUnitario");
  }
  const json = JSON.stringify(esito);
  expect(json).not.toMatch(/"prezzo"|price/i);
}

describe("knowledgeRulesCaratteristiche — KE 2.0", () => {
  it("espone 12 regole indipendenti enabled", () => {
    expect(knowledgeRulesCaratteristiche).toHaveLength(12);
    expect(knowledgeRulesCaratteristiche.every((r) => r.enabled)).toBe(true);
    expect(
      knowledgeRulesCaratteristiche.every((r) => typeof r.execute === "function")
    ).toBe(true);
  });

  describe("RULE_020 — climatizzazione", () => {
    it("aggiunge CLIMA se sì", () => {
      const esito = RULE_020.execute({ climatizzazione: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti).toEqual([
        { id: CATALOGO_IDS.CLIMA, quantita: 1, meta: {} },
      ]);
    });

    it("non applica se no", () => {
      expect(RULE_020.execute({ climatizzazione: false }).applicata).toBe(
        false
      );
    });
  });

  describe("RULE_021 — cucina induzione", () => {
    it("aggiunge LINEA_INDUZIONE", () => {
      const esito = RULE_021.execute({ cucina: CUCINA_TIPI.INDUZIONE });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.LINEA_INDUZIONE);
    });

    it("non applica su cucina standard", () => {
      expect(
        RULE_021.execute({ cucina: CUCINA_TIPI.STANDARD }).applicata
      ).toBe(false);
    });
  });

  describe("RULE_022 — rete dati", () => {
    it("aggiunge PUNTO_DATI", () => {
      const esito = RULE_022.execute({ reteDati: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.PUNTO_DATI);
    });
  });

  describe("RULE_023 — impianto TV", () => {
    it("aggiunge PUNTO_TV", () => {
      const esito = RULE_023.execute({ impiantoTv: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.PUNTO_TV);
    });
  });

  describe("RULE_024 — citofono", () => {
    it("aggiunge CITOFONO", () => {
      const esito = RULE_024.execute({ citofono: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.CITOFONO);
    });
  });

  describe("RULE_025 — videocitofono", () => {
    it("aggiunge VIDEOCITOFONO", () => {
      const esito = RULE_025.execute({ videocitofono: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.VIDEOCITOFONO);
    });
  });

  describe("RULE_026 — allarme", () => {
    it("aggiunge ALLARME", () => {
      const esito = RULE_026.execute({ allarme: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.ALLARME);
    });
  });

  describe("RULE_027 — videosorveglianza", () => {
    it("aggiunge VIDEOSORVEGLIANZA", () => {
      const esito = RULE_027.execute({ videosorveglianza: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.VIDEOSORVEGLIANZA);
    });
  });

  describe("RULE_028 — cancello automatico", () => {
    it("aggiunge CANCELLO", () => {
      const esito = RULE_028.execute({ cancelloAutomatico: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.CANCELLO);
    });
  });

  describe("RULE_029 — fotovoltaico", () => {
    it("aggiunge FOTOVOLTAICO", () => {
      const esito = RULE_029.execute({ predisposizioneFotovoltaico: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.FOTOVOLTAICO);
    });
  });

  describe("RULE_030 — colonnina ricarica", () => {
    it("aggiunge RICARICA_AUTO", () => {
      const esito = RULE_030.execute({ predisposizioneColonnina: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti[0].id).toBe(CATALOGO_IDS.RICARICA_AUTO);
    });
  });

  describe("RULE_031 — domotica", () => {
    it("aggiunge GATEWAY, BUS, ALIMENTATORE", () => {
      const esito = RULE_031.execute({ domotica: true });
      assertSoloCatalogoId(esito);
      expect(esito.suggerimenti.map((s) => s.id)).toEqual([
        CATALOGO_IDS.GATEWAY,
        CATALOGO_IDS.BUS,
        CATALOGO_IDS.ALIMENTATORE,
      ]);
    });

    it("non applica se domotica assente", () => {
      expect(RULE_031.execute({}).applicata).toBe(false);
    });
  });

  it("ogni regola è disattivabile via enabled", () => {
    for (const regola of knowledgeRulesCaratteristiche) {
      expect("enabled" in regola).toBe(true);
      expect(typeof regola.enabled).toBe("boolean");
    }
  });
});
