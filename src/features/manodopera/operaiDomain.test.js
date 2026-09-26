import { describe, expect, it } from "vitest";

import {
  aggiornaOperaio,
  disattivaOperaio,
  etichettaCostoOperaio,
  nomeCompletoOperaio,
  riattivaOperaio,
  suggerisciCostoGiornata,
  validaECreaOperaio,
} from "./operaiDomain";

describe("operaiDomain", () => {
  it("crea operaio con costo giornata", () => {
    const esito = validaECreaOperaio({
      nome: "Mario",
      cognome: "Rossi",
      ruolo: "Elettricista",
      costoGiornata: "120",
    });
    expect(esito.ok).toBe(true);
    expect(esito.operaio.nome).toBe("Mario");
    expect(esito.operaio.costoGiornata).toBe(120);
    expect(esito.operaio.costoOra).toBeNull();
    expect(esito.operaio.attivo).toBe(true);
  });

  it("crea operaio con solo costo ora", () => {
    const esito = validaECreaOperaio({
      nome: "Antonio",
      cognome: "Esposito",
      costoOra: 15,
    });
    expect(esito.ok).toBe(true);
    expect(esito.operaio.costoOra).toBe(15);
  });

  it("rifiuta senza nome/cognome o senza costi", () => {
    expect(validaECreaOperaio({ cognome: "Rossi", costoGiornata: 10 }).ok).toBe(
      false
    );
    expect(validaECreaOperaio({ nome: "Mario", costoGiornata: 10 }).ok).toBe(
      false
    );
    expect(
      validaECreaOperaio({ nome: "Mario", cognome: "Rossi" }).ok
    ).toBe(false);
  });

  it("rifiuta importi negativi", () => {
    expect(
      validaECreaOperaio({
        nome: "A",
        cognome: "B",
        costoGiornata: -1,
      }).ok
    ).toBe(false);
  });

  it("modifica operaio preservando id", () => {
    const creato = validaECreaOperaio({
      nome: "Mario",
      cognome: "Rossi",
      costoGiornata: 120,
    }).operaio;
    const upd = aggiornaOperaio(creato, { costoGiornata: 100, ruolo: "Capo" });
    expect(upd.ok).toBe(true);
    expect(upd.operaio.id).toBe(creato.id);
    expect(upd.operaio.costoGiornata).toBe(100);
    expect(upd.operaio.ruolo).toBe("Capo");
  });

  it("disattiva e riattiva senza perdita dati", () => {
    const creato = validaECreaOperaio({
      nome: "Mario",
      cognome: "Rossi",
      costoGiornata: 120,
    }).operaio;
    const off = disattivaOperaio(creato);
    expect(off.operaio.attivo).toBe(false);
    expect(off.operaio.costoGiornata).toBe(120);
    const on = riattivaOperaio(off.operaio);
    expect(on.operaio.attivo).toBe(true);
  });

  it("etichette e nome completo", () => {
    const op = validaECreaOperaio({
      nome: "Mario",
      cognome: "Rossi",
      costoGiornata: 120,
    }).operaio;
    expect(nomeCompletoOperaio(op)).toBe("Mario Rossi");
    expect(etichettaCostoOperaio(op)).toMatch(/giornata/);
  });

  it("suggerisce costo giornata / orario / personalizzato richiesto", () => {
    const op = validaECreaOperaio({
      nome: "M",
      cognome: "R",
      costoGiornata: 120,
      costoOra: 15,
    }).operaio;
    expect(suggerisciCostoGiornata(op, { tipo: "giornata" }).costo).toBe(120);
    expect(suggerisciCostoGiornata(op, { tipo: "ore", ore: 6 }).costo).toBe(90);
    expect(suggerisciCostoGiornata(null, { tipo: "giornata" }).ok).toBe(false);
  });
});
