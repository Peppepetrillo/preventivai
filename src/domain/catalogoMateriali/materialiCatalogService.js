/**
 * Service Catalogo Materiali — init, seed idempotente, CRUD, ricerca.
 */

import {
  catalogoMaterialiRepository,
  exists as repoExists,
  replace as repoReplace,
  reset as repoReset,
  save as repoSave,
} from "./catalogoMaterialiRepository";
import {
  aggiungiFamigliaAlCatalogo,
  aggiungiVarianteAllaFamiglia,
  aggiornaFamigliaNelCatalogo,
  aggiornaVarianteNelCatalogo,
  cercaFamiglieMateriali,
  clonaSeedCatalogoMateriali,
  creaFamigliaPersonalizzata,
  creaVarianteMateriale,
  elencaFamigliePerCategoria,
  isCatalogoMaterialiPopolato,
  rimuoviFamigliaDalCatalogo,
  rimuoviVarianteDalCatalogo,
} from "./materialiCatalogDomain";
import { CATEGORIE_MATERIALE } from "./materialiTypes";

/**
 * Inizializza il catalogo se assente. Se già popolato, merge conservativo col seed.
 * Idempotente: non duplica e non sovrascrive personalizzazioni.
 * @returns {import("./materialiTypes").FamigliaMateriale[]}
 */
export function inizializzaCatalogoMateriali() {
  return catalogoMaterialiRepository.load();
}

/**
 * Alias esplicito: seed solo se vuoto.
 * @returns {{ catalogo: import("./materialiTypes").FamigliaMateriale[], seeded: boolean }}
 */
export function assicuraSeedCatalogoMateriali() {
  const giaPopolato = repoExists();
  const catalogo = inizializzaCatalogoMateriali();
  return { catalogo, seeded: !giaPopolato };
}

/**
 * @returns {import("./materialiTypes").FamigliaMateriale[]}
 */
export function caricaCatalogoMateriali() {
  return inizializzaCatalogoMateriali();
}

/**
 * @param {import("./materialiTypes").FamigliaMateriale[]} catalogo
 */
export function persistiCatalogoMateriali(catalogo) {
  return repoSave(catalogo);
}

/**
 * Reset esplicito al seed (operazione distruttiva sulle personalizzazioni).
 */
export function resetCatalogoMateriali() {
  return repoReset();
}

/**
 * @param {object} input
 * @returns {import("./materialiTypes").FamigliaMateriale|null}
 */
export function creaFamigliaCatalogo(input = {}) {
  const famiglia = creaFamigliaPersonalizzata(input);
  if (!famiglia) return null;

  const catalogo = caricaCatalogoMateriali();
  if (catalogo.some((f) => f.id === famiglia.id)) {
    return null;
  }

  const prossimo = aggiungiFamigliaAlCatalogo(catalogo, famiglia);
  persistiCatalogoMateriali(prossimo);
  return famiglia;
}

/**
 * @param {string} famigliaId
 * @param {object} patch
 */
export function aggiornaFamigliaCatalogo(famigliaId, patch = {}) {
  const catalogo = caricaCatalogoMateriali();
  const esiste = catalogo.some((f) => f.id === String(famigliaId));
  if (!esiste) return null;

  const prossimo = aggiornaFamigliaNelCatalogo(catalogo, famigliaId, patch);
  persistiCatalogoMateriali(prossimo);
  return prossimo.find((f) => f.id === String(famigliaId)) || null;
}

/**
 * Disattiva (default) o elimina hard se personalizzata.
 * @param {string} famigliaId
 * @param {{ hard?: boolean }=} opzioni
 */
export function eliminaFamigliaCatalogo(famigliaId, opzioni = {}) {
  const catalogo = caricaCatalogoMateriali();
  const target = catalogo.find((f) => f.id === String(famigliaId));
  if (!target) return false;

  const prossimo = rimuoviFamigliaDalCatalogo(catalogo, famigliaId, opzioni);
  persistiCatalogoMateriali(prossimo);
  return true;
}

/**
 * @param {string} famigliaId
 * @param {boolean} attiva
 */
export function impostaAttivaFamigliaCatalogo(famigliaId, attiva) {
  return aggiornaFamigliaCatalogo(famigliaId, { attiva: Boolean(attiva) });
}

/**
 * @param {string} famigliaId
 * @param {object} input
 */
export function creaVarianteCatalogo(famigliaId, input = {}) {
  const catalogo = caricaCatalogoMateriali();
  const famiglia = catalogo.find((f) => f.id === String(famigliaId));
  if (!famiglia) return null;

  const variante = creaVarianteMateriale(famigliaId, input);
  if (!variante) return null;
  if (famiglia.varianti.some((v) => v.id === variante.id)) return null;

  const prossimo = aggiungiVarianteAllaFamiglia(catalogo, famigliaId, variante);
  persistiCatalogoMateriali(prossimo);
  return variante;
}

/**
 * @param {string} famigliaId
 * @param {string} varianteId
 * @param {object} patch
 */
export function aggiornaVarianteCatalogo(famigliaId, varianteId, patch = {}) {
  const catalogo = caricaCatalogoMateriali();
  const famiglia = catalogo.find((f) => f.id === String(famigliaId));
  if (!famiglia) return null;
  if (!famiglia.varianti.some((v) => v.id === String(varianteId))) return null;

  const prossimo = aggiornaVarianteNelCatalogo(
    catalogo,
    famigliaId,
    varianteId,
    patch
  );
  persistiCatalogoMateriali(prossimo);
  const aggiornata = prossimo
    .find((f) => f.id === String(famigliaId))
    ?.varianti.find((v) => v.id === String(varianteId));
  return aggiornata || null;
}

/**
 * @param {string} famigliaId
 * @param {string} varianteId
 * @param {{ hard?: boolean }=} opzioni
 */
export function eliminaVarianteCatalogo(famigliaId, varianteId, opzioni = {}) {
  const catalogo = caricaCatalogoMateriali();
  const famiglia = catalogo.find((f) => f.id === String(famigliaId));
  if (!famiglia) return false;
  if (!famiglia.varianti.some((v) => v.id === String(varianteId))) return false;

  const prossimo = rimuoviVarianteDalCatalogo(
    catalogo,
    famigliaId,
    varianteId,
    opzioni
  );
  persistiCatalogoMateriali(prossimo);
  return true;
}

/**
 * @param {string} famigliaId
 * @param {string} varianteId
 * @param {boolean} attiva
 */
export function impostaAttivaVarianteCatalogo(famigliaId, varianteId, attiva) {
  return aggiornaVarianteCatalogo(famigliaId, varianteId, {
    attiva: Boolean(attiva),
  });
}

/**
 * @param {string=} query
 * @param {{ categoria?: string, soloAttive?: boolean, soloPersonalizzate?: boolean }=} filtri
 */
export function cercaCatalogoMateriali(query = "", filtri = {}) {
  let elenco = caricaCatalogoMateriali();

  if (filtri.categoria) {
    elenco = elencaFamigliePerCategoria(elenco, filtri.categoria);
  }

  elenco = cercaFamiglieMateriali(elenco, query);

  if (filtri.soloAttive) {
    elenco = elenco
      .filter((f) => f.attiva)
      .map((f) => ({
        ...f,
        varianti: f.varianti.filter((v) => v.attiva),
      }));
  }

  if (filtri.soloPersonalizzate) {
    elenco = elenco.filter((f) => f.personalizzata);
  }

  return elenco;
}

/**
 * @param {string=} categoria
 */
export function filtraCatalogoPerCategoria(categoria) {
  return elencaFamigliePerCategoria(caricaCatalogoMateriali(), categoria);
}

/**
 * @param {string} famigliaId
 */
export function trovaFamigliaCatalogo(famigliaId) {
  return (
    caricaCatalogoMateriali().find((f) => f.id === String(famigliaId)) || null
  );
}

/**
 * @param {string} varianteId
 */
export function trovaVarianteCatalogo(varianteId) {
  for (const famiglia of caricaCatalogoMateriali()) {
    const variante = famiglia.varianti.find(
      (v) => v.id === String(varianteId)
    );
    if (variante) return { famiglia, variante };
  }
  return null;
}

export function elencaCategorieCatalogoMateriali() {
  return [...CATEGORIE_MATERIALE];
}

/**
 * Utility test / recovery: forza replace con seed fresco.
 */
export function sostituisciConSeedCatalogoMateriali() {
  return repoReplace(clonaSeedCatalogoMateriali());
}

export {
  isCatalogoMaterialiPopolato,
  clonaSeedCatalogoMateriali,
  catalogoMaterialiRepository,
};
