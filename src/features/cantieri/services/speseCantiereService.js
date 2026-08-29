/**
 * Registro spese cantiere (UX-Spese v1).
 * Source of truth: cantiere.spese[]
 * Distinto da pagamenti[] (incassi) e listaSpesa (materiali da comprare).
 */

import { normalizzaNumero } from "../../../utils/preventivi";
import {
  leggiTotaleIncassato,
  leggiTotaleCantiereEconomico,
  riepilogoEconomicoCantiere,
} from "./pagamentiCantiereService";
import { leggiProgrammazione } from "./programmazioneCantiereService";

export const CATEGORIE_SPESA = Object.freeze({
  materiali: "materiali",
  manodopera: "manodopera",
  subappalto: "subappalto",
  trasferta: "trasferta",
  carburante: "carburante",
  attrezzatura: "attrezzatura",
  altro: "altro",
});

export const METODI_PAGAMENTO_SPESA = Object.freeze({
  contanti: "contanti",
  carta: "carta",
  bonifico: "bonifico",
  altro: "altro",
});

export const ETICHETTE_CATEGORIA_SPESA = Object.freeze({
  [CATEGORIE_SPESA.materiali]: "Materiali",
  [CATEGORIE_SPESA.manodopera]: "Manodopera",
  [CATEGORIE_SPESA.subappalto]: "Subappalto",
  [CATEGORIE_SPESA.trasferta]: "Trasferta",
  [CATEGORIE_SPESA.carburante]: "Carburante",
  [CATEGORIE_SPESA.attrezzatura]: "Attrezzatura",
  [CATEGORIE_SPESA.altro]: "Altro",
});

export const ETICHETTE_METODO_PAGAMENTO_SPESA = Object.freeze({
  [METODI_PAGAMENTO_SPESA.contanti]: "Contanti",
  [METODI_PAGAMENTO_SPESA.carta]: "Carta",
  [METODI_PAGAMENTO_SPESA.bonifico]: "Bonifico",
  [METODI_PAGAMENTO_SPESA.altro]: "Altro",
});

function oraIso() {
  return new Date().toISOString();
}

/**
 * @returns {string}
 */
export function creaIdSpesaCantiere() {
  return `spc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {string|undefined} categoria
 */
export function normalizzaCategoriaSpesa(categoria) {
  const grezzo = String(categoria || "")
    .trim()
    .toLowerCase();
  if (Object.values(CATEGORIE_SPESA).includes(grezzo)) return grezzo;
  return CATEGORIE_SPESA.altro;
}

/**
 * @param {string|undefined} metodo
 */
export function normalizzaMetodoPagamentoSpesa(metodo) {
  const grezzo = String(metodo || "")
    .trim()
    .toLowerCase();
  if (Object.values(METODI_PAGAMENTO_SPESA).includes(grezzo)) return grezzo;
  return "";
}

/**
 * @param {object} cantiere
 * @param {string|undefined} giornataId
 */
export function giornataIdValidaPerCantiere(cantiere = {}, giornataId) {
  const id = String(giornataId || "").trim();
  if (!id) return "";
  const esiste = leggiProgrammazione(cantiere).some(
    (g) => String(g?.id || "") === id
  );
  return esiste ? id : "";
}

/**
 * @param {unknown} grezzo
 * @param {object=} cantiere
 * @returns {object|null}
 */
export function normalizzaSpesaCantiere(grezzo, cantiere = {}) {
  if (!grezzo || typeof grezzo !== "object") return null;

  const data = String(grezzo.data || "").trim();
  const descrizione = String(grezzo.descrizione || "").trim();
  const importo = normalizzaNumero(grezzo.importo);
  const categoria = normalizzaCategoriaSpesa(grezzo.categoria);

  if (!data || !descrizione || !(importo > 0)) return null;

  /** @type {object} */
  const spesa = {
    id: String(grezzo.id || "").trim() || creaIdSpesaCantiere(),
    data,
    importo,
    descrizione,
    categoria,
    createdAt: String(grezzo.createdAt || oraIso()),
    updatedAt: String(grezzo.updatedAt || oraIso()),
  };

  const fornitore = String(grezzo.fornitore || "").trim();
  if (fornitore) spesa.fornitore = fornitore;

  const metodo = normalizzaMetodoPagamentoSpesa(grezzo.metodoPagamento);
  if (metodo) spesa.metodoPagamento = metodo;

  const note = String(grezzo.note || "").trim();
  if (note) spesa.note = note;

  const giornataId = giornataIdValidaPerCantiere(cantiere, grezzo.giornataId);
  if (giornataId) spesa.giornataId = giornataId;

  return spesa;
}

/**
 * @param {object} input
 * @returns {{ valida: boolean, errori: string[], spesa?: object }}
 */
export function validaSpesaCantiere(input = {}, cantiere = {}) {
  const errori = [];
  const data = String(input.data || "").trim();
  const descrizione = String(input.descrizione || "").trim();
  const importo = normalizzaNumero(input.importo);

  if (!descrizione) errori.push("descrizione_obbligatoria");
  if (!data) errori.push("data_obbligatoria");
  if (!(importo > 0)) errori.push("importo_non_valido");

  if (errori.length > 0) {
    return { valida: false, errori };
  }

  const spesa = normalizzaSpesaCantiere(input, cantiere);
  if (!spesa) {
    return { valida: false, errori: ["spesa_non_valida"] };
  }

  return { valida: true, errori: [], spesa };
}

/**
 * @param {object} a
 * @param {object} b
 */
function confrontaSpesePerData(a, b) {
  const parse = (d) => {
    const m = String(d || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return 0;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  };
  const ta = parse(a?.data);
  const tb = parse(b?.data);
  if (ta !== tb) return tb - ta;
  return String(b?.id || "").localeCompare(String(a?.id || ""));
}

/**
 * @param {object} cantiere
 * @returns {object[]}
 */
export function leggiSpese(cantiere = {}) {
  if (!Array.isArray(cantiere.spese)) return [];
  return cantiere.spese
    .map((grezzo) => normalizzaSpesaCantiere(grezzo, cantiere))
    .filter(Boolean)
    .sort(confrontaSpesePerData);
}

/**
 * @param {object} cantiere
 */
export function calcolaTotaleSpeseCantiere(cantiere = {}) {
  return leggiSpese(cantiere).reduce((acc, spesa) => acc + spesa.importo, 0);
}

/**
 * @param {object} cantiere
 */
export function calcolaTotaleSpesePerCategoria(cantiere = {}) {
  /** @type {Record<string, number>} */
  const totali = {};
  for (const spesa of leggiSpese(cantiere)) {
    const cat = spesa.categoria || CATEGORIE_SPESA.altro;
    totali[cat] = (totali[cat] || 0) + spesa.importo;
  }
  return totali;
}

/**
 * @param {object} cantiere
 */
export function calcolaMargineLordo(cantiere = {}) {
  const incassato = leggiTotaleIncassato(cantiere);
  const spese = calcolaTotaleSpeseCantiere(cantiere);
  return incassato - spese;
}

/**
 * @param {object} input
 * @param {object=} cantiere
 */
export function creaSpesaCantiere(input = {}, cantiere = {}) {
  const esito = validaSpesaCantiere(input, cantiere);
  if (!esito.valida || !esito.spesa) {
    throw new Error("Spesa non valida.");
  }
  return esito.spesa;
}

/**
 * @param {object} spesa
 * @param {object} modifiche
 * @param {object=} cantiere
 */
export function aggiornaSpesaCantiere(spesa, modifiche = {}, cantiere = {}) {
  const base = spesa && typeof spesa === "object" ? spesa : {};
  const prossima = normalizzaSpesaCantiere(
    {
      ...base,
      ...modifiche,
      id: base.id,
      createdAt: base.createdAt,
      updatedAt: oraIso(),
    },
    cantiere
  );
  if (!prossima) {
    throw new Error("Spesa non valida.");
  }
  return prossima;
}

/**
 * @param {object} cantiere
 * @param {object} input
 */
export function aggiungiSpesa(cantiere, input = {}) {
  const spesa = creaSpesaCantiere(input, cantiere);
  const spese = [...leggiSpese(cantiere), spesa].sort(confrontaSpesePerData);
  return { ...cantiere, spese };
}

/**
 * @param {object} cantiere
 * @param {string} spesaId
 * @param {object} modifiche
 */
export function modificaSpesa(cantiere, spesaId, modifiche = {}) {
  const id = String(spesaId || "");
  const precedente = leggiSpese(cantiere).find((s) => String(s.id) === id);
  if (!precedente) {
    throw new Error("Spesa non trovata.");
  }
  const aggiornata = aggiornaSpesaCantiere(precedente, modifiche, cantiere);
  const spese = leggiSpese(cantiere)
    .map((s) => (String(s.id) === id ? aggiornata : s))
    .sort(confrontaSpesePerData);
  return { ...cantiere, spese };
}

/**
 * @param {object} cantiere
 * @param {string} spesaId
 */
export function rimuoviSpesaCantiere(cantiere, spesaId) {
  const id = String(spesaId || "");
  const spese = leggiSpese(cantiere).filter((s) => String(s.id) !== id);
  return { ...cantiere, spese };
}

/**
 * @param {object} cantiere
 * @param {string|number} giornataId
 */
export function etichettaGiornataSpesa(cantiere = {}, giornataId) {
  const id = String(giornataId || "").trim();
  if (!id) return "";
  const giornata = leggiProgrammazione(cantiere).find(
    (g) => String(g?.id || "") === id
  );
  if (!giornata) return "";
  return String(giornata.data || "").trim();
}

/**
 * Riepilogo economico completo con spese e margine lordo.
 * @param {object} cantiere
 */
export function riepilogoEconomicoCompleto(cantiere = {}) {
  const base = riepilogoEconomicoCantiere(cantiere);
  const totaleSpese = calcolaTotaleSpeseCantiere(cantiere);
  const margineLordo = base.incassato - totaleSpese;
  const perCategoria = calcolaTotaleSpesePerCategoria(cantiere);

  return {
    ...base,
    totaleCantiere: base.totale,
    totaleSpese,
    margineLordo,
    spese: leggiSpese(cantiere),
    spesePerCategoria: perCategoria,
  };
}

/**
 * Filtra spese per ricerca e categoria.
 * @param {object[]} spese
 * @param {{ ricerca?: string, categoria?: string, giornataId?: string }=} filtri
 */
export function filtraSpeseCantiere(spese = [], filtri = {}) {
  const q = String(filtri.ricerca || "")
    .trim()
    .toLowerCase();
  const categoria = String(filtri.categoria || "").trim().toLowerCase();
  const giornataId = String(filtri.giornataId || "").trim();

  return (spese || []).filter((spesa) => {
    if (categoria && categoria !== "tutte") {
      if (String(spesa.categoria || "") !== categoria) return false;
    }
    if (giornataId && String(spesa.giornataId || "") !== giornataId) {
      return false;
    }
    if (!q) return true;
    const hay = [
      spesa.descrizione,
      spesa.fornitore,
      spesa.note,
      ETICHETTE_CATEGORIA_SPESA[spesa.categoria],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export { leggiTotaleCantiereEconomico };
