import { describe, expect, it } from "vitest";

import {
  creaLavoroDaCantiere,
  etichettaTipoLavoro,
  formattaDurataStimata,
  risolviTipoLavoro,
} from "./lavoriDomain";
import { TIPO_LAVORO } from "./lavoriTypes";

describe("lavoriDomain", () => {
  it("mantiene compatibilità: cantieri senza tipo sono cantiere", () => {
    expect(risolviTipoLavoro({ id: "c1", nome: "Villa" })).toBe(
      TIPO_LAVORO.CANTIERE
    );
  });

  it("risolve i tipi lavoro espliciti", () => {
    expect(risolviTipoLavoro({ tipoLavoro: "intervento" })).toBe(
      TIPO_LAVORO.INTERVENTO
    );
    expect(risolviTipoLavoro({ tipoLavoro: "sopralluogo" })).toBe(
      TIPO_LAVORO.SOPRALLUOGO
    );
    expect(risolviTipoLavoro({ tipoLavoro: "manutenzione" })).toBe(
      TIPO_LAVORO.MANUTENZIONE
    );
  });

  it("proietta un lavoro con durata e saldo", () => {
    const lavoro = creaLavoroDaCantiere({
      id: "c1",
      nome: "Villa Rossi",
      cliente: "Rossi",
      indirizzo: "Via Roma 12",
      stato: "In corso",
      orario: "09:00",
      durataStimata: 90,
      preventivoOriginaleTotale: 500,
      incassato: 200,
      tipoLavoro: "intervento",
    });

    expect(lavoro.tipoLavoro).toBe(TIPO_LAVORO.INTERVENTO);
    expect(lavoro.tipoLavoroLabel).toBe(etichettaTipoLavoro(TIPO_LAVORO.INTERVENTO));
    expect(lavoro.durataStimataLabel).toBe("1 h 30 min");
    expect(lavoro.saldo).toBe(300);
    expect(lavoro.link).toBe("/cantiere/c1");
  });

  it("formatta durate brevi e intere", () => {
    expect(formattaDurataStimata(45)).toBe("45 min");
    expect(formattaDurataStimata(120)).toBe("2 h");
    expect(formattaDurataStimata(0)).toBe("");
  });
});
