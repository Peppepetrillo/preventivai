import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import { caricaCatalogoMateriali } from "../catalogoMateriali/materialiCatalogService";
import { caricaDistinteMateriali } from "../distinteMateriali/distintaMaterialiService";
import {
  aggregaVociAcquisto,
  chiaveAggregazioneAcquisto,
  raggruppaAcquistiPerLavoro,
  selezionaAcquistiAggregati,
  selezionaDaComprare,
  selezionaDaComprareOggi,
  selezionaDaComprarePerLavoro,
} from "./acquistiSelectors";
import {
  allineaAcquistatoDaMaterialeCantiere,
  chiaveUnitaAcquisto,
  creaVoceListaSpesa,
  rimuoviVoceListaPerMaterialeEliminato,
  sincronizzaMaterialiDaCantiere,
  trovaVoceListaCollegata,
  unitaAcquistoEquivalenti,
  unitaAcquistoInLettura,
  voceAncoraCollegataAllaSorgente,
} from "./listaSpesaDomain";
import {
  leggiDaComprare,
  leggiListaSpesa,
  sincronizzaAcquistatoMaterialeSuLista,
  sincronizzaEliminazioneMaterialeSuLista,
  sincronizzaListaSpesaDaCantiere,
  salvaListaSpesa,
} from "./listaSpesaRepository";

describe("listaSpesa Step 8.0 domain", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("accetta voce legacy senza ID catalogo/distinta", () => {
    const voce = creaVoceListaSpesa({
      nome: "Nastro",
      quantita: 2,
      unita: "cad",
      lavoroId: "c1",
    });
    expect(voce.famigliaId).toBeUndefined();
    expect(voce.varianteId).toBeUndefined();
    expect(voce.distintaVoceId).toBeUndefined();
    expect(voce.origine).toBeUndefined();
  });

  it("supporta campi origine / note / distintaId / cantiereMaterialeId / titoloLavoro", () => {
    const voce = creaVoceListaSpesa({
      nome: "Tubo",
      quantita: 10,
      unita: "m",
      lavoroId: "c1",
      origine: "distinta",
      note: "parete",
      distintaId: "d1",
      cantiereMaterialeId: "m1",
      titoloLavoro: "Villa Rossi",
    });
    expect(voce.origine).toBe("distinta");
    expect(voce.note).toBe("parete");
    expect(voce.distintaId).toBe("d1");
    expect(voce.cantiereMaterialeId).toBe("m1");
    expect(voce.titoloLavoro).toBe("Villa Rossi");
  });

  it("normalizza unità in lettura cad↔pz e mq↔m² senza migrare", () => {
    expect(unitaAcquistoEquivalenti("cad", "pz")).toBe(true);
    expect(unitaAcquistoEquivalenti("mq", "m²")).toBe(true);
    expect(unitaAcquistoInLettura("cad")).toBe("pz");
    expect(unitaAcquistoInLettura("mq")).toBe("m²");
    expect(chiaveUnitaAcquisto("cad")).toBe("pz");
    const voce = creaVoceListaSpesa({ nome: "X", unita: "cad" });
    expect(voce.unita).toBe("cad");
  });

  it("priorità match: cantiereMaterialeId → distintaVoceId → varianteId → nome+unità", () => {
    const elenco = [
      creaVoceListaSpesa({
        nome: "A",
        unita: "m",
        lavoroId: "c1",
        cantiereMaterialeId: "mat-1",
      }),
      creaVoceListaSpesa({
        nome: "B",
        unita: "m",
        lavoroId: "c1",
        distintaVoceId: "dv-1",
      }),
      creaVoceListaSpesa({
        nome: "C",
        unita: "m",
        lavoroId: "c1",
        varianteId: "var-1",
      }),
      creaVoceListaSpesa({
        nome: "Legacy",
        unita: "cad",
        lavoroId: "c1",
      }),
    ];

    expect(
      trovaVoceListaCollegata(elenco, { id: "mat-1", nome: "Altro" }, "c1")?.cantiereMaterialeId
    ).toBe("mat-1");
    expect(
      trovaVoceListaCollegata(
        elenco,
        { distintaVoceId: "dv-1", nome: "X" },
        "c1"
      )?.distintaVoceId
    ).toBe("dv-1");
    expect(
      trovaVoceListaCollegata(
        elenco,
        { varianteId: "var-1", nome: "X" },
        "c1"
      )?.varianteId
    ).toBe("var-1");
    expect(
      trovaVoceListaCollegata(
        elenco,
        { nome: "Legacy", unita: "pz" },
        "c1"
      )?.nome
    ).toBe("Legacy");
  });

  it("ancoraCollegata non è mai true di default", () => {
    const voce = creaVoceListaSpesa({
      nome: "Tubo",
      unita: "m",
      lavoroId: "c1",
      distintaVoceId: "dv-1",
    });
    expect(
      voceAncoraCollegataAllaSorgente(voce, {
        nome: "Tubo",
        unita: "m",
        distintaVoceId: "dv-ALTRO",
      })
    ).toBe(false);
    expect(
      voceAncoraCollegataAllaSorgente(voce, {
        nome: "Tubo",
        unita: "m",
        distintaVoceId: "dv-1",
      })
    ).toBe(true);
  });

  it("distingue lavori diversi", () => {
    let elenco = [];
    elenco = sincronizzaMaterialiDaCantiere(elenco, {
      id: "c1",
      cliente: "Rossi",
      materiali: [{ id: "m1", nome: "Cavo", quantita: 10, unita: "m" }],
    });
    elenco = sincronizzaMaterialiDaCantiere(elenco, {
      id: "c2",
      cliente: "Bianchi",
      materiali: [{ id: "m2", nome: "Cavo", quantita: 5, unita: "m" }],
    });
    expect(elenco).toHaveLength(2);
    expect(elenco.map((v) => v.lavoroId).sort()).toEqual(["c1", "c2"]);
  });

  it("sync acquistato cantiere → lista e non tocca Distinta/Catalogo", () => {
    localStorage.setItem(STORAGE_KEYS.catalogoMateriali, "[]");
    localStorage.setItem(STORAGE_KEYS.distinteMateriali, "[]");
    const catalogoPrima = JSON.stringify(caricaCatalogoMateriali());
    const distintePrima = JSON.stringify(caricaDistinteMateriali());

    sincronizzaListaSpesaDaCantiere({
      id: "c1",
      nome: "Lavoro",
      materiali: [
        {
          id: "m1",
          nome: "Tubo",
          quantita: 10,
          unita: "m",
          varianteId: "v1",
          acquistato: false,
        },
      ],
    });

    sincronizzaAcquistatoMaterialeSuLista(
      { id: "c1" },
      { id: "m1", nome: "Tubo", unita: "m", varianteId: "v1", acquistato: true }
    );
    expect(leggiDaComprare()).toHaveLength(0);
    expect(leggiListaSpesa()[0].acquistato).toBe(true);

    sincronizzaAcquistatoMaterialeSuLista(
      { id: "c1" },
      { id: "m1", nome: "Tubo", unita: "m", varianteId: "v1", acquistato: false }
    );
    expect(leggiDaComprare()).toHaveLength(1);

    expect(JSON.stringify(caricaCatalogoMateriali())).toBe(catalogoPrima);
    expect(JSON.stringify(caricaDistinteMateriali())).toBe(distintePrima);
  });

  it("elimina materiale: rimuove ghost se link certo, mantiene se acquistata", () => {
    const base = [
      creaVoceListaSpesa({
        nome: "A",
        lavoroId: "c1",
        cantiereMaterialeId: "m1",
        quantita: 1,
        unita: "pz",
      }),
      creaVoceListaSpesa({
        nome: "B",
        lavoroId: "c1",
        cantiereMaterialeId: "m2",
        quantita: 1,
        unita: "pz",
        acquistato: true,
      }),
    ];

    const dopoDelete = rimuoviVoceListaPerMaterialeEliminato(
      base,
      { id: "c1" },
      { id: "m1", nome: "A" }
    );
    expect(dopoDelete.map((v) => v.cantiereMaterialeId)).toEqual(["m2"]);

    const dopoAcquistata = rimuoviVoceListaPerMaterialeEliminato(
      base,
      { id: "c1" },
      { id: "m2", nome: "B" }
    );
    expect(dopoAcquistata).toHaveLength(2);
  });

  it("aggiorna quantità se collegata; rispetta modificatoManualmente", () => {
    let elenco = sincronizzaMaterialiDaCantiere([], {
      id: "c1",
      materiali: [
        {
          id: "m1",
          nome: "Cavo",
          quantita: 10,
          unita: "m",
          distintaVoceId: "dv-1",
        },
      ],
    });
    expect(elenco[0].quantita).toBe(10);

    elenco = sincronizzaMaterialiDaCantiere(elenco, {
      id: "c1",
      materiali: [
        {
          id: "m1",
          nome: "Cavo",
          quantita: 40,
          unita: "m",
          distintaVoceId: "dv-1",
        },
      ],
    });
    expect(elenco[0].quantita).toBe(40);

    elenco[0] = { ...elenco[0], modificatoManualmente: true, quantita: 7 };
    elenco = sincronizzaMaterialiDaCantiere(elenco, {
      id: "c1",
      materiali: [
        {
          id: "m1",
          nome: "Cavo",
          quantita: 99,
          unita: "m",
          distintaVoceId: "dv-1",
        },
      ],
    });
    expect(elenco[0].quantita).toBe(7);
  });

  it("allineaAcquistato non crea voce se assente", () => {
    const elenco = allineaAcquistatoDaMaterialeCantiere(
      [],
      { id: "c1" },
      { id: "m9", nome: "X", acquistato: true }
    );
    expect(elenco).toEqual([]);
  });
});

describe("acquistiSelectors Step 8.1", () => {
  const voci = [
    creaVoceListaSpesa({
      nome: "Cavo Cat.6",
      quantita: 100,
      unita: "m",
      lavoroId: "c1",
      cliente: "Rossi",
      titoloLavoro: "Videosorveglianza",
      varianteId: "var-cat6",
    }),
    creaVoceListaSpesa({
      nome: "Cavo Cat.6",
      quantita: 50,
      unita: "m",
      lavoroId: "c2",
      cliente: "Bianchi",
      titoloLavoro: "Impianto",
      varianteId: "var-cat6",
    }),
    creaVoceListaSpesa({
      nome: "Cavo Cat.6",
      quantita: 10,
      unita: "pz",
      lavoroId: "c3",
      varianteId: "var-cat6",
    }),
    creaVoceListaSpesa({
      nome: "Nastro",
      quantita: 2,
      unita: "cad",
      lavoroId: "c1",
      cliente: "Rossi",
      titoloLavoro: "Videosorveglianza",
    }),
  ];

  it("aggrega per varianteId+unità e non mescola unità diverse", () => {
    const agg = aggregaVociAcquisto(voci);
    const cat6m = agg.find((a) => a.varianteId === "var-cat6" && a.unita === "m");
    expect(cat6m.quantitaTotale).toBe(150);
    expect(cat6m.voci).toHaveLength(2);
    expect(cat6m.idsVoci).toHaveLength(2);

    const cat6pz = agg.find(
      (a) => a.varianteId === "var-cat6" && chiaveUnitaAcquisto(a.unita) === "pz"
    );
    expect(cat6pz.quantitaTotale).toBe(10);
  });

  it("aggrega fallback nome+unità e preserva provenance", () => {
    const soloNome = [
      creaVoceListaSpesa({
        nome: "Vite 6mm",
        quantita: 20,
        unita: "pz",
        lavoroId: "a",
        cliente: "A",
      }),
      creaVoceListaSpesa({
        nome: "Vite 6mm",
        quantita: 5,
        unita: "cad",
        lavoroId: "b",
        cliente: "B",
      }),
    ];
    const agg = selezionaAcquistiAggregati(soloNome);
    expect(agg).toHaveLength(1);
    expect(agg[0].quantitaTotale).toBe(25);
    expect(agg[0].voci.map((v) => v.cliente).sort()).toEqual(["A", "B"]);
  });

  it("raggruppa per lavoro", () => {
    const gruppi = raggruppaAcquistiPerLavoro(voci);
    const rossi = gruppi.find((g) => g.lavoroId === "c1");
    expect(rossi.cliente).toBe("Rossi");
    expect(rossi.voci.length).toBeGreaterThanOrEqual(2);
  });

  it("seleziona da comprare / per lavoro", () => {
    expect(selezionaDaComprare(voci).length).toBe(4);
    expect(selezionaDaComprarePerLavoro(voci, "c1")).toHaveLength(2);
  });

  it("selezionaDaComprareOggi senza doppio conteggio lista+cantiere", () => {
    const lista = [
      creaVoceListaSpesa({
        nome: "Differenziale",
        quantita: 2,
        unita: "cad",
        lavoroId: "c1",
        cantiereMaterialeId: "m2",
      }),
    ];
    const lavori = [
      {
        id: "c1",
        cantiere: {
          id: "c1",
          materiali: [
            {
              id: "m2",
              nome: "Differenziale",
              quantita: 2,
              unita: "cad",
              acquistato: false,
            },
            {
              id: "m3",
              nome: "Tubo 25",
              quantita: 5,
              unita: "m",
              acquistato: false,
            },
          ],
        },
      },
    ];
    const oggi = selezionaDaComprareOggi(lista, lavori);
    const diff = oggi.find((m) => m.nome === "Differenziale");
    expect(diff.quantita).toBe(2);
    expect(oggi.find((m) => m.nome === "Tubo 25")?.quantita).toBe(5);
  });

  it("chiave aggregazione distingue unità", () => {
    expect(
      chiaveAggregazioneAcquisto({
        nome: "X",
        varianteId: "v",
        unita: "m",
      })
    ).not.toBe(
      chiaveAggregazioneAcquisto({
        nome: "X",
        varianteId: "v",
        unita: "pz",
      })
    );
  });
});

describe("listaSpesa repository sync helpers", () => {
  beforeEach(() => localStorage.clear());

  it("sincronizzaEliminazioneMaterialeSuLista persiste policy", () => {
    salvaListaSpesa([
      creaVoceListaSpesa({
        nome: "X",
        lavoroId: "c1",
        cantiereMaterialeId: "m1",
        unita: "m",
      }),
    ]);
    sincronizzaEliminazioneMaterialeSuLista(
      { id: "c1" },
      { id: "m1", nome: "X", unita: "m" }
    );
    expect(leggiListaSpesa()).toHaveLength(0);
  });
});
