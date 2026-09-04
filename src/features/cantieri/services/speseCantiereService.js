/**
 * Registro spese cantiere (UX-Spese v1).
 * Source of truth: cantiere.spese[]
 * Distinto da pagamenti[] (incassi) e listaSpesa (materiali da comprare).
 */

import { normalizzaNumero } from "../../../utils/preventivi";
import {
  leggiPagamenti,
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

  const materialeId = String(grezzo.materialeId || "").trim();
  if (materialeId) spesa.materialeId = materialeId;

  const listaSpesaId = String(grezzo.listaSpesaId || "").trim();
  if (listaSpesaId) spesa.listaSpesaId = listaSpesaId;

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
/**
 * @param {string} dataStr dd/mm/yyyy
 * @returns {number|null}
 */
export function parseDataItalianaCantiere(dataStr) {
  const m = String(dataStr || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const ts = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function confrontaSpesePerData(a, b) {
  const ta = parseDataItalianaCantiere(a?.data) ?? 0;
  const tb = parseDataItalianaCantiere(b?.data) ?? 0;
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

/**
 * Importo proposto da quantità × prezzo unitario del materiale.
 * @param {object} materiale
 * @returns {number|null}
 */
export function calcolaImportoPropostoDaMateriale(materiale = {}) {
  const quantita = Number(materiale.quantita);
  const prezzoUnitario = Number(materiale.prezzoUnitario);
  if (!Number.isFinite(quantita) || quantita <= 0) return null;
  if (!Number.isFinite(prezzoUnitario) || prezzoUnitario <= 0) return null;
  return quantita * prezzoUnitario;
}

/**
 * Spese collegate a un materiale cantiere (ordine per data desc).
 * @param {object} cantiere
 * @param {string} materialeId
 * @returns {object[]}
 */
export function trovaSpesePerMateriale(cantiere = {}, materialeId) {
  const mid = String(materialeId || "").trim();
  if (!mid) return [];
  return leggiSpese(cantiere).filter(
    (spesa) => String(spesa.materialeId || "") === mid
  );
}

/**
 * Spesa più recente collegata al materiale, se presente.
 * @param {object} cantiere
 * @param {string} materialeId
 * @returns {object|null}
 */
export function trovaSpesaPrincipalePerMateriale(cantiere = {}, materialeId) {
  return trovaSpesePerMateriale(cantiere, materialeId)[0] || null;
}

/**
 * Dati precompilati per SpesaSheet da materiale acquistato.
 * @param {object} materiale
 * @param {object|null=} listaSpesaVoce
 */
export function prefillSpesaDaMateriale(materiale = {}, listaSpesaVoce = null) {
  const importoProposto = calcolaImportoPropostoDaMateriale(materiale);
  const materialeId = String(materiale.id || "").trim();
  const listaSpesaId = listaSpesaVoce?.id
    ? String(listaSpesaVoce.id).trim()
    : "";

  return {
    descrizione: String(materiale.nome || "").trim(),
    importo: importoProposto != null ? importoProposto : "",
    data: new Date().toLocaleDateString("it-IT"),
    categoria: CATEGORIE_SPESA.materiali,
    fornitore: "",
    metodoPagamento: "",
    giornataId: "",
    note: "",
    materialeId,
    ...(listaSpesaId ? { listaSpesaId } : {}),
  };
}

/**
 * Crea SpesaCantiere confermata dall'utente a partire da un materiale.
 * @param {object} cantiere
 * @param {object} materiale
 * @param {object=} input Dati confermati dal form
 * @param {object|null=} listaSpesaVoce
 */
export function creaSpesaDaMateriale(
  cantiere = {},
  materiale = {},
  input = {},
  listaSpesaVoce = null
) {
  const prefill = prefillSpesaDaMateriale(materiale, listaSpesaVoce);
  return creaSpesaCantiere(
    {
      ...prefill,
      ...input,
      materialeId: String(input.materialeId || prefill.materialeId || "").trim(),
      listaSpesaId: String(
        input.listaSpesaId || prefill.listaSpesaId || ""
      ).trim(),
    },
    cantiere
  );
}

export const STATO_SCOSTAMENTO_MATERIALE = Object.freeze({
  sotto: "sotto",
  in_linea: "in_linea",
  sopra: "sopra",
  non_disponibile: "non_disponibile",
});

/**
 * Costo previsto del materiale (quantità × prezzoUnitario).
 * @param {object} materiale
 * @returns {number|null}
 */
export function calcolaCostoPrevistoMateriale(materiale = {}) {
  return calcolaImportoPropostoDaMateriale(materiale);
}

/**
 * Somma di tutte le spese collegate al materiale.
 * @param {object} cantiere
 * @param {string} materialeId
 * @returns {number}
 */
export function calcolaCostoRealeMateriale(cantiere = {}, materialeId) {
  return trovaSpesePerMateriale(cantiere, materialeId).reduce(
    (acc, spesa) => acc + spesa.importo,
    0
  );
}

/**
 * @param {object} cantiere
 * @param {string} materialeId
 * @returns {number}
 */
export function contaSpeseMateriale(cantiere = {}, materialeId) {
  return trovaSpesePerMateriale(cantiere, materialeId).length;
}

/**
 * @param {number|null} costoPrevisto
 * @param {number} costoReale
 * @param {boolean} haSpese
 */
export function calcolaScostamentoMateriale(
  costoPrevisto,
  costoReale,
  haSpese = false
) {
  const previstoDisponibile =
    costoPrevisto != null && Number.isFinite(Number(costoPrevisto));

  if (!haSpese) {
    return {
      valore: null,
      stato: STATO_SCOSTAMENTO_MATERIALE.non_disponibile,
      haCostoReale: false,
    };
  }

  if (!previstoDisponibile) {
    return {
      valore: null,
      stato: STATO_SCOSTAMENTO_MATERIALE.non_disponibile,
      haCostoReale: true,
    };
  }

  const valore = Number(costoReale) - Number(costoPrevisto);
  let stato = STATO_SCOSTAMENTO_MATERIALE.in_linea;
  if (valore < 0) stato = STATO_SCOSTAMENTO_MATERIALE.sotto;
  else if (valore > 0) stato = STATO_SCOSTAMENTO_MATERIALE.sopra;

  return { valore, stato, haCostoReale: true };
}

/**
 * Analisi costi previsto/reale/scostamento per singolo materiale.
 * @param {object} cantiere
 * @param {object} materiale
 */
export function analizzaCostiMateriale(cantiere = {}, materiale = {}) {
  const materialeId = String(materiale.id || "");
  const costoPrevisto = calcolaCostoPrevistoMateriale(materiale);
  const spese = trovaSpesePerMateriale(cantiere, materialeId);
  const numeroSpese = spese.length;
  const haSpese = numeroSpese > 0;
  const costoReale = haSpese
    ? calcolaCostoRealeMateriale(cantiere, materialeId)
    : null;
  const scostamento = calcolaScostamentoMateriale(
    costoPrevisto,
    costoReale ?? 0,
    haSpese
  );

  return {
    materialeId,
    costoPrevisto,
    costoPrevistoDisponibile: costoPrevisto != null,
    costoReale,
    haSpese,
    numeroSpese,
    scostamento,
    spesaPrincipale: spese[0] || null,
  };
}

/**
 * Riepilogo costi materiali del cantiere (dati derivati).
 * @param {object} cantiere
 */
export function calcolaRiepilogoCostiMateriali(cantiere = {}) {
  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  const idsMateriali = new Set(
    materiali.map((m) => String(m.id || "")).filter(Boolean)
  );

  let totalePrevisto = 0;
  let materialiConPrevisto = 0;

  for (const materiale of materiali) {
    const previsto = calcolaCostoPrevistoMateriale(materiale);
    if (previsto != null) {
      totalePrevisto += previsto;
      materialiConPrevisto += 1;
    }
  }

  let totaleReale = 0;
  const materialiConSpesaIds = new Set();

  for (const spesa of leggiSpese(cantiere)) {
    const mid = String(spesa.materialeId || "");
    if (!mid || !idsMateriali.has(mid)) continue;
    totaleReale += spesa.importo;
    materialiConSpesaIds.add(mid);
  }
  const materialiConSpesa = materialiConSpesaIds.size;

  const scostamentoCalcolabile = materialiConPrevisto > 0 || totaleReale > 0;
  const scostamento = scostamentoCalcolabile
    ? totaleReale - totalePrevisto
    : null;

  return {
    totalePrevisto,
    totaleReale,
    scostamento,
    materialiConPrevisto,
    materialiConSpesa,
    haPrevisto: materialiConPrevisto > 0,
    haReale: totaleReale > 0,
  };
}

export const STATO_REDDITIVITA = Object.freeze({
  positiva: "positiva",
  in_pareggio: "in_pareggio",
  negativa: "negativa",
  non_disponibile: "non_disponibile",
});

export const ETICHETTE_STATO_REDDITIVITA = Object.freeze({
  [STATO_REDDITIVITA.positiva]: "Redditività positiva",
  [STATO_REDDITIVITA.in_pareggio]: "In pareggio",
  [STATO_REDDITIVITA.negativa]: "Redditività negativa",
  [STATO_REDDITIVITA.non_disponibile]: "Dati insufficienti",
});

/**
 * @param {number|null} percentuale
 * @returns {string|null}
 */
export function formattaPercentualeMargine(percentuale) {
  if (percentuale == null || !Number.isFinite(Number(percentuale))) {
    return null;
  }
  return `${Number(percentuale).toLocaleString("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/**
 * @param {number} incassato
 * @param {number} margineLordo
 * @returns {number|null}
 */
export function calcolaPercentualeMargine(incassato, margineLordo) {
  const inc = Number(incassato);
  const margine = Number(margineLordo);
  if (!(inc > 0) || !Number.isFinite(inc) || !Number.isFinite(margine)) {
    return null;
  }
  return (margine / inc) * 100;
}

/**
 * @param {number} incassato
 * @param {number} margineLordo
 * @returns {string}
 */
export function calcolaStatoRedditivita(incassato, margineLordo) {
  const inc = Number(incassato);
  const margine = Number(margineLordo);
  if (!Number.isFinite(inc) || !Number.isFinite(margine)) {
    return STATO_REDDITIVITA.non_disponibile;
  }
  if (margine > 0) return STATO_REDDITIVITA.positiva;
  if (margine < 0) return STATO_REDDITIVITA.negativa;
  return STATO_REDDITIVITA.in_pareggio;
}

/**
 * Analisi redditività cantiere (UX-Redditività v4).
 * Riutilizza riepilogoEconomicoCompleto senza duplicare formule.
 * @param {object} cantiere
 */
export function analizzaRedditivitaCantiere(cantiere = {}) {
  const riepilogo = riepilogoEconomicoCompleto(cantiere);
  const percentualeMargine = calcolaPercentualeMargine(
    riepilogo.incassato,
    riepilogo.margineLordo
  );
  const statoRedditivita = calcolaStatoRedditivita(
    riepilogo.incassato,
    riepilogo.margineLordo
  );

  const spesePerCategoria = Object.entries(riepilogo.spesePerCategoria || {})
    .filter(([, importo]) => importo > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, importo]) => ({
      categoria,
      etichetta: ETICHETTE_CATEGORIA_SPESA[categoria] || categoria,
      importo,
    }));

  return {
    totaleCantiere: riepilogo.totaleCantiere,
    incassato: riepilogo.incassato,
    rimanenza: riepilogo.rimanenza,
    totaleSpese: riepilogo.totaleSpese,
    margineLordo: riepilogo.margineLordo,
    percentualeMargine,
    statoRedditivita,
    spesePerCategoria,
  };
}

/** Soglia margine % su incassato per situazione positiva (UX-Controllo v5). */
export const SOGLIA_CONTROLLO_MARGINE_POSITIVO_PERCENTUALE = 20;

export const STATO_CONTROLLO_ECONOMICO = Object.freeze({
  positivo: "positivo",
  attenzione: "attenzione",
  critico: "critico",
  non_disponibile: "non_disponibile",
});

export const ETICHETTE_STATO_CONTROLLO_ECONOMICO = Object.freeze({
  [STATO_CONTROLLO_ECONOMICO.positivo]: "Situazione economica positiva",
  [STATO_CONTROLLO_ECONOMICO.attenzione]: "Margine in attenzione",
  [STATO_CONTROLLO_ECONOMICO.critico]: "Controllo economico critico",
  [STATO_CONTROLLO_ECONOMICO.non_disponibile]: "Dati insufficienti",
});

/**
 * @param {number} incassato
 * @param {number} totaleSpese
 * @returns {number|null}
 */
export function calcolaPercentualeSpeseSuIncassato(incassato, totaleSpese) {
  const inc = Number(incassato);
  const spese = Number(totaleSpese);
  if (!(inc > 0) || !Number.isFinite(inc) || !Number.isFinite(spese)) {
    return null;
  }
  return (spese / inc) * 100;
}

/**
 * @param {number} incassato
 * @param {number} margineLordo
 * @returns {string}
 */
export function calcolaStatoControlloEconomico(incassato, margineLordo) {
  const inc = Number(incassato);
  const margine = Number(margineLordo);
  if (!Number.isFinite(inc) || !Number.isFinite(margine) || !(inc > 0)) {
    return STATO_CONTROLLO_ECONOMICO.non_disponibile;
  }
  if (margine < 0) return STATO_CONTROLLO_ECONOMICO.critico;
  const percentualeMargine = calcolaPercentualeMargine(inc, margine);
  if (percentualeMargine == null) {
    return STATO_CONTROLLO_ECONOMICO.non_disponibile;
  }
  if (percentualeMargine > SOGLIA_CONTROLLO_MARGINE_POSITIVO_PERCENTUALE) {
    return STATO_CONTROLLO_ECONOMICO.positivo;
  }
  return STATO_CONTROLLO_ECONOMICO.attenzione;
}

/**
 * Messaggio contestuale scostamento materiali (UX-Controllo v5).
 * @param {{ scostamento?: number|null, haPrevisto?: boolean, haReale?: boolean }} riepilogo
 * @returns {string}
 */
export function formattaMessaggioScostamentoMateriali(riepilogo = {}) {
  const { scostamento, haPrevisto, haReale } = riepilogo;
  if (!haPrevisto && !haReale) return "";
  if (!haPrevisto) return "Scostamento non disponibile";
  if (scostamento == null || !Number.isFinite(Number(scostamento))) {
    return "Scostamento non disponibile";
  }
  const valore = Number(scostamento);
  if (valore === 0) return "Materiali in linea con il previsto";
  if (valore > 0) {
    return `Materiali sopra il previsto di ${Math.abs(valore).toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
    })}`;
  }
  return `Materiali sotto il previsto di ${Math.abs(valore).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  })}`;
}

/**
 * Analisi controllo economico cantiere (UX-Controllo v5).
 * Riutilizza analizzaRedditivitaCantiere e calcolaRiepilogoCostiMateriali.
 * @param {object} cantiere
 */
export function analizzaControlloEconomicoCantiere(cantiere = {}) {
  const redditivita = analizzaRedditivitaCantiere(cantiere);
  const materiali = calcolaRiepilogoCostiMateriali(cantiere);
  const percentualeSpeseSuIncassato = calcolaPercentualeSpeseSuIncassato(
    redditivita.incassato,
    redditivita.totaleSpese
  );
  const statoControlloEconomico = calcolaStatoControlloEconomico(
    redditivita.incassato,
    redditivita.margineLordo
  );
  const speseMaterialiCollegate = materiali.totaleReale;
  const altreSpese = Math.max(
    0,
    redditivita.totaleSpese - speseMaterialiCollegate
  );

  return {
    totaleCantiere: redditivita.totaleCantiere,
    incassato: redditivita.incassato,
    rimanenza: redditivita.rimanenza,
    totaleSpese: redditivita.totaleSpese,
    margineLordo: redditivita.margineLordo,
    percentualeMargine: redditivita.percentualeMargine,
    percentualeSpeseSuIncassato,
    statoRedditivita: redditivita.statoRedditivita,
    statoControlloEconomico,
    spesePerCategoria: redditivita.spesePerCategoria,
    materiali: {
      ...materiali,
      speseMaterialiCollegate,
      altreSpese,
      messaggioScostamento: formattaMessaggioScostamentoMateriali(materiali),
    },
    scostamentoMateriali: materiali.scostamento,
  };
}

export const ETICHETTE_SITUAZIONE_GESTIONALE = Object.freeze({
  [STATO_CONTROLLO_ECONOMICO.positivo]: "Situazione positiva",
  [STATO_CONTROLLO_ECONOMICO.attenzione]: "Richiede attenzione",
  [STATO_CONTROLLO_ECONOMICO.critico]: "Situazione critica",
  [STATO_CONTROLLO_ECONOMICO.non_disponibile]: "Dati insufficienti",
});

export const TIPO_SEGNALE_GESTIONALE = Object.freeze({
  margine_negativo: "margine_negativo",
  materiali_sopra: "materiali_sopra",
  margine_basso: "margine_basso",
  materiali_sotto: "materiali_sotto",
  nessun_incasso: "nessun_incasso",
  nessuna_spesa: "nessuna_spesa",
});

export const LIVELLO_SEGNALE_GESTIONALE = Object.freeze({
  critico: "critico",
  attenzione: "attenzione",
  info: "info",
});

export const TIPO_AZIONE_GESTIONALE = Object.freeze({
  vedi_spese: "vedi_spese",
  vedi_materiali: "vedi_materiali",
  registra_spesa: "registra_spesa",
  registra_incasso: "registra_incasso",
});

/** Origine temporanea CTA (UX v16) — non persistente. */
export const ORIGINE_AZIONE_GESTIONALE = Object.freeze({
  assistente_economico: "assistente-economico",
});

export const TARGET_AZIONE_GESTIONALE = Object.freeze({
  sezione_spese: "sezione-spese",
  sezione_materiali: "sezione-materiali",
  sezione_pagamenti: "sezione-pagamenti",
  nuova_spesa: "nuova-spesa",
  nuovo_incasso: "nuovo-incasso",
});

/**
 * Materiale con scostamento più rilevante (UX-Azioni v8).
 * @param {object} cantiere
 * @param {"sopra"|"sotto"} direzione
 */
export function individuaMaterialeScostamentoPrincipale(
  cantiere = {},
  direzione = "sopra"
) {
  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  let migliore = null;

  for (const materiale of materiali) {
    const analisi = analizzaCostiMateriale(cantiere, materiale);
    const scostamento = analisi.scostamento?.valore;
    if (scostamento == null || !Number.isFinite(Number(scostamento))) continue;
    if (direzione === "sopra" && Number(scostamento) <= 0) continue;
    if (direzione === "sotto" && Number(scostamento) >= 0) continue;
    if (
      !migliore ||
      Math.abs(Number(scostamento)) > Math.abs(Number(migliore.scostamento))
    ) {
      migliore = {
        materialeId: String(materiale.id || ""),
        scostamento: Number(scostamento),
      };
    }
  }

  return migliore;
}

/**
 * Contesto operativo per una CTA (UX-Azioni v8).
 * @param {{ tipo: string }} segnale
 * @param {ReturnType<typeof analizzaControlloEconomicoCantiere>} controllo
 * @param {object} cantiere
 * @returns {object|null}
 */
export function calcolaContestoAzioneSegnale(segnale = {}, controllo = {}, cantiere = {}) {
  const tipo = segnale?.tipo;
  if (tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra) {
    const hit = individuaMaterialeScostamentoPrincipale(cantiere, "sopra");
    return hit?.materialeId ? { materialeId: hit.materialeId } : null;
  }
  if (tipo === TIPO_SEGNALE_GESTIONALE.materiali_sotto) {
    const hit = individuaMaterialeScostamentoPrincipale(cantiere, "sotto");
    return hit?.materialeId ? { materialeId: hit.materialeId } : null;
  }
  void controllo;
  return null;
}

/**
 * Azione suggerita per un segnale (UX-Azioni v7/v8). Privo di dipendenze UI.
 * @param {string} tipoSegnale
 * @param {object|null} contestoAzione
 */
export function calcolaAzioneSegnaleGestionale(tipoSegnale, contestoAzione = null) {
  switch (tipoSegnale) {
    case TIPO_SEGNALE_GESTIONALE.margine_negativo:
    case TIPO_SEGNALE_GESTIONALE.margine_basso:
      return {
        tipo: TIPO_AZIONE_GESTIONALE.vedi_spese,
        label: "Vedi spese",
        disponibile: true,
        target: TARGET_AZIONE_GESTIONALE.sezione_spese,
        contesto: contestoAzione,
      };
    case TIPO_SEGNALE_GESTIONALE.materiali_sopra:
    case TIPO_SEGNALE_GESTIONALE.materiali_sotto:
      return {
        tipo: TIPO_AZIONE_GESTIONALE.vedi_materiali,
        label: "Vedi materiali",
        disponibile: true,
        target: TARGET_AZIONE_GESTIONALE.sezione_materiali,
        contesto: contestoAzione,
      };
    case TIPO_SEGNALE_GESTIONALE.nessuna_spesa:
      return {
        tipo: TIPO_AZIONE_GESTIONALE.registra_spesa,
        label: "Registra spesa",
        disponibile: true,
        target: TARGET_AZIONE_GESTIONALE.nuova_spesa,
        contesto: contestoAzione,
      };
    case TIPO_SEGNALE_GESTIONALE.nessun_incasso:
      return {
        tipo: TIPO_AZIONE_GESTIONALE.registra_incasso,
        label: "Registra incasso",
        disponibile: true,
        target: TARGET_AZIONE_GESTIONALE.nuovo_incasso,
        contesto: contestoAzione,
      };
    default:
      return {
        tipo: null,
        label: "",
        disponibile: false,
        target: null,
        contesto: null,
      };
  }
}

function formattaEuroSegnale(importo) {
  return Number(importo).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

/**
 * @param {{ tipo: string }} segnale
 * @param {ReturnType<typeof analizzaControlloEconomicoCantiere>} controllo
 * @returns {string|null}
 */
export function formattaDettaglioSegnaleGestionale(segnale, controllo = {}) {
  const materiali = controllo.materiali || {};
  const tipo = segnale?.tipo;
  if (
    (tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra ||
      tipo === TIPO_SEGNALE_GESTIONALE.materiali_sotto) &&
    materiali.haPrevisto &&
    materiali.haReale
  ) {
    return `${formattaEuroSegnale(materiali.totaleReale)} reali / ${formattaEuroSegnale(materiali.totalePrevisto)} previsti`;
  }
  return null;
}

/**
 * @param {ReturnType<typeof generaSegnaliGestionaliCantiere>} segnali
 * @param {ReturnType<typeof analizzaControlloEconomicoCantiere>} controllo
 */
export function arricchisciSegnaliGestionali(
  segnali = [],
  controllo = {},
  cantiere = {}
) {
  return segnali.map((segnale) => {
    const contesto = calcolaContestoAzioneSegnale(segnale, controllo, cantiere);
    return {
      ...segnale,
      azione: calcolaAzioneSegnaleGestionale(segnale.tipo, contesto),
      dettaglio: formattaDettaglioSegnaleGestionale(segnale, controllo),
    };
  });
}

/**
 * @param {number} totaleCantiere
 * @param {number} incassato
 * @returns {number|null}
 */
export function calcolaPercentualeIncassoCantiere(totaleCantiere, incassato) {
  const tot = Number(totaleCantiere);
  const inc = Number(incassato);
  if (!(tot > 0) || !Number.isFinite(tot) || !Number.isFinite(inc)) {
    return null;
  }
  return (inc / tot) * 100;
}

/**
 * @param {number} importoCategoria
 * @param {number} totaleSpese
 * @returns {number|null}
 */
export function calcolaIncidenzaCategoriaSpesa(importoCategoria, totaleSpese) {
  const imp = Number(importoCategoria);
  const tot = Number(totaleSpese);
  if (!(tot > 0) || !Number.isFinite(tot) || !Number.isFinite(imp)) {
    return null;
  }
  return (imp / tot) * 100;
}

/**
 * Alert gestionale materiali (UX-Controllo gestionale v6).
 * @param {{ haPrevisto?: boolean, haReale?: boolean, scostamento?: number|null }} materiali
 * @returns {string}
 */
export function formattaAlertGestionaleMateriali(materiali = {}) {
  const { haPrevisto, haReale, scostamento } = materiali;
  if (!haPrevisto && !haReale) return "Costo materiali non calcolabile";
  if (!haPrevisto || !haReale) return "Costo materiali non calcolabile";
  if (scostamento == null || !Number.isFinite(Number(scostamento))) {
    return "Costo materiali non calcolabile";
  }
  if (Number(scostamento) === 0) return "Materiali in linea con il previsto";
  if (Number(scostamento) > 0) {
    return "Attenzione: i costi reali dei materiali sono superiori al previsto";
  }
  return "I costi reali dei materiali sono inferiori al previsto";
}

/**
 * Segnali gestionali derivati (UX-Controllo gestionale v6).
 * @param {ReturnType<typeof analizzaControlloEconomicoCantiere>} controllo
 * @returns {Array<{ priorita: number, tipo: string, livello: string, messaggio: string }>}
 */
export function generaSegnaliGestionaliCantiere(controllo = {}) {
  const segnali = [];
  const inc = Number(controllo.incassato);
  const margine = Number(controllo.margineLordo);
  const spese = Number(controllo.totaleSpese);
  const materiali = controllo.materiali || {};

  if (Number.isFinite(inc) && inc > 0 && Number.isFinite(margine) && margine < 0) {
    segnali.push({
      priorita: 1,
      tipo: TIPO_SEGNALE_GESTIONALE.margine_negativo,
      livello: LIVELLO_SEGNALE_GESTIONALE.critico,
      messaggio: "Attenzione: le spese hanno superato l'incassato.",
    });
  }

  if (
    materiali.haPrevisto &&
    materiali.scostamento != null &&
    Number(materiali.scostamento) > 0
  ) {
    segnali.push({
      priorita: 2,
      tipo: TIPO_SEGNALE_GESTIONALE.materiali_sopra,
      livello: LIVELLO_SEGNALE_GESTIONALE.attenzione,
      messaggio: "Attenzione: i materiali stanno costando più del previsto.",
    });
  }

  if (
    controllo.statoControlloEconomico === STATO_CONTROLLO_ECONOMICO.attenzione &&
    inc > 0
  ) {
    segnali.push({
      priorita: 3,
      tipo: TIPO_SEGNALE_GESTIONALE.margine_basso,
      livello: LIVELLO_SEGNALE_GESTIONALE.attenzione,
      messaggio: "Il margine è positivo ma contenuto.",
    });
  }

  if (!(inc > 0)) {
    segnali.push({
      priorita: 4,
      tipo: TIPO_SEGNALE_GESTIONALE.nessun_incasso,
      livello: LIVELLO_SEGNALE_GESTIONALE.info,
      messaggio: "Dati di redditività non ancora disponibili.",
    });
  }

  if (spese === 0 && inc > 0) {
    segnali.push({
      priorita: 4,
      tipo: TIPO_SEGNALE_GESTIONALE.nessuna_spesa,
      livello: LIVELLO_SEGNALE_GESTIONALE.info,
      messaggio: "Non risultano ancora spese registrate.",
    });
  }

  if (
    materiali.haPrevisto &&
    materiali.scostamento != null &&
    Number(materiali.scostamento) < 0 &&
    !segnali.some((s) => s.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra)
  ) {
    segnali.push({
      priorita: 4,
      tipo: TIPO_SEGNALE_GESTIONALE.materiali_sotto,
      livello: LIVELLO_SEGNALE_GESTIONALE.info,
      messaggio: "I costi reali dei materiali sono inferiori al previsto.",
    });
  }

  return segnali.sort((a, b) => a.priorita - b.priorita);
}

/**
 * Analisi controllo gestionale cantiere (UX-Controllo gestionale v6).
 * @param {object} cantiere
 */
export function analizzaControlloGestionaleCantiere(cantiere = {}) {
  const controllo = analizzaControlloEconomicoCantiere(cantiere);
  const percentualeIncasso = calcolaPercentualeIncassoCantiere(
    controllo.totaleCantiere,
    controllo.incassato
  );
  const costiPrincipali = controllo.spesePerCategoria.map((voce) => ({
    ...voce,
    percentualeSuTotaleSpese: calcolaIncidenzaCategoriaSpesa(
      voce.importo,
      controllo.totaleSpese
    ),
  }));
  const segnaliBase = generaSegnaliGestionaliCantiere(controllo);
  const segnali = arricchisciSegnaliGestionali(segnaliBase, controllo, cantiere);
  const alertMateriali = formattaAlertGestionaleMateriali(controllo.materiali);

  return {
    ...controllo,
    stato: controllo.statoControlloEconomico,
    statoLabel:
      ETICHETTE_SITUAZIONE_GESTIONALE[controllo.statoControlloEconomico] ||
      "Dati insufficienti",
    percentualeIncasso,
    incidenzaSpese: controllo.percentualeSpeseSuIncassato,
    costiPrincipali,
    segnali,
    daTenereDocchio: segnali.slice(0, 3),
    haCriticità: segnali.some(
      (s) =>
        s.livello === LIVELLO_SEGNALE_GESTIONALE.critico ||
        s.livello === LIVELLO_SEGNALE_GESTIONALE.attenzione
    ),
    alertMateriali,
    materialiGestionale: {
      totalePrevisto: controllo.materiali.totalePrevisto,
      totaleReale: controllo.materiali.totaleReale,
      scostamento: controllo.scostamentoMateriali,
      haPrevisto: controllo.materiali.haPrevisto,
      haReale: controllo.materiali.haReale,
      alert: alertMateriali,
    },
  };
}

/** Messaggi sintetici situazione (UX-Assistente economico v9). */
export const MESSAGGI_SITUAZIONE_ASSISTENTE = Object.freeze({
  [STATO_CONTROLLO_ECONOMICO.positivo]:
    "Il cantiere sta mantenendo una buona redditività.",
  [STATO_CONTROLLO_ECONOMICO.attenzione]:
    "La redditività è contenuta: conviene tenere sotto controllo le spese.",
  [STATO_CONTROLLO_ECONOMICO.critico]: "Le spese hanno superato gli incassi.",
  [STATO_CONTROLLO_ECONOMICO.non_disponibile]:
    "Servono più dati per valutare la redditività.",
});

/**
 * Frase sintetica per il blocco situazione (UX-Assistente economico v9).
 * @param {string} stato
 */
export function formattaMessaggioSituazioneAssistente(stato) {
  return (
    MESSAGGI_SITUAZIONE_ASSISTENTE[stato] ||
    MESSAGGI_SITUAZIONE_ASSISTENTE[STATO_CONTROLLO_ECONOMICO.non_disponibile]
  );
}

/**
 * Spiegazione breve del problema prioritario (UX-Assistente economico v9).
 * @param {{ tipo: string }} segnale
 * @param {ReturnType<typeof analizzaControlloGestionaleCantiere>} controllo
 * @param {object} cantiere
 */
export function formattaSpiegazioneProblemaPrincipale(
  segnale = {},
  controllo = {},
  cantiere = {}
) {
  const tipo = segnale?.tipo;
  const margine = Number(controllo.margineLordo);
  const materiali = controllo.materiali || {};

  switch (tipo) {
    case TIPO_SEGNALE_GESTIONALE.margine_negativo:
      if (Number.isFinite(margine) && margine < 0) {
        return `Le spese superano gli incassi di ${formattaEuroSegnale(Math.abs(margine))}.`;
      }
      return segnale.messaggio || "";
    case TIPO_SEGNALE_GESTIONALE.margine_basso:
      return "Il margine lordo è positivo ma limitato rispetto agli incassi.";
    case TIPO_SEGNALE_GESTIONALE.materiali_sopra: {
      const materiale = calcolaContestoMaterialeProblema(segnale, cantiere);
      if (materiale?.messaggio) return materiale.messaggio;
      if (materiali.scostamento != null && Number(materiali.scostamento) > 0) {
        return `Le spese materiali superano il previsto di ${formattaEuroSegnale(materiali.scostamento)}.`;
      }
      return "Le spese materiali superano il previsto.";
    }
    case TIPO_SEGNALE_GESTIONALE.materiali_sotto: {
      const materiale = calcolaContestoMaterialeProblema(segnale, cantiere);
      if (materiale?.messaggio) return materiale.messaggio;
      return "I costi reali dei materiali sono inferiori al previsto.";
    }
    case TIPO_SEGNALE_GESTIONALE.nessuna_spesa:
      return "Non risultano spese registrate sul cantiere.";
    case TIPO_SEGNALE_GESTIONALE.nessun_incasso:
      return "Non risultano incassi registrati sul cantiere.";
    default:
      return segnale.messaggio || "";
  }
}

/**
 * Raccomandazione operativa derivata dal segnale prioritario (UX-Assistente v9).
 * @param {string} tipoSegnale
 */
export function formattaCosaFareAdesso(tipoSegnale) {
  switch (tipoSegnale) {
    case TIPO_SEGNALE_GESTIONALE.margine_negativo:
      return "Controlla le spese registrate e verifica quali costi stanno incidendo maggiormente.";
    case TIPO_SEGNALE_GESTIONALE.margine_basso:
      return "Monitora le spese prima di sostenere altri costi.";
    case TIPO_SEGNALE_GESTIONALE.materiali_sopra:
      return "Controlla il materiale con lo scostamento maggiore.";
    case TIPO_SEGNALE_GESTIONALE.materiali_sotto:
      return "Verifica i costi materiali rispetto al previsto.";
    case TIPO_SEGNALE_GESTIONALE.nessuna_spesa:
      return "Registra le spese sostenute per mantenere il margine aggiornato.";
    case TIPO_SEGNALE_GESTIONALE.nessun_incasso:
      return "Registra gli incassi ricevuti per aggiornare l'avanzamento economico.";
    default:
      return "";
  }
}

/**
 * Dettaglio materiale per problema prioritario materiali (UX-Assistente v9).
 * @param {{ azione?: { contesto?: { materialeId?: string } } }} segnale
 * @param {object} cantiere
 */
export function calcolaContestoMaterialeProblema(segnale = {}, cantiere = {}) {
  const materialeId = String(segnale.azione?.contesto?.materialeId || "").trim();
  if (!materialeId) return null;

  const materiali = Array.isArray(cantiere.materiali) ? cantiere.materiali : [];
  const materiale = materiali.find((m) => String(m.id || "") === materialeId);
  if (!materiale) return null;

  const analisi = analizzaCostiMateriale(cantiere, materiale);
  const scostamentoValore = analisi.scostamento?.valore ?? null;

  return {
    materialeId,
    nome: materiale.nome || "Materiale",
    previsto: analisi.costoPrevisto,
    reale: analisi.costoReale,
    scostamento: scostamentoValore,
    messaggio: formattaMessaggioScostamentoMateriali({
      scostamento: scostamentoValore,
      haPrevisto: analisi.costoPrevistoDisponibile,
      haReale: analisi.haSpese,
    }),
  };
}

/**
 * Arricchisce il segnale prioritario con spiegazione e contesto materiale (UX-Assistente v9).
 */
function arricchisciProblemaPrincipale(segnale, controllo, cantiere) {
  const materiale =
    segnale.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra ||
    segnale.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sotto
      ? calcolaContestoMaterialeProblema(segnale, cantiere)
      : null;

  return {
    ...segnale,
    spiegazione: formattaSpiegazioneProblemaPrincipale(segnale, controllo, cantiere),
    materiale,
  };
}

/**
 * Assistente economico cantiere (UX v9). Orientamento decisionale su controllo gestionale v8.
 * @param {object} cantiere
 */
export function analizzaAssistenteEconomicoCantiere(cantiere = {}) {
  const controllo = analizzaControlloGestionaleCantiere(cantiere);
  const segnalePrioritario = controllo.segnali[0] || null;
  const problemaPrincipale = segnalePrioritario
    ? arricchisciProblemaPrincipale(segnalePrioritario, controllo, cantiere)
    : null;

  const situazione = {
    stato: controllo.stato,
    titolo:
      ETICHETTE_SITUAZIONE_GESTIONALE[controllo.stato] || "Dati insufficienti",
    messaggio: formattaMessaggioSituazioneAssistente(controllo.stato),
    margineLordo: controllo.margineLordo,
    percentualeMargine: controllo.percentualeMargine,
  };

  const cosaFareAdesso = segnalePrioritario
    ? {
        messaggio: formattaCosaFareAdesso(segnalePrioritario.tipo),
        azione: segnalePrioritario.azione,
      }
    : null;

  const segnaliSecondari = segnalePrioritario
    ? controllo.segnali.slice(1, 3)
    : controllo.daTenereDocchio;

  return {
    situazione,
    problemaPrincipale,
    cosaFareAdesso,
    segnaliSecondari,
    controllo,
  };
}

/** Andamento derivato da movimenti datati (UX-Assistente proattivo v10). */
export const TENDENZA_EVOLUZIONE_ECONOMICA = Object.freeze({
  non_disponibile: "non_disponibile",
  stabile: "stabile",
  pressione_spese: "pressione_spese",
  miglioramento_incassi: "miglioramento_incassi",
  equilibrio: "equilibrio",
});

/**
 * Cronologia spese/incassi con data italiana valida.
 * @param {object} cantiere
 */
export function raccogliMovimentiEconomiciDatati(cantiere = {}) {
  /** @type {Array<{ tipo: "spesa"|"incasso", ts: number, importo: number }>} */
  const movimenti = [];

  for (const spesa of leggiSpese(cantiere)) {
    const ts = parseDataItalianaCantiere(spesa.data);
    if (ts == null) continue;
    movimenti.push({ tipo: "spesa", ts, importo: spesa.importo });
  }

  for (const pagamento of leggiPagamenti(cantiere)) {
    const ts = parseDataItalianaCantiere(pagamento.data);
    if (ts == null) continue;
    movimenti.push({ tipo: "incasso", ts, importo: pagamento.importo });
  }

  return movimenti.sort((a, b) => a.ts - b.ts);
}

/**
 * Evoluzione economica da cronologia reale (UX-Assistente proattivo v10).
 * Nessuna previsione: solo confronto tra periodo recente e precedente.
 * @param {object} cantiere
 * @param {ReturnType<typeof analizzaControlloGestionaleCantiere>} controllo
 */
export function calcolaRiepilogoPeriodiEconomiciCantiere(cantiere = {}) {
  const movimenti = raccogliMovimentiEconomiciDatati(cantiere);
  const dateDistinte = new Set(movimenti.map((m) => m.ts)).size;

  if (movimenti.length < 2 || dateDistinte < 2) {
    return {
      disponibile: false,
      movimentiAnalizzati: movimenti.length,
      dateDistinte,
    };
  }

  const splitAt = Math.floor(movimenti.length / 2);
  let speseRecenti = 0;
  let spesePrecedenti = 0;
  let incassiRecenti = 0;
  let incassiPrecedenti = 0;
  let speseRecentiCount = 0;
  let spesePrecedentiCount = 0;
  let incassiRecentiCount = 0;
  let incassiPrecedentiCount = 0;

  movimenti.forEach((movimento, index) => {
    const recente = index >= splitAt;
    if (movimento.tipo === "spesa") {
      if (recente) {
        speseRecenti += movimento.importo;
        speseRecentiCount += 1;
      } else {
        spesePrecedenti += movimento.importo;
        spesePrecedentiCount += 1;
      }
    } else if (recente) {
      incassiRecenti += movimento.importo;
      incassiRecentiCount += 1;
    } else {
      incassiPrecedenti += movimento.importo;
      incassiPrecedentiCount += 1;
    }
  });

  return {
    disponibile: true,
    movimentiAnalizzati: movimenti.length,
    dateDistinte,
    splitAt,
    speseRecenti,
    spesePrecedenti,
    incassiRecenti,
    incassiPrecedenti,
    speseRecentiCount,
    spesePrecedentiCount,
    incassiRecentiCount,
    incassiPrecedentiCount,
    margineRecente: incassiRecenti - speseRecenti,
    marginePrecedente: incassiPrecedenti - spesePrecedenti,
  };
}

export function calcolaEvoluzioneEconomicaCantiere(cantiere = {}, controllo = {}) {
  const periodi = calcolaRiepilogoPeriodiEconomiciCantiere(cantiere);

  if (!periodi.disponibile) {
    return {
      disponibile: false,
      titolo: "Evoluzione economica",
      tendenza: TENDENZA_EVOLUZIONE_ECONOMICA.non_disponibile,
      messaggio:
        "Servono almeno due movimenti su date diverse per valutare l'andamento.",
      dettaglio: {
        movimentiAnalizzati: periodi.movimentiAnalizzati,
        dateDistinte: periodi.dateDistinte,
      },
    };
  }

  const {
    speseRecenti,
    spesePrecedenti,
    incassiRecenti,
    incassiPrecedenti,
    movimentiAnalizzati,
    dateDistinte,
  } = periodi;

  let tendenza = TENDENZA_EVOLUZIONE_ECONOMICA.stabile;
  let messaggio = "L'andamento economico resta sostanzialmente stabile.";

  if (speseRecenti > spesePrecedenti && spesePrecedenti > 0) {
    tendenza = TENDENZA_EVOLUZIONE_ECONOMICA.pression_spese;
    messaggio = "Le spese più recenti stanno pesando di più sul margine.";
    if (controllo.stato === STATO_CONTROLLO_ECONOMICO.critico) {
      messaggio = "Le spese recenti stanno aggravando un margine già negativo.";
    }
  } else if (
    incassiRecenti > incassiPrecedenti &&
    incassiPrecedenti > 0 &&
    speseRecenti <= spesePrecedenti
  ) {
    tendenza = TENDENZA_EVOLUZIONE_ECONOMICA.miglioramento_incassi;
    messaggio = "Gli incassi recenti stanno rafforzando la situazione economica.";
  } else if (incassiRecenti > 0 && speseRecenti > 0 && speseRecenti === spesePrecedenti) {
    tendenza = TENDENZA_EVOLUZIONE_ECONOMICA.equilibrio;
    messaggio = "Incassi e spese recenti sono in equilibrio.";
  }

  return {
    disponibile: true,
    titolo: "Evoluzione economica",
    tendenza,
    messaggio,
    dettaglio: {
      movimentiAnalizzati,
      dateDistinte,
      speseRecenti,
      spesePrecedenti,
      incassiRecenti,
      incassiPrecedenti,
    },
  };
}

/**
 * @param {ReturnType<typeof analizzaAssistenteEconomicoCantiere>} assistente
 * @param {ReturnType<typeof calcolaEvoluzioneEconomicaCantiere>} evoluzione
 * @param {ReturnType<typeof analizzaControlloGestionaleCantiere>} controllo
 * @param {object} cantiere
 */
export function identificaRischioPreventivo(
  assistente = {},
  evoluzione = {},
  controllo = {},
  cantiere = {}
) {
  const problema = assistente.problemaPrincipale;
  const problemaTipo = problema?.tipo;

  if (
    evoluzione.disponibile &&
    evoluzione.tendenza === TENDENZA_EVOLUZIONE_ECONOMICA.pression_spese &&
    problemaTipo !== TIPO_SEGNALE_GESTIONALE.margine_negativo
  ) {
    return {
      tipo: "evoluzione_pression_spese",
      titolo: "Pressione spese in aumento",
      messaggio: evoluzione.messaggio,
      livello: LIVELLO_SEGNALE_GESTIONALE.attenzione,
      spiegazione: "Le spese recenti superano quelle del periodo precedente.",
      azione: calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.margine_basso),
    };
  }

  const segnalePreventivo = controllo.segnali.find(
    (segnale) =>
      segnale.tipo !== problemaTipo &&
      (segnale.livello === LIVELLO_SEGNALE_GESTIONALE.attenzione ||
        segnale.livello === LIVELLO_SEGNALE_GESTIONALE.critico)
  );

  if (segnalePreventivo) {
    return {
      tipo: segnalePreventivo.tipo,
      titolo: "Rischio da monitorare",
      messaggio: segnalePreventivo.messaggio,
      livello: segnalePreventivo.livello,
      spiegazione: formattaSpiegazioneProblemaPrincipale(
        segnalePreventivo,
        controllo,
        cantiere
      ),
      azione: segnalePreventivo.azione,
    };
  }

  const costi = controllo.costiPrincipali || [];
  const top = costi[0];
  if (
    top &&
    controllo.totaleSpese > 0 &&
    controllo.stato === STATO_CONTROLLO_ECONOMICO.attenzione
  ) {
    const percentuale = calcolaIncidenzaCategoriaSpesa(
      top.importo,
      controllo.totaleSpese
    );
    if (percentuale != null && percentuale >= 50) {
      return {
        tipo: "concentrazione_costi",
        titolo: "Concentrazione costi",
        messaggio: `${top.etichetta} assorbe la maggior parte delle spese (${formattaPercentualeMargine(percentuale)}).`,
        livello: LIVELLO_SEGNALE_GESTIONALE.info,
        spiegazione:
          "Una categoria domina i costi: conviene verificarne l'impatto sul margine.",
        azione: calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.margine_basso),
      };
    }
  }

  return null;
}

/**
 * @param {ReturnType<typeof identificaRischioPreventivo>} rischio
 * @param {ReturnType<typeof analizzaAssistenteEconomicoCantiere>} assistente
 */
export function formattaMessaggioPrevenzione(rischio, assistente = {}) {
  if (!rischio) return "";

  switch (rischio.tipo) {
    case "evoluzione_pression_spese":
      return "Controlla le nuove spese prima che riducano ulteriormente il margine.";
    case TIPO_SEGNALE_GESTIONALE.materiali_sopra:
      return "Verifica gli acquisti materiali prima che lo scostamento cresca.";
    case "concentrazione_costi":
      return "Analizza la categoria di spesa dominante per evitare sorprese sul margine.";
    default:
      return (
        formattaCosaFareAdesso(rischio.tipo) ||
        assistente.cosaFareAdesso?.messaggio ||
        ""
      );
  }
}

/**
 * @param {ReturnType<typeof analizzaAssistenteEconomicoCantiere>} assistente
 * @param {ReturnType<typeof identificaRischioPreventivo>} rischio
 */
export function calcolaAzioneRaccomandataProattiva(assistente = {}, rischio = null) {
  if (rischio?.azione?.disponibile) return rischio.azione;
  if (assistente.problemaPrincipale?.azione?.disponibile) {
    return assistente.problemaPrincipale.azione;
  }
  if (assistente.cosaFareAdesso?.azione?.disponibile) {
    return assistente.cosaFareAdesso.azione;
  }
  return null;
}

/**
 * Assistente economico proattivo cantiere (UX v10).
 * @param {object} cantiere
 */
export function analizzaAssistenteEconomicoProattivoCantiere(cantiere = {}) {
  const assistente = analizzaAssistenteEconomicoCantiere(cantiere);
  const controllo = assistente.controllo;
  const evoluzione = calcolaEvoluzioneEconomicaCantiere(cantiere, controllo);
  const rischioPrincipale = identificaRischioPreventivo(
    assistente,
    evoluzione,
    controllo,
    cantiere
  );
  const prevenzione = rischioPrincipale
    ? {
        messaggio: formattaMessaggioPrevenzione(rischioPrincipale, assistente),
        focus: rischioPrincipale.tipo,
      }
    : null;
  const azioneRaccomandata = calcolaAzioneRaccomandataProattiva(
    assistente,
    rischioPrincipale
  );

  return {
    assistente,
    evoluzione,
    rischioPrincipale,
    prevenzione,
    azioneRaccomandata,
    segnaliSecondari: assistente.segnaliSecondari,
  };
}

/** Classificazione cambiamenti osservati (UX-Assistente operativo v11). */
export const STATO_CAMBIAMENTO_ECONOMICO = Object.freeze({
  miglioramento: "miglioramento",
  peggioramento: "peggioramento",
  stabile: "stabile",
  nuovi_movimenti: "nuovi_movimenti",
  non_disponibile: "non_disponibile",
});

/** Tipologia priorità operativa (UX-Assistente operativo v11). */
export const PRIORITA_OPERATIVA_TIPO = Object.freeze({
  critico: "critico",
  peggioramento: "peggioramento",
  materiali: "materiali",
  preventivo: "preventivo",
  registrazione: "registrazione",
  nessuna: "nessuna",
});

/**
 * @param {{ tipo?: string, label?: string }|null} azione
 */
export function formattaTitoloPrioritaOperativa(azione) {
  switch (azione?.tipo) {
    case TIPO_AZIONE_GESTIONALE.vedi_spese:
      return "Controlla le spese";
    case TIPO_AZIONE_GESTIONALE.vedi_materiali:
      return "Controlla il materiale";
    case TIPO_AZIONE_GESTIONALE.registra_incasso:
      return "Registra l'incasso";
    case TIPO_AZIONE_GESTIONALE.registra_spesa:
      return "Registra la spesa";
    default:
      return azione?.label || "Azione consigliata";
  }
}

/**
 * Cambiamenti economici osservabili (UX-Assistente operativo v11).
 * Confronto periodo recente vs precedente — nessuno snapshot persistente.
 * @param {object} cantiere
 * @param {ReturnType<typeof calcolaEvoluzioneEconomicaCantiere>} evoluzione
 */
export function calcolaCambiamentiEconomiciCantiere(cantiere = {}, evoluzione = {}) {
  const periodi = calcolaRiepilogoPeriodiEconomiciCantiere(cantiere);

  if (!periodi.disponibile) {
    return {
      disponibile: false,
      stato: STATO_CAMBIAMENTO_ECONOMICO.non_disponibile,
      elementi: ["Non ci sono abbastanza dati per confrontare l'evoluzione."],
      messaggio: "Confronto storico non disponibile.",
    };
  }

  /** @type {string[]} */
  const elementi = [];

  if (periodi.incassiRecentiCount > 0) {
    elementi.push(
      periodi.incassiRecentiCount === 1
        ? "Registrato un nuovo incasso."
        : `Registrati ${periodi.incassiRecentiCount} nuovi incassi.`
    );
  }

  if (periodi.speseRecentiCount > 0) {
    elementi.push(
      periodi.speseRecentiCount === 1
        ? "Registrata una nuova spesa."
        : `Registrate ${periodi.speseRecentiCount} nuove spese.`
    );
  }

  if (periodi.speseRecenti > periodi.spesePrecedenti && periodi.spesePrecedenti > 0) {
    elementi.push("Le spese sono aumentate rispetto al periodo precedente.");
  }

  if (
    periodi.margineRecente > periodi.marginePrecedente &&
    periodi.incassiRecenti + periodi.speseRecenti > 0
  ) {
    elementi.push("Il margine è migliorato.");
  } else if (
    periodi.margineRecente < periodi.marginePrecedente &&
    periodi.incassiPrecedenti + periodi.spesePrecedenti > 0 &&
    periodi.incassiRecenti + periodi.speseRecenti > 0
  ) {
    elementi.push("Il margine del periodo recente è peggiorato.");
  }

  if (elementi.length === 0) {
    elementi.push("Nessun cambiamento rilevante nel periodo recente.");
  }

  let stato = STATO_CAMBIAMENTO_ECONOMICO.stabile;
  if (
    elementi.some(
      (voce) => voce.includes("incasso") || voce.includes("spes")
    )
  ) {
    stato = STATO_CAMBIAMENTO_ECONOMICO.nuovi_movimenti;
  }
  if (evoluzione.tendenza === TENDENZA_EVOLUZIONE_ECONOMICA.pression_spese) {
    stato = STATO_CAMBIAMENTO_ECONOMICO.peggioramento;
  } else if (
    evoluzione.tendenza === TENDENZA_EVOLUZIONE_ECONOMICA.miglioramento_incassi ||
    elementi.some((voce) => voce.includes("migliorato"))
  ) {
    stato = STATO_CAMBIAMENTO_ECONOMICO.miglioramento;
  }

  return {
    disponibile: true,
    stato,
    elementi: elementi.slice(0, 3),
    messaggio: elementi[0],
  };
}

/**
 * Priorità operativa singola (UX-Assistente operativo v11).
 * @param {ReturnType<typeof analizzaAssistenteEconomicoCantiere>} assistente
 * @param {ReturnType<typeof analizzaAssistenteEconomicoProattivoCantiere>} proattivo
 * @param {ReturnType<typeof calcolaCambiamentiEconomiciCantiere>} cambiamenti
 * @param {object} cantiere
 */
export function calcolaPrioritaOperativaCantiere(
  assistente = {},
  proattivo = {},
  cambiamenti = {},
  cantiere = {}
) {
  const problema = assistente.problemaPrincipale;
  const controllo = assistente.controllo;
  const evoluzione = proattivo.evoluzione || {};
  const rischio = proattivo.rischioPrincipale;

  if (
    problema &&
    (problema.livello === LIVELLO_SEGNALE_GESTIONALE.critico ||
      problema.tipo === TIPO_SEGNALE_GESTIONALE.margine_negativo)
  ) {
    return {
      tipo: PRIORITA_OPERATIVA_TIPO.critico,
      titolo: formattaTitoloPrioritaOperativa(problema.azione),
      perche: problema.spiegazione || problema.messaggio,
      azione: problema.azione,
      urgente: true,
    };
  }

  if (
    cambiamenti.stato === STATO_CAMBIAMENTO_ECONOMICO.peggioramento ||
    (evoluzione.disponibile &&
      evoluzione.tendenza === TENDENZA_EVOLUZIONE_ECONOMICA.pression_spese)
  ) {
    const azione = calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.margine_basso);
    return {
      tipo: PRIORITA_OPERATIVA_TIPO.peggioramento,
      titolo: formattaTitoloPrioritaOperativa(azione),
      perche:
        cambiamenti.elementi?.find((voce) => voce.includes("aumentate")) ||
        evoluzione.messaggio ||
        "Le spese recenti pesano di più sul margine.",
      azione,
      urgente: true,
    };
  }

  const segnaleMateriali =
    problema?.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra
      ? problema
      : controllo.segnali.find(
          (segnale) => segnale.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra
        );

  if (segnaleMateriali) {
    const spiegazione =
      problema?.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra
        ? problema.spiegazione
        : formattaSpiegazioneProblemaPrincipale(segnaleMateriali, controllo, cantiere);

    return {
      tipo: PRIORITA_OPERATIVA_TIPO.materiali,
      titolo: "Controlla il materiale",
      perche: spiegazione || "Il costo reale supera quello previsto.",
      azione: segnaleMateriali.azione,
      urgente: true,
    };
  }

  if (rischio) {
    return {
      tipo: PRIORITA_OPERATIVA_TIPO.preventivo,
      titolo: formattaTitoloPrioritaOperativa(rischio.azione) || rischio.titolo,
      perche: rischio.spiegazione || rischio.messaggio,
      azione: rischio.azione,
      urgente: false,
    };
  }

  if (problema) {
    return {
      tipo: PRIORITA_OPERATIVA_TIPO.registrazione,
      titolo: formattaTitoloPrioritaOperativa(problema.azione),
      perche: problema.spiegazione || problema.messaggio,
      azione: problema.azione,
      urgente: problema.livello !== LIVELLO_SEGNALE_GESTIONALE.info,
    };
  }

  return {
    tipo: PRIORITA_OPERATIVA_TIPO.nessuna,
    titolo: "Nessuna azione urgente",
    perche: "La situazione economica non presenta criticità.",
    azione: null,
    urgente: false,
  };
}

/**
 * Assistente economico operativo cantiere (UX v11).
 * @param {object} cantiere
 */
export function analizzaAssistenteEconomicoOperativoCantiere(cantiere = {}) {
  const proattivo = analizzaAssistenteEconomicoProattivoCantiere(cantiere);
  const assistente = proattivo.assistente;
  const cambiamenti = calcolaCambiamentiEconomiciCantiere(cantiere, proattivo.evoluzione);
  const prioritaOperativa = calcolaPrioritaOperativaCantiere(
    assistente,
    proattivo,
    cambiamenti,
    cantiere
  );

  return {
    assistente,
    proattivo,
    cambiamenti,
    prioritaOperativa,
    azionePrincipale: prioritaOperativa.azione,
    riepilogoOperativo: {
      priorita: prioritaOperativa.titolo,
      urgente: prioritaOperativa.urgente,
      cambiamentiDisponibili: cambiamenti.disponibile,
      numeroCambiamenti: cambiamenti.elementi?.length || 0,
    },
    segnaliSecondari: assistente.segnaliSecondari,
  };
}

/**
 * Materiale collegato alla priorità operativa materiali (UX v12).
 * @param {object} cantiere
 * @param {ReturnType<typeof analizzaAssistenteEconomicoOperativoCantiere>} operativo
 */
function individuaMaterialePrioritaOperativa(cantiere = {}, operativo = {}) {
  const assistente = operativo.assistente || {};
  if (assistente.problemaPrincipale?.materiale) {
    return assistente.problemaPrincipale.materiale;
  }

  const segnaleMateriali =
    assistente.problemaPrincipale?.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra
      ? assistente.problemaPrincipale
      : assistente.controllo?.segnali?.find(
          (s) => s.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra
        );

  if (segnaleMateriali) {
    return calcolaContestoMaterialeProblema(segnaleMateriali, cantiere);
  }

  const hit = individuaMaterialeScostamentoPrincipale(cantiere, "sopra");
  if (hit?.materialeId) {
    return calcolaContestoMaterialeProblema(
      { azione: { contesto: { materialeId: hit.materialeId } } },
      cantiere
    );
  }

  return null;
}

/**
 * Evidenze numeriche per la priorità operativa (UX-Assistente contestuale v12).
 * @param {object} cantiere
 * @param {ReturnType<typeof analizzaAssistenteEconomicoOperativoCantiere>} operativo
 */
export function raccogliEvidenzePrioritaEconomica(cantiere = {}, operativo = {}) {
  const controllo = operativo.assistente?.controllo || {};
  const priorita = operativo.prioritaOperativa || {};
  /** @type {{ etichetta: string, valore: string }[]} */
  const evidenze = [];

  const aggiungiImporto = (etichetta, importo) => {
    if (importo == null || !Number.isFinite(Number(importo))) return;
    evidenze.push({ etichetta, valore: formattaEuroSegnale(importo) });
  };

  const aggiungiTesto = (etichetta, testo) => {
    if (testo) evidenze.push({ etichetta, valore: String(testo) });
  };

  switch (priorita.tipo) {
    case PRIORITA_OPERATIVA_TIPO.critico:
      aggiungiImporto("Incassato", controllo.incassato);
      aggiungiImporto("Spese", controllo.totaleSpese);
      aggiungiImporto("Margine", controllo.margineLordo);
      break;

    case PRIORITA_OPERATIVA_TIPO.peggioramento:
      aggiungiImporto("Spese", controllo.totaleSpese);
      aggiungiImporto("Incassato", controllo.incassato);
      if (controllo.costiPrincipali?.[0]) {
        aggiungiImporto(controllo.costiPrincipali[0].etichetta, controllo.costiPrincipali[0].importo);
      } else {
        aggiungiImporto("Margine", controllo.margineLordo);
      }
      break;

    case PRIORITA_OPERATIVA_TIPO.materiali: {
      const materiale = individuaMaterialePrioritaOperativa(cantiere, operativo);
      if (materiale) {
        aggiungiTesto("Materiale", materiale.nome);
        aggiungiImporto("Previsto", materiale.previsto);
        aggiungiImporto("Reale", materiale.reale);
        if (materiale.scostamento != null) {
          aggiungiImporto("Scostamento", materiale.scostamento);
        }
      } else {
        const materiali = controllo.materiali || {};
        aggiungiImporto("Previsto", materiali.totalePrevisto);
        aggiungiImporto("Reale", materiali.totaleReale);
        aggiungiImporto("Scostamento", materiali.scostamento);
      }
      break;
    }

    case PRIORITA_OPERATIVA_TIPO.registrazione: {
      const problemaTipo = operativo.assistente?.problemaPrincipale?.tipo;
      if (problemaTipo === TIPO_SEGNALE_GESTIONALE.nessun_incasso) {
        aggiungiImporto("Totale cantiere", controllo.totaleCantiere);
        aggiungiImporto("Incassato", controllo.incassato);
        aggiungiImporto("Rimanenza", controllo.rimanenza);
      } else {
        aggiungiImporto("Incassato", controllo.incassato);
        aggiungiImporto("Spese", controllo.totaleSpese);
        aggiungiImporto("Margine", controllo.margineLordo);
      }
      break;
    }

    case PRIORITA_OPERATIVA_TIPO.preventivo:
      aggiungiImporto("Margine", controllo.margineLordo);
      if (controllo.percentualeMargine != null) {
        aggiungiTesto("Margine %", formattaPercentualeMargine(controllo.percentualeMargine));
      }
      if (controllo.costiPrincipali?.[0]) {
        aggiungiImporto(
          controllo.costiPrincipali[0].etichetta,
          controllo.costiPrincipali[0].importo
        );
      }
      break;

    case PRIORITA_OPERATIVA_TIPO.nessuna:
    default:
      aggiungiImporto("Margine", controllo.margineLordo);
      if (controllo.percentualeMargine != null) {
        aggiungiTesto("Margine %", formattaPercentualeMargine(controllo.percentualeMargine));
      }
      if (
        controllo.incidenzaSpese != null &&
        Number(controllo.incassato) > 0 &&
        Number(controllo.totaleSpese) <= Number(controllo.incassato)
      ) {
        aggiungiTesto("Incidenza spese", formattaPercentualeMargine(controllo.incidenzaSpese));
      }
      break;
  }

  return evidenze.slice(0, 3);
}

/**
 * Spiegazione positiva quando non c'è priorità urgente (UX v12).
 * @param {ReturnType<typeof analizzaAssistenteEconomicoCantiere>} assistente
 */
export function formattaSituazionePositivaEconomica(assistente = {}) {
  const controllo = assistente.controllo || {};
  const stato = controllo.stato;

  if (stato === STATO_CONTROLLO_ECONOMICO.positivo) {
    const percentuale = formattaPercentualeMargine(controllo.percentualeMargine);
    if (percentuale) {
      return `Il cantiere mantiene una redditività positiva con margine del ${percentuale}.`;
    }
    return "Il cantiere mantiene una redditività positiva.";
  }

  if (stato === STATO_CONTROLLO_ECONOMICO.attenzione) {
    return "Non ci sono azioni urgenti, ma conviene tenere d'occhio margine e spese.";
  }

  return "La situazione economica non presenta criticità.";
}

/**
 * Spiegazione contestuale della priorità (UX-Assistente contestuale v12).
 * @param {object} cantiere
 * @param {ReturnType<typeof analizzaAssistenteEconomicoOperativoCantiere>} operativo
 */
export function formattaSpiegazionePrioritaEconomica(cantiere = {}, operativo = {}) {
  const priorita = operativo.prioritaOperativa || {};
  const controllo = operativo.assistente?.controllo || {};
  const margine = Number(controllo.margineLordo);

  switch (priorita.tipo) {
    case PRIORITA_OPERATIVA_TIPO.critico:
      if (Number.isFinite(margine) && margine < 0) {
        return `Le spese hanno superato gli incassi di ${formattaEuroSegnale(Math.abs(margine))}. Controlla le voci di spesa che stanno incidendo sul margine.`;
      }
      return (
        priorita.perche ||
        "La situazione economica richiede un controllo immediato sulle spese."
      );

    case PRIORITA_OPERATIVA_TIPO.peggioramento: {
      const top = controllo.costiPrincipali?.[0];
      let messaggio =
        priorita.perche || "Le spese recenti pesano di più rispetto al periodo precedente.";
      if (top?.percentualeSuTotaleSpese != null) {
        messaggio += ` ${top.etichetta} è la categoria con maggiore incidenza (${formattaPercentualeMargine(top.percentualeSuTotaleSpese)} delle spese).`;
      }
      return messaggio;
    }

    case PRIORITA_OPERATIVA_TIPO.materiali: {
      const materiale = individuaMaterialePrioritaOperativa(cantiere, operativo);
      if (materiale?.nome) {
        const scostamento =
          materiale.scostamento != null
            ? ` di ${formattaEuroSegnale(materiale.scostamento)}`
            : "";
        return `Il materiale ${materiale.nome} supera il costo previsto${scostamento}. Verifica le spese collegate.`;
      }
      return priorita.perche || "I costi materiali superano il previsto.";
    }

    case PRIORITA_OPERATIVA_TIPO.registrazione:
      return (
        priorita.perche ||
        "Servono dati aggiornati per monitorare correttamente il cantiere."
      );

    case PRIORITA_OPERATIVA_TIPO.preventivo:
      return (
        operativo.proattivo?.rischioPrincipale?.spiegazione ||
        operativo.proattivo?.rischioPrincipale?.messaggio ||
        priorita.perche ||
        "Conviene intervenire prima che la situazione peggiori."
      );

    case PRIORITA_OPERATIVA_TIPO.nessuna:
      return formattaSituazionePositivaEconomica(operativo.assistente);

    default:
      return priorita.perche || "";
  }
}

/**
 * Suggerimenti operativi su cosa controllare (UX v12).
 * @param {object} cantiere
 * @param {ReturnType<typeof analizzaAssistenteEconomicoOperativoCantiere>} operativo
 */
export function calcolaCosaControllareEconomico(cantiere = {}, operativo = {}) {
  const priorita = operativo.prioritaOperativa || {};
  const controllo = operativo.assistente?.controllo || {};
  const haMateriali =
    Array.isArray(cantiere.materiali) && cantiere.materiali.length > 0;
  /** @type {string[]} */
  const elementi = [];

  switch (priorita.tipo) {
    case PRIORITA_OPERATIVA_TIPO.critico:
    case PRIORITA_OPERATIVA_TIPO.peggioramento:
      elementi.push("Controlla le spese più alte");
      elementi.push("Verifica eventuali spese registrate per errore");
      if (haMateriali) {
        elementi.push("Controlla i materiali con scostamento maggiore");
      }
      break;

    case PRIORITA_OPERATIVA_TIPO.materiali:
      elementi.push("Controlla il materiale più fuori budget");
      elementi.push("Verifica le spese collegate");
      elementi.push("Valuta se ci sono altre spese dello stesso materiale");
      break;

    case PRIORITA_OPERATIVA_TIPO.registrazione: {
      const problemaTipo = operativo.assistente?.problemaPrincipale?.tipo;
      if (problemaTipo === TIPO_SEGNALE_GESTIONALE.nessun_incasso) {
        elementi.push("Verifica i pagamenti ricevuti");
        elementi.push("Registra l'incasso se già ricevuto");
      } else if (problemaTipo === TIPO_SEGNALE_GESTIONALE.nessuna_spesa) {
        elementi.push("Verifica le spese sostenute sul cantiere");
        elementi.push("Registra le spese già sostenute");
      } else {
        elementi.push("Verifica i dati economici registrati");
      }
      break;
    }

    case PRIORITA_OPERATIVA_TIPO.preventivo: {
      const rischioTipo = operativo.proattivo?.rischioPrincipale?.tipo;
      if (rischioTipo === "evoluzione_pression_spese") {
        elementi.push("Controlla le spese del periodo recente");
        elementi.push("Verifica se l'aumento riguarda materiali o altre categorie");
      } else if (rischioTipo === "concentrazione_costi") {
        elementi.push("Analizza la categoria di spesa dominante");
        elementi.push("Verifica l'impatto sul margine");
      } else {
        elementi.push("Monitora l'andamento delle spese");
        elementi.push("Tieni d'occhio il margine lordo");
      }
      break;
    }

    case PRIORITA_OPERATIVA_TIPO.nessuna:
    default:
      if (controllo.stato === STATO_CONTROLLO_ECONOMICO.positivo) {
        elementi.push("Continua a registrare incassi e spese");
        if (haMateriali) {
          elementi.push("Verifica periodicamente i materiali");
        }
      }
      break;
  }

  return elementi.slice(0, 3);
}

/**
 * Assistente economico contestuale cantiere (UX v12).
 * @param {object} cantiere
 */
export function analizzaAssistenteEconomicoContestualeCantiere(cantiere = {}) {
  const operativo = analizzaAssistenteEconomicoOperativoCantiere(cantiere);
  const assistente = operativo.assistente;
  const priorita = operativo.prioritaOperativa;
  const evidenze = raccogliEvidenzePrioritaEconomica(cantiere, operativo);
  const spiegazione = formattaSpiegazionePrioritaEconomica(cantiere, operativo);
  const cosaControllare = calcolaCosaControllareEconomico(cantiere, operativo);

  return {
    operativo,
    assistente,
    proattivo: operativo.proattivo,
    cambiamenti: operativo.cambiamenti,
    situazione: assistente.situazione,
    priorita,
    spiegazione,
    evidenze,
    cosaControllare,
    azione: priorita.azione,
    contesto: priorita.azione?.contesto ?? null,
    segnaliSecondari: operativo.segnaliSecondari,
  };
}

/** Messaggio impatto non quantificabile (UX v13). */
export const MESSAGGIO_IMPATTO_NON_QUANTIFICABILE =
  "Impatto non quantificabile con i dati disponibili.";

/**
 * Decisione economica principale (UX-Assistente decisionale v13).
 * @param {object} cantiere
 * @param {ReturnType<typeof analizzaAssistenteEconomicoContestualeCantiere>} contestuale
 */
export function formattaDecisionePrincipaleEconomica(cantiere = {}, contestuale = {}) {
  const priorita = contestuale.priorita || {};
  const controllo = contestuale.assistente?.controllo || {};
  const problemaTipo = contestuale.assistente?.problemaPrincipale?.tipo;

  switch (priorita.tipo) {
    case PRIORITA_OPERATIVA_TIPO.critico:
      return {
        titolo: "C'è un problema di costi.",
        messaggio: "Le spese superano gli incassi registrati.",
      };

    case PRIORITA_OPERATIVA_TIPO.peggioramento:
      return {
        titolo: "Le spese stanno aumentando.",
        messaggio: "Il periodo recente pesa di più sul margine.",
      };

    case PRIORITA_OPERATIVA_TIPO.materiali: {
      const materiale = individuaMaterialePrioritaOperativa(cantiere, contestuale.operativo);
      const nome = materiale?.nome || "Un materiale";
      return {
        titolo: `${nome} è sopra il previsto.`,
        messaggio: "Il costo reale del materiale supera la previsione.",
      };
    }

    case PRIORITA_OPERATIVA_TIPO.preventivo:
      return {
        titolo:
          contestuale.proattivo?.rischioPrincipale?.titolo || "C'è un rischio da monitorare.",
        messaggio:
          contestuale.proattivo?.rischioPrincipale?.messaggio ||
          "Convine intervenire prima che la situazione peggiori.",
      };

    case PRIORITA_OPERATIVA_TIPO.registrazione:
      if (problemaTipo === TIPO_SEGNALE_GESTIONALE.nessun_incasso) {
        return {
          titolo: "Mancano incassi.",
          messaggio: "Non risultano incassi registrati sul cantiere.",
        };
      }
      if (problemaTipo === TIPO_SEGNALE_GESTIONALE.nessuna_spesa) {
        return {
          titolo: "Mancano spese registrate.",
          messaggio: "Non risultano spese registrate sul cantiere.",
        };
      }
      return {
        titolo: "Servono dati aggiornati.",
        messaggio: priorita.perche || "Registra i movimenti economici mancanti.",
      };

    case PRIORITA_OPERATIVA_TIPO.nessuna:
    default:
      return {
        titolo: "Non ci sono decisioni economiche urgenti da prendere.",
        messaggio:
          controllo.stato === STATO_CONTROLLO_ECONOMICO.positivo
            ? "La situazione economica è sotto controllo."
            : "Non servono interventi immediati sul cantiere.",
      };
  }
}

/**
 * Impatto economico della decisione (UX v13) — solo da dati esistenti.
 * @param {object} cantiere
 * @param {ReturnType<typeof analizzaAssistenteEconomicoContestualeCantiere>} contestuale
 */
export function calcolaImpattoEconomicoDecisione(cantiere = {}, contestuale = {}) {
  const priorita = contestuale.priorita || {};
  const controllo = contestuale.assistente?.controllo || {};
  const margine = Number(controllo.margineLordo);
  const problemaTipo = contestuale.assistente?.problemaPrincipale?.tipo;

  switch (priorita.tipo) {
    case PRIORITA_OPERATIVA_TIPO.critico:
      if (Number.isFinite(margine) && margine < 0) {
        return {
          quantificabile: true,
          messaggio: `Le spese superano gli incassi di ${formattaEuroSegnale(Math.abs(margine))}.`,
          importo: Math.abs(margine),
        };
      }
      break;

    case PRIORITA_OPERATIVA_TIPO.peggioramento: {
      const periodi = calcolaRiepilogoPeriodiEconomiciCantiere(cantiere);
      if (
        periodi.disponibile &&
        periodi.speseRecenti > periodi.spesePrecedenti &&
        periodi.spesePrecedenti > 0
      ) {
        const delta = periodi.speseRecenti - periodi.spesePrecedenti;
        return {
          quantificabile: true,
          messaggio: `Le spese del periodo recente sono aumentate di ${formattaEuroSegnale(delta)}.`,
          importo: delta,
        };
      }
      break;
    }

    case PRIORITA_OPERATIVA_TIPO.materiali: {
      const materiale = individuaMaterialePrioritaOperativa(cantiere, contestuale.operativo);
      if (materiale?.scostamento != null && Number(materiale.scostamento) > 0) {
        const nome = materiale.nome || "Questo materiale";
        return {
          quantificabile: true,
          messaggio: `${nome} sta assorbendo ${formattaEuroSegnale(materiale.scostamento)} oltre il previsto.`,
          importo: Number(materiale.scostamento),
        };
      }
      const scostamentoTot = controllo.materiali?.scostamento;
      if (scostamentoTot != null && Number(scostamentoTot) > 0) {
        return {
          quantificabile: true,
          messaggio: `I materiali superano il previsto di ${formattaEuroSegnale(scostamentoTot)}.`,
          importo: Number(scostamentoTot),
        };
      }
      break;
    }

    case PRIORITA_OPERATIVA_TIPO.registrazione:
      if (problemaTipo === TIPO_SEGNALE_GESTIONALE.nessun_incasso) {
        const rimanenza = Number(controllo.rimanenza);
        if (Number.isFinite(rimanenza) && rimanenza > 0) {
          return {
            quantificabile: true,
            messaggio: `Restano ${formattaEuroSegnale(rimanenza)} da incassare.`,
            importo: rimanenza,
          };
        }
      }
      break;

    case PRIORITA_OPERATIVA_TIPO.preventivo:
      if (Number.isFinite(margine) && margine >= 0 && controllo.percentualeMargine != null) {
        return {
          quantificabile: true,
          messaggio: `Margine attuale: ${formattaEuroSegnale(margine)} (${formattaPercentualeMargine(controllo.percentualeMargine)}).`,
          importo: margine,
        };
      }
      break;

    case PRIORITA_OPERATIVA_TIPO.nessuna:
      if (Number.isFinite(margine) && margine > 0) {
        return {
          quantificabile: true,
          messaggio: `Margine lordo attuale: ${formattaEuroSegnale(margine)}.`,
          importo: margine,
        };
      }
      break;

    default:
      break;
  }

  return {
    quantificabile: false,
    messaggio: MESSAGGIO_IMPATTO_NON_QUANTIFICABILE,
    importo: null,
  };
}

/**
 * Azione raccomandata collegata alla decisione (UX v13).
 * @param {ReturnType<typeof analizzaAssistenteEconomicoContestualeCantiere>} contestuale
 * @param {object} cantiere
 */
export function formattaAzioneRaccomandataDecisionale(contestuale = {}, cantiere = {}) {
  const priorita = contestuale.priorita || {};
  const azione = priorita.azione;
  void cantiere;

  if (!priorita.tipo || priorita.tipo === PRIORITA_OPERATIVA_TIPO.nessuna) {
    return { messaggio: null, azione: null };
  }

  let messaggio = priorita.titolo || "Intervieni sul cantiere.";

  switch (azione?.tipo) {
    case TIPO_AZIONE_GESTIONALE.vedi_spese:
      messaggio = "Controlla le spese registrate.";
      break;
    case TIPO_AZIONE_GESTIONALE.vedi_materiali: {
      const materiale = individuaMaterialePrioritaOperativa(
        cantiere,
        contestuale.operativo
      );
      messaggio = materiale?.nome
        ? `Controlla il costo del materiale ${materiale.nome}.`
        : "Controlla il costo dei materiali.";
      break;
    }
    case TIPO_AZIONE_GESTIONALE.registra_incasso:
      messaggio = "Registra gli incassi effettuati.";
      break;
    case TIPO_AZIONE_GESTIONALE.registra_spesa:
      messaggio = "Registra le spese sostenute.";
      break;
    default:
      messaggio = priorita.titolo || messaggio;
  }

  return { messaggio, azione };
}

/**
 * Alternativa informativa quando utile (UX v13).
 * @param {ReturnType<typeof analizzaAssistenteEconomicoContestualeCantiere>} contestuale
 */
export function calcolaAlternativaDecisionale(contestuale = {}) {
  const priorita = contestuale.priorita || {};
  const segnali = contestuale.segnaliSecondari || [];

  if (priorita.tipo === PRIORITA_OPERATIVA_TIPO.nessuna && segnali.length > 0) {
    const primo = segnali[0];
    return {
      messaggio: primo?.messaggio || null,
      tipo: primo?.tipo || null,
    };
  }

  if (
    priorita.tipo !== PRIORITA_OPERATIVA_TIPO.nessuna &&
    !priorita.azione?.disponibile
  ) {
    return {
      messaggio: "Verifica i dati economici prima di intervenire.",
      tipo: "dati_insufficienti",
    };
  }

  return null;
}

/**
 * Assistente economico decisionale cantiere (UX v13).
 * @param {object} cantiere
 */
export function analizzaAssistenteEconomicoDecisionaleCantiere(cantiere = {}) {
  const assistente = analizzaAssistenteEconomicoContestualeCantiere(cantiere);
  const decisionePrincipale = formattaDecisionePrincipaleEconomica(cantiere, assistente);
  const impattoEconomico = calcolaImpattoEconomicoDecisione(cantiere, assistente);
  const azioneRaccomandata = formattaAzioneRaccomandataDecisionale(assistente, cantiere);
  const alternativa = calcolaAlternativaDecisionale(assistente);

  return {
    assistente,
    decisionePrincipale,
    impattoEconomico,
    motivo: assistente.spiegazione,
    evidenze: assistente.evidenze,
    cosaControllare: assistente.cosaControllare,
    azioneRaccomandata,
    alternativa,
    priorita: assistente.priorita,
    azione: assistente.azione,
    contesto: assistente.contesto,
    situazione: assistente.situazione,
    cambiamenti: assistente.cambiamenti,
    segnaliSecondari: assistente.segnaliSecondari,
  };
}

/** Tipologia scenario economico temporaneo (UX v14). */
export const TIPO_SCENARIO_ECONOMICO = Object.freeze({
  spesa: "spesa",
  incasso: "incasso",
  combinato: "combinato",
});

export const MESSAGGIO_MARGINE_DISPONIBILE_ND =
  "Margine disponibile non determinabile con i dati disponibili.";

/**
 * Normalizza importo scenario (> 0).
 * @param {unknown} importo
 * @returns {number|null}
 */
export function normalizzaImportoScenarioEconomico(importo) {
  const n = normalizzaNumero(importo);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Margine ancora disponibile prima di entrare in perdita (UX v14).
 * @param {number} incassato
 * @param {number} margineLordo
 * @returns {number|null}
 */
export function calcolaMargineDisponibilePrimaPerdita(incassato, margineLordo) {
  const inc = Number(incassato);
  const margine = Number(margineLordo);
  if (!(inc > 0) || !Number.isFinite(margine) || margine < 0) return null;
  return margine;
}

/**
 * @param {{ incassato: number, totaleSpese: number, totaleCantiere: number, margineLordo?: number }} params
 */
function costruisciSnapshotEconomicoScenario(params) {
  const incassato = Number(params.incassato);
  const totaleSpese = Number(params.totaleSpese);
  const totaleCantiere = Number(params.totaleCantiere);
  const margineLordo =
    params.margineLordo != null && Number.isFinite(Number(params.margineLordo))
      ? Number(params.margineLordo)
      : incassato - totaleSpese;
  const percentualeMargine = calcolaPercentualeMargine(incassato, margineLordo);
  const rimanenzaGrezza = totaleCantiere - incassato;

  return {
    incassato,
    totaleSpese,
    totaleCantiere,
    margineLordo,
    percentualeMargine,
    rimanenza: Math.max(rimanenzaGrezza, 0),
    rimanenzaGrezza,
    overpayment: incassato > totaleCantiere,
    statoRedditivita: calcolaStatoRedditivita(incassato, margineLordo),
    statoControllo: calcolaStatoControlloEconomico(incassato, margineLordo),
  };
}

/**
 * @param {ReturnType<typeof costruisciSnapshotEconomicoScenario>} reale
 * @param {ReturnType<typeof costruisciSnapshotEconomicoScenario>} simulato
 */
function formattaMessaggioCambioStatoScenario(reale, simulato) {
  if (reale.statoRedditivita === simulato.statoRedditivita) return null;
  const da = ETICHETTE_STATO_REDDITIVITA[reale.statoRedditivita] || "Stato attuale";
  const a = ETICHETTE_STATO_REDDITIVITA[simulato.statoRedditivita] || "Nuovo stato";
  return `Questa operazione porterebbe il cantiere da ${da} a ${a}.`;
}

/**
 * @param {string} tipoEffettivo
 * @param {ReturnType<typeof costruisciSnapshotEconomicoScenario>} reale
 * @param {ReturnType<typeof costruisciSnapshotEconomicoScenario>} simulato
 * @param {{ spese: number, margine: number, incassato: number, rimanenza: number }} variazioni
 */
function formattaMessaggioSintesiScenario(tipoEffettivo, reale, simulato, variazioni) {
  if (tipoEffettivo === TIPO_SCENARIO_ECONOMICO.incasso) {
    if (simulato.overpayment) {
      return "Il nuovo incassato supera il valore del cantiere.";
    }
    return `Questo incasso ridurrebbe la rimanenza di ${formattaEuroSegnale(Math.abs(variazioni.rimanenza))}.`;
  }

  if (tipoEffettivo === TIPO_SCENARIO_ECONOMICO.spesa) {
    if (simulato.margineLordo < 0 && reale.margineLordo >= 0) {
      return `Con questa spesa il margine diventerebbe negativo di ${formattaEuroSegnale(Math.abs(simulato.margineLordo))}.`;
    }
    return `Con una spesa di ${formattaEuroSegnale(variazioni.spese)}, il margine passerebbe da ${formattaEuroSegnale(reale.margineLordo)} a ${formattaEuroSegnale(simulato.margineLordo)}.`;
  }

  const parti = [];
  if (variazioni.spese > 0) {
    parti.push(
      `spesa ${formattaEuroSegnale(variazioni.spese)} → margine ${formattaEuroSegnale(simulato.margineLordo)}`
    );
  }
  if (variazioni.incassato > 0) {
    parti.push(
      `incasso ${formattaEuroSegnale(variazioni.incassato)} → rimanenza ${formattaEuroSegnale(simulato.rimanenza)}`
    );
  }
  return parti.join(" · ") || null;
}

/**
 * Simulazione economica temporanea — nessuna persistenza (UX v14).
 * @param {object} cantiere
 * @param {{ tipo?: string, importo?: number, spesa?: number, incasso?: number }} scenario
 */
export function simulaScenarioEconomicoCantiere(cantiere = {}, scenario = {}) {
  const realeBase = riepilogoEconomicoCompleto(cantiere);
  const reale = costruisciSnapshotEconomicoScenario({
    incassato: realeBase.incassato,
    totaleSpese: realeBase.totaleSpese,
    totaleCantiere: realeBase.totaleCantiere,
  });

  const spesaAmt =
    scenario.tipo === TIPO_SCENARIO_ECONOMICO.spesa
      ? normalizzaImportoScenarioEconomico(scenario.importo)
      : normalizzaImportoScenarioEconomico(scenario.spesa);
  const incassoAmt =
    scenario.tipo === TIPO_SCENARIO_ECONOMICO.incasso
      ? normalizzaImportoScenarioEconomico(scenario.importo)
      : normalizzaImportoScenarioEconomico(scenario.incasso);

  let tipoEffettivo = null;
  if (spesaAmt && incassoAmt) tipoEffettivo = TIPO_SCENARIO_ECONOMICO.combinato;
  else if (spesaAmt) tipoEffettivo = TIPO_SCENARIO_ECONOMICO.spesa;
  else if (incassoAmt) tipoEffettivo = TIPO_SCENARIO_ECONOMICO.incasso;

  const margineDisponibile = calcolaMargineDisponibilePrimaPerdita(
    reale.incassato,
    reale.margineLordo
  );

  if (!tipoEffettivo) {
    return {
      disponibile: false,
      tipo: scenario.tipo || null,
      motivo: "Importo non valido per la simulazione.",
      reale,
      simulato: null,
      variazioni: null,
      cambioStato: null,
      margineDisponibile,
      messaggio: null,
      messaggioMargineDisponibile:
        margineDisponibile != null
          ? `Margine disponibile prima di entrare in perdita: ${formattaEuroSegnale(margineDisponibile)}.`
          : MESSAGGIO_MARGINE_DISPONIBILE_ND,
    };
  }

  const simIncassato = reale.incassato + (incassoAmt || 0);
  const simSpese = reale.totaleSpese + (spesaAmt || 0);
  const soloIncasso = tipoEffettivo === TIPO_SCENARIO_ECONOMICO.incasso;
  const simMargine = soloIncasso ? reale.margineLordo : reale.incassato - simSpese;

  const simulato = costruisciSnapshotEconomicoScenario({
    incassato: simIncassato,
    totaleSpese: soloIncasso ? reale.totaleSpese : simSpese,
    totaleCantiere: reale.totaleCantiere,
    margineLordo: simMargine,
  });

  const variazioni = {
    spese: simulato.totaleSpese - reale.totaleSpese,
    margine: simulato.margineLordo - reale.margineLordo,
    incassato: simulato.incassato - reale.incassato,
    rimanenza: simulato.rimanenza - reale.rimanenza,
  };

  const cambioStato = {
    redditivita: reale.statoRedditivita !== simulato.statoRedditivita,
    controllo: reale.statoControllo !== simulato.statoControllo,
    daRedditivita: reale.statoRedditivita,
    aRedditivita: simulato.statoRedditivita,
    daControllo: reale.statoControllo,
    aControllo: simulato.statoControllo,
    messaggio: formattaMessaggioCambioStatoScenario(reale, simulato),
  };

  const risultatoBase = {
    disponibile: true,
    tipo: tipoEffettivo,
    importoSpesa: spesaAmt,
    importoIncasso: incassoAmt,
    reale,
    simulato,
    variazioni,
    cambioStato,
    margineDisponibile,
    messaggio: formattaMessaggioSintesiScenario(tipoEffettivo, reale, simulato, variazioni),
    messaggioMargineDisponibile:
      margineDisponibile != null
        ? `Margine disponibile prima di entrare in perdita: ${formattaEuroSegnale(margineDisponibile)}.`
        : MESSAGGIO_MARGINE_DISPONIBILE_ND,
  };

  return {
    ...risultatoBase,
    classificazione: classificaEffettoScenarioEconomico(risultatoBase),
  };
}

/**
 * Assistente con scenario temporaneo (UX v14).
 * @param {object} cantiere
 * @param {{ tipo?: string, importo?: number, spesa?: number, incasso?: number }} scenario
 */
export function analizzaAssistenteEconomicoScenarioCantiere(cantiere = {}, scenario = {}) {
  return {
    decisionale: analizzaAssistenteEconomicoDecisionaleCantiere(cantiere),
    simulazione: simulaScenarioEconomicoCantiere(cantiere, scenario),
  };
}

/** Classificazione effetto scenario (UX v15) — derivata da reale vs simulato, nessuna nuova soglia. */
export const EFFETTO_SCENARIO_ECONOMICO = Object.freeze({
  migliora: "migliora",
  peggiora: "peggiora",
  neutro: "neutro",
  cambia_stato: "cambia_stato",
});

export const ETICHETTE_EFFETTO_SCENARIO_ECONOMICO = Object.freeze({
  [EFFETTO_SCENARIO_ECONOMICO.migliora]: "Migliora la situazione",
  [EFFETTO_SCENARIO_ECONOMICO.peggiora]: "Peggiora la situazione",
  [EFFETTO_SCENARIO_ECONOMICO.neutro]: "Effetto neutro",
  [EFFETTO_SCENARIO_ECONOMICO.cambia_stato]: "Cambia lo stato economico",
});

export const MESSAGGIO_OPERAZIONE_REGISTRATA_SEMPLICE =
  "Operazione registrata. Situazione economica aggiornata.";

/**
 * Classifica l'effetto dello scenario rispetto ai dati reali (UX v15).
 * @param {ReturnType<typeof simulaScenarioEconomicoCantiere>} simulazione
 */
export function classificaEffettoScenarioEconomico(simulazione = {}) {
  if (!simulazione?.disponibile || !simulazione.reale || !simulazione.simulato) {
    return {
      effetto: null,
      cambiaStato: false,
      messaggio: MESSAGGIO_IMPATTO_NON_QUANTIFICABILE,
    };
  }

  const { tipo, variazioni, cambioStato } = simulazione;
  const cambiaStato = Boolean(cambioStato?.redditivita || cambioStato?.controllo);

  let effetto = EFFETTO_SCENARIO_ECONOMICO.neutro;

  if (tipo === TIPO_SCENARIO_ECONOMICO.incasso) {
    if ((variazioni?.incassato || 0) > 0 || (variazioni?.rimanenza || 0) < 0) {
      effetto = EFFETTO_SCENARIO_ECONOMICO.migliora;
    }
  } else if (tipo === TIPO_SCENARIO_ECONOMICO.spesa) {
    if ((variazioni?.margine || 0) < 0) effetto = EFFETTO_SCENARIO_ECONOMICO.peggiora;
    else if ((variazioni?.margine || 0) > 0) effetto = EFFETTO_SCENARIO_ECONOMICO.migliora;
  } else if (tipo === TIPO_SCENARIO_ECONOMICO.combinato) {
    if ((variazioni?.margine || 0) < 0) effetto = EFFETTO_SCENARIO_ECONOMICO.peggiora;
    else if ((variazioni?.margine || 0) > 0) effetto = EFFETTO_SCENARIO_ECONOMICO.migliora;
    else if ((variazioni?.incassato || 0) > 0) effetto = EFFETTO_SCENARIO_ECONOMICO.migliora;
  }

  if (cambiaStato && effetto === EFFETTO_SCENARIO_ECONOMICO.neutro) {
    effetto = EFFETTO_SCENARIO_ECONOMICO.cambia_stato;
  }

  let messaggio = ETICHETTE_EFFETTO_SCENARIO_ECONOMICO[effetto] || MESSAGGIO_IMPATTO_NON_QUANTIFICABILE;
  if (cambiaStato && cambioStato?.messaggio) {
    messaggio = cambioStato.messaggio;
  } else if (effetto === EFFETTO_SCENARIO_ECONOMICO.peggiora) {
    messaggio = "Questa operazione peggiorerebbe la situazione economica.";
  } else if (effetto === EFFETTO_SCENARIO_ECONOMICO.migliora) {
    messaggio =
      tipo === TIPO_SCENARIO_ECONOMICO.incasso
        ? "Questo incasso migliorerebbe la liquidità del cantiere."
        : "Questa operazione migliorerebbe la situazione economica.";
  } else if (effetto === EFFETTO_SCENARIO_ECONOMICO.neutro) {
    messaggio = "Questa operazione non altererebbe in modo rilevante la situazione economica.";
  }

  return {
    effetto,
    cambiaStato,
    messaggio,
  };
}

/**
 * Snapshot economico reale per verifica post-registrazione (UX v15).
 * @param {object} cantiere
 */
export function snapshotEconomicoRealeCantiere(cantiere = {}) {
  const r = riepilogoEconomicoCompleto(cantiere);
  const margineLordo = r.margineLordo;
  return {
    incassato: r.incassato,
    totaleSpese: r.totaleSpese,
    totaleCantiere: r.totaleCantiere,
    margineLordo,
    rimanenza: Math.max(r.totaleCantiere - r.incassato, 0),
    percentualeMargine: calcolaPercentualeMargine(r.incassato, margineLordo),
    statoRedditivita: calcolaStatoRedditivita(r.incassato, margineLordo),
    statoControllo: calcolaStatoControlloEconomico(r.incassato, margineLordo),
    conteggioSpese: (r.spese || []).length,
    conteggioPagamenti: Array.isArray(cantiere?.pagamenti) ? cantiere.pagamenti.length : 0,
  };
}

/**
 * Verifica dopo registrazione reale (UX v15) — nessun falso storico.
 * @param {{ tipo?: string, importo?: number|null, prima?: object|null, dopo?: object|null }} params
 */
export function costruisciVerificaOperazioneEconomica(params = {}) {
  const tipo = params.tipo || null;
  const importo = normalizzaImportoScenarioEconomico(params.importo);
  const prima = params.prima || null;
  const dopo = params.dopo || null;

  if (!dopo) {
    return {
      disponibile: false,
      tipo,
      importo,
      messaggio: MESSAGGIO_OPERAZIONE_REGISTRATA_SEMPLICE,
      confronto: null,
      cambiamenti: null,
    };
  }

  const cambiamenti = calcolaCambiamentiEconomiciCantiere(params.cantiere || {});

  if (!prima) {
    return {
      disponibile: true,
      tipo,
      importo,
      messaggio: MESSAGGIO_OPERAZIONE_REGISTRATA_SEMPLICE,
      confronto: null,
      dopo,
      cambiamenti,
    };
  }

  /** @type {{ etichetta: string, prima: string, ora: string }[]} */
  const confronto = [];
  if (tipo === TIPO_SCENARIO_ECONOMICO.spesa || tipo === TIPO_SCENARIO_ECONOMICO.combinato) {
    confronto.push({
      etichetta: "Margine",
      prima: formattaEuroSegnale(prima.margineLordo),
      ora: formattaEuroSegnale(dopo.margineLordo),
    });
  }
  if (tipo === TIPO_SCENARIO_ECONOMICO.incasso || tipo === TIPO_SCENARIO_ECONOMICO.combinato) {
    confronto.push({
      etichetta: "Incassato",
      prima: formattaEuroSegnale(prima.incassato),
      ora: formattaEuroSegnale(dopo.incassato),
    });
    confronto.push({
      etichetta: "Rimanenza",
      prima: formattaEuroSegnale(prima.rimanenza),
      ora: formattaEuroSegnale(dopo.rimanenza),
    });
  }

  let messaggio = MESSAGGIO_OPERAZIONE_REGISTRATA_SEMPLICE;
  if (tipo === TIPO_SCENARIO_ECONOMICO.spesa && importo != null) {
    const deltaMargine = dopo.margineLordo - prima.margineLordo;
    if (deltaMargine < 0) {
      messaggio = `La situazione è peggiorata: la nuova spesa ha ridotto il margine.`;
    } else if (deltaMargine === 0) {
      messaggio = "Situazione invariata.";
    } else {
      messaggio = "Situazione migliorata rispetto al margine precedente.";
    }
  } else if (tipo === TIPO_SCENARIO_ECONOMICO.incasso && importo != null) {
    const deltaRimanenza = dopo.rimanenza - prima.rimanenza;
    if (deltaRimanenza < 0) {
      messaggio = "Situazione migliorata: l'incasso registrato ha ridotto il residuo.";
    } else if (deltaRimanenza === 0 && dopo.incassato === prima.incassato) {
      messaggio = "Situazione invariata.";
    } else {
      messaggio = "Situazione migliorata: l'incasso è stato registrato.";
    }
  }

  return {
    disponibile: true,
    tipo,
    importo,
    messaggio,
    operazioneLabel:
      tipo === TIPO_SCENARIO_ECONOMICO.spesa
        ? importo != null
          ? `+ Spesa ${formattaEuroSegnale(importo)}`
          : "+ Spesa"
        : tipo === TIPO_SCENARIO_ECONOMICO.incasso
          ? importo != null
            ? `+ Incasso ${formattaEuroSegnale(importo)}`
            : "+ Incasso"
          : "Operazione registrata",
    confronto,
    prima,
    dopo,
    cambiamenti,
  };
}

export { leggiTotaleCantiereEconomico };
