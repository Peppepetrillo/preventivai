import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { APP_DATA_KEYS, STORAGE_KEYS } from "../app/storageKeys";
import { TRIAL_GIORNI, PIANO } from "../domain/freemium/freemiumDomain";

/**
 * Release invariants — must stay true until HUMAN GO changes them.
 * Docs-only October plan relies on these facts.
 */
describe("October release invariants", () => {
  it("trial resta 15 giorni e ladder TRIAL/FREE/PRO esiste", () => {
    expect(TRIAL_GIORNI).toBe(15);
    expect(PIANO.TRIAL).toBe("trial");
    expect(PIANO.FREE).toBe("free");
    expect(PIANO.PRO).toBe("pro");
  });

  it("CORE APP_DATA_KEYS invariato (no satellite silenzioso)", () => {
    const core = Object.keys(APP_DATA_KEYS).sort();
    expect(core).toEqual(
      [
        STORAGE_KEYS.preventivi,
        STORAGE_KEYS.cantieri,
        STORAGE_KEYS.clienti,
        STORAGE_KEYS.datiAzienda,
        STORAGE_KEYS.listino,
        STORAGE_KEYS.esperienze,
      ].sort()
    );
  });

  it("satelliti restano fuori APP_DATA_KEYS", () => {
    expect(STORAGE_KEYS.distinteMateriali in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.firme in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.varianti in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.listaSpesa in APP_DATA_KEYS).toBe(false);
    expect(STORAGE_KEYS.catalogoMateriali in APP_DATA_KEYS).toBe(false);
  });

  it("Bundle ID Capacitor resta com.preventivai.app", () => {
    const cap = JSON.parse(readFileSync("capacitor.config.json", "utf8"));
    expect(cap.appId).toBe("com.preventivai.app");
    expect(cap.appName).toBe("PreventivAI");
  });

  it("iOS dichiara microfono e speech per Preventivo vocale", () => {
    const plist = readFileSync("ios/App/App/Info.plist", "utf8");
    expect(plist).toMatch(/NSMicrophoneUsageDescription/);
    expect(plist).toMatch(/NSSpeechRecognitionUsageDescription/);
    expect(plist).toMatch(/Preventivo vocale/);
  });

  it("Android dichiara RECORD_AUDIO", () => {
    const manifest = readFileSync(
      "android/app/src/main/AndroidManifest.xml",
      "utf8"
    );
    expect(manifest).toMatch(/android.permission.RECORD_AUDIO/);
  });
});
