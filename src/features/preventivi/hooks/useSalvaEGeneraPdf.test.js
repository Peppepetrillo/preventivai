import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isNativePlatform = vi.fn(() => false);

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

vi.mock("../../../repositories/preventiviRepository", () => ({
  leggiPreventivi: vi.fn(() => []),
  salvaNuovoPreventivo: vi.fn((p) => p),
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

vi.mock("../preventiviDomain", async () => {
  const actual = await vi.importActual("../preventiviDomain");
  return {
    ...actual,
    creaPreventivo: vi.fn((args) =>
      actual.creaPreventivo({
        ...args,
        archivio: args.archivio || [],
      })
    ),
  };
});

import {
  aggiornaPreventivo,
  leggiPreventivi,
  salvaNuovoPreventivo,
} from "../../../repositories/preventiviRepository";
import { generaPdfPreventivo } from "../../../services/preventiviPdfService";
import { creaPreventivo } from "../preventiviDomain";
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
    isNativePlatform.mockReturnValue(false);
    leggiPreventivi.mockReturnValue([]);
    generaPdfPreventivo.mockResolvedValue({
      blob: new Blob(["pdf"], { type: "application/pdf" }),
      nomeFile: "PREV-1.pdf",
    });
  });

  it("salva il preventivo e genera il PDF", async () => {
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    let preventivo;
    await act(async () => {
      preventivo = await result.current.salvaEGeneraPdf(STATO);
    });

    await waitFor(() => {
      expect(result.current.pdfGenerato).toBe(true);
    });

    expect(salvaNuovoPreventivo).toHaveBeenCalledTimes(1);
    expect(generaPdfPreventivo).toHaveBeenCalledTimes(1);
    expect(generaPdfPreventivo.mock.calls[0][0].salva).toBe(true);
    expect(preventivo?.cliente).toBe("Mario Rossi");
    expect(result.current.preventivoSalvato).toEqual(
      expect.objectContaining({ cliente: "Mario Rossi" })
    );
  });

  it("su Capacitor non richiede doc.save automatico", async () => {
    isNativePlatform.mockReturnValue(true);
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    await act(async () => {
      await result.current.salvaEGeneraPdf(STATO);
    });

    await waitFor(() => {
      expect(generaPdfPreventivo).toHaveBeenCalled();
    });

    expect(generaPdfPreventivo.mock.calls[0][0].salva).toBe(false);
    expect(result.current.preventivoSalvato).toBeTruthy();
  });

  it("su Capacitor mantiene il blob PDF per condivisione nativa", async () => {
    isNativePlatform.mockReturnValue(true);
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    await act(async () => {
      await result.current.salvaEGeneraPdf(STATO);
    });

    await waitFor(() => {
      expect(result.current.pdfGenerato).toBe(true);
    });

    expect(result.current.pdfBlob).toBeInstanceOf(Blob);
    expect(result.current.pdfNomeFile).toBe("PREV-1.pdf");
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
    generaPdfPreventivo.mockRejectedValue(new Error("pdf fail"));
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    await act(async () => {
      await result.current.salvaEGeneraPdf(STATO);
    });

    await waitFor(() => {
      expect(result.current.avvisoPdf).toMatch(/PDF non generato/i);
    });

    expect(salvaNuovoPreventivo).toHaveBeenCalledTimes(1);
    expect(result.current.preventivoSalvato).toBeTruthy();
    expect(result.current.pdfGenerato).toBe(false);
  });

  it("mostra successo senza attendere un PDF pending", async () => {
    let resolvePdf;
    generaPdfPreventivo.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePdf = resolve;
        })
    );

    const { result } = renderHook(() => useSalvaEGeneraPdf());

    let salvaPromise;
    await act(async () => {
      salvaPromise = result.current.salvaEGeneraPdf(STATO);
      await salvaPromise;
    });

    expect(result.current.preventivoSalvato).toBeTruthy();
    expect(result.current.pdfGenerato).toBe(false);
    expect(salvaNuovoPreventivo).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePdf({});
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.pdfGenerato).toBe(true);
    });
  });

  it("riprova solo il PDF senza creare un nuovo preventivo", async () => {
    generaPdfPreventivo.mockRejectedValueOnce(new Error("pdf fail"));
    const { result } = renderHook(() => useSalvaEGeneraPdf());

    await act(async () => {
      await result.current.salvaEGeneraPdf(STATO);
    });

    await waitFor(() => {
      expect(result.current.avvisoPdf).toMatch(/PDF non generato/i);
    });

    const chiamateCrea = creaPreventivo.mock.calls.length;
    generaPdfPreventivo.mockResolvedValueOnce({});

    await act(async () => {
      await result.current.riprovaPdf(STATO.condizioni);
    });

    expect(salvaNuovoPreventivo).toHaveBeenCalledTimes(1);
    expect(creaPreventivo.mock.calls.length).toBe(chiamateCrea);
    expect(generaPdfPreventivo).toHaveBeenCalledTimes(2);
    expect(result.current.pdfGenerato).toBe(true);
  });
});
