import { describe, expect, it } from "vitest";

import {
  aggiungiGiorni,
  aggregaMaterialiGiorno,
  cantiereAppartieneAlGiorno,
  creaInterventoAgenda,
  differenzaGiorni,
  etichettaGiornoNav,
  etichettaPreparazione,
  inizioGiornata,
  minutiOrario,
  preparaRiepilogoGiornoSuccessivo,
  selezionaInterventiGiorno,
  statoAgendaDaCantiere,
} from "./agendaSelectors";

const OGGI = new Date(2026, 6, 29);

function cantiere(overrides = {}) {
  return {
    id: "c1",
    nome: "Villa Rossi",
    cliente: "Rossi",
    indirizzo: "Via Roma 12",
    stato: "Da iniziare",
    orario: "08:00",
    dataIntervento: "29/07/2026",
    checklist: [
      { id: "1", testo: "Portare differenziale", completata: false },
      { id: "2", testo: "Foto quadro", completata: true },
    ],
    materiali: [
      { id: "m1", nome: "Cavo", quantita: 20, unita: "m", acquistato: true },
      { id: "m2", nome: "Differenziale", quantita: 2, unita: "cad", acquistato: false },
    ],
    preventivoOriginaleTotale: 500,
    incassato: 250,
    telefono: "3331234567",
    ...overrides,
  };
}

describe("agendaSelectors", () => {
  it("ordina gli interventi per orario cronologico", () => {
    const elenco = selezionaInterventiGiorno(
      [
        cantiere({ id: "c2", orario: "11:00", nome: "Condominio Verdi" }),
        cantiere({ id: "c1", orario: "08:00", nome: "Villa Rossi" }),
      ],
      OGGI,
      OGGI
    );

    expect(elenco.map((i) => i.orario)).toEqual(["08:00", "11:00"]);
  });

  it("filtra gli interventi per giorno selezionato", () => {
    const domani = aggiungiGiorni(OGGI, 1);
    const elencoOggi = selezionaInterventiGiorno(
      [cantiere(), cantiere({ id: "c2", dataIntervento: "30/07/2026" })],
      OGGI,
      OGGI
    );
    const elencoDomani = selezionaInterventiGiorno(
      [cantiere(), cantiere({ id: "c2", dataIntervento: "30/07/2026" })],
      domani,
      OGGI
    );

    expect(elencoOggi).toHaveLength(1);
    expect(elencoDomani).toHaveLength(1);
    expect(elencoDomani[0].id).toBe("c2");
  });

  it("mostra cantieri aperti senza data solo su oggi", () => {
    const senzaData = cantiere({ dataIntervento: null, stato: "In corso" });
    expect(cantiereAppartieneAlGiorno(senzaData, OGGI, OGGI)).toBe(true);
    expect(
      cantiereAppartieneAlGiorno(senzaData, aggiungiGiorni(OGGI, 1), OGGI)
    ).toBe(false);
  });

  it("aggrega materiali da portare e mancanti", () => {
    const interventi = selezionaInterventiGiorno(
      [
        cantiere(),
        cantiere({
          id: "c2",
          materiali: [
            { nome: "Cavo", quantita: 15, unita: "m", acquistato: true },
            { nome: "Magnetotermico", quantita: 6, unita: "cad", acquistato: true },
          ],
        }),
      ],
      OGGI,
      OGGI
    );

    const { daPortare, mancanti } = aggregaMaterialiGiorno(interventi);
    const cavo = daPortare.find((m) => m.nome === "Cavo");
    const diff = mancanti.find((m) => m.nome === "Differenziale");

    expect(cavo?.quantita).toBe(35);
    expect(diff?.quantita).toBe(2);
  });

  it("mappa gli stati cantiere in stati agenda", () => {
    expect(statoAgendaDaCantiere("Da iniziare")).toBe("programmato");
    expect(statoAgendaDaCantiere("In corso")).toBe("in-corso");
    expect(statoAgendaDaCantiere("Completato")).toBe("completato");
  });

  it("crea intervento con checklist, saldo e link rapido", () => {
    const intervento = creaInterventoAgenda(cantiere());

    expect(intervento.checklist).toEqual(["Portare differenziale"]);
    expect(intervento.saldo).toBe(250);
    expect(intervento.link).toBe("/cantiere/c1");
    expect(intervento.telefono).toBe("3331234567");
  });

  it("prepara il riepilogo del giorno successivo", () => {
    const riepilogo = preparaRiepilogoGiornoSuccessivo(
      [cantiere({ dataIntervento: "30/07/2026" })],
      OGGI,
      OGGI
    );

    expect(riepilogo.etichetta).toBe("Domani hai");
    expect(riepilogo.interventi).toBe(1);
    expect(riepilogo.materiali.daPortare.length).toBeGreaterThan(0);
  });

  it("etichette navigazione giorno", () => {
    expect(etichettaGiornoNav(OGGI, OGGI)).toBe("Oggi");
    expect(etichettaGiornoNav(aggiungiGiorni(OGGI, -1), OGGI)).toBe("Ieri");
    expect(etichettaGiornoNav(aggiungiGiorni(OGGI, 1), OGGI)).toBe("Domani");
    expect(etichettaPreparazione(OGGI, OGGI)).toBe("Domani hai");
  });

  it("converte orari in minuti per ordinamento", () => {
    expect(minutiOrario("08:00")).toBeLessThan(minutiOrario("11:30"));
    expect(differenzaGiorni(inizioGiornata(OGGI), OGGI)).toBe(0);
  });
});
