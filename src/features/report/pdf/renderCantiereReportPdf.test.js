import { beforeEach, describe, expect, it, vi } from "vitest";

const save = vi.fn();
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
      return 1;
    }
  },
}));

import { buildCantiereReport } from "../builder/buildCantiereReport";
import { renderCantiereReportPdf } from "./renderCantiereReportPdf";

describe("renderCantiereReportPdf", () => {
  beforeEach(() => {
    save.mockClear();
    output.mockClear();
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
});
