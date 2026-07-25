import { beforeEach, describe, expect, it, vi } from "vitest";

const addPage = vi.fn();
const getNumberOfPages = vi.fn(() => 1);
const save = vi.fn();
const setPage = vi.fn();
const output = vi.fn(() => new Blob(["%PDF"], { type: "application/pdf" }));

vi.mock("jspdf", () => ({
  default: class {
    constructor() {
      this.internal = {
        pageSize: { getHeight: () => 297, getWidth: () => 210 },
      };
    }
    setTextColor() {}
    setFillColor() {}
    setDrawColor() {}
    setFontSize() {}
    setFont() {}
    setLineWidth() {}
    text() {}
    rect() {}
    roundedRect() {}
    line() {}
    addImage() {}
    save(...args) {
      save(...args);
    }
    splitTextToSize(valore) {
      return [String(valore || "")];
    }
    output(tipo) {
      return output(tipo);
    }
    setPage(...args) {
      setPage(...args);
    }
    addPage(...args) {
      addPage(...args);
      getNumberOfPages.mockReturnValue(addPage.mock.calls.length + 1);
    }
    getNumberOfPages() {
      return getNumberOfPages();
    }
  },
}));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(async () => "data:image/png;base64,qq") },
}));

import {
  buildPreventivoPdfDocument,
  generaPreventivoPdfDaInput,
  risolviPdfSettings,
  APP_VERSION,
} from "./index";
import { spazioRimanente, areaUtile } from "./pdfLayoutService";

describe("pdfTypes / settings", () => {
  it("risolviPdfSettings applica default e override colore", () => {
    const s = risolviPdfSettings({
      colorePrincipale: [10, 20, 30],
      margine: 18,
    });
    expect(s.colorePrincipale).toEqual([10, 20, 30]);
    expect(s.margine).toBe(18);
    expect(s.font).toBe("helvetica");
  });

  it("espone versione applicazione", () => {
    expect(APP_VERSION).toBeTruthy();
  });
});

describe("pdfLayoutService", () => {
  it("calcola area utile e spazio rimanente", () => {
    const settings = risolviPdfSettings();
    const area = areaUtile(settings);
    expect(area.width).toBe(210 - settings.margine * 2);
    expect(spazioRimanente(settings, 100)).toBeGreaterThan(100);
  });
});

describe("pdfTemplateService", () => {
  beforeEach(() => {
    addPage.mockClear();
    save.mockClear();
    setPage.mockClear();
    getNumberOfPages.mockReturnValue(1);
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("buildPreventivoPdfDocument gestisce dati mancanti", () => {
    const doc = buildPreventivoPdfDocument({});
    expect(doc.azienda.nome).toBe("PreventivAI");
    expect(doc.lavorazioni).toEqual([]);
    expect(doc.cliente.nome).toBe("");
    expect(doc.riepilogo.totale).toBe(0);
    expect(doc.firme.clienteLabel).toContain("Cliente");
  });

  it("buildPreventivoPdfDocument mappa sezioni complete", () => {
    const doc = buildPreventivoPdfDocument({
      datiAzienda: {
        nomeDitta: "Elettro Demo",
        indirizzo: "Via Roma 1",
        telefono: "333",
        email: "a@b.it",
        partitaIva: "IT123",
        condizioniGenerali: "Pagamento 30 gg",
        logo: null,
      },
      cliente: {
        nome: "Rossi",
        telefono: "111",
        email: "r@r.it",
        indirizzo: "Via Verdi 2",
      },
      preventivo: { id: 1, numero: "PREV-1", data: "25/07/2026" },
      lavorazioni: [
        { nome: "Punto luce", quantita: 2, prezzo: 45, unita: "cad" },
      ],
      totali: {
        subtotale: 90,
        importoSconto: 0,
        imponibile: 90,
        importoIva: 19.8,
        totale: 109.8,
      },
      acconto: 20,
      sconto: 0,
      iva: 22,
      note: "Nota test",
    });

    expect(doc.azienda).toMatchObject({
      nome: "Elettro Demo",
      partitaIva: "IT123",
    });
    expect(doc.cliente.nome).toBe("Rossi");
    expect(doc.intestazione.numero).toBe("PREV-1");
    expect(doc.lavorazioni[0].totale).toBe(90);
    expect(doc.acconto.richiesto).toBe(20);
    expect(doc.acconto.residuo).toBeCloseTo(89.8);
    expect(doc.condizioni).toBe("Pagamento 30 gg");
    expect(doc.note).toBe("Nota test");
  });

  it("render di un preventivo piccolo non forza addPage", async () => {
    const risultato = await generaPreventivoPdfDaInput(
      {
        datiAzienda: { nomeDitta: "Test" },
        cliente: "Rossi",
        preventivo: { id: 1, numero: "PREV-T", data: "01/01/2026" },
        lavorazioni: [
          { nome: "A", quantita: 1, prezzo: 10, unita: "cad" },
          { nome: "B", quantita: 2, prezzo: 20, unita: "cad" },
        ],
        totali: {
          subtotale: 50,
          importoSconto: 0,
          imponibile: 50,
          importoIva: 11,
          totale: 61,
        },
        acconto: 0,
        iva: 22,
        sconto: 0,
      },
      { salva: false }
    );

    expect(addPage).not.toHaveBeenCalled();
    expect(risultato.pagine).toBe(1);
    expect(risultato.blobUrl).toBe("blob:mock-pdf");
    expect(save).not.toHaveBeenCalled();
  });

  it("tabelle lunghe generano nuove pagine", async () => {
    const lavorazioni = Array.from({ length: 40 }, (_, i) => ({
      nome: `Lavorazione molto lunga numero ${i + 1}`,
      quantita: 1,
      prezzo: 10,
      unita: "cad",
    }));

    const risultato = await generaPreventivoPdfDaInput(
      {
        datiAzienda: { nomeDitta: "Test" },
        cliente: "Rossi",
        preventivo: { id: 2, numero: "PREV-LONG", data: "01/01/2026" },
        lavorazioni,
        totali: {
          subtotale: 400,
          importoSconto: 0,
          imponibile: 400,
          importoIva: 88,
          totale: 488,
        },
        acconto: 0,
        iva: 22,
        sconto: 0,
      },
      { salva: false }
    );

    expect(addPage.mock.calls.length).toBeGreaterThan(0);
    expect(risultato.pagine).toBeGreaterThan(1);
    expect(setPage).toHaveBeenCalled();
  });

  it("salva PDF quando richiesto", async () => {
    await generaPreventivoPdfDaInput(
      {
        datiAzienda: { nomeDitta: "Test" },
        cliente: "Cliente",
        preventivo: { numero: "PREV-S" },
        lavorazioni: [],
        totali: {
          subtotale: 0,
          importoSconto: 0,
          imponibile: 0,
          importoIva: 0,
          totale: 0,
        },
      },
      { salva: true }
    );
    expect(save).toHaveBeenCalled();
  });
});
