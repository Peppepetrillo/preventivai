import { describe, expect, it } from "vitest";
import {
  calcolaDaIncassare,
  normalizzaPreventivoIncasso,
  registraIncasso,
  riepilogaIncassi,
  segnaPreventivoSaldato,
  STATI_INCASSO,
} from "./incassiDomain";

describe("incassiDomain", () => {
  it("usa l'acconto come incassato quando il campo non esiste", () => {
    const preventivo = normalizzaPreventivoIncasso({
      totale: 1000,
      acconto: 250,
    });

    expect(preventivo.incassato).toBe(250);
    expect(preventivo.statoIncasso).toBe(STATI_INCASSO.parziale);
    expect(calcolaDaIncassare(preventivo)).toBe(750);
  });

  it("registra un incasso senza superare il totale", () => {
    const preventivo = registraIncasso(
      {
        totale: 500,
        incassato: 300,
      },
      400
    );

    expect(preventivo.incassato).toBe(500);
    expect(preventivo.statoIncasso).toBe(STATI_INCASSO.saldato);
  });

  it("segna un preventivo come saldato", () => {
    const preventivo = segnaPreventivoSaldato({
      totale: 800,
      incassato: 100,
    });

    expect(preventivo.incassato).toBe(800);
    expect(preventivo.statoIncasso).toBe(STATI_INCASSO.saldato);
  });

  it("calcola il riepilogo incassi", () => {
    expect(
      riepilogaIncassi([
        { totale: 1000, acconto: 200 },
        { totale: 500, incassato: 500 },
      ])
    ).toEqual({
      daIncassare: 800,
      incassato: 700,
      saldati: 1,
    });
  });
});
