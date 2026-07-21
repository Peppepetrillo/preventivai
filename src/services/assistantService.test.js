import { describe, expect, it, vi } from "vitest";
import {
  ASSISTANT_ACTIONS,
  ASSISTANT_VERSIONE,
  calcolaPriorita,
  getAssistant,
  getCantiereAssistant,
  getClienteAssistant,
  getDashboardAssistant,
  getPreventivoAssistant,
} from "./assistantService";
import * as suggestionService from "./experienceSuggestionService";

vi.mock("./cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

const SUGGERIMENTI_VUOTI = {
  checklist: [],
  materiali: [],
  durata: { durataStimata: null, confidence: 0 },
  confidenceGlobale: 0,
};

const SUGGERIMENTI_RICCHI = {
  checklist: [
    {
      nome: "Posa corrugati",
      confidence: 0.96,
      motivo: "Presente nel 96% dei lavori simili",
      origine: "experience",
    },
    {
      nome: "Verifica impianto",
      confidence: 0.55,
      motivo: "Presente nel 55% dei lavori simili",
      origine: "experience",
    },
  ],
  materiali: [
    {
      nome: "Cavo 3x2.5",
      confidence: 0.88,
      motivo: "Materiale utilizzato frequentemente",
      origine: "experience",
    },
    {
      nome: "Canalina",
      confidence: 0.4,
      motivo: "Materiale utilizzato frequentemente",
      origine: "experience",
    },
  ],
  durata: {
    durataStimata: 5.2,
    confidence: 0.81,
  },
  confidenceGlobale: 0.72,
};

function campiCardObbligatori(card) {
  expect(card).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      tipo: expect.any(String),
      titolo: expect.any(String),
      descrizione: expect.any(String),
      confidence: expect.any(Number),
      priorita: expect.stringMatching(/^(alta|media|bassa)$/),
      origine: expect.any(String),
      action: expect.stringMatching(/^(view|accept|dismiss)$/),
    })
  );

  expect(card.id).not.toBe("");
  expect(card.titolo).not.toBe("");
  expect(card.descrizione).not.toBe("");
  expect(Object.values(card).every((v) => v !== null)).toBe(true);
}

describe("assistantService", () => {
  describe("calcolaPriorita", () => {
    it("mappa le fasce di confidence", () => {
      expect(calcolaPriorita(0.91)).toBe("alta");
      expect(calcolaPriorita(0.9)).toBe("media");
      expect(calcolaPriorita(0.7)).toBe("media");
      expect(calcolaPriorita(0.69)).toBe("bassa");
      expect(calcolaPriorita(null)).toBe("bassa");
      expect(calcolaPriorita(NaN)).toBe("bassa");
    });
  });

  describe("nessun suggerimento", () => {
    it("restituisce payload vuoto ma valido", () => {
      const payload = getAssistant({ suggerimenti: SUGGERIMENTI_VUOTI });

      expect(payload.cards).toEqual([]);
      expect(payload.summary).toEqual({
        totaleSuggerimenti: 0,
        alta: 0,
        media: 0,
        bassa: 0,
      });
      expect(payload.versione).toBe(ASSISTANT_VERSIONE);
      expect(payload.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("pochi e molti suggerimenti", () => {
    it("trasforma i suggerimenti in card standard", () => {
      const payload = getAssistant({ suggerimenti: SUGGERIMENTI_RICCHI });

      expect(payload.cards.length).toBe(5);
      payload.cards.forEach(campiCardObbligatori);

      const checklist = payload.cards.find((c) => c.tipo === "checklist");
      expect(checklist.action).toBe(ASSISTANT_ACTIONS.accept);
      expect(checklist.origine).toBe("experience");

      const durata = payload.cards.find((c) => c.tipo === "durata");
      expect(durata.titolo).toContain("5.2");
      expect(durata.action).toBe(ASSISTANT_ACTIONS.view);
    });

    it("ordina per priorità e poi per confidence", () => {
      const payload = getAssistant({ suggerimenti: SUGGERIMENTI_RICCHI });
      const priorita = payload.cards.map((c) => c.priorita);

      expect(priorita[0]).toBe("alta");
      expect(priorita.includes("media")).toBe(true);
      expect(priorita[priorita.length - 1]).toBe("bassa");

      const medie = payload.cards.filter((c) => c.priorita === "media");
      expect(medie[0].confidence).toBeGreaterThanOrEqual(medie[1].confidence);
    });

    it("calcola lo summary correttamente", () => {
      const payload = getAssistant({ suggerimenti: SUGGERIMENTI_RICCHI });

      expect(payload.summary).toEqual({
        totaleSuggerimenti: 5,
        alta: 1,
        media: 2,
        bassa: 2,
      });
    });

    it("produce output stabile a parità di input (escluso generatedAt)", () => {
      const a = getAssistant({ suggerimenti: SUGGERIMENTI_RICCHI });
      const b = getAssistant({ suggerimenti: SUGGERIMENTI_RICCHI });

      expect(a.cards).toEqual(b.cards);
      expect(a.summary).toEqual(b.summary);
      expect(a.versione).toBe(b.versione);
    });
  });

  describe("contestualizzazioni", () => {
    it("dashboard mostra solo priorità alta e media", () => {
      const payload = getDashboardAssistant({
        suggerimenti: SUGGERIMENTI_RICCHI,
      });

      expect(payload.cards.every((c) => c.priorita !== "bassa")).toBe(true);
      expect(payload.summary.bassa).toBe(0);
      expect(payload.summary.totaleSuggerimenti).toBe(3);
    });

    it("preventivo include checklist, materiali e durata", () => {
      const payload = getPreventivoAssistant({
        suggerimenti: SUGGERIMENTI_RICCHI,
      });
      const tipi = new Set(payload.cards.map((c) => c.tipo));

      expect(tipi.has("checklist")).toBe(true);
      expect(tipi.has("materiale")).toBe(true);
      expect(tipi.has("durata")).toBe(true);
    });

    it("cantiere include checklist e materiali, non durata", () => {
      const payload = getCantiereAssistant({
        suggerimenti: SUGGERIMENTI_RICCHI,
      });
      const tipi = new Set(payload.cards.map((c) => c.tipo));

      expect(tipi.has("checklist")).toBe(true);
      expect(tipi.has("materiale")).toBe(true);
      expect(tipi.has("durata")).toBe(false);
      expect(payload.summary.totaleSuggerimenti).toBe(4);
    });

    it("cliente restituisce struttura vuota pronta per il futuro", () => {
      const payload = getClienteAssistant({
        suggerimenti: SUGGERIMENTI_RICCHI,
      });

      expect(payload.cards).toEqual([]);
      expect(payload.summary.totaleSuggerimenti).toBe(0);
      expect(payload.versione).toBe(ASSISTANT_VERSIONE);
      expect(payload.generatedAt).toBeTruthy();
    });
  });

  describe("integrazioni e robustezza", () => {
    it("delega al Suggestion Engine se non riceve suggerimenti", () => {
      const spy = vi
        .spyOn(suggestionService, "getSuggerimenti")
        .mockReturnValue(SUGGERIMENTI_RICCHI);

      const payload = getAssistant({ tipoLavoro: "impianto" });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ tipoLavoro: "impianto" })
      );
      expect(payload.cards.length).toBeGreaterThan(0);

      spy.mockRestore();
    });

    it("non emette mai valori null nelle card", () => {
      const payload = getAssistant({
        suggerimenti: {
          checklist: [
            {
              nome: null,
              confidence: null,
              motivo: null,
              origine: null,
            },
          ],
          materiali: [],
          durata: { durataStimata: 2, confidence: 0.2 },
          confidenceGlobale: 0,
        },
      });

      payload.cards.forEach(campiCardObbligatori);
    });

    it("ignora durata non disponibile", () => {
      const payload = getAssistant({
        suggerimenti: {
          ...SUGGERIMENTI_VUOTI,
          checklist: [
            {
              nome: "Solo checklist",
              confidence: 0.8,
              motivo: "Test",
              origine: "experience",
            },
          ],
        },
      });

      expect(payload.cards.every((c) => c.tipo !== "durata")).toBe(true);
      expect(payload.cards).toHaveLength(1);
    });
  });
});
