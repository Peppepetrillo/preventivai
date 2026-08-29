import {
  TIPOLOGIA_IMPIANTO_DEFAULT,
  opzioneTipologiaImpianto,
} from "./tipologiaImpiantoConfig";

const OGGETTO_PDF = Object.freeze({
  elettrico: "Preventivo impianto elettrico",
  allarme: "Preventivo impianto antintrusione",
  videosorveglianza: "Preventivo videosorveglianza",
  "rete-dati": "Preventivo rete dati",
  "tv-sat": "Preventivo impianto TV / SAT",
  domotica: "Preventivo domotica",
  fotovoltaico: "Preventivo fotovoltaico",
  illuminazione: "Preventivo illuminazione",
  altro: "Preventivo lavori",
});

const LEGACY_OGGETTO = "Preventivo lavori elettrici";

/**
 * Risolve tipologia commerciale con fallback legacy (no migration).
 * @param {object=} preventivo
 * @returns {string}
 */
export function risolviTipologiaImpianto(preventivo = {}) {
  const esplicita = String(preventivo.tipologiaImpianto || "").trim();
  if (esplicita) return esplicita;

  const legacy = String(preventivo.tipoLavoro || "").trim();
  if (legacy === "intervento" || legacy === "express") {
    return TIPOLOGIA_IMPIANTO_DEFAULT;
  }

  return TIPOLOGIA_IMPIANTO_DEFAULT;
}

/**
 * @param {object=} preventivo
 * @returns {boolean}
 */
export function haTipologiaImpiantoEsplicita(preventivo = {}) {
  return Boolean(String(preventivo.tipologiaImpianto || "").trim());
}

/**
 * @param {string=} tipologiaId
 * @returns {string}
 */
export function etichettaTipologiaImpianto(tipologiaId) {
  const opzione = opzioneTipologiaImpianto(tipologiaId);
  return opzione?.label || "Elettrico";
}

/**
 * @param {object=} preventivo
 * @returns {string}
 */
export function etichettaTipologiaPreventivo(preventivo = {}) {
  return etichettaTipologiaImpianto(risolviTipologiaImpianto(preventivo));
}

/**
 * Oggetto PDF derivato dalla tipologia; fallback legacy se assente tipologiaImpianto.
 * @param {object=} preventivo
 * @returns {string}
 */
export function oggettoPdfTipologia(preventivo = {}) {
  if (haTipologiaImpiantoEsplicita(preventivo)) {
    const id = risolviTipologiaImpianto(preventivo);
    return OGGETTO_PDF[id] || OGGETTO_PDF.altro;
  }

  if (preventivo?.oggetto) {
    return String(preventivo.oggetto).trim();
  }

  return LEGACY_OGGETTO;
}

/**
 * Inferisce tipologia da flags Preventivo Intelligente.
 * @param {object} form
 * @returns {string}
 */
export function tipologiaImpiantoDaFormIntelligente(form = {}) {
  if (form.allarme) return "allarme";
  if (form.videosorveglianza) return "videosorveglianza";
  if (form.reteDati) return "rete-dati";
  if (form.impiantoTv) return "tv-sat";
  if (form.domotica) return "domotica";
  if (form.predisposizioneFotovoltaico) return "fotovoltaico";
  return TIPOLOGIA_IMPIANTO_DEFAULT;
}
