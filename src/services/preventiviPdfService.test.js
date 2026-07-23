import { beforeEach, describe, expect, it, vi } from "vitest";

const addPage = vi.fn();
const getNumberOfPages = vi.fn(() => 1);

vi.mock("jspdf", () => ({
  default: class {
    constructor() {
      this.internal = { pageSize: { getHeight: () => 297, getWidth: () => 210 } };
    }
    setTextColor() {}
    setFillColor() {}
    setDrawColor() {}
    setFontSize() {}
    setFont() {}
    text() {}
    rect() {}
    roundedRect() {}
    line() {}
    addImage() {}
    save() {}
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
  default: {
    toDataURL: vi.fn(async () => "data:image/png;base64,qq"),
  },
}));

import { generaPdfPreventivo } from "./preventiviPdfService";

describe("generaPdfPreventivo densità", () => {
  beforeEach(() => {
    addPage.mockClear();
    getNumberOfPages.mockReturnValue(1);
  });

  it("un preventivo piccolo resta su una sola pagina", async () => {
    const risultato = await generaPdfPreventivo({
      preventivo: { id: 1, numero: "PREV-TEST", data: "23/07/2026" },
      datiAzienda: { nomeDitta: "Elettro Test", telefono: "333", email: "a@b.it" },
      cliente: "Rossi",
      stato: "Bozza",
      lavorazioni: [
        { nome: "Punto luce", quantita: 2, prezzo: 45, unita: "cad" },
        { nome: "Punto presa", quantita: 4, prezzo: 35, unita: "cad" },
      ],
      validita: 30,
      pagamento: "Bonifico",
      note: "",
      sconto: 0,
      iva: 22,
      acconto: 0,
      totali: {
        subtotale: 230,
        importoSconto: 0,
        imponibile: 230,
        importoIva: 50.6,
        totale: 280.6,
      },
      salva: false,
    });

    expect(addPage).not.toHaveBeenCalled();
    expect(risultato.pagine).toBe(1);
  });
});
