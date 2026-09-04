/**
 * Storico lavori — test aggregazione, ordinamento, insight.
 */

import { describe, expect, it } from "vitest";

import {
  aggregaStoricoLavori,
  AMBITO_STORICO,
  analizzaLavoroStorico,
  generaInsightStorico,
  isLavoroConcluso,
  ORDINAMENTO_STORICO,
  ordinaLavoriStorico,
  ricavaDateLavoroDaRegistro,
} from "./storicoLavoriService";
import { CATEGORIE_SPESA } from "../cantieri/services/speseCantiereService";

function cantiereBase(over = {}) {
  return {
    id: "c1",
    nome: "Impianto Rossi",
    cliente: "Rossi",
    stato: "Completato",
    totaleLavoro: 5000,
    origine: "diretto",
    pagamenti: [],
    spese: [],
    registroGiornate: [],
    ...over,
  };
}

describe("storicoLavoriService", () => {
  it("storico vuoto → zeri e nessun insight", () => {
    const r = aggregaStoricoLavori([], { ambito: AMBITO_STORICO.conclusi });
    expect(r.lavoriAnalizzati).toBe(0);
    expect(r.totaleGiornate).toBe(0);
    expect(r.totaleOre).toBe(0);
    expect(r.totaleEntrate).toBe(0);
    expect(r.totaleUscite).toBe(0);
    expect(r.saldoComplessivo).toBe(0);
    expect(r.lavori).toEqual([]);
    expect(r.insight).toEqual([]);
  });

  it("aggregazione giornate e ore", () => {
    const c = cantiereBase({
      registroGiornate: [
        {
          id: "r1",
          data: "01/09/2026",
          oreLavorate: 8,
          operai: ["A"],
          attivita: "Cavidotti",
        },
        {
          id: "r2",
          data: "02/09/2026",
          oreLavorate: 4,
          operai: ["A"],
          attivita: "Quadri",
        },
      ],
    });
    const a = analizzaLavoroStorico(c);
    expect(a.contaGiornate).toBe(2);
    expect(a.oreLavorate).toBe(12);
  });

  it("entrate da pagamenti, uscite da spese, saldo positivo", () => {
    const c = cantiereBase({
      pagamenti: [
        { id: "p1", data: "10/09/2026", importo: 1000, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "08/09/2026",
          importo: 300,
          descrizione: "Cavo",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    const a = analizzaLavoroStorico(c);
    expect(a.entrate).toBe(1000);
    expect(a.uscite).toBe(300);
    expect(a.saldo).toBe(700);
    expect(a.margine).toBe(700);
  });

  it("lavoro con saldo negativo", () => {
    const a = analizzaLavoroStorico(
      cantiereBase({
        pagamenti: [
          { id: "p1", data: "10/09/2026", importo: 100, tipo: "acconto" },
        ],
        spese: [
          {
            id: "s1",
            data: "08/09/2026",
            importo: 400,
            descrizione: "Extra",
            categoria: CATEGORIE_SPESA.altro,
          },
        ],
      })
    );
    expect(a.saldo).toBe(-300);
  });

  it("daIncassare è rimanenza e non somma alle entrate", () => {
    const c = cantiereBase({
      totaleLavoro: 5000,
      pagamenti: [
        { id: "p1", data: "10/09/2026", importo: 1000, tipo: "acconto" },
      ],
    });
    const a = analizzaLavoroStorico(c);
    expect(a.entrate).toBe(1000);
    expect(a.daIncassare).toBe(4000);
  });

  it("materiali categoria vs altre spese", () => {
    const c = cantiereBase({
      spese: [
        {
          id: "s1",
          data: "01/09/2026",
          importo: 200,
          descrizione: "Mat",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "02/09/2026",
          importo: 50,
          descrizione: "Benzina",
          categoria: CATEGORIE_SPESA.carburante,
        },
      ],
    });
    const a = analizzaLavoroStorico(c);
    expect(a.speseMateriali).toBe(200);
    expect(a.altreSpese).toBe(50);
    expect(a.uscite).toBe(250);
  });

  it("lavoro senza giornate → 0 giornate/ore", () => {
    const a = analizzaLavoroStorico(cantiereBase());
    expect(a.contaGiornate).toBe(0);
    expect(a.oreLavorate).toBe(0);
  });

  it("lavoro senza spese → uscite 0", () => {
    const a = analizzaLavoroStorico(
      cantiereBase({
        pagamenti: [
          { id: "p1", data: "10/09/2026", importo: 500, tipo: "acconto" },
        ],
      })
    );
    expect(a.uscite).toBe(0);
    expect(a.saldo).toBe(500);
  });

  it("lavoro senza pagamenti → entrate 0", () => {
    const a = analizzaLavoroStorico(
      cantiereBase({
        spese: [
          {
            id: "s1",
            data: "01/09/2026",
            importo: 100,
            descrizione: "X",
            categoria: CATEGORIE_SPESA.altro,
          },
        ],
      })
    );
    expect(a.entrate).toBe(0);
    expect(a.uscite).toBe(100);
    expect(a.saldo).toBe(-100);
  });

  it("date mancanti/non valide → null, nessuna data inventata", () => {
    const date = ricavaDateLavoroDaRegistro(
      cantiereBase({
        creatoIl: "2026-01-01T00:00:00.000Z",
        aggiornatoIl: "2026-02-01T00:00:00.000Z",
        registroGiornate: [
          {
            id: "r1",
            data: "invalid",
            oreLavorate: 8,
            operai: [],
            attivita: "X",
          },
        ],
      })
    );
    expect(date.dataInizio).toBeNull();
    expect(date.dataFine).toBeNull();
  });

  it("lavori non conclusi esclusi dall'ambito conclusi", () => {
    const r = aggregaStoricoLavori(
      [
        cantiereBase({ id: "c1", stato: "Completato" }),
        cantiereBase({ id: "c2", stato: "In corso", nome: "Aperto" }),
      ],
      { ambito: AMBITO_STORICO.conclusi }
    );
    expect(r.lavoriAnalizzati).toBe(1);
    expect(isLavoroConcluso({ stato: "In corso" })).toBe(false);
  });

  it("ambito tutti include non conclusi", () => {
    const r = aggregaStoricoLavori(
      [
        cantiereBase({ id: "c1", stato: "Completato" }),
        cantiereBase({ id: "c2", stato: "In corso" }),
      ],
      { ambito: AMBITO_STORICO.tutti }
    );
    expect(r.lavoriAnalizzati).toBe(2);
  });

  it("ordinamento saldo alto / basso", () => {
    const lavori = [
      analizzaLavoroStorico(
        cantiereBase({
          id: "basso",
          nome: "Basso",
          pagamenti: [
            { id: "p1", data: "01/09/2026", importo: 100, tipo: "acconto" },
          ],
        })
      ),
      analizzaLavoroStorico(
        cantiereBase({
          id: "alto",
          nome: "Alto",
          pagamenti: [
            { id: "p2", data: "01/09/2026", importo: 900, tipo: "acconto" },
          ],
        })
      ),
    ];
    expect(
      ordinaLavoriStorico(lavori, ORDINAMENTO_STORICO.saldo_alto).map(
        (l) => l.cantiereId
      )
    ).toEqual(["alto", "basso"]);
    expect(
      ordinaLavoriStorico(lavori, ORDINAMENTO_STORICO.saldo_basso).map(
        (l) => l.cantiereId
      )
    ).toEqual(["basso", "alto"]);
  });

  it("ordinamento più giornate / ore / uscite", () => {
    const a = analizzaLavoroStorico(
      cantiereBase({
        id: "a",
        registroGiornate: [
          {
            id: "r1",
            data: "01/09/2026",
            oreLavorate: 2,
            operai: ["A"],
            attivita: "A",
          },
        ],
        spese: [
          {
            id: "s1",
            data: "01/09/2026",
            importo: 50,
            descrizione: "A",
            categoria: CATEGORIE_SPESA.altro,
          },
        ],
      })
    );
    const b = analizzaLavoroStorico(
      cantiereBase({
        id: "b",
        registroGiornate: [
          {
            id: "r2",
            data: "02/09/2026",
            oreLavorate: 8,
            operai: ["A"],
            attivita: "B",
          },
          {
            id: "r3",
            data: "03/09/2026",
            oreLavorate: 8,
            operai: ["A"],
            attivita: "C",
          },
        ],
        spese: [
          {
            id: "s2",
            data: "02/09/2026",
            importo: 400,
            descrizione: "B",
            categoria: CATEGORIE_SPESA.materiali,
          },
        ],
      })
    );
    expect(
      ordinaLavoriStorico([a, b], ORDINAMENTO_STORICO.piu_giornate)[0]
        .cantiereId
    ).toBe("b");
    expect(
      ordinaLavoriStorico([a, b], ORDINAMENTO_STORICO.piu_ore)[0].cantiereId
    ).toBe("b");
    expect(
      ordinaLavoriStorico([a, b], ORDINAMENTO_STORICO.maggiori_uscite)[0]
        .cantiereId
    ).toBe("b");
  });

  it("ordinamento recenti usa dataFine registro; senza data in coda", () => {
    const conData = analizzaLavoroStorico(
      cantiereBase({
        id: "con-data",
        registroGiornate: [
          {
            id: "r1",
            data: "10/09/2026",
            oreLavorate: 8,
            operai: ["A"],
            attivita: "A",
          },
        ],
      })
    );
    const senzaData = analizzaLavoroStorico(
      cantiereBase({ id: "senza-data", registroGiornate: [] })
    );
    const ordinati = ordinaLavoriStorico(
      [senzaData, conData],
      ORDINAMENTO_STORICO.recenti
    );
    expect(ordinati.map((l) => l.cantiereId)).toEqual([
      "con-data",
      "senza-data",
    ]);
  });

  it("insight con dati sufficienti (≥2 lavori)", () => {
    const r = aggregaStoricoLavori(
      [
        cantiereBase({
          id: "c1",
          nome: "Alfa",
          registroGiornate: [
            {
              id: "r1",
              data: "01/09/2026",
              oreLavorate: 8,
              operai: ["A"],
              attivita: "A",
            },
            {
              id: "r2",
              data: "02/09/2026",
              oreLavorate: 8,
              operai: ["A"],
              attivita: "B",
            },
          ],
          pagamenti: [
            { id: "p1", data: "03/09/2026", importo: 2000, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s1",
              data: "01/09/2026",
              importo: 100,
              descrizione: "M",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }),
        cantiereBase({
          id: "c2",
          nome: "Beta",
          registroGiornate: [
            {
              id: "r3",
              data: "05/09/2026",
              oreLavorate: 4,
              operai: ["A"],
              attivita: "C",
            },
          ],
          pagamenti: [
            { id: "p2", data: "06/09/2026", importo: 500, tipo: "acconto" },
          ],
          spese: [
            {
              id: "s2",
              data: "05/09/2026",
              importo: 400,
              descrizione: "M2",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }),
      ],
      { ambito: AMBITO_STORICO.conclusi }
    );
    const ids = r.insight.map((i) => i.id);
    expect(ids).toContain("giornate-totali");
    expect(ids).toContain("uscite-materiali");
    expect(ids).toContain("max-uscite");
    expect(ids).toContain("max-giornate");
    // max-saldo può essere tagliato dal limite 4 insight
    expect(r.insight.find((i) => i.id === "max-uscite").testo).toContain("Beta");
    expect(r.insight.length).toBeLessThanOrEqual(4);
  });

  it("nessun insight estremo con un solo lavoro (solo giornate se presenti)", () => {
    const r = aggregaStoricoLavori(
      [
        cantiereBase({
          id: "solo",
          registroGiornate: [
            {
              id: "r1",
              data: "01/09/2026",
              oreLavorate: 8,
              operai: ["A"],
              attivita: "A",
            },
          ],
        }),
      ],
      { ambito: AMBITO_STORICO.conclusi }
    );
    expect(r.insight.map((i) => i.id)).toEqual(["giornate-totali"]);
  });

  it("generaInsightStorico senza lavori → []", () => {
    expect(generaInsightStorico({ lavori: [] })).toEqual([]);
  });

  it("anti-doppio: preventivo.incassato e totale contratto NON sono entrate", () => {
    const a = analizzaLavoroStorico(
      cantiereBase({
        totaleLavoro: 9999,
        incassato: 9999,
        preventivoImporto: 9999,
        pagamenti: [
          { id: "p1", data: "10/09/2026", importo: 100, tipo: "acconto" },
        ],
      })
    );
    expect(a.entrate).toBe(100);
  });

  it("listaSpesa e materiali qty NON sono uscite; giornate NON generano costi", () => {
    const a = analizzaLavoroStorico(
      cantiereBase({
        listaSpesa: [{ id: "l1", importo: 500 }],
        materiali: [{ id: "m1", quantita: 10, prezzo: 50 }],
        registroGiornate: [
          {
            id: "r1",
            data: "01/09/2026",
            oreLavorate: 40,
            operai: ["A", "B"],
            attivita: "Tutto",
          },
        ],
        spese: [],
      })
    );
    expect(a.uscite).toBe(0);
    expect(a.contaGiornate).toBe(1);
  });

  it("cantiereId corretto sull'analisi", () => {
    const a = analizzaLavoroStorico(cantiereBase({ id: "c-xyz" }));
    expect(a.cantiereId).toBe("c-xyz");
  });
});
