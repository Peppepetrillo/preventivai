/**
 * Preventivo Proposal — tipi DTO economici.
 * Nessuna UI / nessun Knowledge Engine qui.
 */

import { creaIdBrain } from "../brain/brainTypes";

export const ORIGINE_LAVORAZIONE = Object.freeze({
  BASE: "BASE",
  BRAIN: "BRAIN",
  LISTINO: "LISTINO",
});

/**
 * @typedef {Object} LavorazioneProposal
 * @property {string} id
 * @property {string} descrizione
 * @property {number} quantita
 * @property {number|null} prezzoUnitario
 * @property {number|null} totale
 * @property {string} unita
 * @property {string} origine
 * @property {string=} regola
 * @property {string=} perche
 * @property {boolean} prezzoConfigurato
 * @property {string=} listinoId
 * @property {string=} catalogoId
 * @property {string=} categoria
 */

/**
 * @typedef {Object} PreventivoProposal
 * @property {string} id
 * @property {object} riepilogo
 * @property {LavorazioneProposal[]} lavorazioni
 * @property {number} subtotale
 * @property {number} totaleIVA
 * @property {number} totale
 * @property {number} ivaPercentuale
 * @property {object[]} regoleApplicate
 * @property {object} brainInsights
 * @property {object=} conoscenzaProposta
 */

/**
 * @param {Partial<LavorazioneProposal>} dati
 * @returns {LavorazioneProposal}
 */
export function creaLavorazioneProposal(dati = {}) {
  const quantita = Math.max(Number(dati.quantita) || 1, 0);
  const prezzoConfigurato = Boolean(dati.prezzoConfigurato);
  const prezzoUnitario = prezzoConfigurato
    ? Number(dati.prezzoUnitario) || 0
    : null;
  const totale =
    prezzoConfigurato && prezzoUnitario !== null
      ? quantita * prezzoUnitario
      : null;

  return {
    id: dati.id || creaIdBrain("lav"),
    descrizione: String(dati.descrizione || "").trim() || "Lavorazione",
    quantita,
    prezzoUnitario,
    totale,
    unita: String(dati.unita || "cad").trim() || "cad",
    origine: dati.origine || ORIGINE_LAVORAZIONE.BASE,
    regola: dati.regola || "",
    perche: dati.perche || "",
    prezzoConfigurato,
    listinoId: dati.listinoId || null,
    catalogoId: dati.catalogoId || null,
    categoria: dati.categoria || "",
  };
}

/**
 * @param {Partial<PreventivoProposal>} dati
 * @returns {PreventivoProposal}
 */
export function creaPreventivoProposal(dati = {}) {
  return {
    id: dati.id || creaIdBrain("prop"),
    creatoAt: dati.creatoAt || Date.now(),
    riepilogo: {
      superficieMq: dati.riepilogo?.superficieMq ?? null,
      livelloImpianto: dati.riepilogo?.livelloImpianto || "",
      tipoImmobile: dati.riepilogo?.tipoImmobile || "",
      puntiStimati: dati.riepilogo?.puntiStimati ?? null,
      quadroSuggerito: dati.riepilogo?.quadroSuggerito || null,
      ...(dati.riepilogo || {}),
    },
    lavorazioni: Array.isArray(dati.lavorazioni) ? dati.lavorazioni : [],
    subtotale: Number(dati.subtotale) || 0,
    totaleIVA: Number(dati.totaleIVA) || 0,
    totale: Number(dati.totale) || 0,
    ivaPercentuale: Number(dati.ivaPercentuale) || 22,
    scontoPercentuale: Number(dati.scontoPercentuale) || 0,
    regoleApplicate: Array.isArray(dati.regoleApplicate)
      ? dati.regoleApplicate
      : [],
    brainInsights: {
      patterns: [],
      suggerimentiBrain: [],
      ...(dati.brainInsights || {}),
    },
    conoscenzaProposta: dati.conoscenzaProposta || null,
    input: dati.input || null,
  };
}
