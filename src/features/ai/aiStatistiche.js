/**
 * Statistiche deterministiche sui lavori potenzialmente simili.
 * Nessuna media inventata: se manca il dato, il campo resta null.
 */

import { AI_SOGLIE, LIVELLI_CONFIDENZA_AI } from "./aiTypes";

/**
 * @param {number[]} valori
 * @returns {{ media: number|null, min: number|null, max: number|null, n: number }}
 */
function aggregaNumeri(valori) {
  const validi = (valori || []).filter(
    (v) => typeof v === "number" && Number.isFinite(v) && v >= 0
  );
  if (validi.length === 0) {
    return { media: null, min: null, max: null, n: 0 };
  }
  const somma = validi.reduce((s, v) => s + v, 0);
  return {
    media: somma / validi.length,
    min: Math.min(...validi),
    max: Math.max(...validi),
    n: validi.length,
  };
}

/**
 * @param {Array<{ riepilogo?: object|null }>} simili
 * @returns {object}
 */
export function calcolaStatisticheSimili(simili = []) {
  const lista = Array.isArray(simili) ? simili : [];
  const riepiloghi = lista
    .map((s) => s?.riepilogo)
    .filter(Boolean);

  const giornate = aggregaNumeri(riepiloghi.map((r) => r.contaGiornate));
  const ore = aggregaNumeri(riepiloghi.map((r) => r.oreLavorate));
  const materiali = aggregaNumeri(riepiloghi.map((r) => r.speseMateriali));
  const altre = aggregaNumeri(riepiloghi.map((r) => r.altreSpese));
  const uscite = aggregaNumeri(riepiloghi.map((r) => r.uscite));
  const entrate = aggregaNumeri(riepiloghi.map((r) => r.entrate));
  const saldo = aggregaNumeri(riepiloghi.map((r) => r.saldo));

  const conDatiUtili = riepiloghi.filter(
    (r) =>
      (r.contaGiornate > 0 || r.oreLavorate > 0 || r.uscite > 0 || r.entrate > 0)
  ).length;

  return {
    numeroConfrontabili: lista.length,
    conDatiUtili,
    giornate,
    ore,
    speseMateriali: materiali,
    altreSpese: altre,
    uscite,
    entrate,
    saldo,
  };
}

/**
 * @param {{ numeroConfrontabili?: number, conDatiUtili?: number }} stats
 * @param {{ categoria?: string|null }} classificazione
 * @returns {string}
 */
export function valutaConfidenzaAi(stats = {}, classificazione = {}) {
  const n = Number(stats.conDatiUtili) || 0;
  const confrontabili = Number(stats.numeroConfrontabili) || 0;

  if (confrontabili === 0 || n === 0) {
    return LIVELLI_CONFIDENZA_AI.insufficiente;
  }
  if (n < AI_SOGLIE.minLavoriPerStima) {
    return LIVELLI_CONFIDENZA_AI.bassa;
  }
  if (n >= AI_SOGLIE.minLavoriBuona && classificazione.categoria) {
    return LIVELLI_CONFIDENZA_AI.buona;
  }
  if (n >= AI_SOGLIE.minLavoriPerStima) {
    return LIVELLI_CONFIDENZA_AI.media;
  }
  return LIVELLI_CONFIDENZA_AI.bassa;
}

/**
 * True se possiamo proporre una valutazione (non inventata).
 * @param {object} stats
 */
export function haDatiSufficientiPerStima(stats = {}) {
  return (Number(stats.conDatiUtili) || 0) >= AI_SOGLIE.minLavoriPerStima;
}
