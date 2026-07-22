import { describe, expect, it } from "vitest";
import {
  deveApplicareAggiornamentoCloud,
  deveRispingereLocaleVersoCloud,
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

  describe("deveRispingereLocaleVersoCloud", () => {
    it("rispinge se locale più recente e non in coda", () => {
      expect(
        deveRispingereLocaleVersoCloud({
          chiaveInCoda: false,
          updatedAtCloud: "2026-07-22T10:00:00.000Z",
          updatedAtLocale: "2026-07-22T12:00:00.000Z",
          haValoreLocale: true,
        })
      ).toBe(true);
    });

    it("non rispinge se in coda o senza valore locale", () => {
      expect(
        deveRispingereLocaleVersoCloud({
          chiaveInCoda: true,
          updatedAtCloud: "2026-07-22T10:00:00.000Z",
          updatedAtLocale: "2026-07-22T12:00:00.000Z",
          haValoreLocale: true,
        })
      ).toBe(false);

      expect(
        deveRispingereLocaleVersoCloud({
          chiaveInCoda: false,
          updatedAtCloud: "2026-07-22T10:00:00.000Z",
          updatedAtLocale: "2026-07-22T12:00:00.000Z",
          haValoreLocale: false,
        })
      ).toBe(false);
    });
  });
});
