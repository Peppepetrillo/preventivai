/**
 * Repository Distinte Materiali — persistenza isolata, senza UI.
 * Storage key: preventivai.distinteMateriali
 *
 * Locale-only: non entra in APP_DATA_KEYS.
 */

import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../../app/storageKeys";
import { creaRepositoryLocale } from "../../repositories/localStorageRepository";
import { normalizzaElencoDistinte } from "./distintaMaterialiDomain";

const CHIAVE = STORAGE_KEYS.distinteMateriali;
const FALLBACK = STORAGE_FALLBACKS[CHIAVE];

const repo = creaRepositoryLocale(CHIAVE, FALLBACK);

/**
 * @returns {boolean}
 */
export function exists() {
  return loadRaw().length > 0;
}

/**
 * Lettura senza side-effect.
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali[]}
 */
export function loadRaw() {
  try {
    const grezzo = localStorage.getItem(CHIAVE);
    if (grezzo == null) return [];
    const parsed = JSON.parse(grezzo);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    return normalizzaElencoDistinte(parsed);
  } catch {
    return [];
  }
}

/**
 * Carica l'elenco. Se vuoto/corrotto → array vuoto (nessun seed obbligatorio).
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali[]}
 */
export function load() {
  return loadRaw();
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali[]} elenco
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali[]}
 */
export function save(elenco = []) {
  const normalizzato = normalizzaElencoDistinte(elenco);
  repo.salva(normalizzato);
  return normalizzato;
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali[]} elenco
 */
export function replace(elenco = []) {
  return save(elenco);
}

/**
 * Svuota lo storage.
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali[]}
 */
export function reset() {
  return save([]);
}

export const distinteMaterialiRepository = Object.freeze({
  exists,
  load,
  loadRaw,
  save,
  replace,
  reset,
  chiave: CHIAVE,
});

export default distinteMaterialiRepository;
