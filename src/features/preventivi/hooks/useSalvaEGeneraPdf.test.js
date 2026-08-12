import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../repositories/preventiviRepository", () => ({
  leggiPreventivi: vi.fn(() => []),
  salvaNuovoPreventivo: vi.fn(),
  aggiornaPreventivo: vi.fn((_id, aggiorna) => {
    const corrente = {
      id: 1,
      numero: "PREV-1",
      cliente: "Mario",
      stato: "Bozza",
      lavorazioni: [],
    };
    return [aggiorna(corrente)];
  }),
}));

vi.mock("../../../repositories/impostazioniRepository", () => ({
  leggiDatiAzienda: vi.fn(() => ({ nomeDitta: "Test Srl" })),
}));

vi.mock("../../../services/preventiviPdfService", () => ({
  generaPdfPreventivo: vi.fn(() => Promise.resolve()),
}));

import {
  aggiornaPreventivo,
  leggiPreventivi,
  salvaNuovoPreventivo,
} from "../../../repositories/preventiviRepository";
import { generaPdfPreventivo } from "../../../services/preventiviPdfService";
import { useSalvaEGeneraPdf } from "./useSalvaEGeneraPdf";

const STATO = {
  cliente: "Mario Rossi",
  tipoLavoro: "impianto",
  lavorazioni: [
    {
      id: "1",
      nome: "Punto luce",
      categoria: "Impianto",
      prezzo: 40,
      quantita: 2,
      unita: "cad",
    },
  ],
  condizioni: {
    sconto: 0,
    iva: 22,
    validita: 30,
    pagamento: "Bonifico bancario",
    acconto: 0,
    note: "",
  },
};

describe("useSalvaEGeneraPdf UX-5.3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    leggiPreventivi.mockReturnValue([]);
  });

  it("salva il preventivo e genera il PDF", async () => {
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    let preventivo;
    await act(async () => {
      preventivo = await result.current.salvaEGeneraPdf(STATO);
    });

    expect(salvaNuovoPreventivo).toHaveBeenCalledTimes(1);
    expect(generaPdfPreventivo).toHaveBeenCalledTimes(1);
    expect(preventivo?.cliente).toBe("Mario Rossi");
    expect(result.current.pdfGenerato).toBe(true);
    expect(result.current.preventivoSalvato).toEqual(
      expect.objectContaining({ cliente: "Mario Rossi" })
    );
  });

  it("non crea un secondo preventivo al retry", async () => {
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    await act(async () => {
      await result.current.salvaEGeneraPdf(STATO);
    });

    const primoId = result.current.preventivoSalvato.id;
    leggiPreventivi.mockReturnValue([result.current.preventivoSalvato]);

    await act(async () => {
      await result.current.salvaEGeneraPdf(STATO);
    });

    expect(salvaNuovoPreventivo).toHaveBeenCalledTimes(1);
    expect(aggiornaPreventivo).toHaveBeenCalled();
    expect(result.current.preventivoSalvato.id).toBe(primoId);
  });

  it("mantiene il preventivo salvato se il PDF fallisce", async () => {
    generaPdfPreventivo.mockRejectedValueOnce(new Error("pdf fail"));
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    await act(async () => {
      await result.current.salvaEGeneraPdf(STATO);
    });

    expect(salvaNuovoPreventivo).toHaveBeenCalledTimes(1);
    expect(result.current.preventivoSalvato).toBeTruthy();
    expect(result.current.pdfGenerato).toBe(false);
    expect(result.current.avvisoPdf).toMatch(/PDF non generato/i);
  });

  it("riprova solo il PDF senza creare un nuovo preventivo", async () => {
    generaPdfPreventivo.mockRejectedValueOnce(new Error("pdf fail"));
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    await act(async () => {
      await result.current.salvaEGeneraPdf(STATO);
    });

    generaPdfPreventivo.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.riprovaPdf(STATO.condizioni);
    });

    expect(salvaNuovoPreventivo).toHaveBeenCalledTimes(1);
    expect(generaPdfPreventivo).toHaveBeenCalledTimes(2);
    expect(result.current.pdfGenerato).toBe(true);
  });
});
