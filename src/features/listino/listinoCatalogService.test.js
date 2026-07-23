import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

import { STORAGE_KEYS } from "../../app/storageKeys";
import { listinoBase } from "../../data/listinoBase";
import { salvaListino } from "../../repositories/listinoRepository";
import {
  caricaCatalogoListino,
  listinoCatalogoFuturo,
  persistiCatalogoListino,
} from "./listinoCatalogService";

describe("listinoCatalogService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("migra listino legacy al modello catalogo", () => {
    salvaListino([
      { id: "punto-luce", nome: "Punto luce", prezzo: 45, categoria: "Impianto" },
    ]);

    const catalogo = caricaCatalogoListino();
    expect(catalogo[0]).toMatchObject({
      id: "punto-luce",
      attiva: true,
      preferita: false,
      descrizione: "",
    });

    const riletto = JSON.parse(localStorage.getItem(STORAGE_KEYS.listino));
    expect(riletto[0].attiva).toBe(true);
  });

  it("persiste catalogo normalizzato e usa listino base se vuoto", () => {
    const salvato = persistiCatalogoListino(listinoBase.slice(0, 2));
    expect(salvato).toHaveLength(2);
    expect(caricaCatalogoListino()[0].nome).toBe("Punto luce");
  });

  it("stub futuri import/export/multi-listino non implementati", () => {
    expect(() => listinoCatalogoFuturo.importaCatalogo()).toThrow(/Import/i);
    expect(() => listinoCatalogoFuturo.esportaCatalogo()).toThrow(/Export/i);
    expect(() => listinoCatalogoFuturo.attivaCatalogo()).toThrow(/multipli/i);
  });
});
