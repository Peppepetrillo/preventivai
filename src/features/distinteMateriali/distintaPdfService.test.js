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

import {
  generaPdfDistintaMateriali,
  nomeFileDistintaPdf,
} from "./distintaPdfService";

describe("distintaPdfService", () => {
  beforeEach(() => {
    save.mockClear();
    output.mockClear();
  });

  it("genera PDF semplice con titolo e materiali", async () => {
    const distinta = {
      id: "d1",
      titolo: "Materiali quadro",
      clienteNome: "Mario Rossi",
      voci: [
        { id: "v1", nome: "Tubo corrugato Ø25", quantita: 50, unita: "m" },
        { id: "v2", nome: "Cavo 3×2,5", quantita: 80, unita: "m", prezzoUnitario: 1.2 },
      ],
      updatedAt: "2026-03-01T10:00:00.000Z",
    };

    const risultato = await generaPdfDistintaMateriali({
      distinta,
      mostraPrezzi: false,
      salva: true,
    });

    expect(risultato.nomeFile).toMatch(/materiali-quadro\.pdf/);
    expect(risultato.blob).toBeInstanceOf(Blob);
    expect(risultato.pagine).toBe(1);
    expect(save).toHaveBeenCalled();
  });

  it("nomeFileDistintaPdf sanitizza il titolo", () => {
    expect(nomeFileDistintaPdf({ titolo: "Quadro / Civile!!" })).toBe(
      "quadro-civile.pdf"
    );
  });

  it("può includere prezzi senza modificare PDF preventivi", async () => {
    const distinta = {
      titolo: "Con prezzi",
      voci: [{ nome: "Cavo", quantita: 10, unita: "m", prezzoUnitario: 2 }],
    };
    const risultato = await generaPdfDistintaMateriali({
      distinta,
      mostraPrezzi: true,
      salva: false,
    });
    expect(risultato.doc).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });
});
