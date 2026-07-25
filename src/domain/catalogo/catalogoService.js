/**
 * Catalogo Service — risoluzione ID ↔ Listino.
 * I prezzi si ottengono SOLO tramite chiaveListino (id voce listino).
 * Nessun confronto di descrizioni per il prezzo.
 *
 * `risolviIdDaLegacy` esiste solo per retrocompatibilità di dati storici
 * (testi KE/Brain/preventivi vecchi) e non è usato nel percorso caldo nuovo.
 */

import { selezionaVociAttive } from "../../features/listino/listinoCatalogDomain";
import { normalizzaNumero } from "../../utils/preventivi";
import {
  CATALOGO_BY_ID,
  CATALOGO_LAVORAZIONI,
} from "./catalogoLavorazioni";
import {
  creaSuggerimentoCatalogo,
  elencaSenzaListino,
  isCatalogoId,
  nomeDaCatalogo,
} from "./catalogoTypes";
import * as repo from "./catalogoRepository";

function normalizzaAlias(testo) {
  return String(testo || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Mappa alias legacy → catalogoId (costruita una volta). */
const LEGACY_ALIAS_TO_ID = (() => {
  const mappa = Object.create(null);
  for (const voce of CATALOGO_LAVORAZIONI) {
    mappa[normalizzaAlias(voce.id)] = voce.id;
    mappa[normalizzaAlias(voce.nome)] = voce.id;
    for (const alias of voce.aliasLegacy || []) {
      mappa[normalizzaAlias(alias)] = voce.id;
    }
  }
  // Varianti Brain composite → non mappabili 1:1 (report)
  return Object.freeze(mappa);
})();

/**
 * @param {string} catalogoId
 * @returns {object|null}
 */
export function ottieniLavorazione(catalogoId) {
  return repo.trovaPerId(catalogoId);
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function elencaLavorazioni() {
  return repo.leggiCatalogo();
}

/**
 * Solo migrazione / apertura vecchi dati. Non usare per pricing nuovo.
 * @param {string} testo
 * @returns {string|null} catalogoId
 */
export function risolviIdDaLegacy(testo) {
  if (!testo) return null;
  const grezzo = String(testo).trim();
  if (isCatalogoId(grezzo)) return grezzo;
  return LEGACY_ALIAS_TO_ID[normalizzaAlias(grezzo)] || null;
}

/**
 * Risolve un suggerimento grezzo (nuovo ID o legacy string/object) → SuggerimentoCatalogo.
 * @param {string|object} voce
 * @returns {{ id: string, quantita: number, meta: object }|null}
 */
export function normalizzaRiferimentoCatalogo(voce) {
  if (voce == null) return null;

  if (typeof voce === "string") {
    const diretto = creaSuggerimentoCatalogo(voce);
    if (diretto) return diretto;
    const legacyId = risolviIdDaLegacy(voce);
    return legacyId ? creaSuggerimentoCatalogo({ id: legacyId, quantita: 1 }) : null;
  }

  if (typeof voce !== "object") return null;

  // Percorso nuovo: id catalogo esplicito
  const daId = creaSuggerimentoCatalogo(voce);
  if (daId) {
    return daId;
  }

  // Retrocompat oggetti KE/Brain con solo titolo/testo
  const titolo = voce.titolo || voce.testo || voce.nome || "";
  const legacyId = risolviIdDaLegacy(titolo);
  if (!legacyId) return null;

  const quantita = Number(voce.quantita);
  return creaSuggerimentoCatalogo({
    id: legacyId,
    quantita: Number.isFinite(quantita) && quantita > 0 ? quantita : 1,
    meta: voce.meta,
  });
}

/**
 * Prezzo dal Listino tramite chiaveListino del Catalogo. Mai per nome.
 * @param {string} catalogoId
 * @param {object[]} listino
 * @returns {{
 *   catalogo: object|null,
 *   voceListino: object|null,
 *   prezzoUnitario: number|null,
 *   prezzoConfigurato: boolean,
 *   unita: string,
 * }}
 */
export function risolviPrezzoDaCatalogo(catalogoId, listino = []) {
  const catalogo = repo.trovaPerId(catalogoId);
  if (!catalogo) {
    return {
      catalogo: null,
      voceListino: null,
      prezzoUnitario: null,
      prezzoConfigurato: false,
      unita: "cad",
    };
  }

  const chiave = catalogo.chiaveListino;
  if (!chiave) {
    return {
      catalogo,
      voceListino: null,
      prezzoUnitario: null,
      prezzoConfigurato: false,
      unita: catalogo.unita || "cad",
    };
  }

  const attive = selezionaVociAttive(listino);
  const voceListino =
    attive.find((v) => String(v.id) === String(chiave)) || null;

  if (!voceListino) {
    return {
      catalogo,
      voceListino: null,
      prezzoUnitario: null,
      prezzoConfigurato: false,
      unita: catalogo.unita || "cad",
    };
  }

  return {
    catalogo,
    voceListino,
    prezzoUnitario: normalizzaNumero(voceListino.prezzo),
    prezzoConfigurato: true,
    unita: voceListino.unita || catalogo.unita || "cad",
  };
}

/**
 * Arricchisce una lavorazione preventivo legacy con catalogoId se possibile.
 * Non modifica il preventivo in storage: restituisce una copia arricchita.
 * @param {object} lavorazione
 * @returns {object}
 */
export function arricchisciLavorazioneLegacy(lavorazione = {}) {
  if (lavorazione.catalogoId && isCatalogoId(lavorazione.catalogoId)) {
    return {
      ...lavorazione,
      nome: lavorazione.nome || nomeDaCatalogo(lavorazione.catalogoId),
    };
  }

  // Preferisci listinoId → catalogo
  if (lavorazione.listinoId) {
    const daListino = repo.trovaPerChiaveListino(lavorazione.listinoId);
    if (daListino) {
      return {
        ...lavorazione,
        catalogoId: daListino.id,
        nome: lavorazione.nome || daListino.nome,
        categoria: lavorazione.categoria || daListino.categoria,
      };
    }
  }

  // id lavorazione tipo "punto-luce-1710…"
  const idGrezzo = String(lavorazione.id || "");
  const slugMatch = idGrezzo.match(/^([a-z0-9-]+?)(?:-\d{10,}.*)?$/i);
  if (slugMatch) {
    const daSlug = repo.trovaPerChiaveListino(slugMatch[1]);
    if (daSlug) {
      return {
        ...lavorazione,
        catalogoId: daSlug.id,
        listinoId: lavorazione.listinoId || slugMatch[1],
      };
    }
  }

  // Ultimo resort: nome legacy → catalogoId (solo apertura vecchi preventivi)
  const daNome = risolviIdDaLegacy(lavorazione.nome);
  if (daNome) {
    return {
      ...lavorazione,
      catalogoId: daNome,
      nome: lavorazione.nome || nomeDaCatalogo(daNome),
    };
  }

  return { ...lavorazione };
}

/** Dove le voci senza listino sono referenziate nel prodotto. */
const USI_SENZA_LISTINO = Object.freeze({
  BUS: [
    "knowledgeRules (RULE_003 domotica)",
    "brainPatternTypes (domotica)",
  ],
  ALIMENTATORE: [
    "knowledgeRules (RULE_003 domotica)",
    "brainPatternTypes (domotica)",
  ],
  ILLUMINAZIONE_ESTERNA: ["knowledgeRules (RULE_005 villa)"],
  CANCELLO: [
    "knowledgeRules (RULE_005 villa)",
    "brainPatternTypes (cancello)",
  ],
  VIDEOSORVEGLIANZA: ["brainPatternTypes (videosorveglianza)"],
  FOTOVOLTAICO: ["brainPatternTypes (fotovoltaico)"],
  RICARICA_AUTO: ["brainPatternTypes (ricarica auto)"],
  DISTRIBUZIONE_LINEE_PIANO: ["knowledgeRules (RULE_004 piani)"],
  IRRIGAZIONE: [
    "knowledgeMergeService (conoscenze personali / Brain)",
    "test / regole personali",
  ],
});

/**
 * Report catalogo ↔ listino senza prezzo configurato.
 * @returns {Array<{ lavorazione: string, catalogoId: string, dove: string[], motivo: string }>}
 */
export function reportSenzaCorrispondenzaListino() {
  return elencaSenzaListino().map((voce) => ({
    lavorazione: voce.nome,
    catalogoId: voce.id,
    dove: USI_SENZA_LISTINO[voce.id] || ["Catalogo Lavorazioni (suggeribile)"],
    motivo: voce.motivo,
  }));
}

/**
 * Arricchisce tutte le lavorazioni di un preventivo (apertura legacy).
 * Non muta lo storage: il chiamante decide se persistere.
 * @param {object} preventivo
 * @returns {object}
 */
export function arricchisciPreventivoLegacy(preventivo = {}) {
  if (!preventivo || typeof preventivo !== "object") return preventivo;
  const lavorazioni = Array.isArray(preventivo.lavorazioni)
    ? preventivo.lavorazioni.map(arricchisciLavorazioneLegacy)
    : [];
  return { ...preventivo, lavorazioni };
}

export {
  isCatalogoId,
  creaSuggerimentoCatalogo,
  nomeDaCatalogo,
  CATALOGO_BY_ID,
};
