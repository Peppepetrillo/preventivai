/**
 * Quality Check Engine — test unitari.
 */

import { describe, expect, it } from "vitest";
import {
  QC_SOGLIA_CIRCUITI_ELEVATI,
  QC_TYPE,
  contaRegoleAttive,
  generateQualityChecks,
  leggiRegoleQualityCheck,
} from "./index";

function preventivoBase(over = {}) {
  return {
    id: 1,
    numero: "PREV-1",
    cliente: "Rossi Mario",
    lavorazioni: [
      {
        id: "lav-1",
        catalogoId: "PUNTO_IMPIANTO",
        nome: "Punto impianto",
        quantita: 10,
        prezzo: 40,
      },
    ],
    ...over,
  };
}

describe("Quality Check Engine", () => {
  it("espone regole via repository senza logica", () => {
    const regole = leggiRegoleQualityCheck();
    expect(regole.length).toBeGreaterThanOrEqual(7);
    expect(contaRegoleAttive()).toBe(regole.filter((r) => r.enabled !== false).length);
  });

  it("preventivo corretto: score alto senza errori", () => {
    const report = generateQualityChecks(preventivoBase());
    expect(report.errors).toEqual([]);
    expect(report.score).toBe(100);
    expect(report.warnings).toEqual([]);
    expect(report.infos).toEqual([]);
  });

  it("preventivo vuoto → ERROR", () => {
    const report = generateQualityChecks(
      preventivoBase({ lavorazioni: [] })
    );
    expect(report.errors.some((e) => e.id === "CHECK_EMPTY_001")).toBe(true);
    expect(report.errors[0].type).toBe(QC_TYPE.ERROR);
    expect(report.errors[0].autoFix).toBe(false);
    expect(report.score).toBeLessThanOrEqual(75);
  });

  it("cliente mancante → ERROR", () => {
    const report = generateQualityChecks(
      preventivoBase({ cliente: "" })
    );
    expect(report.errors.some((e) => e.id === "CHECK_CLIENTE_001")).toBe(true);

    const placeholder = generateQualityChecks(
      preventivoBase({ cliente: "Da completare" })
    );
    expect(
      placeholder.errors.some((e) => e.id === "CHECK_CLIENTE_001")
    ).toBe(true);
  });

  it("climatizzazione → WARNING predisposizioni", () => {
    const report = generateQualityChecks(
      preventivoBase({
        lavorazioni: [
          { catalogoId: "CLIMA", nome: "Predisposizione clima", quantita: 2, prezzo: 50 },
        ],
      })
    );
    const w = report.warnings.find((x) => x.id === "CHECK_CLIMA_001");
    expect(w).toMatchObject({
      type: QC_TYPE.WARNING,
      relatedItem: "CLIMA",
      source: "Base Tecnica",
      autoFix: false,
    });
    expect(w.message).toMatch(/predisposizioni/i);
  });

  it("fotovoltaico → WARNING accumulo", () => {
    const report = generateQualityChecks(
      preventivoBase({
        lavorazioni: [
          { catalogoId: "FOTOVOLTAICO", nome: "FV", quantita: 1, prezzo: 0 },
        ],
      })
    );
    expect(report.warnings.some((w) => w.id === "CHECK_FV_001")).toBe(true);
    expect(
      report.warnings.find((w) => w.id === "CHECK_FV_001").message
    ).toMatch(/accumulo/i);
  });

  it("videocitofono → WARNING cancello automatico", () => {
    const report = generateQualityChecks(
      preventivoBase({
        lavorazioni: [
          {
            catalogoId: "VIDEOCITOFONO",
            nome: "Videocitofono",
            quantita: 1,
            prezzo: 180,
          },
        ],
      })
    );
    const w = report.warnings.find((x) => x.id === "CHECK_VIDEOCITOFONO_001");
    expect(w).toBeTruthy();
    expect(w.message).toMatch(/cancello/i);
  });

  it("induzione → WARNING linea dedicata", () => {
    const report = generateQualityChecks(
      preventivoBase({
        lavorazioni: [
          {
            catalogoId: "LINEA_INDUZIONE",
            nome: "Linea induzione",
            quantita: 1,
            prezzo: 120,
          },
        ],
      })
    );
    const w = report.warnings.find((x) => x.id === "CHECK_INDUZIONE_001");
    expect(w).toBeTruthy();
    expect(w.relatedItem).toBe("LINEA_INDUZIONE");
    expect(w.message).toMatch(/linea dedicata/i);
  });

  it("circuiti elevati → INFO quadro", () => {
    const report = generateQualityChecks(
      preventivoBase({
        lavorazioni: [
          {
            catalogoId: "PUNTO_IMPIANTO",
            nome: "Punti",
            quantita: QC_SOGLIA_CIRCUITI_ELEVATI,
            prezzo: 40,
          },
        ],
      })
    );
    expect(report.infos.some((i) => i.id === "CHECK_QUADRO_001")).toBe(true);
    expect(report.score).toBe(100); // INFO non penalizza
  });

  it("calcola score corretto con ERROR e WARNING", () => {
    const report = generateQualityChecks({
      cliente: "",
      lavorazioni: [
        { catalogoId: "CLIMA", nome: "Clima", quantita: 1, prezzo: 50 },
        { catalogoId: "FOTOVOLTAICO", nome: "FV", quantita: 1, prezzo: 0 },
      ],
    });
    // ERROR cliente -25, WARNING clima -8, WARNING FV -8 → 59
    expect(report.errors).toHaveLength(1);
    expect(report.warnings.length).toBeGreaterThanOrEqual(2);
    expect(report.score).toBe(100 - 25 - 8 * report.warnings.length);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  it("score non scende sotto 0", () => {
    const report = generateQualityChecks({
      cliente: "",
      lavorazioni: [],
    });
    // empty ERROR + cliente ERROR = 50
    expect(report.errors.length).toBe(2);
    expect(report.score).toBe(50);
  });

  it("non modifica il preventivo originale", () => {
    const preventivo = preventivoBase({
      lavorazioni: [
        {
          catalogoId: "CLIMA",
          nome: "Clima",
          quantita: 3,
          prezzo: 50,
        },
      ],
    });
    const snapshot = JSON.stringify(preventivo);
    const report = generateQualityChecks(preventivo);

    expect(JSON.stringify(preventivo)).toBe(snapshot);
    expect(preventivo.lavorazioni[0].quantita).toBe(3);
    expect(preventivo.lavorazioni[0].prezzo).toBe(50);
    expect(report.warnings.length).toBe(1);
  });

  it("struttura item allineata allo standard", () => {
    const report = generateQualityChecks(
      preventivoBase({
        lavorazioni: [{ catalogoId: "CLIMA", nome: "Clima", quantita: 1 }],
      })
    );
    const item = report.warnings[0];
    expect(item).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        type: expect.stringMatching(/INFO|WARNING|ERROR/),
        severity: expect.stringMatching(/LOW|MEDIUM|HIGH/),
        title: expect.any(String),
        message: expect.any(String),
        relatedItem: expect.anything(),
        source: expect.any(String),
        autoFix: false,
      })
    );
  });
});
