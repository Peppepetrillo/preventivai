import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  apriWhatsAppConTesto,
  copiaTestoNegliAppunti,
  formattaRigaVoce,
  generaTestoDistinta,
} from "./distintaTestoService";

const distintaEsempio = {
  id: "d1",
  titolo: "Quadro civile",
  clienteNome: "Mario",
  voci: [
    { id: "v1", nome: "Tubo corrugato Ø25", quantita: 50, unita: "m", prezzoUnitario: 0.8 },
    { id: "v2", nome: "Cavo 3×2,5", quantita: 80, unita: "m", prezzoUnitario: 1.2 },
    { id: "v3", nome: "Canalina 40×20", quantita: 15, unita: "m" },
    { id: "v4", nome: "Cassette 503", quantita: 10, unita: "pz", prezzoUnitario: 2 },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("distintaTestoService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("genera testo WhatsApp professionale senza prezzi di default", () => {
    const testo = generaTestoDistinta(distintaEsempio);
    expect(testo).toContain("Ciao Mario,");
    expect(testo).toContain("ti invio la lista dei materiali necessari per il lavoro:");
    expect(testo).toContain("• Tubo corrugato Ø25 — 50 m");
    expect(testo).toContain("• Cavo 3×2,5 — 80 m");
    expect(testo).toContain("• Canalina 40×20 — 15 m");
    expect(testo).toContain("• Cassette 503 — 10 pz");
    expect(testo).not.toMatch(/€|EUR|0,80|1,20/);
    expect(testo).not.toContain("Totale");
  });

  it("include prezzi unitari e totale se mostraPrezzi", () => {
    const testo = generaTestoDistinta(distintaEsempio, { mostraPrezzi: true });
    expect(testo).toContain("Tubo corrugato Ø25");
    expect(testo).toMatch(/€/);
    expect(testo).toContain("Totale indicativo:");
  });

  it("formattaRigaVoce esclude prezzi di default", () => {
    expect(formattaRigaVoce(distintaEsempio.voci[0])).toBe(
      "• Tubo corrugato Ø25 — 50 m"
    );
    expect(
      formattaRigaVoce(distintaEsempio.voci[0], true)
    ).toMatch(/Tubo corrugato Ø25 — 50 m \(/);
  });

  it("apriWhatsAppConTesto apre wa.me", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const url = apriWhatsAppConTesto("Ciao Mario");
    expect(url).toContain("wa.me");
    expect(url).toContain(encodeURIComponent("Ciao Mario"));
    expect(open).toHaveBeenCalled();
  });

  it("copiaTestoNegliAppunti usa clipboard", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const ok = await copiaTestoNegliAppunti("testo distinta");
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("testo distinta");
  });

  it("formattaRigaVoce include la nota sotto il materiale", () => {
    const voce = {
      nome: "Scatola 503",
      quantita: 20,
      unita: "pz",
      note: "Da incasso, serie civile bianca",
    };
    expect(formattaRigaVoce(voce)).toBe(
      "• Scatola 503 — 20 pz\n  📝 Da incasso, serie civile bianca"
    );
  });

  it("formattaRigaVoce non aggiunge riga nota se assente o vuota", () => {
    expect(formattaRigaVoce(distintaEsempio.voci[0])).toBe(
      "• Tubo corrugato Ø25 — 50 m"
    );
    expect(
      formattaRigaVoce({ nome: "Cavo", quantita: 10, unita: "m", note: "   " })
    ).toBe("• Cavo — 10 m");
  });

  it("generaTestoDistinta associa ogni nota al proprio materiale", () => {
    const distinta = {
      ...distintaEsempio,
      voci: [
        {
          id: "v1",
          nome: "Scatola 503",
          quantita: 20,
          unita: "pz",
          note: "Da incasso, serie civile bianca",
        },
        {
          id: "v2",
          nome: "Tubo corrugato Ø25",
          quantita: 15,
          unita: "m",
          note: "Utilizzare per linea cucina",
        },
        {
          id: "v3",
          nome: "Canalina 40×20",
          quantita: 15,
          unita: "m",
        },
      ],
    };

    const testo = generaTestoDistinta(distinta);
    const righe = testo.split("\n");

    expect(righe).toContain("• Scatola 503 — 20 pz");
    expect(righe).toContain("  📝 Da incasso, serie civile bianca");
    expect(righe).toContain("• Tubo corrugato Ø25 — 15 m");
    expect(righe).toContain("  📝 Utilizzare per linea cucina");
    expect(righe).toContain("• Canalina 40×20 — 15 m");

    const idxScatola = righe.indexOf("• Scatola 503 — 20 pz");
    const idxNotaScatola = righe.indexOf("  📝 Da incasso, serie civile bianca");
    const idxTubo = righe.indexOf("• Tubo corrugato Ø25 — 15 m");
    const idxNotaTubo = righe.indexOf("  📝 Utilizzare per linea cucina");

    expect(idxNotaScatola).toBe(idxScatola + 1);
    expect(idxNotaTubo).toBe(idxTubo + 1);

    const idxCanalina = righe.indexOf("• Canalina 40×20 — 15 m");
    expect(righe[idxCanalina + 1] || "").not.toMatch(/📝/);
  });

  it("distinta senza note mantiene il formato precedente", () => {
    const testo = generaTestoDistinta(distintaEsempio);
    expect(testo).toContain("• Tubo corrugato Ø25 — 50 m");
    expect(testo).toContain("• Cavo 3×2,5 — 80 m");
    expect(testo).not.toMatch(/📝/);
  });
});
