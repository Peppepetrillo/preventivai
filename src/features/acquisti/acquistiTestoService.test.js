import { beforeEach, describe, expect, it, vi } from "vitest";

import { creaVoceListaSpesa } from "../../domain/listaSpesa";
import {
  apriWhatsAppConTesto,
  copiaTestoNegliAppunti,
  formattaRigaAcquisto,
  generaTestoAcquisti,
  MODALITA_CONDIVIDI_ACQUISTI,
} from "./acquistiTestoService";

const vociEsempio = [
  creaVoceListaSpesa({
    nome: "Cavo Cat.6",
    quantita: 100,
    unita: "m",
    lavoroId: "c1",
    cliente: "Rossi",
    titoloLavoro: "Videosorveglianza",
    varianteId: "var-cat6",
    prezzoUnitario: 0.9,
  }),
  creaVoceListaSpesa({
    nome: "Tubo Ø25",
    quantita: 60,
    unita: "m",
    lavoroId: "c1",
    cliente: "Rossi",
    titoloLavoro: "Videosorveglianza",
  }),
  creaVoceListaSpesa({
    nome: "Cassette",
    quantita: 6,
    unita: "pz",
    lavoroId: "c1",
    cliente: "Rossi",
    titoloLavoro: "Videosorveglianza",
  }),
  creaVoceListaSpesa({
    nome: "Cavo Cat.6",
    quantita: 50,
    unita: "m",
    lavoroId: "c2",
    cliente: "Bianchi",
    titoloLavoro: "Impianto",
    varianteId: "var-cat6",
    prezzoUnitario: 0.9,
  }),
  creaVoceListaSpesa({
    nome: "Cavo 3×2,5",
    quantita: 80,
    unita: "m",
    lavoroId: "c2",
    cliente: "Bianchi",
    titoloLavoro: "Impianto",
  }),
  creaVoceListaSpesa({
    nome: "Canalina 40×20",
    quantita: 15,
    unita: "m",
    lavoroId: "c2",
    cliente: "Bianchi",
    titoloLavoro: "Impianto",
    acquistato: true,
  }),
];

describe("acquistiTestoService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("genera testo per lavoro raggruppato", () => {
    const testo = generaTestoAcquisti(vociEsempio, {
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perLavoro,
    });
    expect(testo).toContain("Lista materiali");
    expect(testo).toContain("Rossi — Videosorveglianza");
    expect(testo).toContain("Bianchi — Impianto");
    expect(testo).toContain("• Cavo Cat.6 — 100 m");
    expect(testo).toContain("• Tubo Ø25 — 60 m");
    expect(testo).toContain("• Cassette — 6 pz");
    expect(testo).toContain("• Cavo 3×2,5 — 80 m");
    expect(testo).not.toContain("Canalina");
  });

  it("genera testo aggregato per fornitore con somma", () => {
    const testo = generaTestoAcquisti(vociEsempio, {
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perFornitore,
    });
    expect(testo).toContain("Lista materiali da acquistare");
    expect(testo).toContain("• Cavo Cat.6 — 150 m");
    expect(testo).toContain("• Tubo Ø25 — 60 m");
    expect(testo).toContain("• Cavo 3×2,5 — 80 m");
    expect(testo).not.toContain("Canalina");
    expect(testo).not.toContain("Rossi");
  });

  it("esclude prezzi di default", () => {
    const testo = generaTestoAcquisti(vociEsempio);
    expect(testo).not.toMatch(/€|EUR|0,90/);
    expect(testo).not.toContain("Totale");
  });

  it("include prezzi se richiesti", () => {
    const testo = generaTestoAcquisti(vociEsempio, {
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perLavoro,
      mostraPrezzi: true,
    });
    expect(testo).toMatch(/€/);
    expect(testo).toContain("Totale indicativo:");
  });

  it("include acquistati solo con opzione", () => {
    const senza = generaTestoAcquisti(vociEsempio, {
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perFornitore,
    });
    expect(senza).not.toContain("Canalina");

    const con = generaTestoAcquisti(vociEsempio, {
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perFornitore,
      includiAcquistati: true,
    });
    expect(con).toContain("Canalina 40×20 — 15 m");
  });

  it("lista vuota", () => {
    const testo = generaTestoAcquisti([]);
    expect(testo).toContain("Lista materiali");
    expect(testo).toContain("• (nessun materiale)");
  });

  it("normalizza unità cad → pz in riga", () => {
    expect(
      formattaRigaAcquisto({ nome: "Vite", quantita: 10, unita: "cad" })
    ).toBe("• Vite — 10 pz");
  });

  it("apriWhatsAppConTesto apre wa.me", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const url = apriWhatsAppConTesto("Lista materiali");
    expect(url).toContain("wa.me");
    expect(url).toContain(encodeURIComponent("Lista materiali"));
    expect(open).toHaveBeenCalled();
  });

  it("copiaTestoNegliAppunti usa clipboard", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const ok = await copiaTestoNegliAppunti("testo acquisti");
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("testo acquisti");
  });

  it("provenance aggregata: più lavori sommati una sola volta", () => {
    const testo = generaTestoAcquisti(vociEsempio, {
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perFornitore,
    });
    const match = testo.match(/Cavo Cat\.6 — 150 m/g);
    expect(match).toHaveLength(1);
  });

  it("condivisione resta flat anche con accessori suggeriti", () => {
    const voci = [
      creaVoceListaSpesa({
        nome: "Presa Living Now",
        quantita: 12,
        unita: "pz",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Civile",
        distintaVoceId: "voce-padre",
      }),
      creaVoceListaSpesa({
        nome: "Cassetta 503",
        quantita: 12,
        unita: "pz",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Civile",
        parentVoceId: "voce-padre",
        origineAccessorio: "suggerito",
      }),
    ];
    const testo = generaTestoAcquisti(voci, {
      modalita: MODALITA_CONDIVIDI_ACQUISTI.perLavoro,
    });
    expect(testo).toContain("• Presa Living Now — 12 pz");
    expect(testo).toContain("• Cassetta 503 — 12 pz");
    expect(testo).not.toMatch(/per:/i);
    expect(testo).not.toMatch(/└|├|Accessorio/i);
  });
});
