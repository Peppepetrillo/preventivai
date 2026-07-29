import { describe, expect, it } from "vitest";
import {
  creaFraseGiornata,
  creaMessaggioOperativo,
  formattaDataGiornata,
  nomeSalutoDaAzienda,
  preparaCantieriOperativi,
  selezionaAttenzioni,
  selezionaContinuaDoveHaiLasciato,
  selezionaInterventiOggi,
  selezionaPreventiviInAttesa,
} from "./dashboardSelectors";

describe("dashboardSelectors", () => {
  it("prepara solo i cantieri aperti con avanzamento checklist", () => {
    const cantieri = [
      {
        id: 1,
        stato: "In corso",
        checklist: [{ completata: true }, { completata: false }],
      },
      {
        id: 2,
        stato: "Completato",
        checklist: [{ completata: true }],
      },
    ];

    expect(preparaCantieriOperativi(cantieri)).toEqual([
      expect.objectContaining({
        id: 1,
        avanzamento: 50,
      }),
    ]);
  });

  it("seleziona i preventivi inviati come preventivi in attesa", () => {
    const preventivi = [
      { id: 1, stato: "Inviato" },
      { id: 2, stato: "Accettato" },
    ];

    expect(selezionaPreventiviInAttesa(preventivi)).toEqual([
      { id: 1, stato: "Inviato" },
    ]);
  });

  it("crea un messaggio operativo leggibile", () => {
    expect(
      creaMessaggioOperativo({
        nome: "Giuseppe",
        cantieriAperti: 2,
        preventiviInAttesa: 1,
      })
    ).toBe(
      "Buongiorno Giuseppe. Hai 2 cantieri aperti e 1 preventivo in attesa."
    );
  });

  it("estrae il nome breve per il saluto", () => {
    expect(nomeSalutoDaAzienda({ nomeDitta: "Giuseppe Petrillo Impianti" })).toBe(
      "Giuseppe"
    );
    expect(nomeSalutoDaAzienda({})).toBe("");
  });

  it("formatta la data giornata in italiano", () => {
    expect(formattaDataGiornata(new Date(2026, 6, 28))).toMatch(/28/);
    expect(formattaDataGiornata(new Date(2026, 6, 28))).toMatch(/luglio/i);
  });

  it("seleziona gli interventi di oggi con orario se presente", () => {
    const oggi = new Date();
    const dataOggi = oggi.toLocaleDateString("it-IT");
    const interventi = selezionaInterventiOggi([
      {
        id: "a",
        stato: "In corso",
        cliente: "Rossi",
        indirizzo: "Via Roma 1",
        orario: "09:00",
        dataIntervento: dataOggi,
      },
      { id: "b", stato: "Completato", cliente: "Verdi" },
      {
        id: "c",
        stato: "Da iniziare",
        cliente: "Bianchi",
        indirizzo: "Via 2",
        dataIntervento: dataOggi,
      },
    ]);

    expect(interventi).toHaveLength(2);
    expect(interventi[0]).toEqual(
      expect.objectContaining({
        cliente: "Rossi",
        orario: "09:00",
        link: "/cantiere/a",
      })
    );
  });

  it("limita le attenzioni a 3 elementi prioritari", () => {
    const attenzioni = selezionaAttenzioni({
      cantieri: [
        {
          id: "c1",
          stato: "In corso",
          materiali: [{ id: "m1", nome: "Tubo", acquistato: false }],
          preventivoOriginaleTotale: 1000,
          incassato: 100,
        },
        { id: "c2", stato: "Da iniziare" },
      ],
      preventivi: [
        { id: "p1", stato: "Bozza" },
        { id: "p2", stato: "Bozza" },
      ],
      massimo: 3,
    });

    expect(attenzioni).toHaveLength(3);
    expect(attenzioni.map((a) => a.id)).toEqual([
      "materiale",
      "preventivi-inviare",
      "pagamenti",
    ]);
  });

  it("crea la frase giornata con priorità interventi", () => {
    expect(
      creaFraseGiornata({
        interventiOggi: 3,
        preventiviInAttesa: 2,
        haSaldoDaIncassare: true,
      })
    ).toBe("Hai 3 interventi oggi.");

    expect(
      creaFraseGiornata({
        interventiOggi: 0,
        preventiviInAttesa: 0,
        haSaldoDaIncassare: false,
      })
    ).toBe("Giornata libera.");
  });

  it("seleziona l'ultimo lavoro per continuare", () => {
    const continua = selezionaContinuaDoveHaiLasciato({
      cantieri: [
        {
          id: "c-old",
          cliente: "Vecchio",
          aggiornatoIl: "01/07/2026",
        },
      ],
      preventivi: [
        {
          id: "p-new",
          cliente: "Nuovo",
          numero: "PREV-9",
          aggiornatoIl: "28/07/2026",
        },
      ],
    });

    expect(continua).toEqual(
      expect.objectContaining({
        tipo: "preventivo",
        titolo: "Nuovo",
        link: "/preventivo/p-new",
      })
    );
  });
});
