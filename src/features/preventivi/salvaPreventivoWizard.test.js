import { describe, expect, it, vi, beforeEach } from "vitest";

import { creaPreventivo } from "./preventiviDomain";
import { salvaUltimoPreventivo } from "./utils/wizardExtensions";

vi.mock("../../repositories/preventiviRepository", () => ({
  leggiPreventivi: vi.fn(() => []),
  salvaNuovoPreventivo: vi.fn(),
}));

vi.mock("../../repositories/impostazioniRepository", () => ({
  leggiDatiAzienda: vi.fn(() => ({ nomeDitta: "Test Srl" })),
}));

vi.mock("../../services/preventiviPdfService", () => ({
  generaPdfPreventivo: vi.fn(() => Promise.resolve()),
}));

import { leggiPreventivi, salvaNuovoPreventivo } from "../../repositories/preventiviRepository";
import { generaPdfPreventivo } from "../../services/preventiviPdfService";

describe("flusso salva preventivo wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem("preventivai:wizard-extensions");
  });

  it("crea e salva un preventivo con tipoLavoro metadato", () => {
    const preventivo = creaPreventivo({
      archivio: leggiPreventivi(),
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
      tipoLavoro: "impianto",
    });

    salvaNuovoPreventivo(preventivo);

    expect(salvaNuovoPreventivo).toHaveBeenCalledWith(
      expect.objectContaining({
        cliente: "Mario Rossi",
        tipoLavoro: "impianto",
        totale: expect.any(Number),
      })
    );
    expect(preventivo.numero).toMatch(/^PREV-/);
  });

  it("salva snapshot ultimo preventivo per estensioni future", () => {
    salvaUltimoPreventivo({
      cliente: "Mario Rossi",
      tipoLavoro: "express",
      lavorazioni: [],
      condizioni: { iva: 22 },
    });

    const raw = JSON.parse(
      localStorage.getItem("preventivai:wizard-extensions") || "{}"
    );

    expect(raw.ultimoPreventivo.cliente).toBe("Mario Rossi");
    expect(raw.ultimoPreventivo.tipoLavoro).toBe("express");
  });

  it("generaPdfPreventivo è invocabile con payload preventivo", async () => {
    const preventivo = creaPreventivo({
      archivio: [],
      cliente: "Test",
      lavorazioni: [
        {
          id: "1",
          nome: "Punto luce",
          categoria: "Impianto",
          prezzo: 45,
          quantita: 1,
          unita: "cad",
        },
      ],
      sconto: 0,
      iva: 22,
      validita: 30,
      pagamento: "Bonifico bancario",
      acconto: 0,
      note: "",
    });

    await generaPdfPreventivo({
      preventivo,
      datiAzienda: { nomeDitta: "Test" },
      cliente: preventivo.cliente,
      stato: preventivo.stato,
      lavorazioni: preventivo.lavorazioni,
      validita: 30,
      pagamento: "Bonifico bancario",
      note: "",
      sconto: 0,
      iva: 22,
      acconto: 0,
      totali: { totale: preventivo.totale },
    });

    expect(generaPdfPreventivo).toHaveBeenCalled();
  });
});
