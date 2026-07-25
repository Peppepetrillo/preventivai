/**
 * Preventivo Intelligente — service di ingresso al Rule Engine.
 * Pipeline: Base + Personali → Merge → Knowledge Engine → proposta.
 * Non crea preventivi, PDF o lavorazioni.
 */

import { elencaConoscenze } from "../brain/personalKnowledgeService";
import { mergeKnowledgeRules } from "./knowledgeMergeService";
import { knowledgeRules } from "./knowledgeRules";
import { runKnowledgeEngine } from "./knowledgeEngine";

/**
 * @param {object} form
 * @param {{ conoscenzePersonali?: object[], regoleBase?: object[] }=} opzioni
 * @returns {{ success: true, proposta: object }}
 */
export function generaPropostaPreventivo(form = {}, opzioni = {}) {
  const base = opzioni.regoleBase || knowledgeRules;
  const personali =
    opzioni.conoscenzePersonali !== undefined
      ? opzioni.conoscenzePersonali
      : elencaConoscenze();

  const regole = mergeKnowledgeRules({ base, personali });
  const proposta = runKnowledgeEngine(form, regole);

  return {
    success: true,
    proposta,
  };
}
