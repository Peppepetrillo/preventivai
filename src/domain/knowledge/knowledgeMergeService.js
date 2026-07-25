/**
 * Merge Knowledge Base + Personal Knowledge → lista regole finale.
 *
 * - Base mai rimossa
 * - Personali possono aggiungere / rafforzare / specializzare
 * - Il Knowledge Engine riceve solo la lista risultante
 */

import { risolviFasciaMq } from "../brain/brainPatternTypes";
import {
  KNOWLEDGE_LAYER,
  KNOWLEDGE_ORIGINE,
  KNOWLEDGE_ORIGINE_LABEL,
  prioritaEffettiva,
} from "./knowledgePriorityService";

/**
 * @param {object} regola
 * @returns {object}
 */
export function annotaRegolaBase(regola = {}) {
  return {
    ...regola,
    layer: KNOWLEDGE_LAYER.BASE,
    knowledgeOrigine: KNOWLEDGE_ORIGINE.BASE,
  };
}

/**
 * Verifica se l'input corrente soddisfa le condizioni di una conoscenza personale.
 * @param {object} input — già normalizzato dal Knowledge Engine
 * @param {object} condizioni
 */
export function condizioniPersonaliSoddisfatte(input = {}, condizioni = {}) {
  if (!condizioni || typeof condizioni !== "object") return true;

  if (
    condizioni.tipoImmobile &&
    String(input.tipoImmobile || "") !== String(condizioni.tipoImmobile)
  ) {
    return false;
  }

  if (
    condizioni.livelli !== null &&
    condizioni.livelli !== undefined &&
    Number(input.livelli) !== Number(condizioni.livelli)
  ) {
    return false;
  }

  if (
    condizioni.livelloImpianto &&
    String(input.livelloImpianto || "") !== String(condizioni.livelloImpianto)
  ) {
    return false;
  }

  if (condizioni.fasciaMq) {
    const fascia = risolviFasciaMq(input.mq);
    if (fascia.id !== condizioni.fasciaMq) return false;
  }

  return true;
}

/**
 * Testo "Perché?" per conoscenze Brain.
 * @param {number} osservazioni
 */
export function costruisciPercheBrain(osservazioni) {
  const n = Number(osservazioni) || 0;
  if (n <= 0) {
    return "Basato sul tuo metodo di lavoro salvato nel Brain.";
  }
  return `Negli ultimi ${n} lavori simili hai sempre aggiunto questa lavorazione.`;
}

/**
 * Converte una Personal Knowledge in regola eseguibile dal motore.
 * Non scrive dati che possano eliminare regole base (solo suggerimenti).
 *
 * @param {object} conoscenza
 * @returns {object|null}
 */
export function conoscenzaPersonaleToRegola(conoscenza = {}) {
  if (!conoscenza || !conoscenza.id) return null;

  const payload =
    conoscenza.payload && typeof conoscenza.payload === "object"
      ? conoscenza.payload
      : {};
  const condizioni =
    payload.condizioni && typeof payload.condizioni === "object"
      ? payload.condizioni
      : {};
  const suggerimentoPayload =
    payload.suggerimento && typeof payload.suggerimento === "object"
      ? payload.suggerimento
      : {};

  const titolo =
    suggerimentoPayload.testo ||
    conoscenza.descrizione ||
    conoscenza.titolo ||
    "";
  if (!titolo) return null;

  const affidabilita = Number(conoscenza.affidabilita);
  const osservazioni = Number(conoscenza.osservazioni) || 0;
  const perche = costruisciPercheBrain(osservazioni);

  return {
    id: `PK_${conoscenza.id}`,
    nome: conoscenza.titolo || titolo,
    descrizione: conoscenza.descrizione || titolo,
    categoria: conoscenza.categoria || "Personale",
    enabled: true,
    priority: 50,
    layer: KNOWLEDGE_LAYER.PERSONALI,
    knowledgeOrigine: KNOWLEDGE_ORIGINE.BRAIN,
    patternId: conoscenza.patternId || null,
    execute(input = {}) {
      if (!condizioniPersonaliSoddisfatte(input, condizioni)) {
        return { applicata: false, suggerimenti: [], dati: {} };
      }

      return {
        applicata: true,
        suggerimenti: [
          {
            titolo,
            origine: KNOWLEDGE_ORIGINE.BRAIN,
            labelOrigine: KNOWLEDGE_ORIGINE_LABEL[KNOWLEDGE_ORIGINE.BRAIN],
            affidabilita: Number.isFinite(affidabilita) ? affidabilita : null,
            osservazioni,
            perche,
            knowledgeId: conoscenza.id,
          },
        ],
        // Nessun dato strutturale: le personali non sovrascrivono quadro/punti base
        dati: {},
      };
    },
  };
}

/**
 * Unisce regole base e personali.
 * Le base non vengono mai filtrate via. Duplicati di id personale collassati.
 *
 * @param {{ base?: object[], personali?: object[] }} parametri
 * @returns {object[]}
 */
export function mergeKnowledgeRules({
  base = [],
  personali = [],
} = {}) {
  const regoleBase = (Array.isArray(base) ? base : [])
    .filter(Boolean)
    .map(annotaRegolaBase);

  const viste = new Set();
  const regolePersonali = [];

  (Array.isArray(personali) ? personali : []).forEach((voce) => {
    if (!voce?.id || viste.has(String(voce.id))) return;
    viste.add(String(voce.id));
    const regola = conoscenzaPersonaleToRegola(voce);
    if (regola) regolePersonali.push(regola);
  });

  // Base sempre presenti; personali solo in aggiunta
  return [...regoleBase, ...regolePersonali];
}

/**
 * @param {object[]} regole
 * @returns {{ base: number, personali: number, community: number, totale: number }}
 */
export function statisticheMerge(regole = []) {
  const elenco = Array.isArray(regole) ? regole : [];
  return {
    base: elenco.filter((r) => r.layer === KNOWLEDGE_LAYER.BASE).length,
    personali: elenco.filter((r) => r.layer === KNOWLEDGE_LAYER.PERSONALI)
      .length,
    community: elenco.filter((r) => r.layer === KNOWLEDGE_LAYER.COMMUNITY)
      .length,
    totale: elenco.length,
  };
}

export { prioritaEffettiva };
