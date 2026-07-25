/**
 * Decision Memory Service.
 *
 * Priorità applicazione quantità:
 * 1. MODIFICATA
 * 2. CONFERMATA
 * 3. Knowledge Engine
 * 4. Default
 *
 * Recupero sempre scoped: sessionId e/o preventivoId (mai globale).
 */

import { creaIdBrain } from "../brain/brainTypes";
import { normalizzaScopeMemoria } from "../sopralluogoSession";
import {
  creaRecordMemoria,
  MEMORY_AZIONE_TIPO,
  MEMORY_ORIGINE,
  MEMORY_STATO,
} from "./decisionMemoryTypes";
import * as repo from "./decisionMemoryRepository";

const ORDINE_PRIORITA_STATO = Object.freeze({
  [MEMORY_STATO.MODIFICATA]: 3,
  [MEMORY_STATO.CONFERMATA]: 2,
  [MEMORY_STATO.IGNORATA]: 0,
});

/**
 * @param {object} dati — richiede sessionId
 * @returns {object}
 */
export function salvaDecisioneMemoria(dati = {}) {
  if (!dati.sessionId) {
    throw new Error("Decision Memory: sessionId obbligatorio per salvare.");
  }

  const scope = {
    sessionId: dati.sessionId,
    preventivoId: dati.preventivoId ?? null,
  };

  const esistente = dati.id
    ? repo.trovaMemoriaPerId(dati.id)
    : repo.trovaMemoriaPerCatalogo(dati.catalogoId, scope);

  const now = Date.now();
  const record = creaRecordMemoria({
    ...esistente,
    ...dati,
    sessionId: dati.sessionId,
    id: dati.id || esistente?.id || creaIdBrain("mem"),
    createdAt: esistente?.createdAt || now,
    updatedAt: now,
    origine: MEMORY_ORIGINE.ASSISTENTE_SOPRALLUOGO,
  });

  return repo.upsertMemoria(record);
}

/**
 * Registra esito Assistente → memoria persistente (scoped).
 *
 * @param {{
 *   sessionId: string,
 *   domandaId: string,
 *   catalogoId: string,
 *   valoreScelto: number|string|null,
 *   valorePrecedente?: number|null,
 *   tipoAzione?: string,
 *   stato: "CONFERMATA"|"MODIFICATA"|"IGNORATA",
 *   preventivoId?: string|null,
 * }} payload
 */
export function registraSceltaAssistente(payload = {}) {
  if (!payload.sessionId) {
    throw new Error("registraSceltaAssistente: sessionId obbligatorio.");
  }

  return salvaDecisioneMemoria({
    sessionId: payload.sessionId,
    domandaId: payload.domandaId,
    catalogoId: payload.catalogoId,
    valorePrecedente:
      payload.valorePrecedente === undefined
        ? null
        : payload.valorePrecedente,
    valoreScelto: payload.valoreScelto,
    tipoAzione: payload.tipoAzione || MEMORY_AZIONE_TIPO.AGGIORNA_QUANTITA,
    stato: payload.stato,
    preventivoId: payload.preventivoId ?? null,
  });
}

/**
 * @param {number|string|null} valoreScelto
 * @param {number|null} valorePrecedente
 * @returns {"CONFERMATA"|"MODIFICATA"}
 */
export function inferisciStatoMemoria(valoreScelto, valorePrecedente) {
  const scelto = Number(valoreScelto);
  const prec =
    valorePrecedente === null || valorePrecedente === undefined
      ? null
      : Number(valorePrecedente);
  if (prec !== null && Number.isFinite(scelto) && scelto !== prec) {
    return MEMORY_STATO.MODIFICATA;
  }
  return MEMORY_STATO.CONFERMATA;
}

/**
 * Decisioni applicabili scoped.
 * @param {{ sessionId?: string|null, preventivoId?: string|null }} scope
 * @returns {object[]}
 */
export function leggiDecisioniAttive(scope = {}) {
  const normalizzato = normalizzaScopeMemoria(scope);

  return repo
    .filtraMemoriaPerScope(normalizzato)
    .filter(
      (r) =>
        r.stato === MEMORY_STATO.MODIFICATA ||
        r.stato === MEMORY_STATO.CONFERMATA
    )
    .sort((a, b) => {
      const pa = ORDINE_PRIORITA_STATO[a.stato] || 0;
      const pb = ORDINE_PRIORITA_STATO[b.stato] || 0;
      if (pb !== pa) return pb - pa;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
}

/**
 * @param {{ sessionId?: string|null, preventivoId?: string|null }} scope
 * @returns {Map<string, { valore: number, record: object }>}
 */
export function mappaOverrideQuantita(scope = {}) {
  const mappa = new Map();
  for (const record of leggiDecisioniAttive(scope)) {
    if (mappa.has(record.catalogoId)) continue;
    const valore = Number(record.valoreScelto);
    if (!Number.isFinite(valore) || valore < 0) continue;
    mappa.set(record.catalogoId, { valore, record });
  }
  return mappa;
}

/**
 * Merge Decision Memory su proposta Knowledge (prima del Proposal Service).
 *
 * @param {object} conoscenzaProposta
 * @param {{
 *   sessionId?: string|null,
 *   preventivoId?: string|null,
 *   decisioni?: object[],
 * }=} opzioni
 * @returns {object}
 */
export function applicaDecisionMemoryAConoscenza(
  conoscenzaProposta = {},
  opzioni = {}
) {
  if (!conoscenzaProposta || typeof conoscenzaProposta !== "object") {
    return conoscenzaProposta;
  }

  let overrides;
  if (opzioni.decisioni != null) {
    overrides = new Map();
    const ordinate = [...opzioni.decisioni].sort((a, b) => {
      const pa = ORDINE_PRIORITA_STATO[a.stato] || 0;
      const pb = ORDINE_PRIORITA_STATO[b.stato] || 0;
      if (pb !== pa) return pb - pa;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    for (const r of ordinate) {
      if (
        r.stato !== MEMORY_STATO.MODIFICATA &&
        r.stato !== MEMORY_STATO.CONFERMATA
      ) {
        continue;
      }
      if (overrides.has(r.catalogoId)) continue;
      const valore = Number(r.valoreScelto);
      if (!Number.isFinite(valore) || valore < 0) continue;
      overrides.set(r.catalogoId, { valore, record: r });
    }
  } else if (opzioni.sessionId || opzioni.preventivoId) {
    overrides = mappaOverrideQuantita({
      sessionId: opzioni.sessionId,
      preventivoId: opzioni.preventivoId,
    });
  } else {
    // Nessuno scope → nessuna memoria (no crosstalk globale)
    return { ...conoscenzaProposta };
  }

  if (overrides.size === 0) {
    return { ...conoscenzaProposta };
  }

  const suggerimenti = (conoscenzaProposta.suggerimenti || []).map((voce) => {
    const id =
      typeof voce === "string"
        ? voce
        : voce?.id || voce?.catalogoId || null;
    if (!id || !overrides.has(id)) return voce;
    const { valore, record } = overrides.get(id);
    if (typeof voce === "string") {
      return {
        id: voce,
        quantita: valore,
        meta: { decisionMemory: record.stato },
      };
    }
    return {
      ...voce,
      quantita: valore,
      meta: {
        ...(voce.meta || {}),
        decisionMemory: record.stato,
        decisionMemoryId: record.id,
      },
    };
  });

  return {
    ...conoscenzaProposta,
    suggerimenti,
    decisionMemoryApplicata: [...overrides.entries()].map(
      ([catalogoId, { valore, record }]) => ({
        catalogoId,
        quantita: valore,
        stato: record.stato,
        id: record.id,
        sessionId: record.sessionId,
      })
    ),
  };
}

export function ottieniMemoria(id) {
  return repo.trovaMemoriaPerId(id);
}

export function ottieniMemoriaPerDomanda(domandaId, scope = {}) {
  return repo.trovaMemoriaPerDomanda(domandaId, scope);
}

export function ottieniMemoriaPerCatalogo(catalogoId, scope = {}) {
  return repo.trovaMemoriaPerCatalogo(catalogoId, scope);
}

export function elencaMemoriaPerScope(scope = {}) {
  return repo.filtraMemoriaPerScope(normalizzaScopeMemoria(scope));
}

/** @deprecated Preferire elencaMemoriaPerScope — non usare in produzione. */
export function elencaMemoria() {
  return repo.leggiMemoria();
}

export function resetMemoriaDecisioni() {
  return repo.cancellaMemoria();
}
