import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useWizardPreventivoState } from "./useWizardPreventivoState";

describe("useWizardPreventivoState clienteId UX-12", () => {
  it("mantiene clienteId dalla selezione cliente", () => {
    const { result } = renderHook(() => useWizardPreventivoState());

    act(() => {
      result.current.selezionaCliente({ nome: "Mario Rossi", id: 42 });
    });

    expect(result.current.stato.cliente).toBe("Mario Rossi");
    expect(result.current.stato.clienteId).toBe(42);
  });

  it("azzera clienteId se il nome viene impostato come testo libero", () => {
    const { result } = renderHook(() => useWizardPreventivoState());

    act(() => {
      result.current.selezionaCliente({ nome: "Mario Rossi", id: 42 });
      result.current.impostaCliente("Altro Nome");
    });

    expect(result.current.stato.cliente).toBe("Altro Nome");
    expect(result.current.stato.clienteId).toBeNull();
  });

  it("imposta clienteId da oggetto con id query param", () => {
    const { result } = renderHook(() => useWizardPreventivoState());

    act(() => {
      result.current.impostaCliente({ nome: "Verdi", id: 99 });
    });

    expect(result.current.stato.clienteId).toBe(99);
  });
});
