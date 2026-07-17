import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

import { STORAGE_KEYS } from "../app/storageKeys";
import { salvaDatoCloud } from "../services/cloudSyncService";
import { leggiClienti, salvaClienti, trovaCliente } from "./clientiRepository";
import { creaRepositoryLocale } from "./localStorageRepository";

describe("clientiRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("legge il fallback quando non ci sono clienti salvati", () => {
    expect(leggiClienti()).toEqual([]);
  });

  it("salva clienti in cache locale e propaga il dato al sync cloud", () => {
    const clienti = [
      {
        id: 1,
        nome: "Mario Rossi",
        telefono: "333",
      },
    ];

    salvaClienti(clienti);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.clienti))).toEqual(clienti);
    expect(salvaDatoCloud).toHaveBeenCalledWith(STORAGE_KEYS.clienti, clienti);
  });

  it("trova un cliente tramite id normalizzato a stringa", () => {
    salvaClienti([{ id: 10, nome: "Cliente Test" }]);

    expect(trovaCliente("10")).toEqual({ id: 10, nome: "Cliente Test" });
  });

  it("crea repository locali riutilizzabili con fallback e sincronizzazione cloud", () => {
    const repository = creaRepositoryLocale("chiaveTest", []);
    const valore = [{ id: "demo" }];

    expect(repository.leggi()).toEqual([]);

    repository.salva(valore);

    expect(repository.leggi()).toEqual(valore);
    expect(salvaDatoCloud).toHaveBeenCalledWith("chiaveTest", valore);
  });
});
