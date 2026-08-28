import { describe, expect, it, vi } from "vitest";

import {
  apriWhatsAppConTesto,
  generaTestoRiepilogoLavoroDiretto,
} from "./lavoroDirettoTestoService";

vi.mock("../../../utils/nativeExport", () => ({
  apriUrlEsterno: vi.fn(),
}));

describe("lavoroDirettoTestoService", () => {
  it("genera riepilogo WhatsApp con totale acconto saldo", () => {
    const testo = generaTestoRiepilogoLavoroDiretto({
      origine: "diretto",
      cliente: "Mario Rossi",
      tipoIntervento: "Riparazione",
      descrizioneIntervento:
        "Sostituito il magnetotermico nel quadro elettrico.",
      totaleLavoro: 180,
      incassato: 50,
      indirizzo: "Via Roma 1",
    });

    expect(testo).toContain("INTERVENTO — PreventivAI");
    expect(testo).toContain("Mario Rossi");
    expect(testo).toContain("Riparazione");
    expect(testo).toContain("magnetotermico");
    expect(testo).toContain("Già incassato:");
    expect(testo).toContain("Resta da incassare:");
    expect(testo).toMatch(/180/);
    expect(testo).toMatch(/50/);
    expect(testo).toMatch(/130/);
  });

  it("apriWhatsAppConTesto apre wa.me", () => {
    const url = apriWhatsAppConTesto("Ciao");
    expect(url).toContain("wa.me");
    expect(url).toContain("Ciao");
  });
});
