import { describe, expect, it } from "vitest";

import { scrubTestoLiberoAi } from "./scrubTestoLiberoAi";
import { normalizzaNuovoLavoroAi } from "./aiContextService";

describe("scrubTestoLiberoAi", () => {
  it("maschera email, cellulare IT, IBAN e CF", () => {
    const testo =
      "Scrivi a mario@example.com o chiama +39 333 1234567. IBAN IT60X0542811101000000123456 CF RSSMRA80A01H501U";
    const out = scrubTestoLiberoAi(testo);
    expect(out).toContain("[email]");
    expect(out).toContain("[telefono]");
    expect(out).toContain("[iban]");
    expect(out).toContain("[cf]");
    expect(out).not.toMatch(/mario@example\.com/i);
    expect(out).not.toMatch(/333\s?1234567/);
  });

  it("non altera misure tecniche comuni", () => {
    expect(scrubTestoLiberoAi("Tubo Ø25 3x2,5 mm")).toBe("Tubo Ø25 3x2,5 mm");
  });
});

describe("normalizzaNuovoLavoroAi + scrub", () => {
  it("scrubba titolo e descrizione free-text", () => {
    const n = normalizzaNuovoLavoroAi({
      titolo: "Quadro villa — 3331234567",
      descrizione: "Contatto cliente@test.it",
      cliente: "NON DEVE COMPARIRE",
    });
    expect(n.titolo).toContain("[telefono]");
    expect(n.descrizione).toContain("[email]");
    expect(n.cliente).toBeUndefined();
  });
});
