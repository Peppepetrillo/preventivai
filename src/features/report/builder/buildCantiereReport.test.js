import { describe, expect, it, vi } from "vitest";

import { DIARIO_EVENT_TYPES } from "../../diario/events/constants";
import { CATEGORIE_SPESA } from "../../cantieri/services/speseCantiereService";
import { aggiungiGiornataProgrammata } from "../../cantieri/services/programmazioneCantiereService";
import { buildCantiereReport } from "./buildCantiereReport";

vi.mock("../../../domain/varianti", () => ({
  STATI_VARIANTE: {
    PROPOSTA: "proposta",
    APPROVATA: "approvata",
    ESEGUITA: "eseguita",
    ANNULLATA: "annullata",
  },
  STATI_VARIANTE_LABEL: {
    approvata: "Approvata",
    eseguita: "Eseguita",
  },
  calcolaTotaleCantiere: vi.fn(() => ({
    preventivoOriginale: 900,
    deltaVarianti: 120,
    totaleAggiornato: 1020,
    numeroVarianti: 1,
    varianti: [],
  })),
  ottieniVarianti: vi.fn(() => [
    {
      id: "v1",
      titolo: "Presa aggiuntiva",
      stato: "approvata",
      totale: 120,
    },
    {
      id: "v2",
      titolo: "Proposta scartata",
      stato: "proposta",
      totale: 50,
    },
  ]),
}));

const cantiere = {
  id: "c1",
  nome: "Villa Rossi",
  cliente: "Rossi",
  indirizzo: "Via Roma 12",
  stato: "Completato",
  preventivoNumero: "PREV-2026-0001",
  dataCreazione: "01/08/2026",
  aggiornatoIl: "10/08/2026",
  preventivoOriginaleTotale: 900,
  incassato: 300,
  lavorazioniOrigine: [{ id: "l1", nome: "Punto luce", quantita: 2, unita: "cad" }],
  materiali: [
    { id: "m1", nome: "Cavo", quantita: 20, unita: "m", acquistato: true },
    { id: "m2", nome: "Magnetotermico", quantita: 2, unita: "cad", acquistato: false },
  ],
  foto: [
    {
      id: "f1",
      nome: "Quadro elettrico",
      src: "data:image/png;base64,abc",
      miniatura: "data:image/png;base64,abc",
    },
  ],
  diario: [
    {
      id: "e1",
      type: DIARIO_EVENT_TYPES.CANTIERE_CREATO,
      icon: "🏗",
      title: "Cantiere creato",
      description: "Villa Rossi",
      timestamp: new Date(2026, 7, 1, 9, 0).getTime(),
      attachments: [],
      meta: {},
    },
    {
      id: "e2",
      type: DIARIO_EVENT_TYPES.FOTO,
      icon: "📷",
      title: "Foto aggiunta",
      description: "Quadro elettrico principale",
      timestamp: new Date(2026, 7, 1, 9, 12).getTime(),
      attachments: [
        {
          id: "a1",
          type: "image",
          src: "data:image/png;base64,abc",
          thumbnail: "data:image/png;base64,abc",
          alt: "Quadro elettrico principale",
        },
      ],
      meta: {},
    },
    {
      id: "e3",
      type: DIARIO_EVENT_TYPES.NOTA_MANUALE,
      icon: "📝",
      title: "Nota",
      description: "Cliente preferisce passare il corrugato nel controsoffitto.",
      timestamp: new Date(2026, 7, 1, 10, 4).getTime(),
      attachments: [],
      meta: {},
    },
    {
      id: "e4",
      type: DIARIO_EVENT_TYPES.PAGAMENTO,
      icon: "💰",
      title: "Pagamento",
      description: "Acconto ricevuto €300",
      timestamp: new Date(2026, 7, 1, 12, 10).getTime(),
      attachments: [],
      meta: { importoDelta: 300, totaleIncassato: 300 },
    },
    {
      id: "e5",
      type: DIARIO_EVENT_TYPES.CANTIERE_COMPLETATO,
      icon: "✅",
      title: "Cantiere completato",
      description: "Villa Rossi",
      timestamp: new Date(2026, 7, 10, 17, 0).getTime(),
      attachments: [],
      meta: {},
    },
  ],
};

describe("buildCantiereReport", () => {
  it("costruisce il report dal diario con ordine cronologico", () => {
    const report = buildCantiereReport({
      cantiere,
      datiAzienda: { nomeDitta: "Giuseppe Impianti", logo: "data:image/png;base64,logo" },
    });

    expect(report.copertina.cliente).toBe("Rossi");
    expect(report.copertina.numeroCantiere).toBe("PREV-2026-0001");
    expect(report.cronologia[0].titolo).toBe("Cantiere creato");
    expect(report.cronologia.at(-1).titolo).toBe("Cantiere completato");
    expect(report.cronologia[0].timestamp).toBeLessThan(report.cronologia[1].timestamp);
  });

  it("include foto, materiali, varianti, pagamenti e note manuali", () => {
    const report = buildCantiereReport({ cantiere });

    expect(report.fotografie).toHaveLength(1);
    expect(report.fotografie[0].didascalia).toContain("Quadro");
    expect(report.materiali).toHaveLength(2);
    expect(report.riepilogo.variantiApprovate).toHaveLength(1);
    expect(report.riepilogo.variantiApprovate[0].titolo).toBe("Presa aggiuntiva");
    expect(report.pagamenti.acconto).toBe(300);
    expect(report.pagamenti.totale).toBe(1020);
    expect(report.note).toEqual([
      "Cliente preferisce passare il corrugato nel controsoffitto.",
    ]);
  });

  it("per lavoro diretto espone descrizione e nasconde preventivo", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiere,
        origine: "diretto",
        tipoIntervento: "Riparazione",
        descrizioneIntervento: "Sostituito magnetotermico.",
        totaleLavoro: 180,
        preventivoNumero: "",
        lavorazioniOrigine: [],
      },
    });

    expect(report.lavoroDiretto).toBe(true);
    expect(report.copertina.titoloDocumento).toMatch(/Riepilogo intervento/i);
    expect(report.riepilogo.descrizioneIntervento).toContain("magnetotermico");
    expect(report.riepilogo.tipoIntervento).toBe("Riparazione");
    expect(report.riepilogo.lavorazioni).toEqual([]);
    expect(report.riepilogo.preventivoOrigine.numero).toBe("");
  });
});

describe("buildCantiereReport UX-PDF Spese v2", () => {
  const cantiereBase = {
    id: "c-spese",
    origine: "diretto",
    totaleLavoro: 10000,
    nome: "Villa Spese",
    cliente: "Bianchi",
    preventivoNumero: "PREV-2026-0099",
    incassato: 7000,
    pagamenti: [
      {
        id: "p1",
        data: "01/09/2026",
        importo: 7000,
        tipo: "acconto",
        metodo: "bonifico",
      },
    ],
    diario: [],
    materiali: [
      {
        id: "m1",
        nome: "Cavo 3x2,5",
        quantita: 3,
        unita: "m",
        acquistato: true,
      },
    ],
  };

  it("PDF senza spese — retrocompatibilità spese undefined", () => {
    const report = buildCantiereReport({ cantiere: cantiereBase });

    expect(report.spese.vuoto).toBe(true);
    expect(report.spese.elenco).toEqual([]);
    expect(report.spese.totale).toBe(0);
    expect(report.spese.totaleLabel).toMatch(/0/);
    expect(report.riepilogoEconomico.totaleSpese).toBe(0);
    expect(report.riepilogoEconomico.margineLordo).toBe(7000);
  });

  it("PDF con una spesa manuale", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 45,
            descrizione: "Carburante",
            categoria: CATEGORIE_SPESA.carburante,
            metodoPagamento: "carta",
          },
        ],
      },
    });

    expect(report.spese.elenco).toHaveLength(1);
    expect(report.spese.elenco[0].descrizione).toBe("Carburante");
    expect(report.spese.elenco[0].categoriaLabel).toBe("Carburante");
    expect(report.spese.elenco[0].metodoLabel).toBe("Carta");
    expect(report.spese.elenco[0].importoLabel).toMatch(/45/);
    expect(report.spese.totale).toBe(45);
    expect(report.riepilogoEconomico.margineLordo).toBe(6955);
  });

  it("PDF con più spese ordinate per data crescente", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        spese: [
          {
            id: "s3",
            data: "05/09/2026",
            importo: 500,
            descrizione: "Subappalto",
            categoria: CATEGORIE_SPESA.subappalto,
            fornitore: "Mario Rossi",
            metodoPagamento: "bonifico",
          },
          {
            id: "s1",
            data: "02/09/2026",
            importo: 68,
            descrizione: "Cavo 3x2,5",
            categoria: CATEGORIE_SPESA.materiali,
            fornitore: "Rossi Materiali",
            metodoPagamento: "carta",
          },
          {
            id: "s2",
            data: "03/09/2026",
            importo: 45,
            descrizione: "Carburante",
            categoria: CATEGORIE_SPESA.carburante,
            metodoPagamento: "carta",
          },
        ],
      },
    });

    expect(report.spese.elenco.map((s) => s.data)).toEqual([
      "02/09/2026",
      "03/09/2026",
      "05/09/2026",
    ]);
    expect(report.spese.totale).toBe(613);
    expect(report.spese.perCategoria).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ etichetta: "Materiali", importo: 68 }),
        expect.objectContaining({ etichetta: "Carburante", importo: 45 }),
        expect.objectContaining({ etichetta: "Subappalto", importo: 500 }),
      ])
    );
  });

  it("rimanenza non alterata dalle spese", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 2500,
            descrizione: "Materiali",
            categoria: CATEGORIE_SPESA.materiali,
          },
        ],
      },
    });

    expect(report.riepilogoEconomico.rimanenza).toBe(3000);
    expect(report.riepilogoEconomico.totaleSpese).toBe(2500);
    expect(report.riepilogoEconomico.margineLordo).toBe(4500);
    expect(report.pagamenti.rimanenza).toBe(3000);
  });

  it("pagamenti non conteggiati come spese", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 100,
            descrizione: "Viti",
            categoria: CATEGORIE_SPESA.materiali,
          },
        ],
      },
    });

    expect(report.spese.totale).toBe(100);
    expect(report.pagamenti.incassato).toBe(7000);
    expect(report.riepilogoEconomico.incassato).toBe(7000);
  });

  it("spesa derivata da materiale presente una sola volta", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 68,
            descrizione: "Cavo 3x2,5",
            categoria: CATEGORIE_SPESA.materiali,
            materialeId: "m1",
            listaSpesaId: "spesa-ls-1",
          },
        ],
      },
    });

    expect(report.spese.elenco).toHaveLength(1);
    expect(report.spese.elenco[0].materialeId).toBeUndefined();
    expect(report.spese.elenco[0].listaSpesaId).toBeUndefined();
    expect(report.spese.totale).toBe(68);
  });

  it("spesa con giornata associata visualizzata", () => {
    let c = aggiungiGiornataProgrammata(cantiereBase, {
      data: "05/09/2026",
      operai: 2,
      orePreviste: 8,
      attivita: "Giornata 2",
    });
    const giornataId = c.programmazione[0].id;

    const report = buildCantiereReport({
      cantiere: {
        ...c,
        spese: [
          {
            id: "s1",
            data: "05/09/2026",
            importo: 68,
            descrizione: "Cavo",
            categoria: CATEGORIE_SPESA.materiali,
            fornitore: "Rossi",
            metodoPagamento: "carta",
            giornataId,
          },
        ],
      },
    });

    expect(report.spese.elenco[0].giornataLabel).toBe("05/09/2026");
    expect(report.spese.elenco[0].giornataId).toBe(giornataId);
  });

  it("spesa senza giornata gestita", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 40,
            descrizione: "Parcheggio",
            categoria: CATEGORIE_SPESA.trasferta,
          },
        ],
      },
    });

    expect(report.spese.elenco[0].giornataLabel).toBe("");
    expect(report.spese.elenco[0].giornataId).toBe("");
  });

  it("formattazione euro e date coerente", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        incassato: 0,
        pagamenti: [],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 1250,
            descrizione: "Attrezzatura",
            categoria: CATEGORIE_SPESA.attrezzatura,
          },
        ],
      },
    });

    expect(report.spese.elenco[0].data).toBe("02/09/2026");
    expect(report.spese.elenco[0].importoLabel).toMatch(/1250/);
    expect(report.riepilogoEconomico.margineLordo).toBe(-1250);
    expect(report.riepilogoEconomico.margineLordoLabel).toMatch(/-/);
  });

  it("PDF redditività — percentuale margine e stato", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        pagamenti: [
          {
            id: "p1",
            data: "01/09/2026",
            importo: 7000,
            tipo: "acconto",
          },
        ],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 2500,
            descrizione: "Materiali",
            categoria: CATEGORIE_SPESA.materiali,
          },
        ],
      },
    });

    expect(report.riepilogoEconomico.percentualeMargine).toBeCloseTo(
      64.285714,
      4
    );
    expect(report.riepilogoEconomico.percentualeMargineLabel).toMatch(/64,3%/);
    expect(report.redditivita.statoRedditivita).toBe("positiva");
    expect(report.redditivita.statoLabel).toBe("Redditività positiva");
    expect(report.redditivita.margineLordo).toBe(4500);
    expect(report.controlloEconomico.statoControlloEconomico).toBe("positivo");
    expect(report.riepilogoEconomico.percentualeSpeseSuIncassato).toBeCloseTo(
      35.714285,
      4
    );
  });

  it("PDF redditività — percentuale non disponibile senza incassi", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        pagamenti: [],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 500,
            descrizione: "Materiali",
            categoria: CATEGORIE_SPESA.materiali,
          },
        ],
      },
    });

    expect(report.riepilogoEconomico.percentualeMargine).toBeNull();
    expect(report.riepilogoEconomico.percentualeMargineLabel).toBe(
      "Non disponibile"
    );
    expect(report.redditivita.statoRedditivita).toBe("negativa");
    expect(report.controlloEconomico.statoControlloEconomico).toBe(
      "non_disponibile"
    );
  });

  it("PDF controllo economico — materiali e incidenza", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        pagamenti: [
          {
            id: "p1",
            data: "01/09/2026",
            importo: 7000,
            tipo: "acconto",
          },
        ],
        materiali: [
          {
            id: "m1",
            nome: "Piastrelle",
            quantita: 10,
            unita: "mq",
            prezzoUnitario: 200,
          },
        ],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 2300,
            descrizione: "Piastrelle",
            categoria: CATEGORIE_SPESA.materiali,
            materialeId: "m1",
          },
        ],
      },
    });

    expect(report.riepilogoEconomico.totaleCantiere).toBe(10000);
    expect(report.riepilogoEconomico.incassato).toBe(7000);
    expect(report.riepilogoEconomico.rimanenza).toBe(3000);
    expect(report.riepilogoEconomico.totaleSpese).toBe(2300);
    expect(report.riepilogoEconomico.margineLordo).toBe(4700);
    expect(report.controlloEconomico.scostamentoMateriali).toBe(300);
    expect(report.controlloEconomico.messaggioScostamentoMateriali).toMatch(
      /sopra il previsto/
    );
  });

  it("PDF controllo gestionale — DTO e segnali", () => {
    const report = buildCantiereReport({
      cantiere: {
        ...cantiereBase,
        pagamenti: [
          { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
        ],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 2500,
            descrizione: "Materiali",
            categoria: CATEGORIE_SPESA.materiali,
          },
        ],
      },
    });

    expect(report.controlloGestionale.statoLabel).toBe("Situazione positiva");
    expect(report.controlloGestionale.percentualeIncasso).toBeCloseTo(70, 4);
    expect(report.controlloGestionale.incidenzaSpese).toBeCloseTo(35.714285, 4);
    expect(report.controlloGestionale.costiPrincipali).toHaveLength(1);
    expect(report.controlloGestionale.costiPrincipali[0].percentualeLabel).toMatch(
      /100,0%/
    );
  });

  it("PDF con molte spese espone elenco completo", () => {
    const spese = Array.from({ length: 25 }, (_, index) => ({
      id: `s${index}`,
      data: `${String((index % 28) + 1).padStart(2, "0")}/09/2026`,
      importo: 10 + index,
      descrizione: `Spesa ${index}`,
      categoria: CATEGORIE_SPESA.altro,
    }));

    const report = buildCantiereReport({
      cantiere: { ...cantiereBase, spese },
    });

    expect(report.spese.elenco).toHaveLength(25);
    expect(report.spese.totale).toBeGreaterThan(0);
  });
});
