import { describe, expect, it } from "vitest";

import {
  ORIGINE_CANTIERE,
  TIPI_INTERVENTO,
  calcolaSaldoCantiere,
  creaCantiere,
  creaCantiereDaPreventivo,
  isCantiereDiretto,
  leggiAccontoCantiere,
  leggiTotaleLavoroDiretto,
} from "./cantieriDomain";

describe("UX-6.5 lavoro diretto — dominio", () => {
  it("crea lavoro diretto con origine, tipo e descrizione", () => {
    const c = creaCantiere({
      nome: "Riparazione quadro",
      cliente: "Rossi",
      indirizzo: "Via Roma 1",
      tipoIntervento: "Riparazione",
      descrizioneIntervento: "Cambiato MT",
      totaleLavoro: 150,
    });

    expect(c.origine).toBe(ORIGINE_CANTIERE.DIRETTO);
    expect(isCantiereDiretto(c)).toBe(true);
    expect(c.tipoIntervento).toBe("Riparazione");
    expect(c.descrizioneIntervento).toBe("Cambiato MT");
    expect(c.totaleLavoro).toBe(150);
    expect(c.preventivoId).toBeUndefined();
    expect(c.incassato).toBe(0);
  });

  it("tipi intervento disponibili", () => {
    expect(TIPI_INTERVENTO).toContain("Riparazione");
    expect(TIPI_INTERVENTO).toContain("Manutenzione");
    expect(TIPI_INTERVENTO.length).toBeGreaterThanOrEqual(5);
  });

  it("calcola saldo e gestisce acconto superiore al totale", () => {
    let c = creaCantiere({
      nome: "Test",
      cliente: "A",
      indirizzo: "",
      totaleLavoro: 100,
    });
    c = {
      ...c,
      pagamenti: [
        {
          id: "p1",
          data: "25/08/2026",
          importo: 40,
          tipo: "acconto",
          metodo: "contanti",
        },
      ],
      incassato: 40,
    };
    expect(calcolaSaldoCantiere(c)).toBe(60);

    c = {
      ...c,
      pagamenti: [
        {
          id: "p1",
          data: "25/08/2026",
          importo: 150,
          tipo: "saldo",
          metodo: "contanti",
        },
      ],
      incassato: 150,
    };
    expect(calcolaSaldoCantiere(c)).toBe(0);

    c.totaleLavoro = -10;
    expect(leggiTotaleLavoroDiretto(c)).toBe(0);
  });

  it("legge acconto da pagamenti[] come source of truth", () => {
    expect(
      leggiAccontoCantiere({
        pagamenti: [{ id: "1", data: "01/01/2026", importo: 70, tipo: "acconto" }],
        incassato: 10,
      })
    ).toBe(70);
  });

  it("non tratta come diretto i cantieri legacy senza origine", () => {
    expect(isCantiereDiretto({ nome: "Vecchio" })).toBe(false);
    expect(isCantiereDiretto({ origine: "preventivo" })).toBe(false);
  });

  it("creaCantiereDaPreventivo resta invariato (origine preventivo)", () => {
    const c = creaCantiereDaPreventivo({
      id: 99,
      numero: "PREV-1",
      cliente: "Bianchi",
      totale: 500,
      lavorazioni: [{ nome: "Punto luce", prezzo: 50, quantita: 2 }],
    });
    expect(c.origine).toBe(ORIGINE_CANTIERE.PREVENTIVO);
    expect(c.preventivoId).toBe(99);
    expect(isCantiereDiretto(c)).toBe(false);
    expect(c.totaleLavoro).toBeUndefined();
  });

  it("legge acconto dalla catena legacy", () => {
    expect(leggiAccontoCantiere({ acconto: 25 })).toBe(25);
    expect(leggiAccontoCantiere({ incassato: 30 })).toBe(30);
    expect(leggiAccontoCantiere({ extra: { acconto: 10 } })).toBe(10);
  });
});
