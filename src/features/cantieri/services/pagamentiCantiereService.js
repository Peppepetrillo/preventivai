/**
 * Registro pagamenti cantiere (UX-7.5).
 * Source of truth: cantiere.pagamenti[]
 * Scalari incassato/acconto = cache retrocompatibile.
 */

import { calcolaTotaleCantiere } from "../../../domain/varianti";
import { normalizzaNumero } from "../../../utils/preventivi";
import {
  isCantiereDiretto,
  leggiTotaleLavoroDiretto,
} from "../cantieriDomain";

export const TIPI_PAGAMENTO = Object.freeze({
  acconto: "acconto",
  saldo: "saldo",
  altro: "altro",
});

export const METODI_PAGAMENTO = Object.freeze({
  contanti: "contanti",
  bonifico: "bonifico",
  pos: "pos",
  altro: "altro",
});

export const ETICHETTE_TIPO_PAGAMENTO = Object.freeze({
  [TIPI_PAGAMENTO.acconto]: "Acconto",
  [TIPI_PAGAMENTO.saldo]: "Saldo",
  [TIPI_PAGAMENTO.altro]: "Altro",
});

export const ETICHETTE_METODO_PAGAMENTO = Object.freeze({
  [METODI_PAGAMENTO.contanti]: "Contanti",
  [METODI_PAGAMENTO.bonifico]: "Bonifico",
  [METODI_PAGAMENTO.pos]: "POS",
  [METODI_PAGAMENTO.altro]: "Altro",
});

/**
 * @returns {string}
 */
export function creaIdPagamento() {
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string|undefined} tipo
 */
export function normalizzaTipoPagamento(tipo) {
  const grezzo = String(tipo || "")
    .trim()
    .toLowerCase();
  if (Object.values(TIPI_PAGAMENTO).includes(grezzo)) return grezzo;
  return TIPI_PAGAMENTO.acconto;
}

/**
 * @param {string|undefined} metodo
 */
export function normalizzaMetodoPagamento(metodo) {
  const grezzo = String(metodo || "")
    .trim()
    .toLowerCase();
  if (Object.values(METODI_PAGAMENTO).includes(grezzo)) return grezzo;
  return METODI_PAGAMENTO.altro;
}

/**
 * @param {unknown} grezzo
 * @returns {object|null}
 */
export function normalizzaPagamento(grezzo) {
  if (!grezzo || typeof grezzo !== "object") return null;
  const data = String(grezzo.data || "").trim();
  const importo = normalizzaNumero(grezzo.importo);
  if (!data || !(importo > 0)) return null;

  /** @type {object} */
  const pagamento = {
    id: String(grezzo.id || "").trim() || creaIdPagamento(),
    data,
    importo,
    tipo: normalizzaTipoPagamento(grezzo.tipo),
    metodo: normalizzaMetodoPagamento(grezzo.metodo),
  };
  const note = String(grezzo.note || "").trim();
  if (note) pagamento.note = note;
  return pagamento;
}

/**
 * @param {object} a
 * @param {object} b
 */
function confrontaPagamentiPerData(a, b) {
  const parse = (d) => {
    const m = String(d || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return 0;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  };
  const ta = parse(a?.data);
  const tb = parse(b?.data);
  if (ta !== tb) return ta - tb;
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

/**
 * Somma pagamenti[] se array presente, altrimenti catena legacy.
 * @param {object} cantiere
 */
export function leggiTotaleIncassato(cantiere = {}) {
  if (Array.isArray(cantiere.pagamenti)) {
    return cantiere.pagamenti.reduce((acc, grezzo) => {
      const p = normalizzaPagamento(grezzo);
      return acc + (p ? p.importo : 0);
    }, 0);
  }
  return normalizzaNumero(
    cantiere.incassato ??
      cantiere.extra?.incassato ??
      cantiere.acconto ??
      cantiere.extra?.acconto ??
      0
  );
}

/**
 * Totale economico del cantiere (diretto o preventivo+varianti).
 * @param {object} cantiere
 */
export function leggiTotaleCantiereEconomico(cantiere = {}) {
  if (isCantiereDiretto(cantiere)) {
    return leggiTotaleLavoroDiretto(cantiere);
  }
  return Math.max(Number(calcolaTotaleCantiere(cantiere).totaleAggiornato) || 0, 0);
}

/**
 * @param {object} cantiere
 * @param {number=} totaleOverride
 */
export function calcolaRimanenzaCantiere(cantiere = {}, totaleOverride) {
  const totale =
    totaleOverride != null && Number.isFinite(Number(totaleOverride))
      ? Math.max(Number(totaleOverride), 0)
      : leggiTotaleCantiereEconomico(cantiere);
  const incassato = leggiTotaleIncassato(cantiere);
  return Math.max(totale - incassato, 0);
}

/**
 * @param {object} cantiere
 */
export function haOverpayment(cantiere = {}) {
  return leggiTotaleIncassato(cantiere) > leggiTotaleCantiereEconomico(cantiere);
}

/**
 * @param {object} cantiere
 * @returns {object[]}
 */
export function leggiPagamenti(cantiere = {}) {
  if (!Array.isArray(cantiere.pagamenti)) return [];
  return cantiere.pagamenti
    .map(normalizzaPagamento)
    .filter(Boolean)
    .sort(confrontaPagamentiPerData);
}

/**
 * Sync cache scalare da pagamenti[].
 * @param {object} cantiere
 * @param {object[]} pagamenti
 */
function conCacheIncassato(cantiere, pagamenti) {
  const totaleIncassato = pagamenti.reduce((acc, p) => acc + p.importo, 0);
  return {
    ...cantiere,
    pagamenti,
    incassato: totaleIncassato,
    acconto: totaleIncassato,
  };
}

/**
 * Migrazione one-shot: se manca pagamenti[] ma c'è incassato/acconto > 0,
 * crea un pagamento "acconto" legacy. Se già array, sync cache.
 * @param {object} cantiere
 * @returns {{ cantiere: object, migrato: boolean }}
 */
export function migraPagamentiLegacy(cantiere = {}) {
  if (Array.isArray(cantiere.pagamenti)) {
    const pagamenti = leggiPagamenti(cantiere);
    const sincronizzato = conCacheIncassato(cantiere, pagamenti);
    const cambiato =
      sincronizzato.incassato !== cantiere.incassato ||
      sincronizzato.acconto !== cantiere.acconto ||
      pagamenti.length !== cantiere.pagamenti.length;
    return { cantiere: sincronizzato, migrato: cambiato };
  }

  const legacy = normalizzaNumero(
    cantiere.incassato ??
      cantiere.extra?.incassato ??
      cantiere.acconto ??
      cantiere.extra?.acconto ??
      0
  );

  if (legacy > 0) {
    const pagamento = normalizzaPagamento({
      id: creaIdPagamento(),
      data:
        cantiere.creatoIl ||
        cantiere.dataCreazione ||
        new Date().toLocaleDateString("it-IT"),
      importo: legacy,
      tipo: TIPI_PAGAMENTO.acconto,
      metodo: METODI_PAGAMENTO.altro,
      note: "Importo migrato da dati precedenti",
    });
    return {
      cantiere: conCacheIncassato(cantiere, pagamento ? [pagamento] : []),
      migrato: true,
    };
  }

  return {
    cantiere: conCacheIncassato(cantiere, []),
    migrato: true,
  };
}

/**
 * Garantisce pagamenti[] sul cantiere (migrazione lazy).
 * @param {object} cantiere
 */
export function assicuraPagamentiCantiere(cantiere = {}) {
  return migraPagamentiLegacy(cantiere).cantiere;
}

/**
 * @param {object} cantiere
 * @param {object} input
 */
export function aggiungiPagamento(cantiere, input = {}) {
  const base = assicuraPagamentiCantiere(cantiere);
  const pagamento = normalizzaPagamento({
    ...input,
    id: input.id || creaIdPagamento(),
  });
  if (!pagamento) {
    throw new Error("Pagamento non valido: importo > 0 e data obbligatori.");
  }
  const pagamenti = [...leggiPagamenti(base), pagamento].sort(
    confrontaPagamentiPerData
  );
  return conCacheIncassato(base, pagamenti);
}

/**
 * @param {object} cantiere
 * @param {string} pagamentoId
 * @param {object} modifiche
 */
export function aggiornaPagamento(cantiere, pagamentoId, modifiche = {}) {
  const base = assicuraPagamentiCantiere(cantiere);
  const id = String(pagamentoId || "");
  const precedente = leggiPagamenti(base).find((p) => String(p.id) === id);
  if (!precedente) {
    throw new Error("Pagamento non trovato.");
  }
  const aggiornato = normalizzaPagamento({
    ...precedente,
    ...modifiche,
    id: precedente.id,
  });
  if (!aggiornato) {
    throw new Error("Pagamento non valido: importo > 0 e data obbligatori.");
  }
  const lista = leggiPagamenti(base)
    .map((p) => (String(p.id) === id ? aggiornato : p))
    .sort(confrontaPagamentiPerData);
  return conCacheIncassato(base, lista);
}

/**
 * @param {object} cantiere
 * @param {string} pagamentoId
 */
export function eliminaPagamento(cantiere, pagamentoId) {
  const base = assicuraPagamentiCantiere(cantiere);
  const id = String(pagamentoId || "");
  const pagamenti = leggiPagamenti(base).filter((p) => String(p.id) !== id);
  return conCacheIncassato(base, pagamenti);
}

/**
 * Riepilogo per UI.
 * @param {object} cantiere
 */
export function riepilogoEconomicoCantiere(cantiere = {}) {
  const base = Array.isArray(cantiere.pagamenti)
    ? cantiere
    : assicuraPagamentiCantiere(cantiere);
  const totale = leggiTotaleCantiereEconomico(base);
  const incassato = leggiTotaleIncassato(base);
  const rimanenza = Math.max(totale - incassato, 0);
  return {
    totale,
    incassato,
    rimanenza,
    overpayment: incassato > totale,
    pagamenti: leggiPagamenti(base),
  };
}
