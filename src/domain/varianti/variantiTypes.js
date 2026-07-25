/**
 * Varianti di cantiere — tipi, stati e factory.
 * Il preventivo originale resta immutabile.
 */

export const TIPI_VARIANTE = Object.freeze({
  AGGIUNTA: "aggiunta",
  MODIFICA: "modifica",
  RIMOZIONE: "rimozione",
});

export const STATI_VARIANTE = Object.freeze({
  PROPOSTA: "proposta",
  APPROVATA: "approvata",
  ESEGUITA: "eseguita",
  ANNULLATA: "annullata",
});

export const TIPI_VARIANTE_LABEL = Object.freeze({
  [TIPI_VARIANTE.AGGIUNTA]: "Aggiunta",
  [TIPI_VARIANTE.MODIFICA]: "Modifica",
  [TIPI_VARIANTE.RIMOZIONE]: "Rimozione",
});

export const STATI_VARIANTE_LABEL = Object.freeze({
  [STATI_VARIANTE.PROPOSTA]: "Proposta",
  [STATI_VARIANTE.APPROVATA]: "Approvata",
  [STATI_VARIANTE.ESEGUITA]: "Eseguita",
  [STATI_VARIANTE.ANNULLATA]: "Annullata",
});

/** Stati che incidono sul totale cantiere. */
export const STATI_VARIANTE_ECONOMICI = Object.freeze([
  STATI_VARIANTE.APPROVATA,
  STATI_VARIANTE.ESEGUITA,
]);

export const EVENTI_VARIANTE = Object.freeze({
  CREATA: "variante_creata",
  APPROVATA: "variante_approvata",
  ESEGUITA: "variante_eseguita",
  ANNULLATA: "variante_annullata",
});

export const EVENTI_VARIANTE_LABEL = Object.freeze({
  [EVENTI_VARIANTE.CREATA]: "Variante creata",
  [EVENTI_VARIANTE.APPROVATA]: "Variante approvata",
  [EVENTI_VARIANTE.ESEGUITA]: "Variante eseguita",
  [EVENTI_VARIANTE.ANNULLATA]: "Variante annullata",
});

/**
 * @param {string=} tipo
 * @returns {string}
 */
export function normalizzaTipoVariante(tipo) {
  const grezzo = String(tipo || "").trim().toLowerCase();
  if (grezzo === TIPI_VARIANTE.RIMOZIONE || grezzo === "rimozione") {
    return TIPI_VARIANTE.RIMOZIONE;
  }
  if (grezzo === TIPI_VARIANTE.MODIFICA || grezzo === "modifica") {
    return TIPI_VARIANTE.MODIFICA;
  }
  return TIPI_VARIANTE.AGGIUNTA;
}

/**
 * @param {string=} stato
 * @returns {string}
 */
export function normalizzaStatoVariante(stato) {
  const grezzo = String(stato || "").trim().toLowerCase();
  const valori = Object.values(STATI_VARIANTE);
  if (valori.includes(grezzo)) return grezzo;
  return STATI_VARIANTE.PROPOSTA;
}

/**
 * @returns {string}
 */
export function creaIdVariante() {
  return `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Importo con segno economico (+ aggiunta/modifica, − rimozione).
 * @param {object} variante
 * @returns {number}
 */
export function importoSegnatoVariante(variante) {
  if (!variante || typeof variante !== "object") return 0;
  const base = Math.abs(Number(variante.importo) || 0);
  if (normalizzaTipoVariante(variante.tipo) === TIPI_VARIANTE.RIMOZIONE) {
    return -base;
  }
  return base;
}

/**
 * True se la variante entra nel totale cantiere.
 * @param {object} variante
 */
export function varianteIncideSulTotale(variante) {
  const stato = normalizzaStatoVariante(variante?.stato);
  return STATI_VARIANTE_ECONOMICI.includes(stato);
}

/**
 * @param {Partial<object>} dati
 * @returns {object}
 */
export function creaVarianteModel(dati = {}) {
  const quantita = Math.max(Number(dati.quantita) || 1, 0);
  const importoGrezzo =
    dati.importo !== undefined && dati.importo !== null && dati.importo !== ""
      ? Number(dati.importo)
      : (Number(dati.prezzoUnitario) || 0) * quantita;
  const importo = Math.abs(Number.isFinite(importoGrezzo) ? importoGrezzo : 0);
  const titolo = String(dati.titolo || dati.descrizione || "").trim();
  const descrizione = String(dati.descrizione || dati.titolo || "").trim();

  return {
    id: dati.id || creaIdVariante(),
    cantiereId: dati.cantiereId ?? null,
    tipo: normalizzaTipoVariante(dati.tipo),
    stato: normalizzaStatoVariante(dati.stato || STATI_VARIANTE.PROPOSTA),
    titolo: titolo || descrizione || "Variante",
    descrizione,
    importo,
    quantita,
    unita: String(dati.unita || "cad").trim() || "cad",
    dataCreazione: dati.dataCreazione || new Date().toLocaleDateString("it-IT"),
    creatoAt: dati.creatoAt || Date.now(),
    autore: dati.autore ? String(dati.autore) : null,
    note: String(dati.note || "").trim(),
    // compat legacy UI
    prezzoUnitario:
      dati.prezzoUnitario !== undefined
        ? Math.max(Number(dati.prezzoUnitario) || 0, 0)
        : quantita > 0
          ? importo / quantita
          : importo,
    categoria: String(dati.categoria || "").trim(),
  };
}

/**
 * Converte una variante legacy (embedded in cantiere.varianti).
 * @param {object} legacy
 * @param {string|number} cantiereId
 */
export function daVarianteLegacy(legacy = {}, cantiereId) {
  return creaVarianteModel({
    id: legacy.id,
    cantiereId,
    tipo: legacy.tipo,
    stato: STATI_VARIANTE.ESEGUITA,
    titolo: legacy.descrizione || legacy.titolo,
    descrizione: legacy.descrizione || legacy.titolo,
    importo: legacy.totale ?? legacy.importo,
    quantita: legacy.quantita,
    unita: legacy.unita || "cad",
    dataCreazione: legacy.data || legacy.dataCreazione,
    note: legacy.note,
    prezzoUnitario: legacy.prezzoUnitario,
    categoria: legacy.categoria,
    autore: legacy.autore || null,
  });
}

/**
 * @param {string} tipo
 * @param {object} payload
 */
export function creaEventoVariante(tipo, payload = {}) {
  return {
    id: `vev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tipo,
    label: EVENTI_VARIANTE_LABEL[tipo] || String(tipo),
    at: payload.at || Date.now(),
    by: payload.by || null,
    cantiereId: payload.cantiereId ?? null,
    varianteId: payload.varianteId ?? null,
    meta: payload.meta && typeof payload.meta === "object" ? payload.meta : {},
  };
}
