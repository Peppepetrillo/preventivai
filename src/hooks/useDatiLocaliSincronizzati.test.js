import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { APP_EVENTS } from "../app/events";
import {
  useCloudSyncTick,
  useDatiLocaliSincronizzati,
} from "./useDatiLocaliSincronizzati";

describe("useDatiLocaliSincronizzati", () => {
  it("aggiorna lo stato quando arriva cloudSyncAggiornata", () => {
    let valore = [{ id: 1 }];
    const leggi = () => valore;

    const { result } = renderHook(() => useDatiLocaliSincronizzati(leggi));
    expect(result.current[0]).toEqual([{ id: 1 }]);

    valore = [{ id: 2 }];
    act(() => {
      window.dispatchEvent(new Event(APP_EVENTS.cloudSyncAggiornata));
    });

    expect(result.current[0]).toEqual([{ id: 2 }]);
  });

  it("incrementa il tick sync", () => {
    const { result } = renderHook(() => useCloudSyncTick());
    expect(result.current).toBe(0);

    act(() => {
      window.dispatchEvent(new Event(APP_EVENTS.cloudSyncAggiornata));
    });

    expect(result.current).toBe(1);
  });
});
