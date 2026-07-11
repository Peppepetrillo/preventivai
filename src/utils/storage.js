import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { CHIAVI_STORAGE_NATIVO } from "./chiaviStorage";

const usaStorageNativo = Capacitor.isNativePlatform();

export function leggiStorage(chiave, fallback = []) {
  try {
    const dato = localStorage.getItem(chiave);
    return dato ? JSON.parse(dato) : fallback;
  } catch (errore) {
    console.error("Errore localStorage:", errore);
    return fallback;
  }
}

export function salvaStorage(chiave, valore) {
  try {
    const dato = JSON.stringify(valore);
    localStorage.setItem(chiave, dato);

    if (usaStorageNativo) {
      return Preferences.set({ key: chiave, value: dato }).catch((errore) => {
        console.error("Errore storage nativo:", errore);
      });
    }
  } catch (errore) {
    console.error("Errore salvataggio:", errore);
  }

  return Promise.resolve();
}

export async function inizializzaStorageNativo() {
  if (!usaStorageNativo) return;

  await Promise.all(
    Object.keys(CHIAVI_STORAGE_NATIVO).map(async (chiave) => {
      const { value } = await Preferences.get({ key: chiave });

      if (value !== null) {
        localStorage.setItem(chiave, value);
        return;
      }

      const valoreLocale = localStorage.getItem(chiave);
      if (valoreLocale !== null) {
        await Preferences.set({ key: chiave, value: valoreLocale });
      }
    })
  );
}
