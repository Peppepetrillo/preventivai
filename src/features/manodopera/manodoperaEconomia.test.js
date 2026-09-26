import { describe, expect, it } from "vitest";

import { calcolaTotaleSpeseCantiere } from "../cantieri/services/speseCantiereService";
import { aggiungiGiornataManodopera } from "./giornateManodoperaService";
import { validaGiornataManodopera } from "./giornateManodoperaService";

/**
 * Critico: registrare una giornata (anche con costo) NON crea uscite.
 * Solo il pagamento reale (vedi manodoperaPagamentoEconomia.test.js) genera spesa.
 */
describe("manodopera vs economia (no double count on create)", () => {
  it("aggiungere giornata manodopera non cambia totale spese", () => {
    const cantiere = {
      id: "c1",
      spese: [
        {
          id: "s1",
          data: "20/09/2026",
          importo: 50,
          categoria: "materiali",
          descrizione: "cavo",
        },
      ],
      giornateManodopera: [],
    };

    const prima = calcolaTotaleSpeseCantiere(cantiere);
    expect(prima).toBe(50);

    const g = validaGiornataManodopera(
      {
        cantiereId: "c1",
        operaioId: "op-1",
        data: "21/09/2026",
        tipo: "giornata",
        costo: 120,
      },
      { id: "op-1", costoGiornata: 120 }
    ).giornata;

    const dopo = aggiungiGiornataManodopera(cantiere, g);
    expect(calcolaTotaleSpeseCantiere(dopo)).toBe(50);
    expect(dopo.spese).toHaveLength(1);
    expect(dopo.giornateManodopera).toHaveLength(1);
    expect(dopo.giornateManodopera[0].costo).toBe(120);
  });
});
