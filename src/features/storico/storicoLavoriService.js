/**
 * Storico lavori — aggregazione pura su cantieri realmente registrati.
 *
 * Struttura (estendibile senza riscrivere):
 * 1. analizzaLavoroStorico     → riepilogo singolo lavoro
 * 2. aggregaStoricoLavori      → aggregazione + lista filtrata/ordinata
 * 3. generaInsightStorico      → lettura fattuale (non predittiva)
 *
 * SoT: registroGiornate (giornate/ore), pagamenti[] (entrate), spese[] (uscite).
 * Nessuna persistenza, nessuna mutazione, nessun matching "lavori simili".
 *
 * Ordinamento "più recenti": dataFine (ultima giornata con data italiana valida
 * nel registro). Senza date di registro affidabili il lavoro va in coda —
 * non si usano creatoIl/aggiornatoIl.
 *
 * Lavori simili / "cosa ho imparato": non implementati — serve classificazione
 * strutturata e/o valutazione strutturata oggi non disponibili.
 */

import { formatEuro } from "../../utils/preventivi";
import { STATI_CANTIERE } from "../cantieri/cantieriDomain";
import { etichettaCantiereEconomia } from "../economia/economiaService";
import {
  leggiRegistroGiornate,
  parseDataProgrammazione,
  riepilogoRegistroCantiere
} from "../cantieri/services/registroGiornateService";
import {
  CATEGORIE_SPESA,
  calcolaTotaleSpesePerCategoria,
  riepilogoEconomicoCompleto
} from "../cantieri/services/speseCantiereService";

/** Ambito filtro storico. */
export const AMBITO_STORICO = Object.freeze({
  conclusi: "conclusi",
  tutti: "tutti",
});

export const ETICHETTE_AMBITO_STORICO = Object.freeze({
  [AMBITO_STORICO.conclusi]: "Completati",
  [AMBITO_STORICO.tutti]: "Tutti",
});

/** Ordinamenti basati su dati reali del riepilogo lavoro. */
export const ORDINAMENTO_STORICO = Object.freeze({
  recenti: "recenti",
  saldo_alto: "saldo_alto",
  saldo_basso: "saldo_basso",
  piu_giornate: "piu_giornate",
  piu_ore: "piu_ore",
  maggiori_uscite: "maggiori_uscite",
});

export const ETICHETTE_ORDINAMENTO_STORICO = Object.freeze({
  [ORDINAMENTO_STORICO.recenti]: "Più recenti",
  [ORDINAMENTO_STORICO.saldo_alto]: "Saldo ↑",
  [ORDINAMENTO_STORICO.saldo_basso]: "Saldo ↓",
  [ORDINAMENTO_STORICO.piu_giornate]: "Più giornate",
  [ORDINAMENTO_STORICO.piu_ore]: "Più ore",
  [ORDINAMENTO_STORICO.maggiori_uscite]: "Più uscite",
});

export const STATO_CANTIERE_COMPLETATO = "Completato";

/**
 * @param {object} cantiere
 * @returns {boolean}
 */
export function isLavoroConcluso(cantiere = {}) {
  return String(cantiere.stato || "").trim() === STATO_CANTIERE_COMPLETATO;
}

/**
 * Min/max date italiane dal registro giornate.
 * Solo date parseabili; nessuna data inventata da creatoIl/aggiornatoIl.
 * @param {object} cantiere
 * @returns {{ dataInizio: string|null, dataFine: string|null, dataInizioTs: number|null, dataFineTs: number|null }}
 */
export function ricavaDateLavoroDaRegistro(cantiere = {}) {
  let minTs = null;
  let maxTs = null;
  let dataInizio = null;
  let dataFine = null;

  for (const giornata of leggiRegistroGiornate(cantiere)) {
    const parsed = parseDataProgrammazione(giornata.data);
    if (!parsed) continue;
    const ts = parsed.getTime();
    if (!Number.isFinite(ts)) continue;
    if (minTs == null || ts < minTs) {
      minTs = ts;
      dataInizio = String(giornata.data || "").trim() || null;
    }
    if (maxTs == null || ts > maxTs) {
      maxTs = ts;
      dataFine = String(giornata.data || "").trim() || null;
    }
  }

  return {
    dataInizio,
    dataFine,
    dataInizioTs: minTs,
    dataFineTs: maxTs,
  };
}

/**
 * Timestamp per "più recenti": ultima giornata di registro valida.
 * @param {object} lavoro
 * @returns {number|null}
 */
export function tsRecenteLavoroStorico(lavoro = {}) {
  if (Number.isFinite(lavoro.dataFineTs)) return lavoro.dataFineTs;
  if (Number.isFinite(lavoro.dataInizioTs)) return lavoro.dataInizioTs;
  return null;
}

/**
 * Analisi pura di un singolo cantiere/lavoro per lo storico.
 * @param {object} cantiere
 * @returns {object|null}
 */
export function analizzaLavoroStorico(cantiere = {}) {
  const cantiereId = String(cantiere.id || "").trim();
  if (!cantiereId) return null;

  const registro = riepilogoRegistroCantiere(cantiere);
  const economico = riepilogoEconomicoCompleto(cantiere);
  const perCategoria = calcolaTotaleSpesePerCategoria(cantiere);
  const speseMateriali = Number(perCategoria[CATEGORIE_SPESA.materiali]) || 0;
  const uscite = Number(economico.totaleSpese) || 0;
  const altreSpese = Math.max(uscite - speseMateriali, 0);
  const entrate = Number(economico.incassato) || 0;
  const margine = Number(economico.margineLordo) || 0;
  const date = ricavaDateLavoroDaRegistro(cantiere);
  const stato = String(cantiere.stato || "").trim() || STATI_CANTIERE[0];

  return {
    cantiereId,
    nome: String(cantiere.nome || "").trim() || "Cantiere",
    cliente: String(cantiere.cliente || "").trim(),
    etichetta: etichettaCantiereEconomia(cantiere),
    stato,
    concluso: isLavoroConcluso(cantiere),
    contaGiornate: Number(registro.giornateLavorate) || 0,
    oreLavorate: Number(registro.totaleOreLavorate) || 0,
    entrate,
    uscite,
    saldo: margine,
    daIncassare: Math.max(Number(economico.rimanenza) || 0, 0),
    speseMateriali,
    altreSpese,
    /** Coerente con margineLordo = incassato − totaleSpese (formule esistenti). */
    margine,
    dataInizio: date.dataInizio,
    dataFine: date.dataFine,
    dataInizioTs: date.dataInizioTs,
    dataFineTs: date.dataFineTs,
  };
}

/**
 * @param {number} totale
 * @param {number} n
 */
function mediaSicura(totale, n) {
  if (!(n > 0)) return 0;
  return totale / n;
}

/**
 * @param {object} a
 * @param {object} b
 */
function confrontaIdLavoro(a, b) {
  return String(b.cantiereId || "").localeCompare(String(a.cantiereId || ""));
}

/**
 * Ordina lavori storico (puro, non muta l'array originale).
 * @param {object[]} lavori
 * @param {string} ordinamento
 * @returns {object[]}
 */
export function ordinaLavoriStorico(lavori = [], ordinamento = ORDINAMENTO_STORICO.recenti) {
  const lista = Array.isArray(lavori) ? [...lavori] : [];
  const chiave = Object.values(ORDINAMENTO_STORICO).includes(ordinamento)
    ? ordinamento
    : ORDINAMENTO_STORICO.recenti;

  lista.sort((a, b) => {
    if (chiave === ORDINAMENTO_STORICO.saldo_alto) {
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
    } else if (chiave === ORDINAMENTO_STORICO.saldo_basso) {
      if (a.saldo !== b.saldo) return a.saldo - b.saldo;
    } else if (chiave === ORDINAMENTO_STORICO.piu_giornate) {
      if (b.contaGiornate !== a.contaGiornate) {
        return b.contaGiornate - a.contaGiornate;
      }
    } else if (chiave === ORDINAMENTO_STORICO.piu_ore) {
      if (b.oreLavorate !== a.oreLavorate) return b.oreLavorate - a.oreLavorate;
    } else if (chiave === ORDINAMENTO_STORICO.maggiori_uscite) {
      if (b.uscite !== a.uscite) return b.uscite - a.uscite;
    } else {
      // recenti: dataFine registro; senza data → coda
      const ta = tsRecenteLavoroStorico(a);
      const tb = tsRecenteLavoroStorico(b);
      if (ta == null && tb == null) return confrontaIdLavoro(a, b);
      if (ta == null) return 1;
      if (tb == null) return -1;
      if (tb !== ta) return tb - ta;
    }
    return confrontaIdLavoro(a, b);
  });

  return lista;
}

/**
 * Insight fattuali (non predittivi) sui lavori analizzati.
 * Restituisce [] se i dati non bastano.
 * @param {{ lavori?: object[], totaleGiornate?: number, totaleUscite?: number, totaleSpeseMateriali?: number, totaleAltreSpese?: number }} aggregato
 * @returns {Array<{ id: string, testo: string }>}
 */
export function generaInsightStorico(aggregato = {}) {
  const lavori = Array.isArray(aggregato.lavori) ? aggregato.lavori : [];
  /** @type {Array<{ id: string, testo: string }>} */
  const insight = [];

  if (lavori.length === 0) return insight;

  const totaleGiornate = Number(aggregato.totaleGiornate) || 0;
  if (totaleGiornate > 0) {
    insight.push({
      id: "giornate-totali",
      testo: `Hai registrato ${totaleGiornate} ${
        totaleGiornate === 1 ? "giornata" : "giornate"
      } nei lavori analizzati.`,
    });
  }

  const totaleUscite = Number(aggregato.totaleUscite) || 0;
  const materiali = Number(aggregato.totaleSpeseMateriali) || 0;
  const altre = Number(aggregato.totaleAltreSpese) || 0;
  if (totaleUscite > 0 && materiali > altre && materiali > 0) {
    insight.push({
      id: "uscite-materiali",
      testo:
        "La maggior parte delle uscite registrate è relativa ai materiali.",
    });
  }

  // Confronto estremi: ha senso con almeno 2 lavori
  if (lavori.length >= 2) {
    const conUscite = lavori.filter((l) => l.uscite > 0);
    if (conUscite.length >= 1) {
      const topUscite = conUscite.reduce((best, l) =>
        l.uscite > best.uscite ? l : best
      );
      insight.push({
        id: "max-uscite",
        testo: `Il lavoro con più uscite è ${topUscite.nome} (${formatEuro(
          topUscite.uscite
        )}).`,
      });
    }

    const conGiornate = lavori.filter((l) => l.contaGiornate > 0);
    if (conGiornate.length >= 1) {
      const topGiornate = conGiornate.reduce((best, l) =>
        l.contaGiornate > best.contaGiornate ? l : best
      );
      insight.push({
        id: "max-giornate",
        testo: `Il lavoro con più giornate è ${topGiornate.nome} (${topGiornate.contaGiornate}).`,
      });
    }

    const topSaldo = lavori.reduce((best, l) => (l.saldo > best.saldo ? l : best));
    insight.push({
      id: "max-saldo",
      testo: `Il lavoro con il saldo più alto è ${topSaldo.nome} (${formatEuro(
        topSaldo.saldo
      )}).`,
    });
  }

  return insight.slice(0, 4);
}

/**
 * Aggregazione storico lavori.
 * @param {object[]} cantieri
 * @param {{ ambito?: string, ordinamento?: string, limiteLavori?: number }=} filtri
 */
export function aggregaStoricoLavori(cantieri = [], filtri = {}) {
  const ambito = filtri.ambito || AMBITO_STORICO.conclusi;
  const ordinamento = filtri.ordinamento || ORDINAMENTO_STORICO.recenti;
  const limite =
    Number.isFinite(Number(filtri.limiteLavori)) && Number(filtri.limiteLavori) > 0
      ? Number(filtri.limiteLavori)
      : 40;

  const lista = Array.isArray(cantieri) ? cantieri : [];
  /** @type {ReturnType<typeof analizzaLavoroStorico>[]} */
  const lavoriGrezzi = [];

  for (const cantiere of lista) {
    if (ambito === AMBITO_STORICO.conclusi && !isLavoroConcluso(cantiere)) {
      continue;
    }
    const analizzato = analizzaLavoroStorico(cantiere);
    if (analizzato) lavoriGrezzi.push(analizzato);
  }

  const lavoriOrdinati = ordinaLavoriStorico(lavoriGrezzi, ordinamento);

  const n = lavoriOrdinati.length;
  let totaleGiornate = 0;
  let totaleOre = 0;
  let totaleEntrate = 0;
  let totaleUscite = 0;
  let totaleSpeseMateriali = 0;
  let totaleAltreSpese = 0;
  let totaleDaIncassare = 0;

  for (const lavoro of lavoriOrdinati) {
    totaleGiornate += lavoro.contaGiornate;
    totaleOre += lavoro.oreLavorate;
    totaleEntrate += lavoro.entrate;
    totaleUscite += lavoro.uscite;
    totaleSpeseMateriali += lavoro.speseMateriali;
    totaleAltreSpese += lavoro.altreSpese;
    totaleDaIncassare += lavoro.daIncassare;
  }

  const saldoComplessivo = totaleEntrate - totaleUscite;

  const statsPerInsight = {
    lavori: lavoriOrdinati,
    totaleGiornate,
    totaleUscite,
    totaleSpeseMateriali,
    totaleAltreSpese,
  };

  return {
    ambito,
    ambitoEtichetta: ETICHETTE_AMBITO_STORICO[ambito] || ambito,
    ordinamento,
    ordinamentoEtichetta:
      ETICHETTE_ORDINAMENTO_STORICO[ordinamento] || ordinamento,
    lavoriAnalizzati: n,
    totaleGiornate,
    totaleOre,
    mediaGiornatePerLavoro: mediaSicura(totaleGiornate, n),
    mediaOrePerLavoro: mediaSicura(totaleOre, n),
    totaleEntrate,
    totaleUscite,
    saldoComplessivo,
    mediaEntratePerLavoro: mediaSicura(totaleEntrate, n),
    mediaUscitePerLavoro: mediaSicura(totaleUscite, n),
    mediaSaldoPerLavoro: mediaSicura(saldoComplessivo, n),
    totaleSpeseMateriali,
    totaleAltreSpese,
    mediaMarginePerLavoro: mediaSicura(saldoComplessivo, n),
    totaleDaIncassare,
    lavori: lavoriOrdinati.slice(0, limite),
    lavoriTotali: n,
    insight: generaInsightStorico(statsPerInsight),
  };
}

export { formatEuro, STATI_CANTIERE };
