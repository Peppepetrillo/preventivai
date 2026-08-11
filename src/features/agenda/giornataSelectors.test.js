import { describe, expect, it } from "vitest";

import { preparaRiepilogoGiornata } from "./giornataSelectors";

const OGGI = new Date(2026, 6, 29);

function cantiere(overrides = {}) {
  return {
    id: "c1",
    nome: "Villa Rossi",
    cliente: "Rossi",
    indirizzo: "Via Roma 12",
    stato: "In corso",
    orario: "08:00",
    dataIntervento: "29/07/2026",
    durataStimata: 60,
    tipoLavoro: "intervento",
    checklist: [{ id: "1", testo: "Portare differenziale", completata: false }],
    materiali: [
      { id: "m1", nome: "Cavo", quantita: 20, unita: "m", acquistato: true },
      { id: "m2", nome: "Differenziale", quantita: 2, unita: "cad", acquistato: false },
    ],
    preventivoOriginaleTotale: 500,
    incassato: 200,
    ...overrides,
  };
}

describe("giornataSelectors", () => {
  it("prepara il riepilogo giornata con lavori, materiali e pagamenti", () => {
    const riepilogo = preparaRiepilogoGiornata([cantiere()], OGGI);

    expect(riepilogo.totaleLavori).toBe(1);
    expect(riepilogo.orePreviste.minuti).toBe(60);
    expect(riepilogo.materialiDaPortare).toHaveLength(1);
    expect(riepilogo.materialiDaComprare).toHaveLength(1);
    expect(riepilogo.pagamentiPrevisti[0].importo).toBe(300);
    expect(riepilogo.lavoriUrgenti).toHaveLength(1);
    expect(riepilogo.haContenuto).toBe(true);
  });

  it("restituisce giornata vuota senza lavori", () => {
    const riepilogo = preparaRiepilogoGiornata([], OGGI);
    expect(riepilogo.totaleLavori).toBe(0);
    expect(riepilogo.haContenuto).toBe(false);
  });

  it("include attività e telefonate nel riepilogo", () => {
    const riepilogo = preparaRiepilogoGiornata([cantiere()], OGGI, {
      attivita: [
        {
          id: "a1",
          titolo: "Chiama grossista",
          categoria: "telefonata",
          priorita: "alta",
          stato: "da-fare",
          data: "29/07/2026",
          ora: "07:30",
        },
      ],
      listaSpesa: [
        { id: "s1", nome: "Tubo 25", quantita: 5, unita: "m", acquistato: false },
      ],
    });

    expect(riepilogo.totaleAttivita).toBe(1);
    expect(riepilogo.telefonate).toHaveLength(1);
    expect(riepilogo.materialiDaComprare.map((m) => m.nome)).toEqual(
      expect.arrayContaining(["Differenziale", "Tubo 25"])
    );
    expect(riepilogo.urgenze.length).toBeGreaterThanOrEqual(1);
  });

  it("non conta due volte materiali già presenti sul cantiere del giorno", () => {
    const riepilogo = preparaRiepilogoGiornata([cantiere()], OGGI, {
      listaSpesa: [
        {
          id: "s1",
          nome: "Differenziale",
          quantita: 2,
          unita: "cad",
          acquistato: false,
          lavoroId: "c1",
          distintaVoceId: "dv-diff",
        },
      ],
    });

    const diff = riepilogo.materialiDaComprare.find(
      (m) => m.nome === "Differenziale"
    );
    expect(diff).toBeTruthy();
    expect(diff.quantita).toBe(2);
  });
});
