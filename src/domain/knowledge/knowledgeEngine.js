/**
 * Knowledge Engine — Rule Engine deterministico.
 * Ordina per priorità effettiva, esegue solo regole enabled, accumula risultati.
 * Non sa come nascono le regole: riceve solo la lista finale.
 */

import { knowledgeRules } from "./knowledgeRules";
import {
  KNOWLEDGE_ORIGINE,
  KNOWLEDGE_ORIGINE_LABEL,
  ordinaPerPrioritaKnowledge,
} from "./knowledgePriorityService";

/**
 * Normalizza il form UI verso l'input canonico delle regole.
 * @param {object} form
 */
export function normalizzaInputKnowledge(form = {}) {
  const mqGrezzo = form.mq ?? form.superficieMq;
  let mq = null;
  if (mqGrezzo !== null && mqGrezzo !== undefined && mqGrezzo !== "") {
    const numero = Number(mqGrezzo);
    mq = Number.isFinite(numero) ? numero : null;
  }

  const livelliGrezzo = form.livelli ?? form.numeroLivelli ?? 1;
  const livelli =
    String(livelliGrezzo) === "4+" ? 4 : Number(livelliGrezzo);

  const extraForm = form.extra || {};

  return {
    mq,
    tipoImmobile: form.tipoImmobile || "",
    livelli: Number.isFinite(livelli) ? livelli : 1,
    livelloImpianto: String(form.livelloImpianto || ""),
    extra: {
      ...extraForm,
      clima: Boolean(extraForm.clima ?? extraForm.predisposizioneClima),
      domotica: Boolean(extraForm.domotica),
    },
  };
}

/**
 * @param {object[]} regole
 */
export function ordinaRegolePerPriority(regole = []) {
  return ordinaPerPrioritaKnowledge(regole);
}

/**
 * Unisce i dati regola: first-wins (priorità alta già eseguita).
 * @param {object} accumulato
 * @param {object} patch
 */
export function fondiDatiRegola(accumulato = {}, patch = {}) {
  const prossimo = { ...accumulato };
  Object.entries(patch || {}).forEach(([chiave, valore]) => {
    if (!(chiave in prossimo)) {
      prossimo[chiave] = valore;
    }
  });
  return prossimo;
}

/**
 * Normalizza un suggerimento a oggetto con origine.
 * @param {string|object} voce
 * @param {object} metaRegola
 */
export function normalizzaSuggerimento(voce, metaRegola = {}) {
  const origine =
    (typeof voce === "object" && voce?.origine) ||
    metaRegola.knowledgeOrigine ||
    KNOWLEDGE_ORIGINE.BASE;

  if (typeof voce === "string") {
    return {
      titolo: voce,
      origine,
      labelOrigine:
        KNOWLEDGE_ORIGINE_LABEL[origine] ||
        KNOWLEDGE_ORIGINE_LABEL[KNOWLEDGE_ORIGINE.BASE],
      affidabilita: null,
      osservazioni: null,
      perche:
        metaRegola.descrizione ||
        "Regola della Knowledge Base.",
      rafforzatoDalBrain: false,
    };
  }

  if (!voce || typeof voce !== "object") return null;

  const titolo = String(voce.titolo || voce.testo || "").trim();
  if (!titolo) return null;

  return {
    titolo,
    origine: voce.origine || origine,
    labelOrigine:
      voce.labelOrigine ||
      KNOWLEDGE_ORIGINE_LABEL[voce.origine || origine] ||
      KNOWLEDGE_ORIGINE_LABEL[KNOWLEDGE_ORIGINE.BASE],
    affidabilita:
      voce.affidabilita === null || voce.affidabilita === undefined
        ? null
        : Number(voce.affidabilita),
    osservazioni:
      voce.osservazioni === null || voce.osservazioni === undefined
        ? null
        : Number(voce.osservazioni),
    perche:
      voce.perche ||
      metaRegola.descrizione ||
      "Regola della Knowledge Base.",
    knowledgeId: voce.knowledgeId || null,
    rafforzatoDalBrain: Boolean(voce.rafforzatoDalBrain),
  };
}

/**
 * Accumula suggerimenti: base non viene rimossa; personali aggiungono o rafforzano.
 * @param {object[]} accumulato
 * @param {object} nuovo
 */
export function accumulaSuggerimento(accumulato, nuovo) {
  if (!nuovo?.titolo) return accumulato;

  const indice = accumulato.findIndex(
    (voce) =>
      String(voce.titolo).toLowerCase() === String(nuovo.titolo).toLowerCase()
  );

  if (indice < 0) {
    accumulato.push(nuovo);
    return accumulato;
  }

  const esistente = accumulato[indice];

  // Rafforzamento: Brain conferma un suggerimento Base → origine resta BASE
  if (
    esistente.origine === KNOWLEDGE_ORIGINE.BASE &&
    nuovo.origine === KNOWLEDGE_ORIGINE.BRAIN
  ) {
    accumulato[indice] = {
      ...esistente,
      rafforzatoDalBrain: true,
      affidabilita:
        esistente.affidabilita ??
        (Number.isFinite(nuovo.affidabilita) ? nuovo.affidabilita : null),
      osservazioni: nuovo.osservazioni ?? esistente.osservazioni,
      percheBrain: nuovo.perche || esistente.percheBrain,
    };
  }

  // Personale non sostituisce / non elimina Base
  return accumulato;
}

/**
 * @param {object} formInput
 * @param {object[]=} regole
 * @returns {{
 *   puntiStimati: number|null,
 *   suggerimenti: object[],
 *   regoleApplicate: Array<object>,
 *   quadroSuggerito: string|null,
 * }}
 */
export function runKnowledgeEngine(formInput = {}, regole = knowledgeRules) {
  const input = normalizzaInputKnowledge(formInput);
  const ordinate = ordinaRegolePerPriority(
    (regole || []).filter((regola) => regola?.enabled !== false)
  );

  let dati = {};
  const suggerimenti = [];
  const regoleApplicate = [];

  ordinate.forEach((regola) => {
    if (typeof regola.execute !== "function") return;

    const esito = regola.execute(input) || {};
    if (!esito.applicata) return;

    regoleApplicate.push({
      id: regola.id,
      nome: regola.nome,
      origine: regola.knowledgeOrigine || KNOWLEDGE_ORIGINE.BASE,
      layer: regola.layer || "BASE",
    });

    // Solo layer BASE può scrivere dati strutturali (quadro, punti).
    // Personali/community non eliminano né sovrascrivono la base.
    if ((regola.layer || "BASE") === "BASE" || !regola.layer) {
      dati = fondiDatiRegola(dati, esito.dati);
    }

    (esito.suggerimenti || []).forEach((voce) => {
      const normalizzato = normalizzaSuggerimento(voce, regola);
      if (normalizzato) {
        accumulaSuggerimento(suggerimenti, normalizzato);
      }
    });
  });

  return {
    puntiStimati:
      dati.puntiStimati === undefined ? null : dati.puntiStimati,
    suggerimenti,
    regoleApplicate,
    quadroSuggerito: dati.quadroSuggerito || null,
  };
}
