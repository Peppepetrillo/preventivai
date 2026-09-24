import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { leggiStorage, salvaStorage } from "../utils/storage";
import { TEMA, normalizzaPreferenzaTema } from "./themeDomain";

/**
 * Preferenza tema — device-local (Preferences + LS), fuori backup/cloud.
 * @returns {"chiaro"|"scuro"|"sistema"}
 */
export function leggiPreferenzaTema() {
  const grezzo = leggiStorage(
    STORAGE_KEYS.tema,
    STORAGE_FALLBACKS[STORAGE_KEYS.tema] ?? TEMA.sistema
  );
  return normalizzaPreferenzaTema(grezzo);
}

/**
 * @param {"chiaro"|"scuro"|"sistema"} preferenza
 */
export function salvaPreferenzaTema(preferenza) {
  const valore = normalizzaPreferenzaTema(preferenza);
  return salvaStorage(STORAGE_KEYS.tema, valore);
}
