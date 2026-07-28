import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../../app/storageKeys";
import { useCantieri } from "./useCantieri";

vi.mock("../../../services/cloudSyncService", () => ({
  creaUrlFirmatoFotoCantiere: vi.fn(),
  eliminaFotoCantiereStorage: vi.fn(),
  salvaDatoCloud: vi.fn(),
}));

describe("useCantieri", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un cantiere e lo salva mantenendolo selezionato", () => {
    const { result } = renderHook(() => useCantieri());

    act(() => {
      result.current.aggiornaCampoNuovoCantiere("nome", "Ristrutturazione");
    });

    act(() => {
      result.current.aggiungiCantiere();
    });

    expect(result.current.cantieri).toHaveLength(1);
    expect(result.current.cantiereSelezionato.nome).toBe("Ristrutturazione");
    expect(result.current.messaggio).toBe("Cantiere creato sul dispositivo.");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri))).toHaveLength(1);
  });

  it("aggiunge una voce checklist al cantiere selezionato", () => {
    const { result } = renderHook(() => useCantieri());

    act(() => {
      result.current.aggiornaCampoNuovoCantiere("nome", "Cantiere Test");
    });
    act(() => {
      result.current.aggiungiCantiere();
    });
    act(() => {
      result.current.setNuovaChecklist("Misurare pareti");
    });
    act(() => {
      result.current.aggiungiChecklist();
    });

    expect(result.current.cantiereSelezionato.checklist).toHaveLength(1);
    expect(result.current.cantiereSelezionato.checklist[0].testo).toBe("Misurare pareti");
    expect(result.current.nuovaChecklist).toBe("");
  });

  it("seleziona il cantiere iniziale quando viene passato un id", () => {
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        { id: "primo", nome: "Primo", checklist: [] },
        { id: "secondo", nome: "Secondo", checklist: [] },
      ])
    );

    const { result } = renderHook(() =>
      useCantieri({
        cantiereInizialeId: "secondo",
      })
    );

    expect(result.current.cantiereSelezionato.nome).toBe("Secondo");
  });

  it("segna il lavoro come completato", () => {
    const { result } = renderHook(() => useCantieri());

    act(() => {
      result.current.aggiornaCampoNuovoCantiere("nome", "Quadro elettrico");
    });
    act(() => {
      result.current.aggiungiCantiere();
    });
    act(() => {
      result.current.completaLavoro();
    });

    expect(result.current.cantiereSelezionato.stato).toBe("Completato");
    expect(result.current.messaggio).toBe("🏁 Lavoro completato.");
  });

  it("avvia il lavoro impostando lo stato In corso", () => {
    const { result } = renderHook(() => useCantieri());

    act(() => {
      result.current.aggiornaCampoNuovoCantiere("nome", "Impianto villa");
    });
    act(() => {
      result.current.aggiungiCantiere();
    });
    act(() => {
      result.current.iniziaLavoro();
    });

    expect(result.current.cantiereSelezionato.stato).toBe("In corso");
    expect(result.current.messaggio).toBe("Lavoro avviato.");
  });

  it("vincola la selezione all'id URL (cantiereId) senza fallback", () => {
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        { id: "primo", nome: "Primo", checklist: [] },
        { id: "secondo", nome: "Secondo", checklist: [] },
      ])
    );

    const { result } = renderHook(() =>
      useCantieri({
        cantiereId: "mancante",
      })
    );

    expect(result.current.cantiereSelezionato).toBeNull();
  });
});
