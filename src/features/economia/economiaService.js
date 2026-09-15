/**
 * Aggregazione economica generale attività.
 * SoT:
 * - cantiere.pagamenti[] (entrate cantiere)
 * - cantiere.spese[] (uscite cantiere)
 * - preventivai.economia.movimenti (movimenti generali senza cantiere)
 * Nessuna doppia contabilizzazione: i generali non ripetono i movimenti cantiere.
 */

import { formatEuro } from "../../utils/preventivi";
import {
  ETICHETTE_CATEGORIA_SPESA,
  leggiSpese,
  parseDataItalianaCantiere,
  CATEGORIE_SPESA,
} from "../cantieri/services/speseCantiereService";
import {
  ETICHETTE_TIPO_PAGAMENTO,
  leggiPagamenti,
  riepilogoEconomicoCantiere,
} from "../cantieri/services/pagamentiCantiereService";
import { leggiMovimentiEconomiaGenerali } from "./economiaMovimentiRepository";
import {
  ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA,
  ETICHETTE_CATEGORIA_USCITA_ECONOMIA,
  ORIGINE_MOVIMENTO_ECONOMIA,
  RIEPILOGO_USCITE_ECONOMIA,
} from "./economiaMovimentiTypes";

/** Periodi filtro Economia (estendibile: settimana / anno / personalizzato). */
export const PERIODO_ECONOMIA = Object.freeze({
  questo_mese: "questo_mese",
  mese_scorso: "mese_scorso",
  settimana: "settimana",
  anno: "anno",
  personalizzato: "personalizzato",
});

export const ETICHETTE_PERIODO_ECONOMIA = Object.freeze({
  [PERIODO_ECONOMIA.questo_mese]: "Questo mese",
  [PERIODO_ECONOMIA.mese_scorso]: "Mese precedente",
  [PERIODO_ECONOMIA.settimana]: "Settimana",
  [PERIODO_ECONOMIA.anno]: "Anno",
  [PERIODO_ECONOMIA.personalizzato]: "Personalizzato",
});

export const TIPO_MOVIMENTO_ECONOMIA = Object.freeze({
  entrata: "entrata",
  uscita: "uscita",
});

/**
 * Intervallo [inizio, fine] inclusivo in timestamp locali.
 * @param {string} periodo
 * @param {Date=} riferimento
 * @param {{ inizio?: Date|number, fine?: Date|number }=} personalizzato
 * @returns {{ inizio: number, fine: number, etichetta: string, anno?: number, mese?: number }|null}
 */
export function intervalloPeriodoEconomia(
  periodo,
  riferimento = new Date(),
  personalizzato = {}
) {
  const base = riferimento instanceof Date ? riferimento : new Date();
  if (!Number.isFinite(base.getTime())) return null;

  if (periodo === PERIODO_ECONOMIA.personalizzato) {
    const inizioRaw = personalizzato.inizio;
    const fineRaw = personalizzato.fine;
    const inizio =
      inizioRaw instanceof Date
        ? inizioRaw.getTime()
        : Number(inizioRaw);
    const fine =
      fineRaw instanceof Date ? fineRaw.getTime() : Number(fineRaw);
    if (!Number.isFinite(inizio) || !Number.isFinite(fine) || fine < inizio) {
      return null;
    }
    return {
      inizio,
      fine,
      etichetta: ETICHETTE_PERIODO_ECONOMIA.personalizzato,
    };
  }

  if (periodo === PERIODO_ECONOMIA.settimana) {
    const giorno = base.getDay();
    const diffLunedi = giorno === 0 ? -6 : 1 - giorno;
    const lunedi = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + diffLunedi,
      0,
      0,
      0,
      0
    );
    const domenica = new Date(
      lunedi.getFullYear(),
      lunedi.getMonth(),
      lunedi.getDate() + 6,
      23,
      59,
      59,
      999
    );
    return {
      inizio: lunedi.getTime(),
      fine: domenica.getTime(),
      etichetta: ETICHETTE_PERIODO_ECONOMIA.settimana,
    };
  }

  if (periodo === PERIODO_ECONOMIA.anno) {
    const inizio = new Date(base.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
    const fine = new Date(
      base.getFullYear(),
      11,
      31,
      23,
      59,
      59,
      999
    ).getTime();
    return {
      inizio,
      fine,
      etichetta: String(base.getFullYear()),
      anno: base.getFullYear(),
    };
  }

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
        String(pagamento.note || "").trim() ||
        ETICHETTE_TIPO_PAGAMENTO[tipoPagamento] ||
        String(tipoPagamento),
      etichettaCantiere,
      origine: ORIGINE_MOVIMENTO_ECONOMIA.cantiere,
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
        ETICHETTE_CATEGORIA_USCITA_ECONOMIA[categoria] ||
        ETICHETTE_CATEGORIA_SPESA[categoria] ||
        "Spesa",
      etichettaCantiere,
      origine: ORIGINE_MOVIMENTO_ECONOMIA.cantiere,
    });
  }

  return movimenti;
}

/**
 * Movimenti generali (senza cantiere).
 * @returns {Array<object>}
 */
export function raccogliMovimentiGeneraliEconomia() {
  return leggiMovimentiEconomiaGenerali()
    .map((m) => {
      const ts = parseDataItalianaCantiere(m.data);
      if (ts == null) return null;
      return {
        id: `generale-${m.id}`,
        cantiereId: null,
        tipo: m.tipo,
        data: m.data,
        ts,
        importo: Number(m.importo) || 0,
        categoria: m.categoria,
        descrizione:
          String(m.descrizione || "").trim() ||
          (m.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata
            ? ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA[m.categoria]
            : ETICHETTE_CATEGORIA_USCITA_ECONOMIA[m.categoria]) ||
          (m.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata ? "Entrata" : "Uscita"),
        etichettaCantiere: "",
        origine: ORIGINE_MOVIMENTO_ECONOMIA.generale,
      };
    })
    .filter(Boolean);
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

function azzeraRiepilogoUscite() {
  /** @type {Record<string, number>} */
  const out = {};
  for (const voce of RIEPILOGO_USCITE_ECONOMIA) {
    out[voce.key] = 0;
  }
  return out;
}

/**
 * Aggregazione Economia attività.
 * @param {object[]} cantieri
 * @param {{
 *   periodo?: string,
 *   riferimento?: Date,
 *   limiteMovimenti?: number,
 *   movimentiGenerali?: object[],
 *   personalizzato?: { inizio?: Date|number, fine?: Date|number },
 * }=} opzioni
 */
export function aggregaEconomiaAttivita(cantieri = [], opzioni = {}) {
  const periodo = opzioni.periodo || PERIODO_ECONOMIA.questo_mese;
  const intervallo = intervalloPeriodoEconomia(
    periodo,
    opzioni.riferimento,
    opzioni.personalizzato
  );
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

  const generali =
    opzioni.movimentiGenerali != null
      ? opzioni.movimentiGenerali
      : raccogliMovimentiGeneraliEconomia();
  for (const g of generali) {
    if (g && g.ts == null) {
      const ts = parseDataItalianaCantiere(g.data);
      if (ts == null) {
        esclusiSenzaData += 1;
        continue;
      }
      movimenti.push({ ...g, ts });
    } else if (g) {
      movimenti.push(g);
    }
  }

  const nelPeriodo =
    intervallo == null
      ? movimenti
      : movimenti.filter(
          (m) => m.ts >= intervallo.inizio && m.ts <= intervallo.fine
        );

  let entrate = 0;
  let uscite = 0;
  const uscitePerCategoria = azzeraRiepilogoUscite();

  for (const m of nelPeriodo) {
    if (m.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata) {
      entrate += m.importo;
    } else if (m.tipo === TIPO_MOVIMENTO_ECONOMIA.uscita) {
      uscite += m.importo;
      const key = Object.values(CATEGORIE_SPESA).includes(m.categoria)
        ? m.categoria
        : CATEGORIE_SPESA.altro;
      uscitePerCategoria[key] = (uscitePerCategoria[key] || 0) + m.importo;
    }
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
    uscitePerCategoria,
    riepilogoUscite: RIEPILOGO_USCITE_ECONOMIA.map((voce) => ({
      ...voce,
      importo: uscitePerCategoria[voce.key] || 0,
    })),
    movimenti: ordinati.slice(0, limite),
    movimentiTotaliNelPeriodo: ordinati.length,
    esclusiSenzaData,
    cantieriAnalizzati: lista.length,
  };
}

export { formatEuro };
export {
  ETICHETTE_CATEGORIA_USCITA_ECONOMIA,
  ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA,
  RIEPILOGO_USCITE_ECONOMIA,
  CATEGORIE_ENTRATA_ECONOMIA,
} from "./economiaMovimentiTypes";
