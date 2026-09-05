/**
 * Fallback deterministico — utile anche senza provider AI.
 * Non inventa prezzi; comunica chiaramente i limiti.
 */

import { formatEuro } from "../../utils/preventivi";
import { normalizzaDatiConfronto } from "./aiContract";
import {
  ETICHETTE_CONFIDENZA_AI,
  LIVELLI_CONFIDENZA_AI,
} from "./aiTypes";
import { haDatiSufficientiPerStima } from "./aiStatistiche";

/**
 * @param {number|null|undefined} n
 * @param {number=} decimali
 */
function fmtNum(n, decimali = 1) {
  if (n == null || !Number.isFinite(n)) return null;
  return Number(n.toFixed(decimali));
}

/**
 * @param {{ media?: number|null, n?: number }} agg
 * @param {"euro"|"num"} tipo
 */
function rigaMedia(agg, tipo = "num") {
  if (!agg || agg.n === 0 || agg.media == null) return null;
  if (tipo === "euro") return formatEuro(agg.media);
  return String(fmtNum(agg.media));
}

/**
 * Costruisce insight strutturato solo dai dati (nessun LLM).
 * @param {object} contesto — da costruisciContestoPreventivAI
 * @param {{ motivo?: string }=} opzioni
 */
export function generaInsightDeterministico(contesto = {}, opzioni = {}) {
  const stats = contesto.statistiche || {};
  const livello =
    contesto.livelloConfidenza || LIVELLI_CONFIDENZA_AI.insufficiente;
  const n = Number(stats.numeroConfrontabili) || 0;
  const utili = Number(stats.conDatiUtili) || 0;
  const sufficiente = haDatiSufficientiPerStima(stats);

  /** @type {string[]} */
  const datiDiConfronto = [];
  if (n > 0) {
    datiDiConfronto.push(
      `Ho trovato ${n} ${
        n === 1 ? "lavoro potenzialmente simile" : "lavori potenzialmente simili"
      }.`
    );
  }
  if (utili > 0) {
    datiDiConfronto.push(`Basato su ${utili} lavori con dati registrati.`);
  }

  const g = rigaMedia(stats.giornate);
  if (g) datiDiConfronto.push(`${g} giornate medie`);
  const o = rigaMedia(stats.ore);
  if (o) datiDiConfronto.push(`${o} ore medie`);
  const mat = rigaMedia(stats.speseMateriali, "euro");
  if (mat) datiDiConfronto.push(`${mat} materiali medi`);
  const alt = rigaMedia(stats.altreSpese, "euro");
  if (alt) datiDiConfronto.push(`${alt} altre spese medie`);
  const usc = rigaMedia(stats.uscite, "euro");
  if (usc) datiDiConfronto.push(`${usc} uscite medie`);
  const ent = rigaMedia(stats.entrate, "euro");
  if (ent) datiDiConfronto.push(`${ent} entrate medie`);

  /** @type {string[]} */
  const rischi = [];
  /** @type {string[]} */
  const cosaControllare = [];

  /** @type {string} */
  let valutazione;
  /** @type {string} */
  let motivazione;
  /** @type {string} */
  let suggerimento;

  if (!sufficiente) {
    valutazione =
      "Non ho abbastanza lavori confrontabili per darti una stima affidabile.";
    motivazione =
      utili === 0
        ? "Nei tuoi cantieri non ci sono ancora abbastanza dati (giornate, spese o incassi) su lavori simili."
        : `Ho solo ${utili} ${
            utili === 1 ? "lavoro" : "lavori"
          } con dati utili: servono almeno 2 confronti.`;
    cosaControllare.push(
      "Registra giornate e spese sui cantieri conclusi."
    );
    cosaControllare.push(
      "Compila tipo lavoro / tipologia e voci del preventivo per migliorare il confronto."
    );
    suggerimento =
      "Puoi comunque preparare il preventivo a mano: l’analisi si rafforzerà con i prossimi lavori.";
    rischi.push("Senza storico, ogni stima resterebbe una ipotesi.");
  } else {
    valutazione =
      "I tuoi dati storici offrono un confronto utile, non un prezzo automatico.";
    motivazione = `Basato su ${utili} lavori confrontabili${
      contesto.nuovoLavoro?.categoriaEtichetta
        ? ` in ambito «${contesto.nuovoLavoro.categoriaEtichetta}»`
        : ""
    }. Le medie descrivono cosa è successo nei lavori passati.`;
    cosaControllare.push(
      "Confronta materiali e complessità con i lavori passati prima di chiudere il totale."
    );
    cosaControllare.push(
      "Verifica se il cantiere richiede più giornate del solito (accessi, rifacimenti)."
    );
    if (stats.saldo?.media != null && stats.saldo.media < 0) {
      rischi.push(
        "In media, lavori simili hanno avuto un saldo negativo (uscite > entrate registrate)."
      );
    }
    if (stats.giornate?.max != null && stats.giornate?.min != null) {
      rischi.push(
        `Le giornate nei confronti vanno da ${fmtNum(stats.giornate.min, 0)} a ${fmtNum(
          stats.giornate.max,
          0
        )}: il range può essere ampio.`
      );
    }
    suggerimento =
      "Usa queste medie come riferimento interno, poi adatta il preventivo al cantiere reale.";
  }

  if (opzioni.motivo) {
    motivazione = `${motivazione} (${opzioni.motivo})`;
  }

  return {
    fonte: "deterministico",
    titolo: "Analisi dai tuoi dati",
    valutazione,
    motivazione,
    datiDiConfronto: normalizzaDatiConfronto(datiDiConfronto),
    rischi,
    cosaControllare,
    suggerimento,
    livelloConfidenza: livello,
    livelloConfidenzaEtichetta: ETICHETTE_CONFIDENZA_AI[livello] || livello,
    numeroLavoriSimili: n,
    numeroConDatiUtili: utili,
  };
}
