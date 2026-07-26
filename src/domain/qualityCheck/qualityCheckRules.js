/**
 * Quality Check — regole professionali (solo lettura).
 * Non modificano il preventivo. autoFix sempre false.
 */

import {
  creaQualityCheckItem,
  QC_SEVERITY,
  QC_TYPE,
} from "./qualityCheckTypes";

/** Soglia punti/circuiti oltre cui suggerire quadro più grande. */
export const QC_SOGLIA_CIRCUITI_ELEVATI = 40;

/**
 * Estrae catalogoId da una lavorazione (con fallback su id/nome).
 * @param {object} lav
 * @returns {string}
 */
export function catalogoIdLavorazione(lav = {}) {
  return String(lav.catalogoId || lav.idCatalogo || "")
    .trim()
    .toUpperCase();
}

/**
 * @param {object} preventivo
 * @returns {object[]}
 */
export function elencoLavorazioni(preventivo = {}) {
  return Array.isArray(preventivo.lavorazioni) ? preventivo.lavorazioni : [];
}

/**
 * @param {object} preventivo
 * @param {string|string[]} catalogoIds
 * @returns {boolean}
 */
export function haCatalogoId(preventivo, catalogoIds) {
  const target = new Set(
    (Array.isArray(catalogoIds) ? catalogoIds : [catalogoIds]).map((id) =>
      String(id).toUpperCase()
    )
  );
  return elencoLavorazioni(preventivo).some((lav) => {
    const id = catalogoIdLavorazione(lav);
    if (target.has(id)) return true;
    const nome = String(lav.nome || lav.descrizione || "").toLowerCase();
    // fallback soft solo per id noti usati nei test / legacy
    for (const t of target) {
      if (t === "CLIMA" && /clima|climatizz/.test(nome)) return true;
      if (t === "FOTOVOLTAICO" && /fotovolta|pv\b|pannell/.test(nome))
        return true;
      if (t === "VIDEOCITOFONO" && /videocitofon/.test(nome)) return true;
      if (t === "LINEA_INDUZIONE" && /induzion/.test(nome)) return true;
      if (t === "CANCELLO" && /cancello/.test(nome)) return true;
    }
    return false;
  });
}

/**
 * Stima circuiti/punti (PUNTO_IMPIANTO + carichi tipici).
 * @param {object} preventivo
 * @returns {number}
 */
export function stimaCircuiti(preventivo = {}) {
  return elencoLavorazioni(preventivo).reduce((acc, lav) => {
    const id = catalogoIdLavorazione(lav);
    const q = Math.max(Number(lav.quantita) || 0, 0);
    if (
      id === "PUNTO_IMPIANTO" ||
      id === "PUNTO_LUCE" ||
      id === "PUNTO_PRESA" ||
      id.startsWith("PUNTO_")
    ) {
      return acc + q;
    }
    return acc;
  }, 0);
}

/**
 * Cliente assente / placeholder.
 * @param {object} preventivo
 * @returns {boolean}
 */
export function clienteMancante(preventivo = {}) {
  const cliente = String(preventivo.cliente ?? "").trim();
  if (!cliente) return true;
  const lower = cliente.toLowerCase();
  return (
    lower === "da completare" ||
    lower === "n/d" ||
    lower === "nd" ||
    lower === "-"
  );
}

/**
 * @typedef {Object} QualityCheckRule
 * @property {string} id
 * @property {boolean} enabled
 * @property {(preventivo: object) => object|null} execute
 */

/** @type {ReadonlyArray<QualityCheckRule>} */
export const QUALITY_CHECK_RULES = Object.freeze([
  Object.freeze({
    id: "CHECK_EMPTY_001",
    enabled: true,
    execute(preventivo = {}) {
      const lav = elencoLavorazioni(preventivo);
      if (lav.length > 0) return null;
      return creaQualityCheckItem({
        id: "CHECK_EMPTY_001",
        type: QC_TYPE.ERROR,
        severity: QC_SEVERITY.HIGH,
        title: "Preventivo vuoto",
        message:
          "Il preventivo non contiene lavorazioni. Aggiungi almeno una voce prima di generare il PDF.",
        relatedItem: null,
        source: "Quality Check",
        autoFix: false,
      });
    },
  }),

  Object.freeze({
    id: "CHECK_CLIENTE_001",
    enabled: true,
    execute(preventivo = {}) {
      if (!clienteMancante(preventivo)) return null;
      return creaQualityCheckItem({
        id: "CHECK_CLIENTE_001",
        type: QC_TYPE.ERROR,
        severity: QC_SEVERITY.HIGH,
        title: "Cliente non selezionato",
        message:
          "Manca il cliente sul preventivo. Seleziona o inserisci un cliente prima della consegna.",
        relatedItem: "CLIENTE",
        source: "Quality Check",
        autoFix: false,
      });
    },
  }),

  Object.freeze({
    id: "CHECK_CLIMA_001",
    enabled: true,
    execute(preventivo = {}) {
      if (!haCatalogoId(preventivo, "CLIMA")) return null;
      return creaQualityCheckItem({
        id: "CHECK_CLIMA_001",
        type: QC_TYPE.WARNING,
        severity: QC_SEVERITY.MEDIUM,
        title: "Verifica predisposizioni",
        message:
          "Hai inserito climatizzatori. Controlla che il numero delle predisposizioni sia corretto.",
        relatedItem: "CLIMA",
        source: "Base Tecnica",
        autoFix: false,
      });
    },
  }),

  Object.freeze({
    id: "CHECK_FV_001",
    enabled: true,
    execute(preventivo = {}) {
      if (!haCatalogoId(preventivo, "FOTOVOLTAICO")) return null;
      return creaQualityCheckItem({
        id: "CHECK_FV_001",
        type: QC_TYPE.WARNING,
        severity: QC_SEVERITY.MEDIUM,
        title: "Verifica accumulo",
        message:
          "Hai previsto fotovoltaico. Verifica se è previsto anche l'accumulo.",
        relatedItem: "FOTOVOLTAICO",
        source: "Base Tecnica",
        autoFix: false,
      });
    },
  }),

  Object.freeze({
    id: "CHECK_VIDEOCITOFONO_001",
    enabled: true,
    execute(preventivo = {}) {
      if (!haCatalogoId(preventivo, "VIDEOCITOFONO")) return null;
      return creaQualityCheckItem({
        id: "CHECK_VIDEOCITOFONO_001",
        type: QC_TYPE.WARNING,
        severity: QC_SEVERITY.MEDIUM,
        title: "Verifica cancello automatico",
        message:
          "Hai inserito un videocitofono. Verifica la presenza del cancello automatico.",
        relatedItem: "VIDEOCITOFONO",
        source: "Base Tecnica",
        autoFix: false,
      });
    },
  }),

  Object.freeze({
    id: "CHECK_INDUZIONE_001",
    enabled: true,
    execute(preventivo = {}) {
      if (!haCatalogoId(preventivo, "LINEA_INDUZIONE")) return null;
      return creaQualityCheckItem({
        id: "CHECK_INDUZIONE_001",
        type: QC_TYPE.WARNING,
        severity: QC_SEVERITY.MEDIUM,
        title: "Verifica linea dedicata",
        message:
          "Hai previsto cucina a induzione. Verifica che sia prevista una linea dedicata.",
        relatedItem: "LINEA_INDUZIONE",
        source: "Base Tecnica",
        autoFix: false,
      });
    },
  }),

  Object.freeze({
    id: "CHECK_QUADRO_001",
    enabled: true,
    execute(preventivo = {}) {
      const circuiti = stimaCircuiti(preventivo);
      if (circuiti < QC_SOGLIA_CIRCUITI_ELEVATI) return null;
      return creaQualityCheckItem({
        id: "CHECK_QUADRO_001",
        type: QC_TYPE.INFO,
        severity: QC_SEVERITY.LOW,
        title: "Valuta il quadro elettrico",
        message:
          "Il numero di circuiti/punti risulta elevato. Valuta un quadro di dimensioni superiori.",
        relatedItem: "QUADRO_ELETTRICO",
        source: "Quality Check",
        autoFix: false,
      });
    },
  }),
]);
