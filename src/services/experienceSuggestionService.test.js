import { describe, expect, it, vi } from "vitest";
import {
  classificaConfidence,
  getConfidenceScore,
  getSuggerimenti,
  getSuggerimentiChecklist,
  getSuggerimentiDurata,
  getSuggerimentiMateriali,
} from "./experienceSuggestionService";
import * as insightsService from "./experienceInsightsService";

vi.mock("./cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

function esperienza({
  tipoLavoro = "impianto",
  durataGiorni = 5,
  checklist = ["Posa corrugati"],
  attivitaAggiunte = [],
  materiali = ["Cavo 3x2.5"],
} = {}) {
  return {
    tipoLavoro,
    durataGiorni,
    checklistCompletata: checklist.map((testo) => ({
      testo,
      completata: true,
    })),
    attivitaAggiunte,
    materiali: materiali.map((nome) => ({ nome, quantita: 1, unita: "cad" })),
  };
}

describe("experienceSuggestionService", () => {
  describe("getConfidenceScore", () => {
    it("restituisce 0 per input non validi", () => {
      expect(getConfidenceScore(0, 10)).toBe(0);
      expect(getConfidenceScore(5, 0)).toBe(0);
      expect(getConfidenceScore(null, 10)).toBe(0);
      expect(getConfidenceScore(5, null)).toBe(0);
      expect(getConfidenceScore(-1, 10)).toBe(0);
      expect(getConfidenceScore("x", 10)).toBe(0);
    });

    it("calcola il rapporto e lo limita a 1", () => {
      expect(getConfidenceScore(9, 10)).toBe(0.9);
      expect(getConfidenceScore(96, 100)).toBe(0.96);
      expect(getConfidenceScore(15, 10)).toBe(1);
      expect(getConfidenceScore(1, 4)).toBe(0.25);
    });

    it("classifica le fasce di confidenza", () => {
      expect(classificaConfidence(0.96)).toBe("molto_alta");
      expect(classificaConfidence(0.9)).toBe("alta");
      expect(classificaConfidence(0.75)).toBe("alta");
      expect(classificaConfidence(0.6)).toBe("media");
      expect(classificaConfidence(0.4)).toBe("bassa");
      expect(classificaConfidence(NaN)).toBe("bassa");
    });
  });

  describe("nessuna esperienza", () => {
    it("restituisce strutture vuote", () => {
      const vuoto = getInsightsVuoti();

      expect(getSuggerimentiChecklist({ insights: vuoto })).toEqual([]);
      expect(getSuggerimentiMateriali({ insights: vuoto })).toEqual([]);
      expect(getSuggerimentiDurata({ insights: vuoto })).toEqual({
        durataStimata: null,
        confidence: 0,
      });
      expect(getSuggerimenti({ insights: vuoto })).toEqual({
        checklist: [],
        materiali: [],
        durata: { durataStimata: null, confidence: 0 },
        confidenceGlobale: 0,
      });
    });
  });

  describe("pochi dati", () => {
    it("produce confidence bassa sulla durata con un solo campione", () => {
      const esperienze = [esperienza({ durataGiorni: 4 })];
      const durata = getSuggerimentiDurata({
        esperienze,
        tipoLavoro: "impianto",
      });

      expect(durata.durataStimata).toBe(4);
      expect(durata.confidence).toBe(0.2);
      expect(classificaConfidence(durata.confidence)).toBe("bassa");
    });
  });

  describe("molti dati", () => {
    const esperienze = [
      esperienza({
        checklist: ["Posa corrugati", "Verifica impianto"],
        materiali: ["Cavo 3x2.5", "Canalina"],
        durataGiorni: 6,
      }),
      esperienza({
        checklist: ["Posa corrugati"],
        materiali: ["Cavo 3x2.5"],
        durataGiorni: 4,
      }),
      esperienza({
        checklist: ["Posa corrugati", "Verifica impianto"],
        materiali: ["Cavo 3x2.5"],
        durataGiorni: 5,
      }),
      esperienza({
        checklist: ["Posa corrugati"],
        materiali: ["Cavo 3x2.5", "Morsetti"],
        durataGiorni: 5,
      }),
      esperienza({
        checklist: ["Posa corrugati", "Verifica impianto"],
        materiali: ["Cavo 3x2.5"],
        durataGiorni: 6,
      }),
    ];

    it("genera checklist con confidence alta e motivo corretto", () => {
      const checklist = getSuggerimentiChecklist({
        esperienze,
        tipoLavoro: "impianto",
      });

      expect(checklist[0]).toMatchObject({
        nome: "Posa corrugati",
        origine: "experience",
      });
      expect(checklist[0].confidence).toBe(1);
      expect(checklist[0].motivo).toContain("100%");
      expect(classificaConfidence(checklist[0].confidence)).toBe("molto_alta");
      expect(checklist.every((s) => s.origine === "experience")).toBe(true);
    });

    it("ordina i materiali per confidence decrescente", () => {
      const materiali = getSuggerimentiMateriali({ esperienze });

      expect(materiali[0].nome).toBe("Cavo 3x2.5");
      expect(materiali[0].confidence).toBeGreaterThanOrEqual(
        materiali[1]?.confidence ?? 0
      );
      expect(materiali[0].motivo).toMatch(/frequentemente/i);
    });

    it("stima durata con confidence alta dopo abbastanza campioni", () => {
      const durata = getSuggerimentiDurata({
        esperienze,
        tipoLavoro: "impianto",
      });

      expect(durata.durataStimata).toBe(5.2);
      expect(durata.confidence).toBe(1);
      expect(classificaConfidence(durata.confidence)).toBe("molto_alta");
    });

    it("getSuggerimenti aggrega checklist, materiali, durata e confidenceGlobale", () => {
      const risultato = getSuggerimenti({
        esperienze,
        tipoLavoro: "impianto",
      });

      expect(risultato.checklist.length).toBeGreaterThan(0);
      expect(risultato.materiali.length).toBeGreaterThan(0);
      expect(risultato.durata.durataStimata).toBe(5.2);
      expect(risultato.confidenceGlobale).toBeGreaterThan(0.5);
    });

    it("produce output stabile a parità di input", () => {
      const a = getSuggerimenti({ esperienze, tipoLavoro: "impianto" });
      const b = getSuggerimenti({ esperienze, tipoLavoro: "impianto" });
      expect(a).toEqual(b);
    });
  });

  describe("tipo sconosciuto e dati assenti", () => {
    it("non stima durata per tipo sconosciuto", () => {
      const esperienze = [esperienza({ tipoLavoro: "impianto" })];

      expect(
        getSuggerimentiDurata({
          esperienze,
          tipoLavoro: "fotovoltaico",
        })
      ).toEqual({
        durataStimata: null,
        confidence: 0,
      });
    });

    it("gestisce checklist e materiali assenti", () => {
      const esperienze = [
        {
          tipoLavoro: "intervento",
          durataGiorni: 2,
          checklistCompletata: null,
          attivitaAggiunte: null,
          materiali: null,
        },
      ];

      expect(getSuggerimentiChecklist({ esperienze })).toEqual([]);
      expect(getSuggerimentiMateriali({ esperienze })).toEqual([]);
      expect(
        getSuggerimentiDurata({ esperienze, tipoLavoro: "intervento" })
          .durataStimata
      ).toBe(2);
    });

    it("gestisce insights incompleti senza lanciare", () => {
      expect(
        getSuggerimentiChecklist({ insights: {} })
      ).toEqual([]);
      expect(
        getSuggerimentiMateriali({ insights: { statistiche: null } })
      ).toEqual([]);
      expect(getSuggerimentiDurata({ insights: null })).toEqual({
        durataStimata: null,
        confidence: 0,
      });
    });
  });

  describe("integrazione Insights", () => {
    it("usa getInsights quando non riceve insights/esperienze", () => {
      const spy = vi.spyOn(insightsService, "getInsights").mockReturnValue({
        statistiche: {
          totaleEsperienze: 2,
          totaleCantieriCompletati: 2,
          durataMedia: 3,
          totaleMaterialiUtilizzati: 1,
          totaleAttivitaRegistrate: 1,
        },
        tipiLavoro: [{ tipo: "express", count: 2 }],
        attivita: [{ nome: "Controllo quadro", count: 2 }],
        materiali: [{ nome: "Nastro", count: 1 }],
        durataMedia: [{ tipo: "express", durataMedia: 3 }],
      });

      const risultato = getSuggerimenti({ tipoLavoro: "express" });

      expect(spy).toHaveBeenCalled();
      expect(risultato.checklist[0].nome).toBe("Controllo quadro");
      expect(risultato.checklist[0].confidence).toBe(1);
      expect(risultato.materiali[0].nome).toBe("Nastro");
      expect(risultato.durata.durataStimata).toBe(3);

      spy.mockRestore();
    });

    it("accetta insights già calcolati senza richiamare il motore", () => {
      const spy = vi.spyOn(insightsService, "getInsights");
      const insights = insightsService.getInsights([
        esperienza({ checklist: ["Solo test"] }),
      ]);
      spy.mockClear();

      const checklist = getSuggerimentiChecklist({ insights });

      expect(spy).not.toHaveBeenCalled();
      expect(checklist[0].nome).toBe("Solo test");
    });
  });
});

function getInsightsVuoti() {
  return {
    statistiche: {
      totaleEsperienze: 0,
      totaleCantieriCompletati: 0,
      durataMedia: 0,
      totaleMaterialiUtilizzati: 0,
      totaleAttivitaRegistrate: 0,
    },
    tipiLavoro: [],
    attivita: [],
    materiali: [],
    durataMedia: [],
  };
}
