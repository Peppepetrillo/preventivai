/**
 * Aggregazione economica generale attività (Economia v0).
 * SoT movimenti: cantiere.pagamenti[] (entrate) + cantiere.spese[] (uscite).
 * Nessuna persistenza, nessuna mutazione, nessuna doppia contabilizzazione.
 */

import { formatEuro } from "../../utils/preventivi";
import {
  ETICHETTE_CATEGORIA_SPESA,
  leggiSpese,
  parseDataItalianaCantiere,
} from "../cantieri/services/speseCantiereService";
import {
  ETICHETTE_TIPO_PAGAMENTO,
  leggiPagamenti,
  riepilogoEconomicoCantiere,
} from "../cantieri/services/pagamentiCantiereService";

/** Periodi filtro Economia v0 (estendibile in seguito). */
export const PERIODO_ECONOMIA = Object.freeze({
  questo_mese: "questo_mese",
  mese_scorso: "mese_scorso",
});

export const ETICHETTE_PERIODO_ECONOMIA = Object.freeze({
  [PERIODO_ECONOMIA.questo_mese]: "Questo mese",
  [PERIODO_ECONOMIA.mese_scorso]: "Mese scorso",
});

export const TIPO_MOVIMENTO_ECONOMIA = Object.freeze({
  entrata: "entrata",
  uscita: "uscita",
});

/**
 * Intervallo [inizio, fine] inclusivo in timestamp locali per un mese.
 * @param {string} periodo
 * @param {Date=} riferimento
 * @returns {{ inizio: number, fine: number, etichetta: string }|null}
 */
export function intervalloPeriodoEconomia(periodo, riferimento = new Date()) {
  const base = riferimento instanceof Date ? riferimento : new Date();
  if (!Number.isFinite(base.getTime())) return null;

  let anno = base.getFullYear();
  let mese = base.getMonth();

  if (periodo === PERIODO_ECONOMIA.mese_scorso) {
    mese -= 1;
    if (mese < 0) {
      mese = 11;
      anno -= 1;
    }
  } else if (periodo !== PERIODO_ECONOMIA.questo_mese) {
    return null;
  }

  const inizio = new Date(anno, mese, 1, 0, 0, 0, 0).getTime();
  const fine = new Date(anno, mese + 1, 0, 23, 59, 59, 999).getTime();
  const etichetta =
    ETICHETTE_PERIODO_ECONOMIA[periodo] ||
    new Date(anno, mese, 1).toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    });

  return { inizio, fine, etichetta, anno, mese };
}

/**
 * @param {object} cantiere
 * @returns {string}
 */
export function etichettaCantiereEconomia(cantiere = {}) {
  const cliente = String(cantiere.cliente || "").trim();
  const nome = String(cantiere.nome || "").trim();
  if (cliente && nome && cliente !== nome) return `${nome} · ${cliente}`;
  return cliente || nome || "Cantiere";
}

/**
 * Raccoglie movimenti di cassa reali da un cantiere.
 * Esclude movimenti senza data italiana valida (nessuna data inventata).
 * Record che falliscono normalizzaPagamento/normalizzaSpesa (es. data vuota)
 * non sono movimenti e non vengono conteggiati in esclusiSenzaData.
 * Non legge preventivo.incassato, listaSpesa, materiali qty, giornate.
 *
 * @param {object} cantiere
 * @returns {Array<object>}
 */
export function raccogliMovimentiCantiereEconomia(cantiere = {}) {
  const cantiereId = String(cantiere.id || "").trim();
  if (!cantiereId) return [];

  const etichettaCantiere = etichettaCantiereEconomia(cantiere);
  /** @type {Array<object>} */
  const movimenti = [];

  for (const pagamento of leggiPagamenti(cantiere)) {
    const ts = parseDataItalianaCantiere(pagamento.data);
    if (ts == null) continue;
    const tipoPagamento = pagamento.tipo || "acconto";
    movimenti.push({
      id: `entrata-${cantiereId}-${pagamento.id}`,
      cantiereId,
      tipo: TIPO_MOVIMENTO_ECONOMIA.entrata,
      data: pagamento.data,
      ts,
      importo: Number(pagamento.importo) || 0,
      categoria: tipoPagamento,
      descrizione:
        ETICHETTE_TIPO_PAGAMENTO[tipoPagamento] ||
        String(tipoPagamento),
      etichettaCantiere,
    });
  }

  for (const spesa of leggiSpese(cantiere)) {
    const ts = parseDataItalianaCantiere(spesa.data);
    if (ts == null) continue;
    const categoria = spesa.categoria || "altro";
    movimenti.push({
      id: `uscita-${cantiereId}-${spesa.id}`,
      cantiereId,
      tipo: TIPO_MOVIMENTO_ECONOMIA.uscita,
      data: spesa.data,
      ts,
      importo: Number(spesa.importo) || 0,
      categoria,
      descrizione:
        String(spesa.descrizione || "").trim() ||
        ETICHETTE_CATEGORIA_SPESA[categoria] ||
        "Spesa",
      etichettaCantiere,
    });
  }

  return movimenti;
}

/**
 * Stock "da incassare" su tutti i cantieri (non filtrato dal periodo).
 * @param {object[]} cantieri
 * @returns {number}
 */
export function calcolaDaIncassareEconomia(cantieri = []) {
  return (Array.isArray(cantieri) ? cantieri : []).reduce((acc, cantiere) => {
    const { rimanenza } = riepilogoEconomicoCantiere(cantiere);
    return acc + Math.max(Number(rimanenza) || 0, 0);
  }, 0);
}

/**
 * Aggregazione Economia attività.
 * @param {object[]} cantieri
 * @param {{ periodo?: string, riferimento?: Date, limiteMovimenti?: number }=} opzioni
 */
export function aggregaEconomiaAttivita(cantieri = [], opzioni = {}) {
  const periodo = opzioni.periodo || PERIODO_ECONOMIA.questo_mese;
  const intervallo = intervalloPeriodoEconomia(periodo, opzioni.riferimento);
  const limite =
    Number.isFinite(Number(opzioni.limiteMovimenti)) &&
    Number(opzioni.limiteMovimenti) > 0
      ? Number(opzioni.limiteMovimenti)
      : 40;

  const lista = Array.isArray(cantieri) ? cantieri : [];
  /** @type {Array<object>} */
  let movimenti = [];
  let esclusiSenzaData = 0;

  for (const cantiere of lista) {
    // Conteggio esclusi: pagamenti/spese senza data valida
    const pagamenti = leggiPagamenti(cantiere);
    for (const p of pagamenti) {
      if (parseDataItalianaCantiere(p.data) == null) esclusiSenzaData += 1;
    }
    const spese = leggiSpese(cantiere);
    for (const s of spese) {
      if (parseDataItalianaCantiere(s.data) == null) esclusiSenzaData += 1;
    }
    movimenti = movimenti.concat(raccogliMovimentiCantiereEconomia(cantiere));
  }

  const nelPeriodo =
    intervallo == null
      ? movimenti
      : movimenti.filter(
          (m) => m.ts >= intervallo.inizio && m.ts <= intervallo.fine
        );

  let entrate = 0;
  let uscite = 0;
  for (const m of nelPeriodo) {
    if (m.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata) entrate += m.importo;
    else if (m.tipo === TIPO_MOVIMENTO_ECONOMIA.uscita) uscite += m.importo;
  }

  const ordinati = [...nelPeriodo].sort((a, b) => {
    if (b.ts !== a.ts) return b.ts - a.ts;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });

  return {
    periodo,
    periodoEtichetta:
      intervallo?.etichetta || ETICHETTE_PERIODO_ECONOMIA[periodo] || periodo,
    intervallo,
    entrate,
    uscite,
    saldo: entrate - uscite,
    daIncassare: calcolaDaIncassareEconomia(lista),
    movimenti: ordinati.slice(0, limite),
    movimentiTotaliNelPeriodo: ordinati.length,
    esclusiSenzaData,
    cantieriAnalizzati: lista.length,
  };
}

export { formatEuro };
