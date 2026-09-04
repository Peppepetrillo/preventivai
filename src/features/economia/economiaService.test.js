/**
 * Economia v0 — aggregazione attività.
 */

import { describe, expect, it } from "vitest";

import {
  aggregaEconomiaAttivita,
  calcolaDaIncassareEconomia,
  intervalloPeriodoEconomia,
  PERIODO_ECONOMIA,
  raccogliMovimentiCantiereEconomia,
  TIPO_MOVIMENTO_ECONOMIA
} from "./economiaService";
import { CATEGORIE_SPESA } from "../cantieri/services/speseCantiereService";

describe("economiaService v0", () => {
  const riferimento = new Date(2026, 8, 15); // 15 settembre 2026

  it("1. nessun cantiere → zeri", () => {
    const r = aggregaEconomiaAttivita([], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(r.entrate).toBe(0);
    expect(r.uscite).toBe(0);
    expect(r.saldo).toBe(0);
    expect(r.movimenti).toEqual([]);
  });

  it("2. un cantiere pagamento + spesa → saldo corretto", () => {
    const cantiere = {
      id: "c1",
      nome: "Appartamento Rossi",
      cliente: "Rossi",
      totaleLavoro: 5000,
      origine: "diretto",
      pagamenti: [
        { id: "p1", data: "10/09/2026", importo: 1000, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "08/09/2026",
          importo: 300,
          descrizione: "Materiale",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const r = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(r.entrate).toBe(1000);
    expect(r.uscite).toBe(300);
    expect(r.saldo).toBe(700);
  });

  it("3–4. filtro mese: esclude mesi diversi", () => {
    const cantiere = {
      id: "c1",
      totaleLavoro: 10000,
      origine: "diretto",
      pagamenti: [
        { id: "p1", data: "10/09/2026", importo: 1000, tipo: "acconto" },
        { id: "p2", data: "05/08/2026", importo: 500, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "01/08/2026",
          importo: 200,
          descrizione: "Vecchia",
          categoria: CATEGORIE_SPESA.altro,
        },
      ],
    };
    const settembre = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(settembre.entrate).toBe(1000);
    expect(settembre.uscite).toBe(0);

    const agosto = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.mese_scorso,
      riferimento,
    });
    expect(agosto.entrate).toBe(500);
    expect(agosto.uscite).toBe(200);
    expect(agosto.saldo).toBe(300);
  });

  it("5. daIncassare è stock e non modifica entrate", () => {
    const cantiere = {
      id: "c1",
      totaleLavoro: 5000,
      origine: "diretto",
      pagamenti: [
        { id: "p1", data: "10/09/2026", importo: 1000, tipo: "acconto" },
      ],
      spese: [],
    };
    const r = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(r.entrate).toBe(1000);
    expect(r.daIncassare).toBe(4000);
    expect(calcolaDaIncassareEconomia([cantiere])).toBe(4000);
  });

  it("6. preventivo.incassato non produce doppio conteggio", () => {
    const cantiere = {
      id: "c1",
      preventivoId: "prev1",
      totaleLavoro: 5000,
      // Campo ereditato/legacy — NON deve essere letto da Economia
      incassato: 9999,
      origine: "preventivo",
      pagamenti: [
        { id: "p1", data: "10/09/2026", importo: 800, tipo: "acconto" },
      ],
      spese: [],
    };
    const r = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(r.entrate).toBe(800);
    expect(r.entrate).not.toBe(9999);
  });

  it("7. listaSpesa non produce uscita", () => {
    const cantiere = {
      id: "c1",
      totaleLavoro: 1000,
      origine: "diretto",
      pagamenti: [],
      spese: [],
      listaSpesa: [{ id: "l1", importo: 500, nome: "Cavo" }],
    };
    const r = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(r.uscite).toBe(0);
  });

  it("8. materiali[].qty non produce uscita", () => {
    const cantiere = {
      id: "c1",
      totaleLavoro: 1000,
      origine: "diretto",
      pagamenti: [],
      spese: [],
      materiali: [{ id: "m1", nome: "Tubo", quantita: 10, prezzo: 50 }],
    };
    const r = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(r.uscite).toBe(0);
  });

  it("9. movimento senza data valida escluso (nessuna data inventata)", () => {
    // Data non italiana ma non vuota: passa normalizzazione, esclusa da Economia.
    // Record con data vuota falliscono normalizza* e non entrano affatto.
    const cantiere = {
      id: "c1",
      totaleLavoro: 1000,
      origine: "diretto",
      pagamenti: [
        { id: "p1", data: "invalid", importo: 100, tipo: "acconto" },
        { id: "p2", data: "10/09/2026", importo: 50, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "non-una-data",
          importo: 20,
          descrizione: "X",
          categoria: CATEGORIE_SPESA.altro,
        },
      ],
    };
    const r = aggregaEconomiaAttivita([cantiere], {
      periodo: PERIODO_ECONOMIA.questo_mese,
      riferimento,
    });
    expect(r.entrate).toBe(50);
    expect(r.uscite).toBe(0);
    expect(r.esclusiSenzaData).toBe(2);
  });

  it("10. movimento espone cantiereId corretto", () => {
    const mov = raccogliMovimentiCantiereEconomia({
      id: "c-xyz",
      nome: "Test",
      pagamenti: [
        { id: "p1", data: "10/09/2026", importo: 100, tipo: "acconto" },
      ],
      spese: [],
    });
    expect(mov[0].cantiereId).toBe("c-xyz");
    expect(mov[0].tipo).toBe(TIPO_MOVIMENTO_ECONOMIA.entrata);
  });

  it("11. ordine movimenti: più recente prima", () => {
    const r = aggregaEconomiaAttivita(
      [
        {
          id: "c1",
          totaleLavoro: 5000,
          origine: "diretto",
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 100, tipo: "acconto" },
            { id: "p2", data: "20/09/2026", importo: 200, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "10/09/2026",
              importo: 50,
              descrizione: "A",
              categoria: CATEGORIE_SPESA.altro,
            },
          ],
        },
      ],
      { periodo: PERIODO_ECONOMIA.questo_mese, riferimento }
    );
    expect(r.movimenti.map((m) => m.data)).toEqual([
      "20/09/2026",
      "10/09/2026",
      "01/09/2026",
    ]);
  });

  it("12. più cantieri: aggregazione corretta", () => {
    const r = aggregaEconomiaAttivita(
      [
        {
          id: "c1",
          totaleLavoro: 3000,
          origine: "diretto",
          pagamenti: [
            { id: "p1", data: "05/09/2026", importo: 1000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "06/09/2026",
              importo: 100,
              descrizione: "A",
              categoria: CATEGORIE_SPESA.altro,
            },
          ],
        },
        {
          id: "c2",
          totaleLavoro: 2000,
          origine: "diretto",
          pagamenti: [
            { id: "p2", data: "07/09/2026", importo: 400, tipo: "saldo" },
          ],
          spese: [
            {
              id: "s2",
              data: "08/09/2026",
              importo: 50,
              descrizione: "B",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        },
      ],
      { periodo: PERIODO_ECONOMIA.questo_mese, riferimento }
    );
    expect(r.entrate).toBe(1400);
    expect(r.uscite).toBe(150);
    expect(r.saldo).toBe(1250);
    expect(r.cantieriAnalizzati).toBe(2);
  });

  it("intervalloPeriodoEconomia: questo mese e mese scorso", () => {
    const questo = intervalloPeriodoEconomia(
      PERIODO_ECONOMIA.questo_mese,
      riferimento
    );
    const scorso = intervalloPeriodoEconomia(
      PERIODO_ECONOMIA.mese_scorso,
      riferimento
    );
    expect(questo.mese).toBe(8);
    expect(scorso.mese).toBe(7);
    expect(questo.inizio).toBeLessThan(questo.fine);
  });
});
