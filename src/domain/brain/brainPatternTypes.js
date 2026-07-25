/**
 * PreventivAI Brain — tipi e soglie Pattern Engine.
 * Solo statistica. Nessuna AI / auto-conoscenza.
 */

import { creaIdBrain } from "./brainTypes";

/** Soglie configurabili per proporre un pattern. */
export const BRAIN_PATTERN_SOGLIE = Object.freeze({
  MIN_OSSERVAZIONI: 5,
  MIN_RIPETIZIONE: 0.8,
});

/** Fasce superficie per raggruppamento statistico. */
export const BRAIN_FASCE_MQ = Object.freeze([
  { id: "0-50", min: 0, max: 50, label: "≤50 mq" },
  { id: "51-100", min: 51, max: 100, label: "51–100 mq" },
  { id: "101-150", min: 101, max: 150, label: "101–150 mq" },
  { id: "150+", min: 151, max: Number.POSITIVE_INFINITY, label: ">150 mq" },
]);

export const BRAIN_PATTERN_STATI = Object.freeze({
  NUOVO: "nuovo",
  PROPOSTO: "proposto",
  ACCETTATO: "accettato",
  RIFIUTATO: "rifiutato",
});

/** Mappa extra form → Catalogo (id) + etichetta UI. */
export const BRAIN_EXTRA_SUGGERIMENTI = Object.freeze({
  predisposizioneClima: {
    label: "Clima",
    categoria: "Climatizzazione",
    catalogoId: "CLIMA",
    testo: "Predisposizione climatizzazione",
  },
  clima: {
    label: "Clima",
    categoria: "Climatizzazione",
    catalogoId: "CLIMA",
    testo: "Predisposizione climatizzazione",
  },
  domotica: {
    label: "Domotica",
    categoria: "Domotica",
    /** Domotica → più voci catalogo (non un testo composito). */
    catalogoIds: ["GATEWAY", "BUS", "ALIMENTATORE"],
    catalogoId: "GATEWAY",
    testo: "Gateway",
  },
  videosorveglianza: {
    label: "Videosorveglianza",
    categoria: "Sicurezza",
    catalogoId: "VIDEOSORVEGLIANZA",
    testo: "Videosorveglianza",
  },
  allarme: {
    label: "Allarme",
    categoria: "Sicurezza",
    catalogoId: "ALLARME",
    testo: "Predisposizione impianto allarme",
  },
  fotovoltaico: {
    label: "Fotovoltaico",
    categoria: "Fotovoltaico",
    catalogoId: "FOTOVOLTAICO",
    testo: "Predisposizione fotovoltaico",
  },
  ricaricaAuto: {
    label: "Ricarica Auto",
    categoria: "Ricarica Auto",
    catalogoId: "RICARICA_AUTO",
    testo: "Predisposizione ricarica auto",
  },
  automazioneCancello: {
    label: "Cancello",
    categoria: "Immobile",
    catalogoId: "CANCELLO",
    testo: "Predisposizione cancello",
  },
});

/**
 * @typedef {Object} BrainPattern
 * @property {string} id
 * @property {number} createdAt
 * @property {string} nome
 * @property {string} categoria
 * @property {object} condizioni
 * @property {object} suggerimento
 * @property {number} osservazioni
 * @property {number} affidabilita
 * @property {"nuovo"|"proposto"|"accettato"|"rifiutato"} stato
 * @property {string=} fingerprint
 * @property {number|null=} decisionAt
 * @property {string|null=} decisionBy
 * @property {string|null=} motivoRifiuto
 */

/**
 * @param {number|null|undefined} mq
 * @returns {{ id: string, label: string }|null}
 */
export function risolviFasciaMq(mq) {
  if (mq === null || mq === undefined || !Number.isFinite(Number(mq))) {
    return { id: "nd", label: "mq n/d" };
  }
  const valore = Number(mq);
  const fascia = BRAIN_FASCE_MQ.find(
    (f) => valore >= f.min && valore <= f.max
  );
  return fascia
    ? { id: fascia.id, label: fascia.label }
    : { id: "nd", label: "mq n/d" };
}

/**
 * @param {Partial<BrainPattern>} dati
 * @returns {BrainPattern}
 */
export function creaBrainPattern(dati = {}) {
  return {
    id: dati.id || creaIdBrain("pat"),
    createdAt: dati.createdAt || Date.now(),
    nome: dati.nome || "Pattern",
    categoria: dati.categoria || "Generale",
    condizioni: dati.condizioni && typeof dati.condizioni === "object"
      ? { ...dati.condizioni }
      : {},
    suggerimento:
      dati.suggerimento && typeof dati.suggerimento === "object"
        ? { ...dati.suggerimento }
        : {},
    osservazioni: Number(dati.osservazioni) || 0,
    affidabilita: Number(dati.affidabilita) || 0,
    stato: dati.stato || BRAIN_PATTERN_STATI.NUOVO,
    fingerprint: dati.fingerprint || "",
    decisionAt:
      dati.decisionAt === null || dati.decisionAt === undefined
        ? null
        : Number(dati.decisionAt) || null,
    decisionBy: dati.decisionBy ? String(dati.decisionBy) : null,
    motivoRifiuto:
      dati.motivoRifiuto === null || dati.motivoRifiuto === undefined
        ? null
        : String(dati.motivoRifiuto),
  };
}

/**
 * Chiave stabile per merge accettato/rifiutato tra analisi successive.
 * @param {object} condizioni
 * @param {object} suggerimento
 */
export function fingerprintPattern(condizioni = {}, suggerimento = {}) {
  return JSON.stringify({
    c: condizioni,
    s: {
      tipo: suggerimento.tipo || "",
      catalogoId: suggerimento.catalogoId || "",
      testo: suggerimento.testo || "",
      chiave: suggerimento.chiave || "",
    },
  });
}
