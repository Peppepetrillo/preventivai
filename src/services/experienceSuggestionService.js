import {
  getInsights,
} from "./experienceInsightsService";

const ORIGINE_EXPERIENCE = "experience";
const PRECISIONE_CONFIDENCE = 2;
const PRECISIONE_DURATA = 1;
/** Campioni necessari per considerare la stima durata a confidenza piena. */
const CAMPIONI_DURATA_PIENI = 5;
/** Soglia minima sotto la quale un suggerimento non viene esposto. */
const CONFIDENZA_MINIMA = 0.05;

/**
 * @typedef {object} Suggerimento
 * @property {string} nome
 * @property {number} confidence
 * @property {string} motivo
 * @property {"experience"|"ai"|"utente"|"manuale"} origine
 */

/**
 * @typedef {object} OpzioniSuggerimenti
 * @property {string=} tipoLavoro
 * @property {ReturnType<typeof getInsights>=} insights
 * @property {object[]=} esperienze Passate a getInsights se `insights` assente
 */

/**
 * Calcola un punteggio di confidenza tra 0 e 1.
 * @param {unknown} occorrenze
 * @param {unknown} totale
 * @returns {number}
 */
export function getConfidenceScore(occorrenze, totale) {
  const numOccorrenze = Number(occorrenze);
  const numTotale = Number(totale);

  if (
    !Number.isFinite(numOccorrenze) ||
    !Number.isFinite(numTotale) ||
    numOccorrenze <= 0 ||
    numTotale <= 0
  ) {
    return 0;
  }

  const grezzo = numOccorrenze / numTotale;
  const limitato = Math.min(1, Math.max(0, grezzo));
  return Number(limitato.toFixed(PRECISIONE_CONFIDENCE));
}

/**
 * @param {unknown} valore
 * @returns {string}
 */
function normalizzaTipo(valore) {
  if (valore == null) return "";
  return String(valore).trim();
}

/**
 * @param {OpzioniSuggerimenti=} opzioni
 * @returns {ReturnType<typeof getInsights>}
 */
function risolviInsights(opzioni = {}) {
  if (
    opzioni.insights != null &&
    typeof opzioni.insights === "object"
  ) {
    return opzioni.insights;
  }

  const esperienze = opzioni.esperienze;
  if (esperienze !== undefined) {
    const tipo = normalizzaTipo(opzioni.tipoLavoro);
    if (!tipo) {
      return getInsights(esperienze);
    }

    const chiave = tipo.toLowerCase();
    const filtrate = (Array.isArray(esperienze) ? esperienze : []).filter(
      (item) =>
        item &&
        normalizzaTipo(item.tipoLavoro).toLowerCase() === chiave
    );
    return getInsights(filtrate);
  }

  return getInsights();
}

/**
 * @param {number} confidence
 * @returns {number}
 */
function percentualeDaConfidence(confidence) {
  return Math.round(confidence * 100);
}

/**
 * @param {string} nome
 * @param {number} confidence
 * @param {string} motivo
 * @returns {Suggerimento}
 */
function creaSuggerimento(nome, confidence, motivo) {
  return {
    nome,
    confidence,
    motivo,
    origine: ORIGINE_EXPERIENCE,
  };
}

/**
 * @param {Suggerimento[]} suggerimenti
 * @returns {Suggerimento[]}
 */
function ordinaPerConfidence(suggerimenti) {
  return [...suggerimenti].sort(
    (a, b) =>
      b.confidence - a.confidence || a.nome.localeCompare(b.nome, "it")
  );
}

/**
 * Suggerimenti checklist basati sulla frequenza storica.
 * @param {OpzioniSuggerimenti=} opzioni
 * @returns {Suggerimento[]}
 */
export function getSuggerimentiChecklist(opzioni = {}) {
  const insights = risolviInsights(opzioni);
  const totale = Number(insights?.statistiche?.totaleEsperienze) || 0;
  const attivita = Array.isArray(insights?.attivita) ? insights.attivita : [];

  if (totale <= 0 || attivita.length === 0) {
    return [];
  }

  const suggerimenti = [];

  for (const voce of attivita) {
    if (!voce || !voce.nome) continue;

    const confidence = getConfidenceScore(voce.count, totale);
    if (confidence < CONFIDENZA_MINIMA) continue;

    const percentuale = percentualeDaConfidence(confidence);
    suggerimenti.push(
      creaSuggerimento(
        voce.nome,
        confidence,
        `Presente nel ${percentuale}% dei lavori simili`
      )
    );
  }

  return ordinaPerConfidence(suggerimenti);
}

/**
 * Suggerimenti materiali basati sulla frequenza storica.
 * @param {OpzioniSuggerimenti=} opzioni
 * @returns {Suggerimento[]}
 */
export function getSuggerimentiMateriali(opzioni = {}) {
  const insights = risolviInsights(opzioni);
  const totale = Number(insights?.statistiche?.totaleEsperienze) || 0;
  const materiali = Array.isArray(insights?.materiali) ? insights.materiali : [];

  if (totale <= 0 || materiali.length === 0) {
    return [];
  }

  const suggerimenti = [];

  for (const materiale of materiali) {
    if (!materiale || !materiale.nome) continue;

    const confidence = getConfidenceScore(materiale.count, totale);
    if (confidence < CONFIDENZA_MINIMA) continue;

    const percentuale = percentualeDaConfidence(confidence);
    suggerimenti.push(
      creaSuggerimento(
        materiale.nome,
        confidence,
        percentuale >= 70
          ? `Materiale utilizzato frequentemente (${percentuale}% dei lavori)`
          : "Materiale utilizzato frequentemente"
      )
    );
  }

  return ordinaPerConfidence(suggerimenti);
}

/**
 * @param {ReturnType<typeof getInsights>} insights
 * @param {string} tipoLavoro
 * @returns {{ durataMedia: number, campioni: number }|null}
 */
function risolviDurataPerTipo(insights, tipoLavoro) {
  const durate = Array.isArray(insights?.durataMedia) ? insights.durataMedia : [];
  const tipi = Array.isArray(insights?.tipiLavoro) ? insights.tipiLavoro : [];
  const tipo = normalizzaTipo(tipoLavoro);

  if (tipo) {
    const chiave = tipo.toLowerCase();
    const durata = durate.find(
      (item) => normalizzaTipo(item?.tipo).toLowerCase() === chiave
    );
    const tipoInfo = tipi.find(
      (item) => normalizzaTipo(item?.tipo).toLowerCase() === chiave
    );

    if (durata && Number.isFinite(Number(durata.durataMedia))) {
      return {
        durataMedia: Number(durata.durataMedia),
        campioni: Number(tipoInfo?.count) || 0,
      };
    }

    return null;
  }

  const durataMedia = Number(insights?.statistiche?.durataMedia);
  if (!Number.isFinite(durataMedia) || durataMedia <= 0) {
    return null;
  }

  return {
    durataMedia,
    campioni: Number(insights?.statistiche?.totaleEsperienze) || 0,
  };
}

/**
 * Stima durata basata sull'esperienza storica.
 * @param {OpzioniSuggerimenti=} opzioni
 * @returns {{ durataStimata: number|null, confidence: number }}
 */
export function getSuggerimentiDurata(opzioni = {}) {
  const insights = risolviInsights(opzioni);
  const risolto = risolviDurataPerTipo(insights, opzioni.tipoLavoro);

  if (!risolto) {
    return {
      durataStimata: null,
      confidence: 0,
    };
  }

  const confidence = getConfidenceScore(
    risolto.campioni,
    Math.max(risolto.campioni, CAMPIONI_DURATA_PIENI)
  );

  return {
    durataStimata: Number(risolto.durataMedia.toFixed(PRECISIONE_DURATA)),
    confidence,
  };
}

/**
 * Media confidenza dei suggerimenti disponibili (0 se assenti).
 * @param {Suggerimento[]} checklist
 * @param {Suggerimento[]} materiali
 * @param {{ confidence: number }} durata
 * @returns {number}
 */
function calcolaConfidenceGlobale(checklist, materiali, durata) {
  const valori = [
    ...checklist.map((item) => item.confidence),
    ...materiali.map((item) => item.confidence),
  ];

  if (durata && durata.confidence > 0 && durata.durataStimata != null) {
    valori.push(durata.confidence);
  }

  if (valori.length === 0) return 0;

  const media = valori.reduce((acc, n) => acc + n, 0) / valori.length;
  return Number(media.toFixed(PRECISIONE_CONFIDENCE));
}

/**
 * Punto di ingresso unico per Sprint 11 – Assistant Core.
 * @param {OpzioniSuggerimenti=} opzioni
 * @returns {{
 *   checklist: Suggerimento[],
 *   materiali: Suggerimento[],
 *   durata: { durataStimata: number|null, confidence: number },
 *   confidenceGlobale: number
 * }}
 */
export function getSuggerimenti(opzioni = {}) {
  const insights = risolviInsights(opzioni);
  const contesto = { ...opzioni, insights };

  const checklist = getSuggerimentiChecklist(contesto);
  const materiali = getSuggerimentiMateriali(contesto);
  const durata = getSuggerimentiDurata(contesto);

  return {
    checklist,
    materiali,
    durata,
    confidenceGlobale: calcolaConfidenceGlobale(checklist, materiali, durata),
  };
}

/**
 * Esposto per test e documentazione delle fasce.
 * @param {number} confidence
 * @returns {"molto_alta"|"alta"|"media"|"bassa"}
 */
export function classificaConfidence(confidence) {
  const valore = Number(confidence);
  if (!Number.isFinite(valore) || valore < 0.5) return "bassa";
  if (valore < 0.7) return "media";
  if (valore <= 0.9) return "alta";
  return "molto_alta";
}
