/**
 * Preventivo Workflow Service — Accetta → Converti in Cantiere.
 * Nessuna dipendenza diretta dai repository: usa dependency injection.
 */

import { creaCantiereDaPreventivo as creaCantiereDaPreventivoDefault } from "../../features/cantieri/cantieriDomain";
import {
  AZIONI_PREVENTIVO,
  EVENTI_WORKFLOW,
  STATI_PREVENTIVO,
  calcolaAzioniDisponibili,
  creaEventoWorkflow,
  normalizzaStatoPreventivo,
} from "./preventivoWorkflowTypes";

/**
 * @typedef {Object} PreventivoWorkflowDeps
 * @property {() => object[]} leggiPreventivi
 * @property {(id: string|number, fn: Function) => object[]} aggiornaPreventivo
 * @property {() => object[]} leggiCantieri
 * @property {(cantieri: object[]) => void} salvaCantieri
 * @property {() => object[]} [leggiClienti]
 * @property {(preventivo: object, opzioni?: object) => object} [creaCantiereDaPreventivo]
 * @property {() => object[]} [leggiTimeline]
 * @property {(eventi: object[]) => void} [salvaTimeline]
 * @property {() => number} [now]
 */

/**
 * @param {PreventivoWorkflowDeps} deps
 */
export function creaPreventivoWorkflowService(deps) {
  if (!deps?.leggiPreventivi || !deps?.aggiornaPreventivo) {
    throw new Error("Workflow: dipendenze preventivi mancanti.");
  }
  if (!deps?.leggiCantieri || !deps?.salvaCantieri) {
    throw new Error("Workflow: dipendenze cantieri mancanti.");
  }

  const leggiClienti = deps.leggiClienti || (() => []);
  const creaCantiereDaPreventivo =
    deps.creaCantiereDaPreventivo || creaCantiereDaPreventivoDefault;
  const leggiTimeline = deps.leggiTimeline || (() => []);
  const salvaTimeline = deps.salvaTimeline || (() => {});
  const now = deps.now || (() => Date.now());

  function trovaPreventivo(id) {
    return (
      deps.leggiPreventivi().find((p) => String(p.id) === String(id)) || null
    );
  }

  function trovaCantiereCollegato(preventivo) {
    if (!preventivo) return null;
    return (
      deps.leggiCantieri().find(
        (cantiere) =>
          String(cantiere.id) === String(preventivo.cantiereId) ||
          String(cantiere.preventivoId) === String(preventivo.id)
      ) || null
    );
  }

  function registraEvento(tipo, payload = {}) {
    const evento = creaEventoWorkflow(tipo, {
      ...payload,
      at: payload.at || now(),
    });
    const elenco = Array.isArray(leggiTimeline()) ? [...leggiTimeline()] : [];
    elenco.unshift(evento);
    salvaTimeline(elenco);
    return evento;
  }

  function risolviCliente(preventivo) {
    const clienti = leggiClienti() || [];
    const cliente = clienti.find((item) => item.nome === preventivo.cliente);
    return {
      clienteId: preventivo.clienteId ?? cliente?.id ?? null,
      indirizzo: String(
        preventivo.indirizzo || cliente?.indirizzo || ""
      ).trim(),
    };
  }

  function patchPreventivo(id, patchFn) {
    const aggiornati = deps.aggiornaPreventivo(id, patchFn);
    return (
      aggiornati.find((p) => String(p.id) === String(id)) ||
      trovaPreventivo(id)
    );
  }

  /**
   * @param {string|number} preventivoId
   * @param {{ by?: string }=} opzioni
   */
  function inviaPreventivo(preventivoId, opzioni = {}) {
    const preventivo = trovaPreventivo(preventivoId);
    if (!preventivo) {
      return { success: false, error: "preventivo_non_trovato" };
    }

    const stato = normalizzaStatoPreventivo(preventivo.stato);
    if (stato === STATI_PREVENTIVO.ANNULLATO) {
      return { success: false, error: "preventivo_annullato", preventivo };
    }
    if (
      stato === STATI_PREVENTIVO.ACCETTATO ||
      stato === STATI_PREVENTIVO.CONVERTITO
    ) {
      return {
        success: false,
        error: "stato_non_consentito",
        preventivo,
      };
    }

    const aggiornato = patchPreventivo(preventivoId, (item) => ({
      ...item,
      stato: STATI_PREVENTIVO.INVIATO,
      inviatoAt: now(),
    }));

    registraEvento(EVENTI_WORKFLOW.PREVENTIVO_INVIATO, {
      preventivoId,
      by: opzioni.by || null,
    });

    return { success: true, preventivo: aggiornato };
  }

  /**
   * @param {string|number} preventivoId
   * @param {{ by?: string }=} opzioni
   */
  function accettaPreventivo(preventivoId, opzioni = {}) {
    const preventivo = trovaPreventivo(preventivoId);
    if (!preventivo) {
      return { success: false, error: "preventivo_non_trovato" };
    }

    const stato = normalizzaStatoPreventivo(preventivo.stato);
    if (stato === STATI_PREVENTIVO.ANNULLATO) {
      return { success: false, error: "preventivo_annullato", preventivo };
    }
    if (stato === STATI_PREVENTIVO.CONVERTITO) {
      return {
        success: false,
        error: "gia_convertito",
        preventivo,
      };
    }
    if (stato === STATI_PREVENTIVO.ACCETTATO) {
      return { success: true, preventivo, alreadyAccepted: true };
    }

    const dataAccettazione = new Date(now()).toLocaleDateString("it-IT");
    const aggiornato = patchPreventivo(preventivoId, (item) => ({
      ...item,
      stato: STATI_PREVENTIVO.ACCETTATO,
      dataAccettazione,
      accettatoAt: now(),
      accettatoBy: opzioni.by || null,
    }));

    registraEvento(EVENTI_WORKFLOW.PREVENTIVO_ACCETTATO, {
      preventivoId,
      by: opzioni.by || null,
    });

    return { success: true, preventivo: aggiornato };
  }

  /**
   * @param {string|number} preventivoId
   * @param {{ by?: string }=} opzioni
   */
  function annullaPreventivo(preventivoId, opzioni = {}) {
    const preventivo = trovaPreventivo(preventivoId);
    if (!preventivo) {
      return { success: false, error: "preventivo_non_trovato" };
    }

    const stato = normalizzaStatoPreventivo(preventivo.stato);
    if (stato === STATI_PREVENTIVO.CONVERTITO) {
      return {
        success: false,
        error: "non_annullabile_convertito",
        preventivo,
      };
    }
    if (stato === STATI_PREVENTIVO.ANNULLATO) {
      return { success: true, preventivo, alreadyCancelled: true };
    }

    const aggiornato = patchPreventivo(preventivoId, (item) => ({
      ...item,
      stato: STATI_PREVENTIVO.ANNULLATO,
      annullatoAt: now(),
      annullatoBy: opzioni.by || null,
    }));

    registraEvento(EVENTI_WORKFLOW.PREVENTIVO_ANNULLATO, {
      preventivoId,
      by: opzioni.by || null,
    });

    return { success: true, preventivo: aggiornato };
  }

  /**
   * Solo ACCETTATO → crea cantiere. Se già collegato, restituisce esistente.
   * @param {string|number} preventivoId
   * @param {{ by?: string }=} opzioni
   */
  function convertiInCantiere(preventivoId, opzioni = {}) {
    const snapshotPreventivi = deps.leggiPreventivi().map((p) => ({ ...p }));
    const snapshotCantieri = deps.leggiCantieri().map((c) => ({ ...c }));
    const snapshotTimeline = (leggiTimeline() || []).map((e) => ({ ...e }));

    try {
      const preventivo = trovaPreventivo(preventivoId);
      if (!preventivo) {
        return { success: false, error: "preventivo_non_trovato" };
      }

      const stato = normalizzaStatoPreventivo(preventivo.stato);
      const esistente = trovaCantiereCollegato(preventivo);

      if (esistente) {
        const aggiornato =
          String(preventivo.cantiereId) === String(esistente.id) &&
          stato === STATI_PREVENTIVO.CONVERTITO
            ? preventivo
            : patchPreventivo(preventivoId, (item) => ({
                ...item,
                stato: STATI_PREVENTIVO.CONVERTITO,
                cantiereId: esistente.id,
                convertitoAt: item.convertitoAt || now(),
                convertitoBy: item.convertitoBy || opzioni.by || null,
              }));

        return {
          success: true,
          creato: false,
          cantiere: esistente,
          preventivo: aggiornato,
        };
      }

      if (stato !== STATI_PREVENTIVO.ACCETTATO) {
        return {
          success: false,
          error: "solo_accettato_convertibile",
          preventivo,
        };
      }

      const { clienteId, indirizzo } = risolviCliente(preventivo);
      const cantiere = creaCantiereDaPreventivo(preventivo, {
        clienteId,
        indirizzo,
        dataAccettazione:
          preventivo.dataAccettazione ||
          new Date(now()).toLocaleDateString("it-IT"),
      });

      deps.salvaCantieri([cantiere, ...deps.leggiCantieri()]);

      const convertitoAt = now();
      const aggiornato = patchPreventivo(preventivoId, (item) => ({
        ...item,
        stato: STATI_PREVENTIVO.CONVERTITO,
        cantiereId: cantiere.id,
        convertitoAt,
        convertitoBy: opzioni.by || null,
        dataAccettazione:
          item.dataAccettazione ||
          new Date(convertitoAt).toLocaleDateString("it-IT"),
      }));

      registraEvento(EVENTI_WORKFLOW.CANTIERE_CREATO, {
        preventivoId,
        cantiereId: cantiere.id,
        by: opzioni.by || null,
        meta: { preventivoNumero: cantiere.preventivoNumero },
      });
      registraEvento(EVENTI_WORKFLOW.PREVENTIVO_CONVERTITO, {
        preventivoId,
        cantiereId: cantiere.id,
        by: opzioni.by || null,
      });

      return {
        success: true,
        creato: true,
        cantiere,
        preventivo: aggiornato,
      };
    } catch (errore) {
      deps.salvaCantieri(snapshotCantieri);
      // ripristina preventivi uno a uno via aggiorna o salva se disponibile
      if (typeof deps.salvaPreventivi === "function") {
        deps.salvaPreventivi(snapshotPreventivi);
      } else {
        snapshotPreventivi.forEach((p) => {
          deps.aggiornaPreventivo(p.id, () => p);
        });
      }
      salvaTimeline(snapshotTimeline);
      return {
        success: false,
        error: errore?.message || "conversione_fallita",
      };
    }
  }

  /**
   * @param {object} preventivo
   * @returns {string[]}
   */
  function ottieniAzioniDisponibili(preventivo) {
    return calcolaAzioniDisponibili(preventivo, {
      cantiereCollegato: trovaCantiereCollegato(preventivo),
    });
  }

  /**
   * @param {string|number=} preventivoId
   * @returns {object[]}
   */
  function ottieniTimeline(preventivoId) {
    const elenco = Array.isArray(leggiTimeline()) ? leggiTimeline() : [];
    if (preventivoId === undefined || preventivoId === null) return elenco;
    return elenco.filter(
      (e) => String(e.preventivoId) === String(preventivoId)
    );
  }

  /**
   * @returns {number}
   */
  function contaPreventiviConvertiti() {
    return deps
      .leggiPreventivi()
      .filter(
        (p) =>
          normalizzaStatoPreventivo(p.stato) === STATI_PREVENTIVO.CONVERTITO ||
          Boolean(p.cantiereId)
      ).length;
  }

  function registraCreazionePreventivo(preventivoId, opzioni = {}) {
    return registraEvento(EVENTI_WORKFLOW.PREVENTIVO_CREATO, {
      preventivoId,
      by: opzioni.by || null,
    });
  }

  return {
    inviaPreventivo,
    accettaPreventivo,
    convertiInCantiere,
    annullaPreventivo,
    ottieniAzioniDisponibili,
    ottieniTimeline,
    contaPreventiviConvertiti,
    trovaCantiereCollegato,
    trovaPreventivo,
    registraCreazionePreventivo,
    AZIONI: AZIONI_PREVENTIVO,
    STATI: STATI_PREVENTIVO,
  };
}

export {
  AZIONI_PREVENTIVO,
  STATI_PREVENTIVO,
  normalizzaStatoPreventivo,
  calcolaAzioniDisponibili,
};
