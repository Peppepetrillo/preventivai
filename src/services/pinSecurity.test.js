import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { leggiStorage } from "../utils/storage";
import {
  bloccoPerInattivitaNecessario,
  bloccaSessioneApp,
  disattivaPin,
  impostaPinSicuro,
  interpretaPinSalvato,
  marcaSessioneSbloccata,
  pinEAttivo,
  salvaConfigAppLock,
  validaFormatoPin,
  verificaDisponibilitaBiometria,
  verificaPinSicuro,
} from "./pinSecurity";

describe("pinSecurity RC-3", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("salva il PIN come hash e non in chiaro", async () => {
    await impostaPinSicuro("1234");

    const grezzo = leggiStorage(STORAGE_KEYS.pinAccesso, "");
    expect(String(JSON.stringify(grezzo))).not.toContain("1234");
    expect(interpretaPinSalvato(grezzo).tipo).toBe("hash");
    expect(pinEAttivo()).toBe(true);
    expect(await verificaPinSicuro("1234")).toBe(true);
    expect(await verificaPinSicuro("9999")).toBe(false);
  });

  it("migra un PIN legacy in chiaro al primo sblocco corretto", async () => {
    localStorage.setItem(STORAGE_KEYS.pinAccesso, JSON.stringify("5678"));
    expect(interpretaPinSalvato(leggiStorage(STORAGE_KEYS.pinAccesso, "")).tipo).toBe(
      "legacy"
    );

    expect(await verificaPinSicuro("5678")).toBe(true);
    const dopo = interpretaPinSalvato(leggiStorage(STORAGE_KEYS.pinAccesso, ""));
    expect(dopo.tipo).toBe("hash");
  });

  it("disattiva il blocco e valida il formato", async () => {
    await impostaPinSicuro("4321");
    disattivaPin();
    expect(pinEAttivo()).toBe(false);

    expect(validaFormatoPin("12").ok).toBe(false);
    expect(validaFormatoPin("abcdef").ok).toBe(false);
    expect(validaFormatoPin("").disattiva).toBe(true);
  });

  it("rileva inattività oltre il timeout configurato", () => {
    localStorage.setItem(
      STORAGE_KEYS.pinAccesso,
      JSON.stringify({ v: 1, salt: "ab", hash: "cd" })
    );
    salvaConfigAppLock({ timeoutMinuti: 5 });
    marcaSessioneSbloccata();

    const ora = Date.now();
    sessionStorage.setItem(
      "preventivai-app-lock-activity",
      String(ora - 6 * 60_000)
    );

    expect(bloccoPerInattivitaNecessario(ora)).toBe(true);
    bloccaSessioneApp();
    expect(sessionStorage.getItem("preventivai-sbloccata")).toBeNull();
  });

  it("espone stub biometria non disponibile", async () => {
    const esito = await verificaDisponibilitaBiometria();
    expect(esito.disponibile).toBe(false);
    expect(esito.motivo).toMatch(/Face ID|Touch ID/i);
  });
});
