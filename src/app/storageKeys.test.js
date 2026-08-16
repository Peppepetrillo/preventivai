import { describe, expect, it } from "vitest";

import {
  STORAGE_FALLBACKS,
  STORAGE_KEYS,
  APP_DATA_KEYS,
  NATIVE_STORAGE_KEYS,
  CLOUD_SYNC_STORAGE_KEYS,
} from "./storageKeys";

describe("storageKeys — sync cloud APP_DATA", () => {
  it("include preventivai:esperienze in APP_DATA_KEYS per sync multi-device", () => {
    expect(STORAGE_KEYS.esperienze).toBe("preventivai:esperienze");
    expect(STORAGE_KEYS.esperienze in APP_DATA_KEYS).toBe(true);
    expect(APP_DATA_KEYS[STORAGE_KEYS.esperienze]).toEqual(
      STORAGE_FALLBACKS[STORAGE_KEYS.esperienze]
    );
    expect(APP_DATA_KEYS[STORAGE_KEYS.esperienze]).toEqual([]);
  });

  it("espone le chiavi operative core nel sync cloud", () => {
    const chiaviAttese = [
      STORAGE_KEYS.preventivi,
      STORAGE_KEYS.cantieri,
      STORAGE_KEYS.clienti,
      STORAGE_KEYS.datiAzienda,
      STORAGE_KEYS.listino,
      STORAGE_KEYS.esperienze,
    ];

    for (const chiave of chiaviAttese) {
      expect(chiave in APP_DATA_KEYS).toBe(true);
    }
  });
});

describe("storageKeys — restore nativo Capacitor", () => {
  it("ripristina tutte le STORAGE_KEYS da Preferences (nessuna perdita a cold start)", () => {
    for (const chiave of Object.values(STORAGE_KEYS)) {
      expect(chiave in NATIVE_STORAGE_KEYS).toBe(true);
      expect(NATIVE_STORAGE_KEYS[chiave]).toEqual(STORAGE_FALLBACKS[chiave]);
    }
  });

  it("include meta coda/revisioni sync nelle chiavi native", () => {
    for (const chiave of Object.values(CLOUD_SYNC_STORAGE_KEYS)) {
      expect(chiave in NATIVE_STORAGE_KEYS).toBe(true);
    }
  });
});
