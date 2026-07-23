/**
 * Sprint 12A — Listino professionale: modello catalogo.
 *
 * Indipendente dai preventivi. Il wizard legge solo voci attive via repository.
 *
 * Slot futuri (NON implementati):
 * serieCompatibili, marca, iva, codiceArticolo, tempoMedioInstallazione
 *
 * Multi-listino (NON implementato): BTicino, Vimar, Gewiss, personale.
 */

import { normalizzaNumero } from "../../utils/preventivi";

/** Catalogo attivo oggi — PreventivAI Base */
export const LISTINO_CATALOGO_ATTIVO_ID = "preventivai-base";

/**
 * Registry estendibile per listini multipli (solo predisposizione).
 */
export const LISTINI_CATALOGHI = Object.freeze({
  preventivaiBase: {
    id: LISTINO_CATALOGO_ATTIVO_ID,
    label: "PreventivAI Base",
    stato: "attivo",
  },
  bticino: {
    id: "bticino",
    label: "BTicino",
    stato: "riservato",
  },
  vimar: {
    id: "vimar",
    label: "Vimar",
    stato: "riservato",
  },
  gewiss: {
    id: "gewiss",
    label: "Gewiss",
    stato: "riservato",
  },
  personale: {
    id: "personale",
    label: "Listino personale",
    stato: "riservato",
  },
});

/** Campi riservati per sprint successivi (non persistiti finché non valorizzati). */
export const VOCE_LISTINO_CAMPI_FUTURI = Object.freeze([
  "serieCompatibili",
  "marca",
  "iva",
  "codiceArticolo",
  "tempoMedioInstallazione",
]);

export const UNITA_COMUNI = Object.freeze(["cad", "m", "h", "mq", "kit"]);

/**
 * @param {object=} voce
 * @param {number=} indice
 * @returns {object}
 */
export function normalizzaVoceCatalogo(voce = {}, indice = 0) {
  const id = String(voce.id || "").trim() || `voce-${Date.now()}-${indice}`;
  const nome = String(voce.nome || "").trim();
  const categoria = String(voce.categoria || "Lavorazioni").trim() || "Lavorazioni";

  return {
    id,
    categoria,
    nome,
    descrizione: String(voce.descrizione || "").trim(),
    unita: String(voce.unita || "cad").trim() || "cad",
    prezzo: Math.max(0, normalizzaNumero(voce.prezzo)),
    attiva: voce.attiva !== false,
    preferita: Boolean(voce.preferita),
    ordinamento: Number.isFinite(Number(voce.ordinamento))
      ? Number(voce.ordinamento)
      : indice,
  };
}

/**
 * @param {object[]} elenco
 * @returns {object[]}
 */
export function normalizzaCatalogo(elenco = []) {
  if (!Array.isArray(elenco)) return [];
  return elenco.map((voce, indice) => normalizzaVoceCatalogo(voce, indice));
}

/**
 * @param {object[]} elenco
 * @returns {boolean}
 */
export function catalogoNecessitaMigrazione(elenco = []) {
  if (!Array.isArray(elenco) || elenco.length === 0) return false;
  return elenco.some(
    (voce) =>
      typeof voce?.attiva === "undefined" ||
      typeof voce?.preferita === "undefined" ||
      typeof voce?.ordinamento === "undefined" ||
      typeof voce?.descrizione === "undefined"
  );
}

/**
 * @param {object} dati
 */
export function creaVoceCatalogo(dati = {}) {
  const nome = String(dati.nome || "").trim();
  if (!nome) {
    throw new Error("Inserisci il nome della lavorazione.");
  }

  return normalizzaVoceCatalogo(
    {
      id: `locale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      categoria: dati.categoria,
      nome,
      descrizione: dati.descrizione,
      unita: dati.unita,
      prezzo: dati.prezzo,
      attiva: dati.attiva !== false,
      preferita: Boolean(dati.preferita),
      ordinamento:
        Number.isFinite(Number(dati.ordinamento))
          ? Number(dati.ordinamento)
          : Date.now(),
    },
    0
  );
}

/**
 * @param {object[]} elenco
 * @param {string} voceId
 * @param {object} patch
 */
export function aggiornaVoceCatalogo(elenco, voceId, patch = {}) {
  return normalizzaCatalogo(elenco).map((voce) =>
    String(voce.id) === String(voceId)
      ? normalizzaVoceCatalogo({ ...voce, ...patch }, voce.ordinamento)
      : voce
  );
}

/**
 * @param {object[]} elenco
 * @param {string} voceId
 */
export function eliminaVoceCatalogo(elenco, voceId) {
  return normalizzaCatalogo(elenco).filter(
    (voce) => String(voce.id) !== String(voceId)
  );
}

/**
 * @param {object[]} elenco
 * @param {string} query
 */
export function filtraCatalogoPerRicerca(elenco = [], query = "") {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  const base = normalizzaCatalogo(elenco);
  if (!q) return base;

  return base.filter((voce) => {
    const blob = [
      voce.nome,
      voce.categoria,
      voce.descrizione,
      voce.unita,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

/**
 * @param {object[]} elenco
 * @returns {string[]}
 */
export function elencaCategorieCatalogo(elenco = []) {
  const set = new Set();
  normalizzaCatalogo(elenco).forEach((voce) => {
    if (voce.categoria) set.add(voce.categoria);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "it"));
}

/**
 * Ordine UX: preferite → ordinamento → nome.
 * @param {object[]} elenco
 */
export function ordinaCatalogo(elenco = []) {
  return [...normalizzaCatalogo(elenco)].sort((a, b) => {
    if (Boolean(a.preferita) !== Boolean(b.preferita)) {
      return a.preferita ? -1 : 1;
    }
    if (a.ordinamento !== b.ordinamento) {
      return a.ordinamento - b.ordinamento;
    }
    return String(a.nome).localeCompare(String(b.nome), "it");
  });
}

/**
 * Voci usabili in composizione preventivo.
 * @param {object[]} elenco
 */
export function selezionaVociAttive(elenco = []) {
  return ordinaCatalogo(elenco).filter((voce) => voce.attiva);
}

/**
 * @param {object[]} elenco
 * @param {string=} categoria
 */
export function raggruppaPerCategoria(elenco = [], categoria) {
  const ordinato = ordinaCatalogo(elenco);
  if (categoria && categoria !== "tutte") {
    return ordinato.filter((voce) => voce.categoria === categoria);
  }
  return ordinato;
}
