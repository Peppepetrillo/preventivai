/**
 * Service Decision Flow Assistente Sopralluogo.
 *
 * Flusso: risposta → (eventuale) PROPOSTA → conferma elettricista → CONFERMATA.
 * Nessuna modifica automatica a Knowledge Engine / Proposal / totali.
 * Nessun prezzo gestito qui: solo catalogoId + quantità.
 */

import { creaIdBrain } from "../brain/brainTypes";
import { calcolaTotali } from "../../utils/preventivi";
import {
  inferisciStatoMemoria,
  MEMORY_STATO as MEMORY_STATO_PERSISTITO,
  registraSceltaAssistente,
} from "../decisionMemory";
import { aggiungiDecisionIdASessione } from "../sopralluogoSession";
import {
  creaAzioneProposta,
  creaDecisione,
  DECISION_AZIONE_TIPO,
  DECISION_ORIGINE,
  DECISION_STATO,
  parsificaQuantitaRisposta,
} from "./assistantDecisionTypes";
import * as repo from "./assistantDecisionRepository";

/**
 * Mappa domanda → azione proposta (prima implementazione).
 * Solo quantità + catalogoId. Nessun prezzo.
 */
export const DECISION_MAPPINGS = Object.freeze({
  ASK_CLIMA_QUANTI: Object.freeze({
    tipo: DECISION_AZIONE_TIPO.AGGIORNA_QUANTITA,
    catalogoId: "CLIMA",
    etichetta: "CLIMA",
  }),
  ASK_UFFICIO_POSTAZIONI_DATI: Object.freeze({
    tipo: DECISION_AZIONE_TIPO.AGGIORNA_QUANTITA,
    catalogoId: "PUNTO_DATI",
    etichetta: "PUNTO_DATI",
  }),
});

/**
 * @param {string} catalogoId
 * @param {number} quantita
 * @returns {string}
 */
export function messaggioPropostaQuantita(catalogoId, quantita) {
  return `Impostare ${catalogoId} quantità ${quantita}?`;
}

/**
 * Deriva azione da domanda + risposta, se supportata.
 * @param {string} domandaId
 * @param {unknown} risposta
 * @returns {{ azione: object, messaggioProposta: string }|null}
 */
export function derivaAzioneDaRisposta(domandaId, risposta) {
  const mapping = DECISION_MAPPINGS[String(domandaId)];
  if (!mapping) return null;

  const quantita = parsificaQuantitaRisposta(risposta);
  if (quantita === null) return null;

  const azione = creaAzioneProposta({
    tipo: mapping.tipo,
    catalogoId: mapping.catalogoId,
    quantita,
    etichetta: mapping.etichetta,
  });

  return {
    azione,
    messaggioProposta: messaggioPropostaQuantita(
      mapping.etichetta || mapping.catalogoId,
      quantita
    ),
  };
}

/**
 * Riceve una risposta e crea decisione.
 * Se mappabile → stato PROPOSTA con azione; altrimenti RICEVUTA.
 * Non tocca preventivo / KE / pricing.
 *
 * @param {string} domandaId
 * @param {unknown} risposta
 * @param {{ id?: string, timestamp?: number }=} opzioni
 * @returns {object}
 */
export function riceviRisposta(domandaId, risposta, opzioni = {}) {
  const id = opzioni.id || creaIdBrain("dec");
  const derivata = derivaAzioneDaRisposta(domandaId, risposta);

  const decisione = creaDecisione({
    id,
    domandaId: String(domandaId),
    risposta,
    stato: derivata ? DECISION_STATO.PROPOSTA : DECISION_STATO.RICEVUTA,
    origine: DECISION_ORIGINE.ASSISTENTE_SOPRALLUOGO,
    timestamp: opzioni.timestamp || Date.now(),
    azione: derivata?.azione || null,
    messaggioProposta: derivata?.messaggioProposta || null,
  });

  return repo.salvaDecisione(decisione);
}

/**
 * Aggiorna la risposta di una decisione in PROPOSTA (o RICEVUTA) e ricalcola azione.
 * @param {string} decisioneId
 * @param {unknown} nuovaRisposta
 * @returns {object|null}
 */
export function modificaProposta(decisioneId, nuovaRisposta) {
  const esistente = repo.trovaDecisionePerId(decisioneId);
  if (!esistente) return null;
  if (
    esistente.stato !== DECISION_STATO.PROPOSTA &&
    esistente.stato !== DECISION_STATO.RICEVUTA
  ) {
    return esistente;
  }

  const derivata = derivaAzioneDaRisposta(esistente.domandaId, nuovaRisposta);
  const aggiornata = creaDecisione({
    ...esistente,
    risposta: nuovaRisposta,
    stato: derivata ? DECISION_STATO.PROPOSTA : DECISION_STATO.RICEVUTA,
    timestamp: Date.now(),
    azione: derivata?.azione || null,
    messaggioProposta: derivata?.messaggioProposta || null,
  });

  return repo.salvaDecisione(aggiornata);
}

/**
 * Quantità corrente in proposal per catalogoId (valore KE / precedente).
 * @param {object|null} proposal
 * @param {string} catalogoId
 * @returns {number|null}
 */
function quantitaInProposal(proposal, catalogoId) {
  if (!proposal || !catalogoId) return null;
  const lav = (proposal.lavorazioni || []).find(
    (l) => l.catalogoId === catalogoId
  );
  if (!lav) return null;
  const q = Number(lav.quantita);
  return Number.isFinite(q) ? q : null;
}

/**
 * Persiste in Decision Memory dopo conferma/ignora.
 * @param {object} decisione
 * @param {{
 *   proposal?: object|null,
 *   sessionId?: string|null,
 *   preventivoId?: string|null,
 *   statoForzato?: string,
 * }=} opzioni
 */
function persistiInDecisionMemory(decisione, opzioni = {}) {
  if (!decisione?.azione?.catalogoId) return null;
  if (!opzioni.sessionId) {
    throw new Error("Persistenza Decision Memory richiede sessionId.");
  }

  const valoreScelto = decisione.azione.quantita;
  const valorePrecedente = quantitaInProposal(
    opzioni.proposal,
    decisione.azione.catalogoId
  );

  let stato = opzioni.statoForzato;
  if (!stato) {
    if (decisione.stato === DECISION_STATO.IGNORATA) {
      stato = MEMORY_STATO_PERSISTITO.IGNORATA;
    } else {
      stato = inferisciStatoMemoria(valoreScelto, valorePrecedente);
    }
  }

  const record = registraSceltaAssistente({
    sessionId: opzioni.sessionId,
    domandaId: decisione.domandaId,
    catalogoId: decisione.azione.catalogoId,
    valorePrecedente,
    valoreScelto,
    tipoAzione: decisione.azione.tipo,
    stato,
    preventivoId: opzioni.preventivoId ?? null,
  });

  aggiungiDecisionIdASessione(opzioni.sessionId, record.id);
  return record;
}

/**
 * Conferma esplicita dell'elettricista. Non applica ancora al preventivo.
 * @param {string} decisioneId
 * @param {{
 *   proposal?: object|null,
 *   sessionId?: string|null,
 *   preventivoId?: string|null,
 *   persistiMemoria?: boolean,
 * }=} opzioni
 * @returns {object|null}
 */
export function confermaDecisione(decisioneId, opzioni = {}) {
  const esistente = repo.trovaDecisionePerId(decisioneId);
  if (!esistente) return null;
  if (esistente.stato !== DECISION_STATO.PROPOSTA) return esistente;

  const confermata = creaDecisione({
    ...esistente,
    stato: DECISION_STATO.CONFERMATA,
    timestamp: Date.now(),
  });
  const salvata = repo.salvaDecisione(confermata);

  if (opzioni.persistiMemoria !== false) {
    persistiInDecisionMemory(salvata, {
      proposal: opzioni.proposal,
      sessionId: opzioni.sessionId,
      preventivoId: opzioni.preventivoId,
    });
  }

  return salvata;
}

/**
 * Ignora la proposta (o la risposta).
 * @param {string} decisioneId
 * @param {{
 *   proposal?: object|null,
 *   sessionId?: string|null,
 *   preventivoId?: string|null,
 *   persistiMemoria?: boolean,
 * }=} opzioni
 * @returns {object|null}
 */
export function ignoraDecisione(decisioneId, opzioni = {}) {
  const esistente = repo.trovaDecisionePerId(decisioneId);
  if (!esistente) return null;
  if (
    esistente.stato === DECISION_STATO.CONFERMATA ||
    esistente.stato === DECISION_STATO.IGNORATA
  ) {
    return esistente;
  }

  const ignorata = creaDecisione({
    ...esistente,
    stato: DECISION_STATO.IGNORATA,
    timestamp: Date.now(),
  });
  const salvata = repo.salvaDecisione(ignorata);

  if (opzioni.persistiMemoria !== false && salvata.azione?.catalogoId) {
    persistiInDecisionMemory(salvata, {
      proposal: opzioni.proposal,
      sessionId: opzioni.sessionId,
      preventivoId: opzioni.preventivoId,
      statoForzato: MEMORY_STATO_PERSISTITO.IGNORATA,
    });
  }

  return salvata;
}

/**
 * Applica esplicitamente una decisione CONFERMATA a una copia della proposal.
 * - Aggiorna solo quantità su lavorazione con catalogoId
 * - Ricalcola totali dai prezzi già presenti (Listino già risolto in Proposal)
 * - Non chiama Knowledge Engine né Proposal Service
 * - Non introduce prezzi
 *
 * @param {object|null} proposal
 * @param {object} decisione
 * @returns {{ success: boolean, proposal: object|null, error?: string }}
 */
export function applicaDecisioneConfermataAProposal(proposal, decisione) {
  if (!decisione || decisione.stato !== DECISION_STATO.CONFERMATA) {
    return {
      success: false,
      proposal: proposal || null,
      error: "decisione_non_confermata",
    };
  }

  const azione = decisione.azione;
  if (!azione || azione.tipo !== DECISION_AZIONE_TIPO.AGGIORNA_QUANTITA) {
    return {
      success: false,
      proposal: proposal || null,
      error: "azione_non_supportata",
    };
  }

  if (!proposal || !Array.isArray(proposal.lavorazioni)) {
    return {
      success: false,
      proposal: proposal || null,
      error: "proposal_assente",
    };
  }

  const idx = proposal.lavorazioni.findIndex(
    (l) => l.catalogoId === azione.catalogoId
  );
  if (idx < 0) {
    return {
      success: false,
      proposal,
      error: "lavorazione_assente",
    };
  }

  const lavorazioni = proposal.lavorazioni.map((l, i) => {
    if (i !== idx) return { ...l };
    const quantita = azione.quantita;
    const prezzoUnitario = l.prezzoConfigurato ? l.prezzoUnitario : null;
    const totale =
      l.prezzoConfigurato && prezzoUnitario != null
        ? quantita * Number(prezzoUnitario)
        : null;
    return { ...l, quantita, totale };
  });

  const perCalcolo = lavorazioni
    .filter((l) => l.prezzoConfigurato)
    .map((l) => ({
      prezzo: l.prezzoUnitario,
      quantita: l.quantita,
    }));

  const totali = calcolaTotali(
    perCalcolo,
    proposal.scontoPercentuale ?? 0,
    proposal.ivaPercentuale ?? 22
  );

  return {
    success: true,
    proposal: {
      ...proposal,
      lavorazioni,
      subtotale: totali.subtotale,
      totaleIVA: totali.importoIva,
      totale: totali.totale,
    },
  };
}

/**
 * Conferma + applica in un passo esplicito (sempre opt-in).
 * Persiste in Decision Memory prima dell'apply (valorePrecedente da proposal).
 * @param {string} decisioneId
 * @param {object|null} proposal
 * @param {{ sessionId?: string|null, preventivoId?: string|null }=} opzioni
 */
export function confermaEApplicaAProposal(decisioneId, proposal, opzioni = {}) {
  const confermata = confermaDecisione(decisioneId, {
    proposal,
    sessionId: opzioni.sessionId,
    preventivoId: opzioni.preventivoId,
    persistiMemoria: true,
  });
  if (!confermata || confermata.stato !== DECISION_STATO.CONFERMATA) {
    return {
      success: false,
      decisione: confermata,
      proposal,
      error: "conferma_fallita",
    };
  }
  const esito = applicaDecisioneConfermataAProposal(proposal, confermata);
  return { ...esito, decisione: confermata };
}

export function ottieniDecisione(id) {
  return repo.trovaDecisionePerId(id);
}

export function ottieniDecisionePerDomanda(domandaId) {
  return repo.trovaUltimaDecisionePerDomanda(domandaId);
}

export function elencaDecisioniAssistente() {
  return repo.elencaDecisioni();
}

export function resetDecisioniAssistente() {
  repo.resetDecisioni();
}

/**
 * Invariante: nessuna decisione/azione contiene prezzi.
 * @returns {boolean}
 */
export function decisioniSenzaPrezzi() {
  return repo.elencaDecisioni().every((d) => {
    const json = JSON.stringify(d);
    return !/"prezzo"|prezzoUnitario|"totale"/i.test(json.replace(
      /"stato":"[^"]*"/g,
      ""
    ));
  });
}
