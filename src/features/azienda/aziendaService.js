/**
 * Profilo azienda — normalizzazione pura + accesso allo storage esistente.
 * Persistenza: impostazioniRepository / STORAGE_KEYS.datiAzienda (nessuno storage nuovo).
 */

import {
  leggiDatiAzienda,
  salvaDatiAzienda,
} from "../../repositories/impostazioniRepository";

function testo(valore) {
  return String(valore ?? "").trim();
}

/** Campi stringa del profilo (logo e pdfSettings gestiti a parte). */
export const CAMPI_PROFILO_AZIENDA = Object.freeze([
  "nomeDitta",
  "nomeTitolare",
  "indirizzo",
  "cap",
  "comune",
  "provincia",
  "telefono",
  "email",
  "pec",
  "sitoWeb",
  "partitaIva",
  "codiceFiscale",
  "codiceSdi",
  "iban",
  "intestatarioConto",
  "banca",
  "bicSwift",
  "condizioniGenerali",
  "condizioniPagamento",
  "notePdf",
  "testoFinale",
]);

/**
 * Profilo vuoto (default).
 * @returns {object}
 */
export function profiloAziendaVuoto() {
  /** @type {Record<string, string>} */
  const vuoto = {};
  for (const campo of CAMPI_PROFILO_AZIENDA) {
    vuoto[campo] = "";
  }
  return {
    ...vuoto,
    logo: "",
  };
}

/**
 * Normalizza un profilo grezzo (parziale ok). Backward-compat alias.
 * @param {object=} grezzo
 * @returns {object}
 */
export function normalizzaProfiloAzienda(grezzo = {}) {
  const src = grezzo && typeof grezzo === "object" ? grezzo : {};
  const base = profiloAziendaVuoto();

  const nomeDitta = testo(
    src.nomeDitta || src.ragioneSociale || src.nome || ""
  );

  /** @type {object} */
  const profilo = {
    ...base,
    nomeDitta,
    nomeTitolare: testo(src.nomeTitolare),
    indirizzo: testo(src.indirizzo),
    cap: testo(src.cap),
    comune: testo(src.comune),
    provincia: testo(src.provincia).toUpperCase(),
    telefono: testo(src.telefono),
    email: testo(src.email),
    pec: testo(src.pec),
    sitoWeb: testo(src.sitoWeb),
    partitaIva: testo(src.partitaIva || src.pIva),
    codiceFiscale: testo(src.codiceFiscale).toUpperCase(),
    codiceSdi: testo(src.codiceSdi || src.codiceSDI).toUpperCase(),
    iban: testo(src.iban).replace(/\s+/g, " ").toUpperCase(),
    intestatarioConto: testo(src.intestatarioConto),
    banca: testo(src.banca),
    bicSwift: testo(src.bicSwift || src.bic).toUpperCase(),
    condizioniGenerali: testo(src.condizioniGenerali || src.condizioni),
    condizioniPagamento: testo(src.condizioniPagamento),
    notePdf: testo(src.notePdf),
    testoFinale: testo(src.testoFinale),
    logo: typeof src.logo === "string" ? src.logo : "",
  };

  if (src.pdfSettings && typeof src.pdfSettings === "object") {
    profilo.pdfSettings = src.pdfSettings;
  }

  return profilo;
}

/**
 * Indirizzo completo su una riga (solo parti compilate).
 * @param {object} profilo
 */
export function formattaIndirizzoAzienda(profilo = {}) {
  const p = normalizzaProfiloAzienda(profilo);
  const citta = [p.cap, p.comune].filter(Boolean).join(" ");
  const conProv = p.provincia
    ? citta
      ? `${citta} (${p.provincia})`
      : `(${p.provincia})`
    : citta;
  return [p.indirizzo, conProv].filter(Boolean).join(" · ");
}

/**
 * True se c'è almeno un dato bancario/condizioni pagamento.
 * @param {object} profilo
 */
export function haDatiPagamentoAzienda(profilo = {}) {
  const p = normalizzaProfiloAzienda(profilo);
  return Boolean(
    p.iban ||
      p.intestatarioConto ||
      p.banca ||
      p.bicSwift ||
      p.condizioniPagamento
  );
}

/**
 * Shape azienda per il DTO PDF (campi vuoti = stringa vuota, niente etichette inventate).
 * @param {object=} grezzo
 */
export function risolviAziendaPerPdf(grezzo = {}) {
  const p = normalizzaProfiloAzienda(grezzo);
  return {
    nome: p.nomeDitta || "PreventivAI",
    nomeTitolare: p.nomeTitolare,
    indirizzo: formattaIndirizzoAzienda(p) || p.indirizzo,
    telefono: p.telefono,
    email: p.email,
    pec: p.pec,
    sitoWeb: p.sitoWeb,
    partitaIva: p.partitaIva,
    codiceFiscale: p.codiceFiscale,
    codiceSdi: p.codiceSdi,
    logo: p.logo || null,
    iban: p.iban,
    intestatarioConto: p.intestatarioConto,
    banca: p.banca,
    bicSwift: p.bicSwift,
    condizioniPagamento: p.condizioniPagamento,
    condizioniGenerali: p.condizioniGenerali,
    notePdf: p.notePdf,
    testoFinale: p.testoFinale,
  };
}

/**
 * Linee header PDF (solo valori presenti, senza etichette vuote).
 * @param {object} aziendaPdf
 * @returns {string[]}
 */
export function lineeHeaderAziendaPdf(aziendaPdf = {}) {
  const a = aziendaPdf || {};
  const linee = [];
  if (a.indirizzo) linee.push(String(a.indirizzo));

  const contatti = [
    a.telefono && `Tel. ${a.telefono}`,
    a.email,
    a.pec && `PEC ${a.pec}`,
  ].filter(Boolean);
  if (contatti.length) linee.push(contatti.join(" · "));

  const fiscali = [
    a.partitaIva && `P. IVA ${a.partitaIva}`,
    a.codiceFiscale && `C.F. ${a.codiceFiscale}`,
    a.codiceSdi && `SDI ${a.codiceSdi}`,
  ].filter(Boolean);
  if (fiscali.length) linee.push(fiscali.join(" · "));

  if (a.sitoWeb) linee.push(String(a.sitoWeb));

  return linee;
}

/**
 * @returns {object}
 */
export function leggiProfiloAzienda() {
  return normalizzaProfiloAzienda(leggiDatiAzienda());
}

/**
 * Salva profilo (merge con esistente per non perdere pdfSettings/logo se omessi).
 * @param {object} patch
 * @returns {object} profilo salvato
 */
export function salvaProfiloAzienda(patch = {}) {
  const attuale = leggiDatiAzienda() || {};
  const grezzo = {
    ...attuale,
    ...(patch && typeof patch === "object" ? patch : {}),
  };
  if (patch?.logo === undefined && attuale.logo) {
    grezzo.logo = attuale.logo;
  }
  if (patch?.pdfSettings === undefined && attuale.pdfSettings) {
    grezzo.pdfSettings = attuale.pdfSettings;
  }
  const profilo = normalizzaProfiloAzienda(grezzo);
  salvaDatiAzienda(profilo);
  return profilo;
}

/**
 * Aggiornamento parziale (alias di salva con merge).
 * @param {object} patch
 */
export function aggiornaProfiloAzienda(patch = {}) {
  return salvaProfiloAzienda(patch);
}

/**
 * Reset ai default (mantiene pdfSettings se presenti).
 * @param {{ mantieniPdfSettings?: boolean }=} opzioni
 */
export function resetProfiloAzienda(opzioni = {}) {
  const attuale = leggiDatiAzienda() || {};
  const vuoto = profiloAziendaVuoto();
  if (opzioni.mantieniPdfSettings !== false && attuale.pdfSettings) {
    vuoto.pdfSettings = attuale.pdfSettings;
  }
  salvaDatiAzienda(vuoto);
  return normalizzaProfiloAzienda(vuoto);
}
