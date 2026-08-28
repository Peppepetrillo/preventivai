import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../../app/storageKeys";
import { useCantieri } from "./useCantieri";

vi.mock("../../../services/cloudSyncService", () => ({
  creaUrlFirmatoFotoCantiere: vi.fn(),
  eliminaFotoCantiereStorage: vi.fn(),
  salvaDatoCloud: vi.fn(),
}));

vi.mock("../services/cantieriFotoService", () => ({
  apriFotoCantiere: vi.fn(),
  risolviSrcFotoCantiere: vi.fn(async (foto) => foto?.src || ""),
  eliminaStorageFotoCantiere: vi.fn(),
  eliminaStorageFotoCantieri: vi.fn(),
  fileFotoValido: vi.fn(() => true),
  preparaFotoCantiere: vi.fn(async (file) => ({
    id: "foto-1",
    nome: file.name,
    src: "blob://foto",
    miniatura: "blob://thumb",
  })),
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
    expect(result.current.cantiereSelezionato.diario).toHaveLength(1);
    expect(result.current.cantiereSelezionato.diario[0].title).toBe("Cantiere creato");
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
    expect(
      result.current.cantiereSelezionato.diario.some(
        (evento) =>
          evento.title === "Checklist" &&
          String(evento.description).includes("Misurare pareti")
      )
    ).toBe(true);
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
    expect(result.current.messaggio).toBe("Lavoro finito.");
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
    expect(
      result.current.cantiereSelezionato.diario.some(
        (evento) => evento.title === "Cantiere avviato"
      )
    ).toBe(true);
  });

  it("aggiunge una nota manuale al diario", () => {
    const { result } = renderHook(() => useCantieri());

    act(() => {
      result.current.aggiornaCampoNuovoCantiere("nome", "Impianto villa");
    });
    act(() => {
      result.current.aggiungiCantiere();
    });
    act(() => {
      result.current.aggiungiNotaDiario("Cliente preferisce LED caldi");
    });

    expect(
      result.current.cantiereSelezionato.diario.some(
        (evento) =>
          evento.title === "Nota" &&
          evento.description === "Cliente preferisce LED caldi"
      )
    ).toBe(true);
  });

  it("genera un evento quando viene aggiunta una foto", async () => {
    const { result } = renderHook(() => useCantieri());

    act(() => {
      result.current.aggiornaCampoNuovoCantiere("nome", "Impianto villa");
    });
    act(() => {
      result.current.aggiungiCantiere();
    });

    await act(async () => {
      await result.current.aggiungiFoto({
        target: {
          files: [{ name: "quadro.jpg", type: "image/jpeg" }],
          value: "fake",
        },
      });
    });

    expect(result.current.cantiereSelezionato.foto).toHaveLength(1);
    expect(
      result.current.cantiereSelezionato.diario.some(
        (evento) => evento.title === "Foto aggiunta"
      )
    ).toBe(true);
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

  it("sposta un cantiere nel Cestino in qualsiasi stato senza richiedere Completato", () => {
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        { id: "c-attivo", nome: "Attivo", stato: "In corso", foto: [] },
        { id: "c-altro", nome: "Altro", stato: "Da iniziare", foto: [] },
      ])
    );

    const { result } = renderHook(() =>
      useCantieri({ cantiereId: "c-attivo" })
    );

    let ok;
    act(() => {
      ok = result.current.eliminaCantiere();
    });

    expect(ok).toBe(true);
    expect(result.current.cantieriAttivi).toHaveLength(1);
    expect(result.current.cantieriAttivi[0].id).toBe("c-altro");
    expect(result.current.messaggio).toBe("Elemento spostato nel Cestino.");
    const salvati = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri));
    expect(salvati).toHaveLength(2);
    expect(salvati.find((c) => c.id === "c-attivo").deletedAt).toBeTruthy();
  });
});
