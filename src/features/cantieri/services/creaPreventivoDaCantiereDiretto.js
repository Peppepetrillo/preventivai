/**
 * Cantiere diretto → crea preventivo collegato allo stesso cantiere.
 * SoT: preventivo.cantiereId ↔ cantiere.preventivoId.
 * NON crea un secondo cantiere. Idempotente se già collegato.
 */

import { STATI_PREVENTIVO } from "../../../domain/workflow";
import {
  isRecordCestinato,
} from "../../../domain/cestino";
import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../../repositories/cantieriRepository";
import {
  leggiPreventiviTutti,
  salvaNuovoPreventivo,
  trovaPreventivo,
} from "../../../repositories/preventiviRepository";
import { creaPreventivo } from "../../preventivi/preventiviDomain";
import { ORIGINE_CANTIERE } from "../cantieriDomain";

/**
 * @param {string|number} cantiereId
 * @param {{
 *   lavorazioni?: object[],
 *   sconto?: number,
 *   iva?: number,
 *   validita?: number,
 *   pagamento?: string,
 *   note?: string,
 *   tipologiaImpianto?: string,
 * }=} opzioni
 * @returns {{
 *   ok: boolean,
 *   creato?: boolean,
 *   preventivo?: object,
 *   cantiere?: object,
 *   errore?: string,
 * }}
 */
export function creaPreventivoDaCantiereDiretto(cantiereId, opzioni = {}) {
  const id = String(cantiereId || "").trim();
  if (!id) {
    return { ok: false, errore: "cantiere_non_trovato" };
  }

  const cantieri = leggiCantieriTutti();
  const indice = cantieri.findIndex((c) => String(c.id) === id);
  if (indice < 0) {
    return { ok: false, errore: "cantiere_non_trovato" };
  }

  const cantiere = cantieri[indice];
  if (isRecordCestinato(cantiere)) {
    return { ok: false, errore: "cantiere_cestinato" };
  }

  if (cantiere.preventivoId) {
    const esistente = trovaPreventivo(cantiere.preventivoId, {
      includiCestinati: true,
    });
    if (esistente && !isRecordCestinato(esistente)) {
      return {
        ok: true,
        creato: false,
        preventivo: esistente,
        cantiere,
      };
    }
  }

  const lavorazioni = Array.isArray(opzioni.lavorazioni)
    ? opzioni.lavorazioni
    : [];
  const noteDaCantiere = String(
    opzioni.note ||
      cantiere.descrizioneIntervento ||
      cantiere.descrizione ||
      cantiere.note ||
      ""
  ).trim();

  const preventivo = creaPreventivo({
    archivio: leggiPreventiviTutti(),
    cliente: String(cantiere.cliente || cantiere.nome || "").trim() || "Cliente",
    clienteId: cantiere.clienteId,
    lavorazioni,
    sconto: opzioni.sconto ?? 0,
    iva: opzioni.iva ?? 22,
    validita: opzioni.validita ?? 30,
    pagamento: opzioni.pagamento || "Bonifico bancario",
    note: noteDaCantiere,
    tipologiaImpianto: opzioni.tipologiaImpianto,
  });

  const convertitoAt = new Date().toISOString();
  const collegato = {
    ...preventivo,
    stato: STATI_PREVENTIVO.CONVERTITO,
    cantiereId: cantiere.id,
    convertitoAt,
    dataAccettazione: new Date().toLocaleDateString("it-IT"),
  };

  salvaNuovoPreventivo(collegato);

  const cantiereAggiornato = {
    ...cantiere,
    preventivoId: collegato.id,
    preventivoNumero: collegato.numero,
    // Origine resta diretta se lo era; non riscrivere come "preventivo"
    origine: cantiere.origine || ORIGINE_CANTIERE.DIRETTO,
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
  };

  const prossimo = [...cantieri];
  prossimo[indice] = cantiereAggiornato;
  salvaCantieri(prossimo);

  return {
    ok: true,
    creato: true,
    preventivo: collegato,
    cantiere: cantiereAggiornato,
  };
}
