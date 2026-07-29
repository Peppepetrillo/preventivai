import { describe, expect, it, vi } from "vitest";

import { DIARIO_EVENT_TYPES } from "../../diario/events/constants";
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
});
