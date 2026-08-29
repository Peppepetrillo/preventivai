/**
 * Preventivo Workflow Service — Accetta → Converti in Cantiere.
 * Nessuna dipendenza diretta dai repository: usa dependency injection.
 */

import { creaCantiereDaPreventivo as creaCantiereDaPreventivoDefault } from "../../features/cantieri/cantieriDomain";
import { isRecordCestinato } from "../cestino";
import {
  AZIONI_PREVENTIVO,
  EVENTI_WORKFLOW,
  STATI_PREVENTIVO,
  calcolaAzioniDisponibili,
  creaEventoWorkflow,
  isStatoPreventivoTerminale,
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

  function rifiutaSeCestinato(preventivo) {
    if (!preventivo) return null;
    if (!isRecordCestinato(preventivo)) return null;
    return {
      success: false,
      error: "preventivo_cestinato",
      preventivo,
    };
  }

  function trovaCantiereCollegato(preventivo) {
    if (!preventivo) return null;
    return (
      deps.leggiCantieri().find(
        (cantiere) =>
          !isRecordCestinato(cantiere) &&
          (String(cantiere.id) === String(preventivo.cantiereId) ||
            String(cantiere.preventivoId) === String(preventivo.id))
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

  function applicaBackfillClienteId(item, clienteId) {
    if (clienteId == null || clienteId === "" || item.clienteId != null) {
      return item;
    }
    return { ...item, clienteId };
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
    const bloccoCestino = rifiutaSeCestinato(preventivo);
    if (bloccoCestino) return bloccoCestino;

    const stato = normalizzaStatoPreventivo(preventivo.stato);
    if (isStatoPreventivoTerminale(stato)) {
      return { success: false, error: "preventivo_chiuso", preventivo };
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
    const bloccoCestino = rifiutaSeCestinato(preventivo);
    if (bloccoCestino) return bloccoCestino;

    const stato = normalizzaStatoPreventivo(preventivo.stato);
    if (isStatoPreventivoTerminale(stato)) {
      return { success: false, error: "preventivo_chiuso", preventivo };
    }
    if (
      stato === STATI_PREVENTIVO.CONVERTITO ||
      stato === STATI_PREVENTIVO.LAVORO_COMPLETATO
    ) {
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
    return rifiutaPreventivo(preventivoId, opzioni);
  }

  /**
   * Rifiuta / annulla (stato terminale 🔴 Rifiutato).
   * @param {string|number} preventivoId
   * @param {{ by?: string }=} opzioni
   */
  function rifiutaPreventivo(preventivoId, opzioni = {}) {
    const preventivo = trovaPreventivo(preventivoId);
    if (!preventivo) {
      return { success: false, error: "preventivo_non_trovato" };
    }
    const bloccoCestino = rifiutaSeCestinato(preventivo);
    if (bloccoCestino) return bloccoCestino;

    const stato = normalizzaStatoPreventivo(preventivo.stato);
    if (
      stato === STATI_PREVENTIVO.CONVERTITO ||
      stato === STATI_PREVENTIVO.LAVORO_COMPLETATO
    ) {
      return {
        success: false,
        error: "non_annullabile_convertito",
        preventivo,
      };
    }
    if (stato === STATI_PREVENTIVO.RIFIUTATO) {
      return { success: true, preventivo, alreadyCancelled: true };
    }

    const aggiornato = patchPreventivo(preventivoId, (item) => ({
      ...item,
      stato: STATI_PREVENTIVO.RIFIUTATO,
      rifiutatoAt: now(),
      annullatoAt: now(),
      annullatoBy: opzioni.by || null,
    }));

    registraEvento(EVENTI_WORKFLOW.PREVENTIVO_RIFIUTATO, {
      preventivoId,
      by: opzioni.by || null,
    });

    return { success: true, preventivo: aggiornato };
  }

  /**
   * Chiusura cantiere → preventivo 🏁 Lavoro completato.
   * @param {string|number} preventivoId
   * @param {{ by?: string, cantiereId?: string|number }=} opzioni
   */
  function completaLavoroDaCantiere(preventivoId, opzioni = {}) {
    const preventivo = trovaPreventivo(preventivoId);
    if (!preventivo) {
      return { success: false, error: "preventivo_non_trovato" };
    }
    const bloccoCestino = rifiutaSeCestinato(preventivo);
    if (bloccoCestino) return bloccoCestino;

    const stato = normalizzaStatoPreventivo(preventivo.stato);
    if (stato === STATI_PREVENTIVO.LAVORO_COMPLETATO) {
      return { success: true, preventivo, alreadyCompleted: true };
    }
    if (stato === STATI_PREVENTIVO.RIFIUTATO) {
      return { success: false, error: "preventivo_rifiutato", preventivo };
    }

    const aggiornato = patchPreventivo(preventivoId, (item) => ({
      ...item,
      stato: STATI_PREVENTIVO.LAVORO_COMPLETATO,
      cantiereId: opzioni.cantiereId ?? item.cantiereId ?? null,
      lavoroCompletatoAt: now(),
      lavoroCompletatoBy: opzioni.by || null,
    }));

    registraEvento(EVENTI_WORKFLOW.LAVORO_COMPLETATO, {
      preventivoId,
      cantiereId: opzioni.cantiereId ?? aggiornato.cantiereId ?? null,
      by: opzioni.by || null,
    });

    return { success: true, preventivo: aggiornato };
  }

  /**
   * Aggiunge una variante come lavorazione sul preventivo collegato.
   * @param {string|number} preventivoId
   * @param {object} variante
   */
  function sincronizzaVarianteSuPreventivo(preventivoId, variante = {}) {
    const preventivo = trovaPreventivo(preventivoId);
    if (!preventivo) {
      return { success: false, error: "preventivo_non_trovato" };
    }
    const bloccoCestino = rifiutaSeCestinato(preventivo);
    if (bloccoCestino) return bloccoCestino;

    const nome = String(
      variante.titolo || variante.descrizione || "Variante cantiere"
    ).trim();
    const quantita = Number(variante.quantita);
    const prezzo = Number(
      variante.prezzoUnitario ??
        (Number(variante.importo) && Number(variante.quantita)
          ? Number(variante.importo) / Number(variante.quantita)
          : variante.importo) ??
        0
    );
    const qta = Number.isFinite(quantita) && quantita > 0 ? quantita : 1;
    const prezzoUnitario = Number.isFinite(prezzo) ? prezzo : 0;

    const nuovaLavorazione = {
      id: `var-prev-${variante.id || Date.now()}`,
      nome,
      quantita: qta,
      prezzo: prezzoUnitario,
      unita: String(variante.unita || "cad").trim() || "cad",
      daVariante: true,
      varianteId: variante.id || null,
    };

    const aggiornato = patchPreventivo(preventivoId, (item) => {
      const lavorazioni = [...(item.lavorazioni || []), nuovaLavorazione];
      const totale = lavorazioni.reduce(
        (acc, voce) =>
          acc + (Number(voce.prezzo) || 0) * (Number(voce.quantita) || 0),
        0
      );
      return {
        ...item,
        lavorazioni,
        totale,
        note: item.note
          ? `${item.note}\n[Variante] ${nome}`
          : `[Variante] ${nome}`,
      };
    });

    return { success: true, preventivo: aggiornato, lavorazione: nuovaLavorazione };
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
      const bloccoCestino = rifiutaSeCestinato(preventivo);
      if (bloccoCestino) return bloccoCestino;

      const stato = normalizzaStatoPreventivo(preventivo.stato);
      const esistente = trovaCantiereCollegato(preventivo);

      if (esistente) {
        const { clienteId } = risolviCliente(preventivo);
        const aggiornato =
          String(preventivo.cantiereId) === String(esistente.id) &&
          stato === STATI_PREVENTIVO.CONVERTITO
            ? preventivo
            : patchPreventivo(preventivoId, (item) =>
                applicaBackfillClienteId(
                  {
                    ...item,
                    stato: STATI_PREVENTIVO.CONVERTITO,
                    cantiereId: esistente.id,
                    convertitoAt: item.convertitoAt || now(),
                    convertitoBy: item.convertitoBy || opzioni.by || null,
                  },
                  clienteId
                )
              );

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
      const aggiornato = patchPreventivo(preventivoId, (item) =>
        applicaBackfillClienteId(
          {
            ...item,
            stato: STATI_PREVENTIVO.CONVERTITO,
            cantiereId: cantiere.id,
            convertitoAt,
            convertitoBy: opzioni.by || null,
            dataAccettazione:
              item.dataAccettazione ||
              new Date(convertitoAt).toLocaleDateString("it-IT"),
          },
          clienteId
        )
      );

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
    if (isRecordCestinato(preventivo)) return [];
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
      .filter((p) => {
        const stato = normalizzaStatoPreventivo(p.stato);
        return (
          stato === STATI_PREVENTIVO.CONVERTITO ||
          stato === STATI_PREVENTIVO.LAVORO_COMPLETATO ||
          Boolean(p.cantiereId)
        );
      }).length;
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
    rifiutaPreventivo,
    completaLavoroDaCantiere,
    sincronizzaVarianteSuPreventivo,
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
