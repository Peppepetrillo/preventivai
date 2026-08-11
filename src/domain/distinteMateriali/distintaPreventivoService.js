/**
 * Soft-link Distinta ↔ Preventivo + helper conversione (Sprint 13 Step 7).
 *
 * NON tocca lavorazioni, prezzi, IVA, totali, PDF o workflow stati.
 */

import { collegaESincronizzaDistintaACantiere } from "./distintaCantiereService";
import {
  caricaDistinteMateriali,
  cercaDistinteMateriali,
  collegaDistintaAPreventivo,
  scollegaDistintaDaPreventivo,
  trovaDistintaPerId,
} from "./distintaMaterialiService";

/**
 * @param {string|number} preventivoId
 * @returns {import("./distintaMaterialiTypes").DistintaMateriali|null}
 */
export function trovaDistintaCollegataAlPreventivo(preventivoId) {
  const id = String(preventivoId || "").trim();
  if (!id) return null;
  const elenco = cercaDistinteMateriali("", { preventivoId: id });
  return elenco[0] || null;
}

/**
 * Elenco distinte per il picker (con flag se già collegate altrove).
 * @param {string=} query
 * @param {{ preventivoId?: string|number }=} opzioni
 */
export function elencaDistintePerCollegamentoPreventivo(
  query = "",
  { preventivoId } = {}
) {
  const target = preventivoId != null ? String(preventivoId) : "";
  return cercaDistinteMateriali(query).map((d) => {
    const linked = d.collegamenti?.preventivoId
      ? String(d.collegamenti.preventivoId)
      : "";
    return {
      id: d.id,
      titolo: d.titolo || "",
      clienteNome: d.clienteNome || "",
      nVoci: Array.isArray(d.voci) ? d.voci.length : 0,
      updatedAt: d.updatedAt || d.createdAt || "",
      preventivoId: linked || undefined,
      collegataQui: Boolean(target && linked === target),
      collegataAltrove: Boolean(linked && target && linked !== target),
    };
  });
}

/**
 * Collega una distinta a un preventivo senza duplicare l'entità.
 * - Se un'altra distinta era già collegata a questo preventivo → la scollega.
 * - Se la distinta era collegata a un altro preventivo → riassegna (no clone).
 *
 * @param {string} distintaId
 * @param {string|number} preventivoId
 */
export function collegaDistintaAPreventivoSenzaDuplicati(
  distintaId,
  preventivoId
) {
  const pid = String(preventivoId || "").trim();
  const did = String(distintaId || "").trim();
  if (!pid || !did) {
    return { ok: false, errore: "parametri_mancanti" };
  }

  const distinta = trovaDistintaPerId(did);
  if (!distinta) {
    return { ok: false, errore: "distinta_non_trovata" };
  }

  // Una sola distinta per preventivo: scollega eventuali altre.
  for (const altra of caricaDistinteMateriali()) {
    if (
      altra.id !== did &&
      altra.collegamenti?.preventivoId &&
      String(altra.collegamenti.preventivoId) === pid
    ) {
      scollegaDistintaDaPreventivo(altra.id);
    }
  }

  const collegata = collegaDistintaAPreventivo(did, pid);
  if (!collegata) {
    return { ok: false, errore: "collegamento_fallito" };
  }

  return { ok: true, distinta: collegata };
}

/**
 * @param {string} distintaId
 */
export function scollegaDistintaDalPreventivo(distintaId) {
  const d = scollegaDistintaDaPreventivo(distintaId);
  if (!d) return { ok: false, errore: "scollegamento_fallito" };
  return { ok: true, distinta: d };
}

/**
 * Dopo `convertiInCantiere`, se l'utente sceglie "Usa distinta":
 * proietta materiali su cantiere + lista spesa (Step 6).
 *
 * @param {string|number} preventivoId
 * @param {string|number} cantiereId
 */
export function usaDistintaDopoConversioneCantiere(preventivoId, cantiereId) {
  const distinta = trovaDistintaCollegataAlPreventivo(preventivoId);
  if (!distinta) {
    return { ok: false, errore: "nessuna_distinta", applicata: false };
  }

  const sync = collegaESincronizzaDistintaACantiere(distinta.id, cantiereId);
  if (!sync.ok) {
    return { ...sync, applicata: false };
  }

  return {
    ok: true,
    applicata: true,
    distinta: sync.distinta,
    cantiere: sync.cantiere,
  };
}

/**
 * True se il preventivo ha almeno una distinta collegata
 * (per mostrare il consenso in conversione).
 *
 * @param {string|number} preventivoId
 */
export function preventivoHaDistintaCollegata(preventivoId) {
  return Boolean(trovaDistintaCollegataAlPreventivo(preventivoId));
}
