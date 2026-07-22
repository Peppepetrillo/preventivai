import { getSuggerimenti } from "./experienceSuggestionService";
import {
  formatEuro,
} from "../utils/preventivi";
import { riepilogoEconomicoCantiere } from "../features/cantieri/cantiereVariantiDomain";

export const ASSISTANT_VERSIONE = 1;

const PRIORITA_ALTA = "alta";
const PRIORITA_MEDIA = "media";
const PRIORITA_BASSA = "bassa";

const TIPO_CHECKLIST = "checklist";
const TIPO_MATERIALE = "materiale";
const TIPO_DURATA = "durata";
const TIPO_DOCUMENTAZIONE = "documentazione";
const TIPO_NOTA = "nota";
const TIPO_ECONOMICO = "economico";
const TIPO_VARIANTE = "variante";

const ACTION_VIEW = "view";
const ACTION_ACCEPT = "accept";
const ACTION_DISMISS = "dismiss";

const ORDINE_PRIORITA = {
  [PRIORITA_ALTA]: 0,
  [PRIORITA_MEDIA]: 1,
  [PRIORITA_BASSA]: 2,
};

/**
 * @typedef {"alta"|"media"|"bassa"} PrioritaAssistant
 */

/**
 * @typedef {"view"|"accept"|"dismiss"} ActionAssistant
 */

/**
 * @typedef {object} AssistantCard
 * @property {string} id
 * @property {string} tipo
 * @property {string} titolo
 * @property {string} descrizione
 * @property {number} confidence
 * @property {PrioritaAssistant} priorita
 * @property {string} origine
 * @property {ActionAssistant} action
 */

/**
 * @typedef {object} AssistantSummary
 * @property {number} totaleSuggerimenti
 * @property {number} alta
 * @property {number} media
 * @property {number} bassa
 */

/**
 * @typedef {object} AssistantPayload
 * @property {AssistantCard[]} cards
 * @property {AssistantSummary} summary
 * @property {string} generatedAt
 * @property {number} versione
 */

/**
 * @typedef {object} OpzioniAssistant
 * @property {string=} tipoLavoro
 * @property {object=} insights
 * @property {object[]=} esperienze
 * @property {ReturnType<typeof getSuggerimenti>=} suggerimenti
 */

/**
 * Calcola la priorità di una card dalla confidence.
 * @param {unknown} confidence
 * @returns {PrioritaAssistant}
 */
export function calcolaPriorita(confidence) {
  const valore = Number(confidence);

  if (!Number.isFinite(valore) || valore < 0.7) {
    return PRIORITA_BASSA;
  }

  if (valore <= 0.9) {
    return PRIORITA_MEDIA;
  }

  return PRIORITA_ALTA;
}

/**
 * @param {unknown} valore
 * @param {string} fallback
 * @returns {string}
 */
function testoSicuro(valore, fallback = "") {
  if (valore == null) return fallback;
  const testo = String(valore).trim();
  return testo || fallback;
}

/**
 * @param {unknown} valore
 * @returns {number}
 */
function confidenceSicura(valore) {
  const numero = Number(valore);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  if (numero > 1) return 1;
  return numero;
}

/**
 * @param {string} tipo
 * @param {string} chiave
 * @returns {string}
 */
function creaIdCard(tipo, chiave) {
  const slug = testoSicuro(chiave, "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  return `${tipo}-${slug || "item"}`;
}

/**
 * @param {object} params
 * @param {string} params.tipo
 * @param {string} params.titolo
 * @param {string} params.descrizione
 * @param {number} params.confidence
 * @param {string} params.origine
 * @param {ActionAssistant} params.action
 * @returns {AssistantCard}
 */
function creaCard({
  tipo,
  titolo,
  descrizione,
  confidence,
  origine,
  action,
}) {
  const confidenceNormalizzata = confidenceSicura(confidence);

  return {
    id: creaIdCard(tipo, titolo),
    tipo: testoSicuro(tipo, "generico"),
    titolo: testoSicuro(titolo, "Suggerimento"),
    descrizione: testoSicuro(descrizione, "Suggerimento basato sull'esperienza"),
    confidence: confidenceNormalizzata,
    priorita: calcolaPriorita(confidenceNormalizzata),
    origine: testoSicuro(origine, "experience"),
    action: testoSicuro(action, ACTION_VIEW),
  };
}

/**
 * @param {AssistantCard[]} cards
 * @returns {AssistantCard[]}
 */
function ordinaCards(cards) {
  return [...cards].sort((a, b) => {
    const diffPriorita =
      (ORDINE_PRIORITA[a.priorita] ?? 99) - (ORDINE_PRIORITA[b.priorita] ?? 99);
    if (diffPriorita !== 0) return diffPriorita;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.titolo.localeCompare(b.titolo, "it");
  });
}

/**
 * @param {AssistantCard[]} cards
 * @returns {AssistantSummary}
 */
function creaSummary(cards) {
  const summary = {
    totaleSuggerimenti: cards.length,
    alta: 0,
    media: 0,
    bassa: 0,
  };

  for (const card of cards) {
    if (card.priorita === PRIORITA_ALTA) summary.alta += 1;
    else if (card.priorita === PRIORITA_MEDIA) summary.media += 1;
    else summary.bassa += 1;
  }

  return summary;
}

/**
 * @param {ReturnType<typeof getSuggerimenti>} suggerimenti
 * @param {{ includiChecklist?: boolean, includiMateriali?: boolean, includiDurata?: boolean }} filtri
 * @returns {AssistantCard[]}
 */
function cardsDaSuggerimenti(
  suggerimenti,
  {
    includiChecklist = true,
    includiMateriali = true,
    includiDurata = true,
  } = {}
) {
  /** @type {AssistantCard[]} */
  const cards = [];
  const checklist = Array.isArray(suggerimenti?.checklist)
    ? suggerimenti.checklist
    : [];
  const materiali = Array.isArray(suggerimenti?.materiali)
    ? suggerimenti.materiali
    : [];
  const durata = suggerimenti?.durata;

  if (includiChecklist) {
    for (const voce of checklist) {
      if (!voce) continue;
      cards.push(
        creaCard({
          tipo: TIPO_CHECKLIST,
          titolo: testoSicuro(voce.nome, "Attività consigliata"),
          descrizione: testoSicuro(
            voce.motivo,
            "Attività frequente nei lavori simili"
          ),
          confidence: voce.confidence,
          origine: voce.origine,
          action: ACTION_ACCEPT,
        })
      );
    }
  }

  if (includiMateriali) {
    for (const materiale of materiali) {
      if (!materiale) continue;
      cards.push(
        creaCard({
          tipo: TIPO_MATERIALE,
          titolo: testoSicuro(materiale.nome, "Materiale consigliato"),
          descrizione: testoSicuro(
            materiale.motivo,
            "Materiale utilizzato frequentemente"
          ),
          confidence: materiale.confidence,
          origine: materiale.origine,
          action: ACTION_ACCEPT,
        })
      );
    }
  }

  if (
    includiDurata &&
    durata &&
    durata.durataStimata != null &&
    Number.isFinite(Number(durata.durataStimata)) &&
    Number(durata.durataStimata) > 0
  ) {
    const giorni = Number(durata.durataStimata);
    cards.push(
      creaCard({
        tipo: TIPO_DURATA,
        titolo: `Durata stimata: ${giorni} giorni`,
        descrizione: "Stima basata sulla durata media dei lavori simili",
        confidence: durata.confidence,
        origine: "experience",
        action: ACTION_VIEW,
      })
    );
  }

  return ordinaCards(cards);
}

/**
 * Promemoria operativi derivati dallo stato del cantiere aperto.
 * Regole deterministiche, indipendenti dal Suggestion Engine.
 * @param {object=} cantiere
 * @returns {AssistantCard[]}
 */
function cardsPromemoriaCantiere(cantiere) {
  if (!cantiere || typeof cantiere !== "object") return [];

  /** @type {AssistantCard[]} */
  const cards = [];
  const foto = Array.isArray(cantiere.foto) ? cantiere.foto : [];
  const note = String(cantiere.note || "").trim();
  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  const lavorazioni = Array.isArray(cantiere.lavorazioniOrigine)
    ? cantiere.lavorazioniOrigine
    : [];
  const stato = String(cantiere.stato || "");

  if (foto.length === 0) {
    cards.push(
      creaCard({
        tipo: TIPO_DOCUMENTAZIONE,
        titolo: "Documentazione fotografica",
        descrizione:
          "Mancano ancora le foto finali del quadro elettrico.",
        confidence: 0.88,
        origine: "experience",
        action: ACTION_ACCEPT,
      })
    );
  }

  if (!note) {
    cards.push(
      creaCard({
        tipo: TIPO_NOTA,
        titolo: "Annotazioni operative",
        descrizione:
          "Ricorda di annotare il numero del differenziale installato.",
        confidence: 0.75,
        origine: "experience",
        action: ACTION_ACCEPT,
      })
    );
  }

  if (materiali.length === 0 && lavorazioni.length > 0) {
    cards.push(
      creaCard({
        tipo: TIPO_MATERIALE,
        titolo: "Verifica materiali",
        descrizione:
          "Nei lavori simili è stato necessario un secondo sopralluogo. Verifica la disponibilità del materiale.",
        confidence: 0.72,
        origine: "experience",
        action: ACTION_VIEW,
      })
    );
  }

  if (stato === "In corso" || stato === "Completato") {
    cards.push(
      creaCard({
        tipo: TIPO_ECONOMICO,
        titolo: "Stato economico",
        descrizione:
          "Verifica acconto e ricorda di segnare il saldo a fine lavori.",
        confidence: 0.8,
        origine: "experience",
        action: ACTION_ACCEPT,
      })
    );
  }

  const economico = riepilogoEconomicoCantiere(cantiere);
  if (economico.numeroVarianti > 0) {
    const delta = economico.deltaVarianti;
    const descrizioneDelta =
      delta === 0
        ? `Sono state registrate ${economico.numeroVarianti} varianti a saldo zero.`
        : delta > 0
          ? `Il valore del cantiere è aumentato di ${formatEuro(delta)} rispetto al preventivo iniziale.`
          : `Il valore del cantiere è diminuito di ${formatEuro(Math.abs(delta))} rispetto al preventivo iniziale.`;

    cards.push(
      creaCard({
        tipo: TIPO_VARIANTE,
        titolo:
          economico.numeroVarianti === 1
            ? "1 variante di cantiere"
            : `${economico.numeroVarianti} varianti di cantiere`,
        descrizione: descrizioneDelta,
        confidence: 0.9,
        origine: "experience",
        action: ACTION_VIEW,
      })
    );
  } else if (stato === "In corso") {
    cards.push(
      creaCard({
        tipo: TIPO_VARIANTE,
        titolo: "Richieste extra del cliente?",
        descrizione:
          "Registra aggiunte o rimozioni come varianti: il preventivo originale resta invariato.",
        confidence: 0.7,
        origine: "experience",
        action: ACTION_VIEW,
      })
    );
  }

  return cards;
}

/**
 * @param {AssistantCard[]} cards
 * @returns {AssistantPayload}
 */
function creaPayload(cards) {
  const cardsOrdinate = ordinaCards(cards);

  return {
    cards: cardsOrdinate,
    summary: creaSummary(cardsOrdinate),
    generatedAt: new Date().toISOString(),
    versione: ASSISTANT_VERSIONE,
  };
}

/**
 * @param {OpzioniAssistant=} opzioni
 * @returns {ReturnType<typeof getSuggerimenti>}
 */
function risolviSuggerimenti(opzioni = {}) {
  if (opzioni.suggerimenti && typeof opzioni.suggerimenti === "object") {
    return opzioni.suggerimenti;
  }

  return getSuggerimenti({
    tipoLavoro: opzioni.tipoLavoro,
    insights: opzioni.insights,
    esperienze: opzioni.esperienze,
  });
}

/**
 * Punto di ingresso principale dell'Assistant Core.
 * @param {OpzioniAssistant=} opzioni
 * @returns {AssistantPayload}
 */
export function getAssistant(opzioni = {}) {
  const suggerimenti = risolviSuggerimenti(opzioni);
  const cards = cardsDaSuggerimenti(suggerimenti);
  return creaPayload(cards);
}

/**
 * Card utili per la Dashboard / Home (priorità alta e media).
 * @param {OpzioniAssistant=} opzioni
 * @returns {AssistantPayload}
 */
export function getDashboardAssistant(opzioni = {}) {
  const payload = getAssistant(opzioni);
  const cards = payload.cards.filter(
    (card) =>
      card.priorita === PRIORITA_ALTA || card.priorita === PRIORITA_MEDIA
  );

  return creaPayload(cards);
}

/**
 * Assistant contestuale al flusso Preventivo.
 * @param {OpzioniAssistant=} opzioni
 * @returns {AssistantPayload}
 */
export function getPreventivoAssistant(opzioni = {}) {
  const suggerimenti = risolviSuggerimenti(opzioni);
  const cards = cardsDaSuggerimenti(suggerimenti, {
    includiChecklist: true,
    includiMateriali: true,
    includiDurata: true,
  });
  return creaPayload(cards);
}

/**
 * Assistant contestuale al Cantiere.
 * Unisce promemoria operativi del cantiere aperto e suggerimenti esperienza.
 * @param {OpzioniAssistant & { cantiere?: object }=} opzioni
 * @returns {AssistantPayload}
 */
export function getCantiereAssistant(opzioni = {}) {
  const cantiere = opzioni.cantiere;
  const tipoLavoro =
    opzioni.tipoLavoro ||
    cantiere?.tipoLavoro ||
    cantiere?.origine ||
    "";

  const suggerimenti = risolviSuggerimenti({
    ...opzioni,
    tipoLavoro,
  });

  const daEsperienza = cardsDaSuggerimenti(suggerimenti, {
    includiChecklist: true,
    includiMateriali: true,
    includiDurata: true,
  }).map((card) => {
    if (card.tipo !== TIPO_DURATA) return card;
    return {
      ...card,
      titolo: String(card.titolo || "").replace(
        "Durata stimata:",
        "Tempo medio dei cantieri simili:"
      ),
      descrizione: "Riferimento basato sui cantieri simili completati",
    };
  });

  const promemoria = cardsPromemoriaCantiere(cantiere);
  return creaPayload([...promemoria, ...daEsperienza]);
}

/**
 * Assistant contestuale al Cliente (struttura pronta, contenuti futuri).
 * @param {OpzioniAssistant=} opzioni Riservato per filtri futuri (clienteId, storico, …)
 * @returns {AssistantPayload}
 */
export function getClienteAssistant(opzioni = {}) {
  void opzioni;
  return creaPayload([]);
}

export const ASSISTANT_ACTIONS = {
  view: ACTION_VIEW,
  accept: ACTION_ACCEPT,
  dismiss: ACTION_DISMISS,
};
