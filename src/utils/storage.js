import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { CHIAVI_STORAGE_NATIVO } from "./chiaviStorage";

function usaStorageNativo() {
  return Capacitor.isNativePlatform();
}

function jsonValido(testo) {
  if (testo == null || testo === "") return false;
  try {
    JSON.parse(testo);
    return true;
  } catch {
    return false;
  }
}

export function leggiStorage(chiave, fallback = []) {
  try {
    const dato = localStorage.getItem(chiave);
    if (dato == null) return fallback;
    return JSON.parse(dato);
  } catch (errore) {
    console.error("Errore localStorage:", errore);
    return fallback;
  }
}

/**
 * Salva su localStorage (+ Preferences su native).
 * Rifiuta `undefined` (evita stringa "undefined" e wipe silenziosi).
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export function salvaStorage(chiave, valore) {
  if (valore === undefined) {
    console.error("salvaStorage: valore undefined rifiutato", chiave);
    return Promise.resolve({ ok: false, error: "undefined" });
  }

  try {
    const dato = JSON.stringify(valore);
    localStorage.setItem(chiave, dato);

    if (usaStorageNativo()) {
      return Preferences.set({ key: chiave, value: dato })
        .then(() => ({ ok: true }))
        .catch((errore) => {
          console.error("Errore storage nativo:", errore);
          return { ok: false, error: errore?.message || "preferences_failed" };
        });
    }

    return Promise.resolve({ ok: true });
  } catch (errore) {
    console.error("Errore salvataggio:", errore);
    return Promise.resolve({
      ok: false,
      error: errore?.name || errore?.message || "save_failed",
    });
  }
}

/**
 * Idra localStorage da Preferences senza perdere dati locali più freschi.
 * - Preferences corrotte → non sovrascrivono LS
 * - Entrambi validi → resta LS (scrittura sync), Preferences si riallinea
 * - Solo Preferences → ripristina LS (wipe WKWebView)
 */
export async function inizializzaStorageNativo() {
  if (!usaStorageNativo()) return;

  await Promise.all(
    Object.keys(CHIAVI_STORAGE_NATIVO).map(async (chiave) => {
      let value;
      try {
        const esito = await Preferences.get({ key: chiave });
        value = esito?.value ?? null;
      } catch (errore) {
        console.error("Errore lettura Preferences:", errore);
        return;
      }

      const locale = localStorage.getItem(chiave);
      const prefsOk = value !== null && jsonValido(value);
      const localeOk = locale !== null && jsonValido(locale);

      if (prefsOk && !localeOk) {
        localStorage.setItem(chiave, value);
        return;
      }

      if (localeOk) {
        if (!prefsOk || locale !== value) {
          await Preferences.set({ key: chiave, value: locale }).catch((errore) => {
            console.error("Errore allineamento Preferences:", errore);
          });
        }
        return;
      }

      if (locale !== null && !localeOk) {
        localStorage.removeItem(chiave);
      }
    })
  );
}
