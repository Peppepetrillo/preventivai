import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useCarrelloPreventivo } from "./useCarrelloPreventivo";

describe("useCarrelloPreventivo smart qty/price", () => {
  it("impostaQuantita aggiorna la quantità senza toccare il prezzo", () => {
    let lavorazioni = [
      { id: "1", nome: "Punto luce", prezzo: 45, quantita: 2 },
    ];
    const onAggiorna = vi.fn((updater) => {
      lavorazioni = updater(lavorazioni);
    });

    const { result } = renderHook(() =>
      useCarrelloPreventivo({ onAggiornaLavorazioni: onAggiorna })
    );

    act(() => {
      result.current.impostaQuantita(0, 60);
    });

    expect(lavorazioni[0].quantita).toBe(60);
    expect(lavorazioni[0].prezzo).toBe(45);
  });

  it("impostaQuantita a 0 rimuove la riga", () => {
    let lavorazioni = [
      { id: "1", nome: "Punto luce", prezzo: 45, quantita: 2 },
    ];
    const onAggiorna = vi.fn((updater) => {
      lavorazioni = updater(lavorazioni);
    });

    const { result } = renderHook(() =>
      useCarrelloPreventivo({ onAggiornaLavorazioni: onAggiorna })
    );

    act(() => {
      result.current.impostaQuantita(0, 0);
    });

    expect(lavorazioni).toHaveLength(0);
  });

  it("impostaPrezzo modifica solo la lavorazione in carrello", () => {
    let lavorazioni = [
      { id: "1", nome: "Punto luce", prezzo: 45, quantita: 2 },
    ];
    const onAggiorna = vi.fn((updater) => {
      lavorazioni = updater(lavorazioni);
    });

    const { result } = renderHook(() =>
      useCarrelloPreventivo({ onAggiornaLavorazioni: onAggiorna })
    );

    act(() => {
      result.current.impostaPrezzo(0, 55.5);
    });

    expect(lavorazioni[0].prezzo).toBe(55.5);
    expect(lavorazioni[0].quantita).toBe(2);
  });
});
