import { STORAGE_KEYS } from "../../../app/storageKeys";
import { leggiStorage, salvaStorage } from "../../../utils/storage";
import {
  SERIE_CIVILE_DEFAULT,
  SERIE_CIVILE_DEFAULT_ID,
} from "./contestoPreventivoModel";

/**
 * Persistenza locale del catalogo Serie Civile.
 * Usa salvaStorage diretto → NON passa da cloud sync.
 */

function assicuratiDefault(elenco) {
  const lista = Array.isArray(elenco) ? [...elenco] : [];
  const haDefault = lista.some(
    (serie) => String(serie?.id) === SERIE_CIVILE_DEFAULT_ID
  );
  if (!haDefault) {
    lista.unshift({ ...SERIE_CIVILE_DEFAULT });
  }
  return lista;
}

export function leggiSerieCivili() {
  const grezzo = leggiStorage(STORAGE_KEYS.serieCivili, null);
  if (!Array.isArray(grezzo) || grezzo.length === 0) {
    const iniziale = [{ ...SERIE_CIVILE_DEFAULT }];
    salvaStorage(STORAGE_KEYS.serieCivili, iniziale);
    return iniziale;
  }
  return assicuratiDefault(grezzo);
}

export function salvaSerieCivili(elenco) {
  const normalizzato = assicuratiDefault(elenco);
  salvaStorage(STORAGE_KEYS.serieCivili, normalizzato);
  return normalizzato;
}

/**
 * Raccolta opzionale di id già presenti su preventivi salvati
 * (forward-compatible se in futuro il contesto verrà persistito sul doc).
 * @param {Array<object>} preventivi
 * @returns {string[]}
 */
export function raccogliSerieCiviliInUso(preventivi = []) {
  const ids = new Set();
  (preventivi || []).forEach((preventivo) => {
    const id =
      preventivo?.contesto?.serieCivileId ||
      preventivo?.serieCivileId ||
      null;
    if (id) ids.add(String(id));
  });
  return [...ids];
}
