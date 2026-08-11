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
});
