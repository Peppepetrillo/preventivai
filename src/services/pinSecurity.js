/**
 * Sicurezza PIN locale (RC-3).
 * - Hash PBKDF2-SHA-256 (mai plaintext)
 * - Migrazione automatica da PIN legacy in chiaro
 * - Stub biometria per integrazioni future (Face ID / Touch ID)
 *
 * Il PIN NON è in APP_DATA_KEYS → nessun impatto sul cloud sync.
 */

import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { leggiStorage, salvaStorage } from "../utils/storage";

export const PIN_MIN_LEN = 4;
export const PIN_MAX_LEN = 6;
export const APP_LOCK_SESSION_KEY = "preventivai-sbloccata";
export const APP_LOCK_ACTIVITY_KEY = "preventivai-app-lock-activity";

const ALGORITMO = "PBKDF2";
/** Iterazioni ridotte in test per non rallentare la suite; produzione resta robusta. */
const ITERAZIONI =
  typeof import.meta !== "undefined" && import.meta.env?.MODE === "test"
    ? 5_000
    : 120_000;
const LUNGHEZZA_HASH_BITS = 256;

export const TIMEOUT_INATTIVITA_OPZIONI = [
  { valore: 0, etichetta: "Solo all'apertura" },
  { valore: 1, etichetta: "1 minuto" },
  { valore: 5, etichetta: "5 minuti" },
  { valore: 15, etichetta: "15 minuti" },
  { valore: 30, etichetta: "30 minuti" },
];

const CONFIG_FALLBACK = { timeoutMinuti: 5 };

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex) {
  const pulito = String(hex || "");
  const bytes = new Uint8Array(pulito.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(pulito.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

function generaSale() {
  const sale = new Uint8Array(16);
  crypto.getRandomValues(sale);
  return bufferToHex(sale);
}

/**
 * @param {string} pin
 * @param {string} saleHex
 * @returns {Promise<string>}
 */
export async function derivaHashPin(pin, saleHex) {
  const encoder = new TextEncoder();
  const materiale = await crypto.subtle.importKey(
    "raw",
    encoder.encode(String(pin)),
    ALGORITMO,
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: ALGORITMO,
      salt: hexToBuffer(saleHex),
      iterations: ITERAZIONI,
      hash: "SHA-256",
    },
    materiale,
    LUNGHEZZA_HASH_BITS
  );

  return bufferToHex(bits);
}

/**
 * @param {unknown} valore
 * @returns {boolean}
 */
export function eRecordPinHash(valore) {
  if (!valore || typeof valore !== "object") return false;
  return (
    Number(valore.v) >= 1 &&
    typeof valore.salt === "string" &&
    typeof valore.hash === "string" &&
    valore.salt.length > 0 &&
    valore.hash.length > 0
  );
}

/**
 * @param {unknown} grezzo
 * @returns {{ tipo: "assente"|"hash"|"legacy", record?: object, legacy?: string }}
 */
export function interpretaPinSalvato(grezzo) {
  if (grezzo == null || grezzo === "") {
    return { tipo: "assente" };
  }

  if (typeof grezzo === "object" && eRecordPinHash(grezzo)) {
    return { tipo: "hash", record: grezzo };
  }

  if (typeof grezzo === "string") {
    const trim = grezzo.trim();
    if (!trim) return { tipo: "assente" };

    try {
      const parsed = JSON.parse(trim);
      if (eRecordPinHash(parsed)) {
        return { tipo: "hash", record: parsed };
      }
    } catch {
      // legacy plaintext
    }

    if (/^\d{4,6}$/.test(trim)) {
      return { tipo: "legacy", legacy: trim };
    }
  }

  return { tipo: "assente" };
}

export function validaFormatoPin(pin) {
  const pulito = String(pin || "").trim();
  if (!pulito) {
    return { ok: true, pin: "", disattiva: true };
  }
  if (!/^\d+$/.test(pulito)) {
    return { ok: false, errore: "Il PIN deve contenere solo cifre." };
  }
  if (pulito.length < PIN_MIN_LEN || pulito.length > PIN_MAX_LEN) {
    return {
      ok: false,
      errore: `Usa un PIN di ${PIN_MIN_LEN}-${PIN_MAX_LEN} cifre.`,
    };
  }
  return { ok: true, pin: pulito, disattiva: false };
}

/**
 * @returns {boolean}
 */
export function pinEAttivo() {
  const grezzo = leggiStorage(
    STORAGE_KEYS.pinAccesso,
    STORAGE_FALLBACKS[STORAGE_KEYS.pinAccesso]
  );
  return interpretaPinSalvato(grezzo).tipo !== "assente";
}

/**
 * Imposta o aggiorna il PIN (sempre come hash).
 * @param {string} pin
 */
export async function impostaPinSicuro(pin) {
  const validazione = validaFormatoPin(pin);
  if (!validazione.ok) {
    throw new Error(validazione.errore);
  }
  if (validazione.disattiva) {
    disattivaPin();
    return null;
  }

  const salt = generaSale();
  const hash = await derivaHashPin(validazione.pin, salt);
  const record = {
    v: 1,
    alg: ALGORITMO,
    iter: ITERAZIONI,
    salt,
    hash,
    // Stub: predisposizione biometria (non ancora collegata al SO).
    biometriaAbilitata: false,
  };

  salvaStorage(STORAGE_KEYS.pinAccesso, record);
  return record;
}

export function disattivaPin() {
  salvaStorage(STORAGE_KEYS.pinAccesso, "");
  sessionStorage.removeItem(APP_LOCK_SESSION_KEY);
  sessionStorage.removeItem(APP_LOCK_ACTIVITY_KEY);
}

/**
 * Verifica il PIN. Migra automaticamente i PIN legacy in chiaro.
 * @param {string} pinInserito
 * @returns {Promise<boolean>}
 */
export async function verificaPinSicuro(pinInserito) {
  const grezzo = leggiStorage(
    STORAGE_KEYS.pinAccesso,
    STORAGE_FALLBACKS[STORAGE_KEYS.pinAccesso]
  );
  const interpretato = interpretaPinSalvato(grezzo);

  if (interpretato.tipo === "assente") return true;

  const tentativo = String(pinInserito || "").trim();

  if (interpretato.tipo === "legacy") {
    if (tentativo !== interpretato.legacy) return false;
    await impostaPinSicuro(tentativo);
    return true;
  }

  const atteso = interpretato.record;
  const calcolato = await derivaHashPin(tentativo, atteso.salt);
  return calcolato === atteso.hash;
}

export function leggiConfigAppLock() {
  const grezzo = leggiStorage(STORAGE_KEYS.appLockConfig, CONFIG_FALLBACK);
  const timeout = Number(grezzo?.timeoutMinuti);
  return {
    timeoutMinuti: Number.isFinite(timeout)
      ? timeout
      : CONFIG_FALLBACK.timeoutMinuti,
  };
}

export function salvaConfigAppLock(config) {
  const timeout = Number(config?.timeoutMinuti);
  const payload = {
    timeoutMinuti: Number.isFinite(timeout)
      ? timeout
      : CONFIG_FALLBACK.timeoutMinuti,
  };
  salvaStorage(STORAGE_KEYS.appLockConfig, payload);
  return payload;
}

export function marcaSessioneSbloccata() {
  sessionStorage.setItem(APP_LOCK_SESSION_KEY, "true");
  sessionStorage.setItem(APP_LOCK_ACTIVITY_KEY, String(Date.now()));
}

export function sessioneESbloccata() {
  return sessionStorage.getItem(APP_LOCK_SESSION_KEY) === "true";
}

export function registraAttivitaUtente() {
  sessionStorage.setItem(APP_LOCK_ACTIVITY_KEY, String(Date.now()));
}

export function bloccoPerInattivitaNecessario(ora = Date.now()) {
  if (!pinEAttivo()) return false;
  if (!sessioneESbloccata()) return false;

  const { timeoutMinuti } = leggiConfigAppLock();
  if (!timeoutMinuti || timeoutMinuti <= 0) return false;

  const ultimo = Number(sessionStorage.getItem(APP_LOCK_ACTIVITY_KEY) || 0);
  if (!ultimo) return true;

  return ora - ultimo >= timeoutMinuti * 60_000;
}

export function bloccaSessioneApp() {
  sessionStorage.removeItem(APP_LOCK_SESSION_KEY);
  sessionStorage.removeItem(APP_LOCK_ACTIVITY_KEY);
}

/**
 * Stub biometria — nessuna API nativa collegata in RC-3.
 * @returns {Promise<{ disponibile: boolean, motivo: string }>}
 */
export async function verificaDisponibilitaBiometria() {
  return {
    disponibile: false,
    motivo:
      "Face ID / Touch ID saranno disponibili in un aggiornamento successivo.",
  };
}
