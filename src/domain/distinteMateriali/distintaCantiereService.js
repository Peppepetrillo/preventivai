/**
 * Orchestrazione Distinta ↔ Cantiere ↔ Lista spesa (Sprint 13 Step 6).
 */

import {
  leggiCantieri,
  leggiCantieriTutti,
  salvaCantieri,
} from "../../repositories/cantieriRepository";
import { sincronizzaListaSpesaDaCantiere } from "../listaSpesa";
import {
  aggiornaDistintaMateriali,
  collegaDistintaACantiere,
  scollegaDistintaDaCantiere,
  trovaDistintaPerId,
} from "./distintaMaterialiService";
import { proiettaVociDistintaSuMaterialiCantiere } from "./distintaProiezione";
import { isRecordCestinato } from "../cestino";

function trovaCantiere(cantiereId) {
  const id = String(cantiereId || "").trim();
  if (!id) return null;
  const cantiere =
    leggiCantieriTutti().find((c) => String(c.id) === id) || null;
  if (!cantiere || isRecordCestinato(cantiere)) return null;
  return cantiere;
}

function persistiCantiere(cantiereAggiornato) {
  const elenco = leggiCantieriTutti();
  const prossimo = elenco.map((c) =>
    String(c.id) === String(cantiereAggiornato.id) ? cantiereAggiornato : c
  );
  salvaCantieri(prossimo);
  return cantiereAggiornato;
}

/**
 * Proietta le voci della distinta sui materiali del cantiere e sincronizza
 * la lista spesa. Idempotente.
 *
 * @param {string} distintaId
 * @param {string|number} cantiereId
 */
export function sincronizzaDistintaSuCantiere(distintaId, cantiereId) {
  const distinta = trovaDistintaPerId(distintaId);
  if (!distinta) {
    return { ok: false, errore: "distinta_non_trovata" };
  }

  const cantiere = trovaCantiere(cantiereId);
  if (!cantiere) {
    return { ok: false, errore: "cantiere_non_trovato" };
  }

  const materiali = proiettaVociDistintaSuMaterialiCantiere(
    cantiere.materiali,
    distinta
  );
  const cantiereAggiornato = persistiCantiere({
    ...cantiere,
    materiali,
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
  });

  sincronizzaListaSpesaDaCantiere(cantiereAggiornato);

  const distintaAggiornata = aggiornaDistintaMateriali(distinta.id, {
    collegamenti: {
      ...(distinta.collegamenti || {}),
      cantiereId: String(cantiere.id),
      listaSpesaSyncAt: new Date().toISOString(),
    },
  });

  return {
    ok: true,
    distinta: distintaAggiornata || distinta,
    cantiere: cantiereAggiornato,
  };
}

/**
 * Collega la distinta al cantiere e proietta le voci (snapshot soft).
 * @param {string} distintaId
 * @param {string|number} cantiereId
 */
export function collegaESincronizzaDistintaACantiere(distintaId, cantiereId) {
  const collegata = collegaDistintaACantiere(distintaId, cantiereId);
  if (!collegata) {
    return { ok: false, errore: "collegamento_fallito" };
  }
  return sincronizzaDistintaSuCantiere(distintaId, cantiereId);
}

/**
 * Scollega soft: non rimuove i materiali già proiettati sul cantiere.
 * @param {string} distintaId
 */
export function scollegaDistintaDaCantiereSoft(distintaId) {
  const distinta = trovaDistintaPerId(distintaId);
  if (!distinta) return { ok: false, errore: "distinta_non_trovata" };

  const scollegata = scollegaDistintaDaCantiere(distintaId);
  return { ok: Boolean(scollegata), distinta: scollegata };
}

/**
 * Se la distinta è già collegata a un cantiere, ripete la proiezione
 * (es. dopo salvataggio editor / cambio quantità).
 * @param {string} distintaId
 */
export function risincronizzaDistintaSeCollegata(distintaId) {
  const distinta = trovaDistintaPerId(distintaId);
  const cantiereId = distinta?.collegamenti?.cantiereId;
  if (!cantiereId) {
    return { ok: false, errore: "non_collegata", distinta };
  }
  return sincronizzaDistintaSuCantiere(distintaId, cantiereId);
}

/**
 * Elenco cantieri disponibili per il picker di collegamento.
 */
export function elencaCantieriPerCollegamento() {
  return leggiCantieri().map((c) => ({
    id: c.id,
    nome: c.nome || "",
    cliente: c.cliente || "",
    stato: c.stato || "",
    indirizzo: c.indirizzo || "",
  }));
}
