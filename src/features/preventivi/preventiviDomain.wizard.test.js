import { describe, expect, it, beforeEach } from "vitest";

import { creaPreventivo } from "./preventiviDomain";
import {
  indiceStep,
  TIPO_LAVORO,
  WIZARD_STEPS,
} from "./wizard/wizardConfig";
import {
  leggiLavorazioniPiuUsate,
  registraUsoLavorazione,
} from "./utils/lavorazioniUsage";

describe("creaPreventivo tipoLavoro", () => {
  it("salva tipoLavoro come metadato senza alterare i totali", () => {
    const preventivo = creaPreventivo({
      archivio: [],
      cliente: "Mario Rossi",
      lavorazioni: [
        {
          id: "1",
          nome: "Punto luce",
          categoria: "Impianto",
          prezzo: 45,
          quantita: 2,
          unita: "cad",
        },
      ],
      sconto: 0,
      iva: 22,
      validita: 30,
      pagamento: "Bonifico bancario",
      acconto: 0,
      note: "",
      tipoLavoro: TIPO_LAVORO.express,
    });

    expect(preventivo.tipoLavoro).toBe("express");
    expect(preventivo.totale).toBeGreaterThan(0);
    expect(preventivo.imponibile).toBeGreaterThan(0);
  });
});

describe("wizardConfig", () => {
  it("include il percorso express come terza scelta", () => {
    expect(WIZARD_STEPS).toHaveLength(4);
    expect(indiceStep("conferma")).toBe(3);
  });
});

describe("lavorazioniUsage", () => {
  beforeEach(() => {
    localStorage.removeItem("preventivai:lavorazioni-usage");
  });

  it("ordina le voci più usate per frequenza", () => {
    const listino = [
      { id: "a", nome: "A", categoria: "Impianto", prezzo: 10, unita: "cad" },
      { id: "b", nome: "B", categoria: "Impianto", prezzo: 20, unita: "cad" },
    ];

    registraUsoLavorazione("a", 3);
    registraUsoLavorazione("b", 1);
    registraUsoLavorazione("a", 2);

    const piuUsate = leggiLavorazioniPiuUsate(listino, 2);

    expect(piuUsate[0].id).toBe("a");
    expect(piuUsate[1].id).toBe("b");
  });
});
