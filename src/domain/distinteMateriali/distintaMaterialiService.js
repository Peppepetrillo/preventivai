/**
 * Service Distinta Materiali — init, CRUD, collegamenti, ricerca, duplicazione.
 */

import { caricaCatalogoMateriali } from "../catalogoMateriali/materialiCatalogService";
import {
  aggiungiVoce,
  aggiornaDistinta,
  calcolaTotaleMateriali,
  collegaCantiere,
  collegaPreventivo,
  creaDistinta,
  duplicaDistinta,
  modificaVoce,
  normalizzaElencoDistinte,
  rimuoviVoce,
  scollegaCantiere,
  scollegaPreventivo,
  validaDistinta,
} from "./distintaMaterialiDomain";
import {
  distinteMaterialiRepository,
  exists as repoExists,
  load as repoLoad,
  replace as repoReplace,
  reset as repoReset,
  save as repoSave,
} from "./distinteMaterialiRepository";

/**
 * Inizializza lo storage se assente (array vuoto). Idempotente.
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali[]}
 */
export function inizializzaDistinteMateriali() {
  if (repoExists() || localStorage.getItem(distinteMaterialiRepository.chiave) != null) {
    return repoLoad();
  }
  return repoSave([]);
}

/**
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali[]}
 */
export function caricaDistinteMateriali() {
  inizializzaDistinteMateriali();
  return repoLoad();
}

/**
 * @param {import("./distintaMaterialiTypes").DistintaMateriali[]} elenco
 */
export function persistiDistinteMateriali(elenco) {
  return repoSave(elenco);
}

export function resetDistinteMateriali() {
  return repoReset();
}

/**
 * @param {string} id
 */
export function trovaDistintaPerId(id) {
  return (
    caricaDistinteMateriali().find((d) => d.id === String(id)) || null
  );
}

/**
 * @param {object} input
 */
export function creaDistintaMateriali(input = {}) {
  const distinta = creaDistinta(input);
  if (!distinta) return null;
  if (!validaDistinta(distinta).ok) return null;

  const elenco = caricaDistinteMateriali();
  if (elenco.some((d) => d.id === distinta.id)) return null;

  persistiDistinteMateriali([...elenco, distinta]);
  return distinta;
}

/**
 * @param {string} id
 * @param {object} patch
 */
export function aggiornaDistintaMateriali(id, patch = {}) {
  const elenco = caricaDistinteMateriali();
  const idx = elenco.findIndex((d) => d.id === String(id));
  if (idx < 0) return null;

  const aggiornata = aggiornaDistinta(elenco[idx], patch);
  if (!aggiornata || !validaDistinta(aggiornata).ok) return null;

  const prossimo = elenco.map((d, i) => (i === idx ? aggiornata : d));
  persistiDistinteMateriali(prossimo);
  return aggiornata;
}

/**
 * @param {string} id
 */
export function eliminaDistintaMateriali(id) {
  const elenco = caricaDistinteMateriali();
  const prossimo = elenco.filter((d) => d.id !== String(id));
  if (prossimo.length === elenco.length) return false;
  persistiDistinteMateriali(prossimo);
  return true;
}

/**
 * @param {string} distintaId
 * @param {object} inputVoce
 * @param {{ daCatalogo?: boolean }=} opzioni
 */
export function aggiungiVoceDistinta(distintaId, inputVoce = {}, opzioni = {}) {
  const elenco = caricaDistinteMateriali();
  const idx = elenco.findIndex((d) => d.id === String(distintaId));
  if (idx < 0) return null;

  const catalogo =
    opzioni.daCatalogo || inputVoce.varianteId || inputVoce.famigliaId
      ? caricaCatalogoMateriali()
      : undefined;

  const aggiornata = aggiungiVoce(elenco[idx], inputVoce, catalogo);
  if (!aggiornata) return null;

  const prossimo = elenco.map((d, i) => (i === idx ? aggiornata : d));
  persistiDistinteMateriali(prossimo);
  return aggiornata;
}

/**
 * @param {string} distintaId
 * @param {string} voceId
 * @param {object} patch
 */
export function modificaVoceDistinta(distintaId, voceId, patch = {}) {
  const elenco = caricaDistinteMateriali();
  const idx = elenco.findIndex((d) => d.id === String(distintaId));
  if (idx < 0) return null;

  const aggiornata = modificaVoce(elenco[idx], voceId, patch);
  if (!aggiornata) return null;

  const prossimo = elenco.map((d, i) => (i === idx ? aggiornata : d));
  persistiDistinteMateriali(prossimo);
  return aggiornata;
}

/**
 * @param {string} distintaId
 * @param {string} voceId
 */
export function rimuoviVoceDistinta(distintaId, voceId) {
  const elenco = caricaDistinteMateriali();
  const idx = elenco.findIndex((d) => d.id === String(distintaId));
  if (idx < 0) return null;

  const aggiornata = rimuoviVoce(elenco[idx], voceId);
  if (!aggiornata) return null;

  const prossimo = elenco.map((d, i) => (i === idx ? aggiornata : d));
  persistiDistinteMateriali(prossimo);
  return aggiornata;
}

/**
 * @param {string} distintaId
 * @param {{ titolo?: string }=} opzioni
 */
export function duplicaDistintaMateriali(distintaId, opzioni = {}) {
  const sorgente = trovaDistintaPerId(distintaId);
  if (!sorgente) return null;

  const copia = duplicaDistinta(sorgente, opzioni);
  if (!copia) return null;

  const elenco = caricaDistinteMateriali();
  persistiDistinteMateriali([...elenco, copia]);
  return copia;
}

/**
 * @param {string} distintaId
 * @param {string} preventivoId
 */
export function collegaDistintaAPreventivo(distintaId, preventivoId) {
  const elenco = caricaDistinteMateriali();
  const idx = elenco.findIndex((d) => d.id === String(distintaId));
  if (idx < 0) return null;

  const aggiornata = collegaPreventivo(elenco[idx], preventivoId);
  if (!aggiornata) return null;

  persistiDistinteMateriali(
    elenco.map((d, i) => (i === idx ? aggiornata : d))
  );
  return aggiornata;
}

/**
 * @param {string} distintaId
 */
export function scollegaDistintaDaPreventivo(distintaId) {
  const elenco = caricaDistinteMateriali();
  const idx = elenco.findIndex((d) => d.id === String(distintaId));
  if (idx < 0) return null;

  const aggiornata = scollegaPreventivo(elenco[idx]);
  if (!aggiornata) return null;

  persistiDistinteMateriali(
    elenco.map((d, i) => (i === idx ? aggiornata : d))
  );
  return aggiornata;
}

/**
 * @param {string} distintaId
 * @param {string} cantiereId
 */
export function collegaDistintaACantiere(distintaId, cantiereId) {
  const elenco = caricaDistinteMateriali();
  const idx = elenco.findIndex((d) => d.id === String(distintaId));
  if (idx < 0) return null;

  const aggiornata = collegaCantiere(elenco[idx], cantiereId);
  if (!aggiornata) return null;

  persistiDistinteMateriali(
    elenco.map((d, i) => (i === idx ? aggiornata : d))
  );
  return aggiornata;
}

/**
 * @param {string} distintaId
 */
export function scollegaDistintaDaCantiere(distintaId) {
  const elenco = caricaDistinteMateriali();
  const idx = elenco.findIndex((d) => d.id === String(distintaId));
  if (idx < 0) return null;

  const aggiornata = scollegaCantiere(elenco[idx]);
  if (!aggiornata) return null;

  persistiDistinteMateriali(
    elenco.map((d, i) => (i === idx ? aggiornata : d))
  );
  return aggiornata;
}

/**
 * @param {string=} query
 * @param {{ preventivoId?: string, cantiereId?: string }=} filtri
 */
export function cercaDistinteMateriali(query = "", filtri = {}) {
  let elenco = caricaDistinteMateriali();
  const q = String(query || "")
    .trim()
    .toLowerCase();

  if (filtri.preventivoId) {
    elenco = elenco.filter(
      (d) => d.collegamenti?.preventivoId === String(filtri.preventivoId)
    );
  }
  if (filtri.cantiereId) {
    elenco = elenco.filter(
      (d) => d.collegamenti?.cantiereId === String(filtri.cantiereId)
    );
  }
  if (!q) return elenco;

  return elenco.filter((d) => {
    const blob = [
      d.titolo,
      d.clienteNome,
      d.note,
      ...(d.voci || []).map((v) => v.nome),
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

/**
 * @param {string} distintaId
 */
export function totaleDistintaMateriali(distintaId) {
  const distinta = trovaDistintaPerId(distintaId);
  return calcolaTotaleMateriali(distinta);
}

export {
  calcolaTotaleMateriali,
  validaDistinta,
  normalizzaElencoDistinte,
  distinteMaterialiRepository,
  repoReplace,
};
