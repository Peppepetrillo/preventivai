/**
 * Persistenza catalogo listino — usa il repository esistente senza modificarlo.
 * Migrazione one-shot dei campi Sprint 12A.
 *
 * Predisposizione futura (NON implementata):
 * - import/export JSON
 * - listini multipli (BTicino, Vimar, Gewiss, personale)
 */

import {
  leggiListino,
  salvaListino,
} from "../../repositories/listinoRepository";
import {
  LISTINO_CATALOGO_ATTIVO_ID,
  catalogoNecessitaMigrazione,
  normalizzaCatalogo,
} from "./listinoCatalogDomain";

/**
 * Carica e normalizza il catalogo attivo.
 * Persistisce la migrazione campi se necessario.
 * @returns {object[]}
 */
export function caricaCatalogoListino() {
  const grezzo = leggiListino();
  const catalogo = normalizzaCatalogo(grezzo);

  if (catalogoNecessitaMigrazione(grezzo)) {
    salvaListino(catalogo);
  }

  return catalogo;
}

/**
 * @param {object[]} catalogo
 * @returns {object[]}
 */
export function persistiCatalogoListino(catalogo) {
  const normalizzato = normalizzaCatalogo(catalogo);
  salvaListino(normalizzato);
  return normalizzato;
}

/**
 * Stub API futura — multi-listino / import-export.
 * Non usare in produzione finché non implementato.
 */
export const listinoCatalogoFuturo = Object.freeze({
  catalogoAttivoId: LISTINO_CATALOGO_ATTIVO_ID,
  /** @returns {never} */
  importaCatalogo() {
    throw new Error("Import listino: disponibile nello sprint successivo.");
  },
  /** @returns {never} */
  esportaCatalogo() {
    throw new Error("Export listino: disponibile nello sprint successivo.");
  },
  /** @returns {never} */
  attivaCatalogo() {
    throw new Error("Listini multipli: predisposti, non ancora attivi.");
  },
});
