import { beforeEach, describe, expect, it, vi } from "vitest";

const save = vi.fn();
const output = vi.fn(() => new Blob(["%PDF"], { type: "application/pdf" }));
const testiPdf = [];

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
    text(valore) {
      testiPdf.push(String(valore ?? ""));
    }
    rect() {}
    roundedRect() {}
    line() {}
    addImage() {}
    addPage() {}
    save(...args) {
      save(...args);
    }
    splitTextToSize(valore) {
      return [String(valore || "")];
    }
    output(tipo) {
      return output(tipo);
    }
    getNumberOfPages() {
      return this._pagine || 1;
    }
  },
}));

import { CATEGORIE_SPESA } from "../../cantieri/services/speseCantiereService";
import { buildCantiereReport } from "../builder/buildCantiereReport";
import { renderCantiereReportPdf } from "./renderCantiereReportPdf";

describe("renderCantiereReportPdf", () => {
  beforeEach(() => {
    save.mockClear();
    output.mockClear();
    testiPdf.length = 0;
    globalThis.URL.createObjectURL = vi.fn(() => "blob:report-mock");
  });

  it("genera un PDF serializzabile con blob e nome file", async () => {
    const document = buildCantiereReport({
      cantiere: {
        id: "c1",
        cliente: "Rossi",
        nome: "Villa Rossi",
        diario: [],
      },
      datiAzienda: { nomeDitta: "Giuseppe Impianti" },
    });

    const risultato = await renderCantiereReportPdf(document, {
      salva: false,
      nomeFile: "Report_Villa_Rossi.pdf",
    });

    expect(risultato.blob).toBeInstanceOf(Blob);
    expect(risultato.blobUrl).toBe("blob:report-mock");
    expect(risultato.nomeFile).toBe("Report_Villa_Rossi.pdf");
    expect(save).not.toHaveBeenCalled();
  });

  it("include sezione spese e riepilogo economico nel PDF", async () => {
    const document = buildCantiereReport({
      cantiere: {
        id: "c1",
        origine: "diretto",
        totaleLavoro: 10000,
        cliente: "Rossi",
        pagamenti: [{ id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" }],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 68,
            descrizione: "Cavo 3x2,5",
            categoria: CATEGORIE_SPESA.materiali,
            fornitore: "Rossi Materiali",
            metodoPagamento: "carta",
          },
        ],
        diario: [],
      },
    });

    await renderCantiereReportPdf(document, { salva: false });

    const contenuto = testiPdf.join("\n");
    expect(contenuto).toContain("Riepilogo economico");
    expect(contenuto).toContain("Totale spese:");
    expect(contenuto).toContain("Margine lordo:");
    expect(contenuto).toContain("Percentuale margine:");
    expect(contenuto).toContain("Incidenza spese:");
    expect(contenuto).toContain("Controllo gestionale");
    expect(contenuto).toContain("Situazione positiva");
    expect(contenuto).toContain("Principali costi:");
    expect(contenuto).toContain("Segnali gestionali:");
    expect(contenuto).toContain("Spese del cantiere");
    expect(contenuto).toContain("Cavo 3x2,5");
    expect(contenuto).toContain("Riepilogo spese per categoria");
    expect(contenuto).toContain("Materiali:");
  });

  it("mostra messaggio discreto se non ci sono spese", async () => {
    const document = buildCantiereReport({
      cantiere: {
        id: "c1",
        origine: "diretto",
        totaleLavoro: 5000,
        cliente: "Verdi",
        diario: [],
      },
    });

    await renderCantiereReportPdf(document, { salva: false });

    const contenuto = testiPdf.join("\n");
    expect(contenuto).toContain("Nessuna spesa registrata.");
    expect(contenuto).toContain("Totale spese:");
  });

  it("gestisce molte spese con continuazione pagine", async () => {
    const spese = Array.from({ length: 40 }, (_, index) => ({
      id: `s${index}`,
      data: `${String((index % 28) + 1).padStart(2, "0")}/09/2026`,
      importo: 10 + index,
      descrizione: `Spesa ${index}`,
      categoria: CATEGORIE_SPESA.altro,
    }));

    const document = buildCantiereReport({
      cantiere: {
        id: "c1",
        origine: "diretto",
        totaleLavoro: 10000,
        cliente: "Neri",
        spese,
        diario: [],
      },
    });

    const risultato = await renderCantiereReportPdf(document, { salva: false });

    expect(risultato.document.spese.elenco).toHaveLength(40);
    expect(testiPdf.join("\n")).toContain("Spesa 0");
    expect(testiPdf.join("\n")).toContain("Spesa 39");
  });
});
