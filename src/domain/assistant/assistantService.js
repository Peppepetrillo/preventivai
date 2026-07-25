/**
 * Service Assistente Sopralluogo.
 * Propone domande tecniche in base all'input. Non tocca pricing / preventivo.
 */

import { condizioniSchedaSoddisfatte } from "../baseTecnica/baseTecnicaTypes";
import { ottieniSchedaTecnica } from "../baseTecnica/baseTecnicaService";
import { creaKnowledgeInput } from "../knowledge/knowledgeInputTypes";
import { ASSISTANT_PRIORITA } from "./assistantTypes";
import * as repo from "./assistantRepository";

const ORDINE_PRIORITA = Object.freeze({
  [ASSISTANT_PRIORITA.ALTA]: 3,
  [ASSISTANT_PRIORITA.MEDIA]: 2,
  [ASSISTANT_PRIORITA.BASSA]: 1,
});

/**
 * @param {object[]} domande
 * @returns {object[]}
 */
function ordinaPerPriorita(domande = []) {
  return [...domande].sort((a, b) => {
    const pa = ORDINE_PRIORITA[a.priorita] || 0;
    const pb = ORDINE_PRIORITA[b.priorita] || 0;
    if (pb !== pa) return pb - pa;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * @param {object} formOrInput — form UI o KnowledgeInput
 * @returns {object} KnowledgeInput
 */
export function normalizzaInputAssistente(formOrInput = {}) {
  return creaKnowledgeInput(formOrInput);
}

/**
 * Domande attive per l'input corrente (escluse quelle già gestite se passate).
 *
 * @param {object} formOrInput
 * @param {{
 *   escludiId?: string[],
 *   soloEnabled?: boolean,
 * }=} opzioni
 * @returns {object[]}
 */
export function proponiDomandeSopralluogo(formOrInput = {}, opzioni = {}) {
  const input = normalizzaInputAssistente(formOrInput);
  const escludi = new Set(
    (opzioni.escludiId || []).map((id) => String(id))
  );
  const soloEnabled = opzioni.soloEnabled !== false;

  let domande = repo.leggiDomande();
  if (soloEnabled) {
    domande = domande.filter((d) => d.enabled !== false);
  }

  const attive = domande.filter((domanda) => {
    if (escludi.has(domanda.id)) return false;
    return condizioniSchedaSoddisfatte(
      domanda.condizioniAttivazione,
      input
    );
  });

  return ordinaPerPriorita(attive).map((domanda) => {
    const scheda = domanda.schedaTecnicaId
      ? ottieniSchedaTecnica(domanda.schedaTecnicaId)
      : null;
    return {
      ...domanda,
      percheChiede: scheda
        ? {
            schedaTecnicaId: scheda.id,
            motivazione: scheda.motivazione,
            origine: scheda.origine ? { ...scheda.origine } : null,
            verificheProfessionista: [
              ...(scheda.verificheProfessionista || []),
            ],
            livelloAffidabilita: scheda.livelloAffidabilita,
          }
        : null,
    };
  });
}

/**
 * @param {string} id
 * @returns {object|null}
 */
export function ottieniDomanda(id) {
  return repo.trovaDomandaPerId(id);
}

/**
 * @returns {number}
 */
export function contaDomandeAssistente() {
  return repo.contaDomande();
}

/**
 * Verifica che le domande non contengano prezzi (invariante di dominio).
 * @returns {boolean}
 */
export function domandeSenzaPrezzi() {
  return repo.leggiDomande().every((d) => {
    const json = JSON.stringify(d);
    return !/"prezzo"|price|prezzoUnitario/i.test(json);
  });
}
