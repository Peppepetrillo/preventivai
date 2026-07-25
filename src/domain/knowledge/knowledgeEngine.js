/**
 * Knowledge Engine — Rule Engine deterministico.
 * I suggerimenti sono riferimenti Catalogo (id + quantita).
 * Retrocompat: stringhe legacy normalizzate a ID Catalogo.
 */

import { knowledgeRules } from "./knowledgeRules";
import {
  KNOWLEDGE_ORIGINE,
  KNOWLEDGE_ORIGINE_LABEL,
  ordinaPerPrioritaKnowledge,
} from "./knowledgePriorityService";
import {
  nomeDaCatalogo,
  normalizzaRiferimentoCatalogo,
  isCatalogoId,
} from "../catalogo";
import { creaKnowledgeInput } from "./knowledgeInputTypes";
import {
  consultaBaseTecnica,
  mappaCatalogoIdASchedaTecnica,
  ottieniSchedaTecnica,
} from "../baseTecnica";

/**
 * Normalizza il form UI verso l'input canonico delle regole (KE 2.0).
 * @param {object} form
 * @returns {import("./knowledgeInputTypes").KnowledgeInput}
 */
export function normalizzaInputKnowledge(form = {}) {
  return creaKnowledgeInput(form);
}

/**
 * Consulta la Base Tecnica (conoscenza pura) a partire dal form.
 * Non genera prezzi né quantità: solo schede tecniche applicabili.
 * @param {object} form
 * @returns {object[]}
 */
export function consultaConoscenzaTecnica(form = {}) {
  return consultaBaseTecnica(normalizzaInputKnowledge(form));
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
 * Normalizza un suggerimento a riferimento Catalogo + metadati origine.
 * @param {string|object} voce
 * @param {object} metaRegola
 */
export function normalizzaSuggerimento(voce, metaRegola = {}) {
  const origine =
    (typeof voce === "object" && voce?.origine) ||
    metaRegola.knowledgeOrigine ||
    KNOWLEDGE_ORIGINE.BASE;

  const rif = normalizzaRiferimentoCatalogo(voce);
  if (!rif) return null;

  const titolo = nomeDaCatalogo(rif.id);
  const moduli = rif.meta?.moduli;
  const titoloDisplay =
    (rif.id === "QUADRO_ELETTRICO" || rif.id === "QUADRO_12_MODULI") && moduli
      ? `Quadro ${moduli} moduli`
      : titolo;

  return {
    id: rif.id,
    catalogoId: rif.id,
    quantita: rif.quantita,
    meta: rif.meta || {},
    titolo: titoloDisplay,
    origine,
    labelOrigine:
      (typeof voce === "object" && voce.labelOrigine) ||
      KNOWLEDGE_ORIGINE_LABEL[origine] ||
      KNOWLEDGE_ORIGINE_LABEL[KNOWLEDGE_ORIGINE.BASE],
    affidabilita:
      typeof voce === "object" &&
      voce.affidabilita !== null &&
      voce.affidabilita !== undefined
        ? Number(voce.affidabilita)
        : null,
    osservazioni:
      typeof voce === "object" &&
      voce.osservazioni !== null &&
      voce.osservazioni !== undefined
        ? Number(voce.osservazioni)
        : null,
    perche:
      (typeof voce === "object" && voce.perche) ||
      metaRegola.descrizione ||
      "Regola della Knowledge Base.",
    knowledgeId:
      typeof voce === "object" ? voce.knowledgeId || null : null,
    rafforzatoDalBrain: Boolean(
      typeof voce === "object" && voce.rafforzatoDalBrain
    ),
  };
}

/**
 * Accumula per catalogoId (non per titolo).
 * @param {object[]} accumulato
 * @param {object} nuovo
 */
export function accumulaSuggerimento(accumulato, nuovo) {
  if (!nuovo?.id && !nuovo?.catalogoId) return accumulato;
  const chiave = nuovo.catalogoId || nuovo.id;

  const indice = accumulato.findIndex(
    (voce) => (voce.catalogoId || voce.id) === chiave
  );

  if (indice < 0) {
    accumulato.push(nuovo);
    return accumulato;
  }

  const esistente = accumulato[indice];

  // Quantità: max (es. punti) o somma se entrambe > 1 da fonti diverse — preferisci max
  const quantita = Math.max(
    Number(esistente.quantita) || 1,
    Number(nuovo.quantita) || 1
  );

  if (
    esistente.origine === KNOWLEDGE_ORIGINE.BASE &&
    nuovo.origine === KNOWLEDGE_ORIGINE.BRAIN
  ) {
    accumulato[indice] = {
      ...esistente,
      quantita,
      meta: { ...esistente.meta, ...nuovo.meta },
      rafforzatoDalBrain: true,
      affidabilita:
        esistente.affidabilita ??
        (Number.isFinite(nuovo.affidabilita) ? nuovo.affidabilita : null),
      osservazioni: nuovo.osservazioni ?? esistente.osservazioni,
      percheBrain: nuovo.perche || esistente.percheBrain,
    };
    return accumulato;
  }

  // Aggiorna quantità / meta se già presente (meta: first-wins)
  accumulato[indice] = {
    ...esistente,
    quantita,
    meta: { ...(nuovo.meta || {}), ...(esistente.meta || {}) },
    titolo: esistente.titolo || nuovo.titolo,
  };

  return accumulato;
}

/**
 * @param {object} formInput
 * @param {object[]=} regole
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

  // quadroSuggerito: ID catalogo → etichetta leggibile per UI
  let quadroSuggerito = null;
  if (dati.quadroSuggerito) {
    if (isCatalogoId(dati.quadroSuggerito)) {
      const moduli = dati.quadroModuli;
      quadroSuggerito = moduli
        ? `Quadro ${moduli} moduli`
        : nomeDaCatalogo(dati.quadroSuggerito);
    } else {
      quadroSuggerito = String(dati.quadroSuggerito);
    }
  }

  // Metadati Base Tecnica: collega catalogoId → scheda (senza cambiare le regole)
  const mappaSchede = mappaCatalogoIdASchedaTecnica(input);
  const suggerimentiConScheda = suggerimenti.map((s) => {
    const catalogoId = s.catalogoId || s.id;
    const schedaTecnicaId = mappaSchede.get(catalogoId) || null;
    const scheda = schedaTecnicaId
      ? ottieniSchedaTecnica(schedaTecnicaId)
      : null;

    return {
      ...s,
      schedaTecnicaId,
      motivazione: scheda?.motivazione || null,
      // Non sovrascrivere `origine` (BASE/BRAIN): metadati BT separati
      origineTecnica: scheda?.origine ? { ...scheda.origine } : null,
      verificheProfessionista: scheda
        ? [...scheda.verificheProfessionista]
        : [],
      livelloAffidabilita: scheda?.livelloAffidabilita || null,
    };
  });

  const schedeTecniche = consultaBaseTecnica(input).map((s) => ({
    id: s.id,
    categoria: s.categoria,
    titolo: s.titolo,
    priorita: s.priorita,
    catalogoIds: [...s.catalogoIds],
    condizioni: { ...s.condizioni },
    origine: { ...s.origine },
    motivazione: s.motivazione,
    verificheProfessionista: [...s.verificheProfessionista],
    livelloAffidabilita: s.livelloAffidabilita,
  }));

  return {
    puntiStimati:
      dati.puntiStimati === undefined ? null : dati.puntiStimati,
    suggerimenti: suggerimentiConScheda,
    regoleApplicate,
    quadroSuggerito,
    quadroCatalogoId: isCatalogoId(dati.quadroSuggerito)
      ? dati.quadroSuggerito
      : null,
    quadroModuli: dati.quadroModuli ?? null,
    /** Schede Base Tecnica applicabili (conoscenza spiegabile, non pricing). */
    schedeTecniche,
  };
}
