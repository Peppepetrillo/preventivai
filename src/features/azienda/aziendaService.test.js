/**
 * Test profilo azienda (normalizzazione + persistenza via repository esistente).
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  aggiornaProfiloAzienda,
  formattaIndirizzoAzienda,
  haDatiPagamentoAzienda,
  leggiProfiloAzienda,
  lineeHeaderAziendaPdf,
  normalizzaProfiloAzienda,
  profiloAziendaVuoto,
  resetProfiloAzienda,
  risolviAziendaPerPdf,
  salvaProfiloAzienda,
} from "./aziendaService";

describe("aziendaService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("profilo assente → vuoto normalizzato", () => {
    const p = leggiProfiloAzienda();
    expect(p.nomeDitta).toBe("");
    expect(p.iban).toBe("");
    expect(p.logo).toBe("");
  });

  it("profiloAziendaVuoto ha tutti i campi stringa", () => {
    const v = profiloAziendaVuoto();
    expect(v.nomeDitta).toBe("");
    expect(v.partitaIva).toBe("");
    expect(v.condizioniPagamento).toBe("");
  });

  it("profilo parziale: alias ragioneSociale e pIva", () => {
    const p = normalizzaProfiloAzienda({
      ragioneSociale: "Elettro SRL",
      pIva: "123",
      iban: "it60 x054 2811 1010 0000 0123 456",
    });
    expect(p.nomeDitta).toBe("Elettro SRL");
    expect(p.partitaIva).toBe("123");
    expect(p.iban).toBe("IT60 X054 2811 1010 0000 0123 456");
  });

  it("salva e rilegge profilo", () => {
    salvaProfiloAzienda({
      nomeDitta: "Demo",
      telefono: "333",
      iban: "IT00",
    });
    const p = leggiProfiloAzienda();
    expect(p.nomeDitta).toBe("Demo");
    expect(p.telefono).toBe("333");
    expect(p.iban).toBe("IT00");
  });

  it("aggiornamento parziale preserva campi esistenti", () => {
    salvaProfiloAzienda({ nomeDitta: "A", email: "a@test.it", logo: "data:x" });
    aggiornaProfiloAzienda({ telefono: "111" });
    const p = leggiProfiloAzienda();
    expect(p.nomeDitta).toBe("A");
    expect(p.email).toBe("a@test.it");
    expect(p.telefono).toBe("111");
    expect(p.logo).toBe("data:x");
  });

  it("resetProfiloAzienda svuota i campi", () => {
    salvaProfiloAzienda({ nomeDitta: "X", iban: "IT" });
    resetProfiloAzienda();
    const p = leggiProfiloAzienda();
    expect(p.nomeDitta).toBe("");
    expect(p.iban).toBe("");
  });

  it("formattaIndirizzoAzienda solo parti compilate", () => {
    expect(
      formattaIndirizzoAzienda({
        indirizzo: "Via Roma 1",
        cap: "00100",
        comune: "Roma",
        provincia: "rm",
      })
    ).toBe("Via Roma 1 · 00100 Roma (RM)");
    expect(formattaIndirizzoAzienda({ comune: "Milano" })).toBe("Milano");
  });

  it("haDatiPagamentoAzienda", () => {
    expect(haDatiPagamentoAzienda({})).toBe(false);
    expect(haDatiPagamentoAzienda({ iban: "IT" })).toBe(true);
    expect(haDatiPagamentoAzienda({ condizioniPagamento: "30 gg" })).toBe(true);
  });

  it("lineeHeaderAziendaPdf senza etichette vuote", () => {
    const linee = lineeHeaderAziendaPdf(
      risolviAziendaPerPdf({
        nomeDitta: "Demo",
        telefono: "333",
        partitaIva: "123",
        pec: "",
        email: "",
      })
    );
    expect(linee.some((l) => l.includes("Tel. 333"))).toBe(true);
    expect(linee.some((l) => l.includes("P. IVA 123"))).toBe(true);
    expect(linee.join(" ")).not.toMatch(/PEC\s*$/);
    expect(linee.join(" ")).not.toContain("PEC ");
  });

  it("risolviAziendaPerPdf con profilo vuoto resta generabile", () => {
    const a = risolviAziendaPerPdf({});
    expect(a.nome).toBe("PreventivAI");
    expect(a.iban).toBe("");
  });
});
