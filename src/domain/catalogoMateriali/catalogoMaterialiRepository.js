/**
 * Repository Catalogo Materiali — persistenza isolata, senza UI.
 * Storage key: preventivai.catalogoMateriali
 *
 * Non entra in APP_DATA_KEYS (locale-only, come listaSpesa/insights).
 */

import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../../app/storageKeys";
import { creaRepositoryLocale } from "../../repositories/localStorageRepository";
import {
  clonaSeedCatalogoMateriali,
  normalizzaCatalogoMateriali,
} from "./materialiCatalogDomain";

const CHIAVE = STORAGE_KEYS.catalogoMateriali;
const FALLBACK = STORAGE_FALLBACKS[CHIAVE];

const repo = creaRepositoryLocale(CHIAVE, FALLBACK);

/**
 * True solo se esiste almeno una famiglia valida persistita.
 * @returns {boolean}
 */
export function exists() {
  return loadRaw().length > 0;
}

/**
 * Lettura grezza senza seed automatico.
 * @returns {import("./materialiTypes").FamigliaMateriale[]}
 */
export function loadRaw() {
  try {
    const grezzo = localStorage.getItem(CHIAVE);
    if (grezzo == null) return [];
    const parsed = JSON.parse(grezzo);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    return normalizzaCatalogoMateriali(parsed);
  } catch {
    return [];
  }
}

/**
 * Carica il catalogo. Se storage vuoto/corrotto → seed.
 * Non sovrascrive un catalogo già popolato.
 * @returns {import("./materialiTypes").FamigliaMateriale[]}
 */
export function load() {
  if (!exists()) {
    const seed = clonaSeedCatalogoMateriali();
    repo.salva(seed);
    return normalizzaCatalogoMateriali(seed);
  }
  return loadRaw();
}

/**
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 * @returns {import("./materialiTypes").FamigliaMateriale[]}
 */
export function save(catalogo = []) {
  const normalizzato = normalizzaCatalogoMateriali(catalogo);
  repo.salva(normalizzato);
  return normalizzato;
}

/**
 * Sostituisce integralmente il catalogo persistito.
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 */
export function replace(catalogo = []) {
  return save(catalogo);
}

/**
 * Ripristina il seed di sistema (cancella personalizzazioni).
 * @returns {import("./materialiTypes").FamigliaMateriale[]}
 */
export function reset() {
  const seed = clonaSeedCatalogoMateriali();
  return save(seed);
}

export const catalogoMaterialiRepository = Object.freeze({
  exists,
  load,
  loadRaw,
  save,
  replace,
  reset,
  chiave: CHIAVE,
});

export default catalogoMaterialiRepository;
