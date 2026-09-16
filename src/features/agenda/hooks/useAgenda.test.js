import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { useAgenda } from "./useAgenda";

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    cancelNotificheGiornata: vi.fn(),
    cancelNotificheCantiereCompleto: vi.fn(),
    cancelNotificheLavoro: vi.fn(),
    resyncNotificheLavoro: vi.fn(),
  },
}));

describe("useAgenda — storage SoT", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("due creaLavoro rapidi non perdono il primo (storage SoT)", () => {
    const { result } = renderHook(() => useAgenda());

    act(() => {
      result.current.creaLavoro({
        titolo: "Primo",
        cliente: "Rossi",
        scheduledDate: "16/09/2026",
      });
      result.current.creaLavoro({
        titolo: "Secondo",
        cliente: "Bianchi",
        scheduledDate: "16/09/2026",
      });
    });

    const salvati = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri) || "[]");
    expect(salvati).toHaveLength(2);
    expect(salvati.map((c) => c.nome || c.titolo || c.cliente)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Primo|Rossi/),
        expect.stringMatching(/Secondo|Bianchi/),
      ])
    );
  });
});
