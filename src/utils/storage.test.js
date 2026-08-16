import { beforeEach, describe, expect, it, vi } from "vitest";

const { isNativePlatform, preferencesGet, preferencesSet } = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  preferencesGet: vi.fn(),
  preferencesSet: vi.fn(async () => undefined),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: (...args) => preferencesGet(...args),
    set: (...args) => preferencesSet(...args),
  },
}));

import {
  inizializzaStorageNativo,
  leggiStorage,
  salvaStorage,
} from "./storage";

describe("storage — affidabilità", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    isNativePlatform.mockReturnValue(false);
  });

  it("JSON corrotto restituisce fallback senza crash", () => {
    localStorage.setItem("chiave-rotta", "{non-json");
    expect(leggiStorage("chiave-rotta", [])).toEqual([]);
    expect(leggiStorage("chiave-rotta", { ok: true })).toEqual({ ok: true });
  });

  it("rifiuta salvataggio undefined", async () => {
    const esito = await salvaStorage("chiave-x", undefined);
    expect(esito.ok).toBe(false);
    expect(localStorage.getItem("chiave-x")).toBeNull();
  });

  it("salva oggetti validi", async () => {
    const esito = await salvaStorage("chiave-ok", [{ id: 1 }]);
    expect(esito.ok).toBe(true);
    expect(leggiStorage("chiave-ok", [])).toEqual([{ id: 1 }]);
  });

  it("quota/error localStorage non crasha e restituisce ok:false", async () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const err = new Error("QuotaExceededError");
      err.name = "QuotaExceededError";
      throw err;
    });
    const esito = await salvaStorage("chiave-quota", [{ id: 1 }]);
    expect(esito.ok).toBe(false);
    expect(esito.error).toMatch(/QuotaExceededError/);
    spy.mockRestore();
  });

  it("Preferences corrotte non sovrascrivono localStorage valido", async () => {
    isNativePlatform.mockReturnValue(true);
    localStorage.setItem("archivioPreventivi", JSON.stringify([{ id: "locale" }]));
    preferencesGet.mockResolvedValue({ value: "{corrotto" });

    await inizializzaStorageNativo();

    expect(leggiStorage("archivioPreventivi", [])).toEqual([{ id: "locale" }]);
    expect(preferencesSet).toHaveBeenCalled();
  });

  it("Preferences valide ripristinano LS vuoto/corrotto", async () => {
    isNativePlatform.mockReturnValue(true);
    localStorage.setItem("clienti", "{rotto");
    preferencesGet.mockImplementation(async ({ key }) => {
      if (key === "clienti") {
        return { value: JSON.stringify([{ id: "cloud", nome: "Mario" }]) };
      }
      return { value: null };
    });

    await inizializzaStorageNativo();

    expect(leggiStorage("clienti", [])).toEqual([{ id: "cloud", nome: "Mario" }]);
  });
});
