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
    save(...args) {
      save(...args);
    }
    splitTextToSize(valore) {
      return [String(valore || "")];
    }
    output(tipo) {
      return output(tipo);
    }
    addPage() {}
    getNumberOfPages() {
      return 1;
    }
  },
}));

import { creaVoceListaSpesa } from "../../domain/listaSpesa";
import {
  generaPdfAcquisti,
  nomeFileAcquistiPdf,
} from "./acquistiPdfService";
import { MODALITA_CONDIVIDI_ACQUISTI } from "./acquistiTestoService";

describe("acquistiPdfService", () => {
  beforeEach(() => {
    save.mockClear();
    output.mockClear();
  });

  it("genera PDF per lavoro", async () => {
    const voci = [
      creaVoceListaSpesa({
        nome: "Tubo Ø25",
        quantita: 60,
        unita: "m",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Videosorveglianza",
      }),
      creaVoceListaSpesa({
        nome: "Cavo 3×2,5",
        quantita: 80,
        unita: "m",
        lavoroId: "c2",
        cliente: "Bianchi",
        titoloLavoro: "Impianto",
      }),
    ];

    const risultato = await generaPdfAcquisti({
      voci,
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perLavoro,
      mostraPrezzi: false,
      salva: true,
    });

    expect(risultato.nomeFile).toBe("lista-acquisti-lavoro.pdf");
    expect(risultato.blob).toBeInstanceOf(Blob);
    expect(risultato.pagine).toBe(1);
    expect(save).toHaveBeenCalled();
  });

  it("genera PDF aggregato per fornitore", async () => {
    const voci = [
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 100,
        unita: "m",
        lavoroId: "c1",
        varianteId: "v1",
      }),
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 50,
        unita: "m",
        lavoroId: "c2",
        varianteId: "v1",
      }),
    ];

    const risultato = await generaPdfAcquisti({
      voci,
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perFornitore,
      salva: false,
    });

    expect(risultato.nomeFile).toBe("lista-acquisti-fornitore.pdf");
    expect(risultato.doc).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });

  it("può includere prezzi senza toccare PDF preventivi", async () => {
    const voci = [
      creaVoceListaSpesa({
        nome: "Cavo",
        quantita: 10,
        unita: "m",
        lavoroId: "c1",
        prezzoUnitario: 2,
      }),
    ];
    const risultato = await generaPdfAcquisti({
      voci,
      mostraPrezzi: true,
      salva: false,
    });
    expect(risultato.doc).toBeTruthy();
  });

  it("lista vuota genera comunque PDF", async () => {
    const risultato = await generaPdfAcquisti({ voci: [], salva: false });
    expect(risultato.blob).toBeInstanceOf(Blob);
  });

  it("nomeFileAcquistiPdf dipende dalla modalità", () => {
    expect(
      nomeFileAcquistiPdf({
        modalita: MODALITA_CONDIVIDI_ACQUISTI.perFornitore,
      })
    ).toBe("lista-acquisti-fornitore.pdf");
    expect(
      nomeFileAcquistiPdf({ modalita: MODALITA_CONDIVIDI_ACQUISTI.perLavoro })
    ).toBe("lista-acquisti-lavoro.pdf");
  });
});
