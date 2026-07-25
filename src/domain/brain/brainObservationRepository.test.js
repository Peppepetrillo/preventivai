import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import {
  cancellaTutteOsservazioni,
  contaOsservazioniRepository,
  inserisciOsservazione,
  leggiOsservazioni,
  scriviOsservazioni,
} from "./brainObservationRepository";

describe("brainObservationRepository", () => {
  beforeEach(() => {
    localStorage.clear();
    cancellaTutteOsservazioni();
  });

  it("persiste su LocalStorage con chiave Brain dedicata", () => {
    inserisciOsservazione({ id: "obs-1", createdAt: 1 });
    expect(leggiOsservazioni()).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.brainObservations))
    ).toEqual([{ id: "obs-1", createdAt: 1 }]);
  });

  it("scrive, conta e cancella osservazioni", () => {
    scriviOsservazioni([{ id: "a" }, { id: "b" }]);
    expect(contaOsservazioniRepository()).toBe(2);
    expect(cancellaTutteOsservazioni()).toEqual([]);
    expect(leggiOsservazioni()).toEqual([]);
  });
});
