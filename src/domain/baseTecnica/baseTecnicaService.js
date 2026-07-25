/**
 * Service Base Tecnica — API di consultazione per il Knowledge Engine.
 *
 * Non genera preventivi. Non risolve prezzi. Non calcola quantità.
 * Espone conoscenza spiegabile (motivazione, origine, verifiche).
 */

import {
  condizioniSchedaSoddisfatte,
  BASE_TECNICA_PRIORITA,
} from "./baseTecnicaTypes";
import * as repo from "./baseTecnicaRepository";

const ORDINE_PRIORITA = Object.freeze({
  [BASE_TECNICA_PRIORITA.ALTA]: 3,
  [BASE_TECNICA_PRIORITA.MEDIA]: 2,
  [BASE_TECNICA_PRIORITA.BASSA]: 1,
});

/**
 * @param {object[]} schede
 * @returns {object[]}
 */
function ordinaPerPriorita(schede = []) {
  return [...schede].sort((a, b) => {
    const pa = ORDINE_PRIORITA[a.priorita] || 0;
    const pb = ORDINE_PRIORITA[b.priorita] || 0;
    if (pb !== pa) return pb - pa;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function elencaSchedeTecniche() {
  return repo.leggiSchede();
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function ottieniSchedaTecnica(id) {
  return repo.trovaPerId(id);
}

/**
 * @param {string} id
 * @returns {string|null}
 */
export function ottieniMotivazione(id) {
  return repo.trovaPerId(id)?.motivazione || null;
}

/**
 * @param {string} id
 * @returns {{ tipo: string, riferimento?: string }|null}
 */
export function ottieniOrigine(id) {
  const scheda = repo.trovaPerId(id);
  return scheda?.origine ? { ...scheda.origine } : null;
}

/**
 * @param {string} id
 * @returns {string[]}
 */
export function ottieniVerificheProfessionista(id) {
  const scheda = repo.trovaPerId(id);
  return scheda ? [...(scheda.verificheProfessionista || [])] : [];
}

/**
 * @param {string} categoria
 * @returns {object[]}
 */
export function elencaPerCategoria(categoria) {
  return repo.trovaPerCategoria(categoria);
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function elencaSezioni() {
  return repo.leggiSezioni();
}

/**
 * @param {object} inputKnowledge
 * @param {{ soloEnabled?: boolean, categoria?: string }=} opzioni
 * @returns {object[]}
 */
export function consultaBaseTecnica(inputKnowledge = {}, opzioni = {}) {
  const soloEnabled = opzioni.soloEnabled !== false;
  let schede = repo.leggiSchede();

  if (soloEnabled) {
    schede = schede.filter((s) => s.enabled !== false);
  }

  if (opzioni.categoria) {
    schede = schede.filter((s) => s.categoria === opzioni.categoria);
  }

  const applicabili = schede.filter((scheda) =>
    condizioniSchedaSoddisfatte(scheda.condizioni, inputKnowledge)
  );

  return ordinaPerPriorita(applicabili);
}

/**
 * Mappa catalogoId → schedaTecnicaId dalle schede applicabili all'input.
 * Se più schede condividono lo stesso catalogoId, vince la priorità più alta.
 *
 * @param {object} inputKnowledge
 * @returns {Map<string, string>}
 */
export function mappaCatalogoIdASchedaTecnica(inputKnowledge = {}) {
  const mappa = new Map();
  for (const scheda of consultaBaseTecnica(inputKnowledge)) {
    for (const catalogoId of scheda.catalogoIds || []) {
      if (!catalogoId || mappa.has(catalogoId)) continue;
      mappa.set(catalogoId, scheda.id);
    }
  }
  return mappa;
}

/**
 * @param {string} catalogoId
 * @param {object} inputKnowledge
 * @returns {string|null}
 */
export function risolviSchedaTecnicaId(catalogoId, inputKnowledge = {}) {
  if (!catalogoId) return null;
  return (
    mappaCatalogoIdASchedaTecnica(inputKnowledge).get(String(catalogoId)) ||
    null
  );
}

/**
 * @param {object} inputKnowledge
 * @returns {string[]}
 */
export function catalogoIdsDaBaseTecnica(inputKnowledge = {}) {
  return [...mappaCatalogoIdASchedaTecnica(inputKnowledge).keys()];
}

/**
 * @returns {{ totaleSchede: number, perCategoria: Record<string, number>, sezioni: number }}
 */
export function statisticheBaseTecnica() {
  const schede = repo.leggiSchede();
  const perCategoria = Object.create(null);
  for (const sezione of repo.leggiSezioni()) {
    perCategoria[sezione.id] = 0;
  }
  for (const scheda of schede) {
    perCategoria[scheda.categoria] = (perCategoria[scheda.categoria] || 0) + 1;
  }
  return {
    totaleSchede: schede.length,
    perCategoria,
    sezioni: repo.leggiSezioni().length,
  };
}
