import { describe, expect, it } from "vitest";
import {
  deveApplicareAggiornamentoCloud,
  deveProteggereLocaleDaWipeCloud,
  normalizzaPayloadCloud,
  tempoDaIso,
} from "./cloudSyncIntegrity";

describe("cloudSyncIntegrity", () => {
  describe("tempoDaIso", () => {
    it("gestisce valori non validi", () => {
      expect(tempoDaIso(null)).toBe(0);
      expect(tempoDaIso("")).toBe(0);
      expect(tempoDaIso("non-una-data")).toBe(0);
    });
  });

  describe("deveApplicareAggiornamentoCloud", () => {
    it("non applica mai se la chiave è in coda offline", () => {
      expect(
        deveApplicareAggiornamentoCloud({
          chiaveInCoda: true,
          updatedAtCloud: "2026-07-22T12:00:00.000Z",
          updatedAtLocale: "2026-07-21T12:00:00.000Z",
        })
      ).toBe(false);
    });

    it("applica il cloud se non c'è revisione locale", () => {
      expect(
        deveApplicareAggiornamentoCloud({
          chiaveInCoda: false,
          updatedAtCloud: "2026-07-22T12:00:00.000Z",
          updatedAtLocale: null,
        })
      ).toBe(true);
    });

    it("non applica cloud senza timestamp se esiste revisione locale", () => {
      expect(
        deveApplicareAggiornamentoCloud({
          chiaveInCoda: false,
          updatedAtCloud: null,
          updatedAtLocale: "2026-07-22T12:00:00.000Z",
        })
      ).toBe(false);
    });

    it("applica solo se cloud >= locale", () => {
      expect(
        deveApplicareAggiornamentoCloud({
          chiaveInCoda: false,
          updatedAtCloud: "2026-07-22T12:00:00.000Z",
          updatedAtLocale: "2026-07-22T11:00:00.000Z",
        })
      ).toBe(true);

      expect(
        deveApplicareAggiornamentoCloud({
          chiaveInCoda: false,
          updatedAtCloud: "2026-07-22T12:00:00.000Z",
          updatedAtLocale: "2026-07-22T12:00:00.000Z",
        })
      ).toBe(true);

      expect(
        deveApplicareAggiornamentoCloud({
          chiaveInCoda: false,
          updatedAtCloud: "2026-07-22T10:00:00.000Z",
          updatedAtLocale: "2026-07-22T12:00:00.000Z",
        })
      ).toBe(false);
    });
  });

  describe("deveProteggereLocaleDaWipeCloud", () => {
    it("protegge array locale non vuoto da payload cloud vuoto/null", () => {
      expect(
        deveProteggereLocaleDaWipeCloud({
          haValoreLocale: true,
          payloadCloud: [],
          fallback: [],
        })
      ).toBe(true);
      expect(
        deveProteggereLocaleDaWipeCloud({
          haValoreLocale: true,
          payloadCloud: null,
          fallback: [],
        })
      ).toBe(true);
      expect(
        deveProteggereLocaleDaWipeCloud({
          haValoreLocale: true,
          payloadCloud: [{ id: 1 }],
          fallback: [],
        })
      ).toBe(false);
      expect(
        deveProteggereLocaleDaWipeCloud({
          haValoreLocale: false,
          payloadCloud: [],
          fallback: [],
        })
      ).toBe(false);
    });

    it("protegge oggetto locale non vuoto da cloud {}", () => {
      expect(
        deveProteggereLocaleDaWipeCloud({
          haValoreLocale: true,
          payloadCloud: {},
          fallback: {},
        })
      ).toBe(true);
      expect(
        deveProteggereLocaleDaWipeCloud({
          haValoreLocale: true,
          payloadCloud: { ragioneSociale: "X" },
          fallback: {},
        })
      ).toBe(false);
    });
  });

  describe("normalizzaPayloadCloud", () => {
    it("sostituisce payload di forma errata con il fallback", () => {
      expect(normalizzaPayloadCloud({}, [])).toEqual([]);
      expect(normalizzaPayloadCloud(null, [])).toEqual([]);
      expect(normalizzaPayloadCloud([{ id: 1 }], [])).toEqual([{ id: 1 }]);
      expect(normalizzaPayloadCloud([], { a: 1 })).toEqual({ a: 1 });
      expect(normalizzaPayloadCloud({ ragioneSociale: "X" }, {})).toEqual({
        ragioneSociale: "X",
      });
    });
  });
});
