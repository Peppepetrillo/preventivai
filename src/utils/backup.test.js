import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS, APP_DATA_KEYS } from "../app/storageKeys";
import { creaBackupCompleto, ripristinaBackupCompleto } from "../utils/backup";
import { leggiStorage, salvaStorage } from "../utils/storage";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloudImmediato: vi.fn().mockResolvedValue(undefined),
}));

describe("backup esperienze RC-2A", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("include le esperienze in APP_DATA_KEYS e nel backup", () => {
    expect(STORAGE_KEYS.esperienze in APP_DATA_KEYS).toBe(true);

    const esperienze = [
      { id: "e1", cantiereId: 1, tipoLavoro: "impianto" },
    ];
    salvaStorage(STORAGE_KEYS.esperienze, esperienze);

    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.esperienze]).toEqual(esperienze);
  });

  it("ripristina le esperienze dal backup", async () => {
    const { salvaDatoCloudImmediato } = await import("../services/cloudSyncService");

    await ripristinaBackupCompleto({
      app: "PreventivAI",
      versione: 1,
      creatoIl: "2026-07-22T00:00:00.000Z",
      dati: {
        [STORAGE_KEYS.esperienze]: [{ id: "e-restored", cliente: "Rossi" }],
        [STORAGE_KEYS.clienti]: [],
        [STORAGE_KEYS.cantieri]: [],
        [STORAGE_KEYS.preventivi]: [],
        [STORAGE_KEYS.datiAzienda]: {},
        [STORAGE_KEYS.listino]: [],
      },
    });

    expect(leggiStorage(STORAGE_KEYS.esperienze, [])).toEqual([
      { id: "e-restored", cliente: "Rossi" },
    ]);
    expect(salvaDatoCloudImmediato).toHaveBeenCalledWith(
      STORAGE_KEYS.esperienze,
      [{ id: "e-restored", cliente: "Rossi" }]
    );
  });
});
