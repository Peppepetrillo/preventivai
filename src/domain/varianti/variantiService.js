/**
 * Varianti Service — gestione modifiche di cantiere.
 * Il preventivo originale non viene mai modificato.
 * Il totale cantiere è sempre calcolato (mai salvato sul preventivo).
 */

import { normalizzaNumero } from "../../utils/preventivi";
import {
  EVENTI_VARIANTE,
  STATI_VARIANTE,
  creaEventoVariante,
  creaVarianteModel,
  daVarianteLegacy,
  importoSegnatoVariante,
  varianteIncideSulTotale,
} from "./variantiTypes";
import * as repoDefault from "./variantiRepository";

/**
 * @typedef {Object} VariantiDeps
 * @property {() => object[]} [leggiTutteVarianti]
 * @property {(elenco: object[]) => void} [scriviTutteVarianti]
 * @property {(id: string|number) => object|null} [trovaVariante]
 * @property {(v: object) => object} [inserisciVariante]
 * @property {(id: string|number, patch: object) => object|null} [aggiornaVariante]
 * @property {() => object[]} [leggiTimelineVarianti]
 * @property {(eventi: object[]) => void} [scriviTimelineVarianti]
 * @property {(id: string|number) => object|null} [trovaCantiere]
 * @property {() => number} [now]
 */

/**
 * @param {VariantiDeps=} deps
 */
export function creaVariantiService(deps = {}) {
  const leggiTutte =
    deps.leggiTutteVarianti || repoDefault.leggiTutteVarianti;
  const scriviTutte =
    deps.scriviTutteVarianti || repoDefault.scriviTutteVarianti;
  const trova =
    deps.trovaVariante || repoDefault.trovaVariante;
  const inserisci =
    deps.inserisciVariante || repoDefault.inserisciVariante;
  const aggiorna =
    deps.aggiornaVariante || repoDefault.aggiornaVariante;
  const leggiTimeline =
    deps.leggiTimelineVarianti || repoDefault.leggiTimelineVarianti;
  const scriviTimeline =
    deps.scriviTimelineVarianti || repoDefault.scriviTimelineVarianti;
  const trovaCantiere = deps.trovaCantiere || (() => null);
  const now = deps.now || (() => Date.now());

  function registraEvento(tipo, payload = {}) {
    const evento = creaEventoVariante(tipo, {
      ...payload,
      at: payload.at || now(),
    });
    const elenco = [...(leggiTimeline() || [])];
    elenco.unshift(evento);
    scriviTimeline(elenco);
    return evento;
  }

  /**
   * Snapshot economico del preventivo sul cantiere (immutabile).
   * @param {object=} cantiere
   */
  function risolviPreventivoOriginale(cantiere) {
    if (!cantiere || typeof cantiere !== "object") return 0;
    const daImporto = Number(cantiere.preventivoImporto);
    if (Number.isFinite(daImporto)) return daImporto;
    const salvato = Number(cantiere.preventivoOriginaleTotale);
    if (Number.isFinite(salvato)) return salvato;
    const lavorazioni = Array.isArray(cantiere.lavorazioniOrigine)
      ? cantiere.lavorazioniOrigine
      : [];
    return lavorazioni.reduce(
      (acc, item) =>
        acc +
        normalizzaNumero(item?.prezzo) * normalizzaNumero(item?.quantita),
      0
    );
  }

  /**
   * Unisce store + eventuali legacy embedded (solo lettura, no write preventivo).
   * @param {string|number} cantiereId
   * @param {object=} cantiere
   */
  function ottieniVarianti(cantiereId, cantiere) {
    const dalRepo = leggiTutte().filter(
      (v) => String(v.cantiereId) === String(cantiereId)
    );
    const ids = new Set(dalRepo.map((v) => String(v.id)));
    const cantiereRif = cantiere || trovaCantiere(cantiereId) || {};
    const legacy = Array.isArray(cantiereRif.varianti) ? cantiereRif.varianti : [];
    const migrate = legacy
      .filter((v) => v?.id && !ids.has(String(v.id)))
      .map((v) => daVarianteLegacy(v, cantiereId));

    return [...dalRepo, ...migrate].sort(
      (a, b) => (b.creatoAt || 0) - (a.creatoAt || 0)
    );
  }

  /**
   * @param {object} dati
   * @param {{ by?: string }=} opzioni
   */
  function creaVariante(dati = {}, opzioni = {}) {
    const cantiereId = dati.cantiereId;
    if (cantiereId === null || cantiereId === undefined || cantiereId === "") {
      return { success: false, error: "cantiere_obbligatorio" };
    }

    const titolo = String(dati.titolo || dati.descrizione || "").trim();
    if (!titolo) {
      return { success: false, error: "titolo_obbligatorio" };
    }

    const snapshot = leggiTutte().map((v) => ({ ...v }));
    const snapshotTl = (leggiTimeline() || []).map((e) => ({ ...e }));

    try {
      // Anti-duplicato: stesso cantiere + titolo + importo + tipo in proposta
      const duplicato = ottieniVarianti(cantiereId).find(
        (v) =>
          v.stato === STATI_VARIANTE.PROPOSTA &&
          String(v.titolo).toLowerCase() === titolo.toLowerCase() &&
          normalizzaNumero(v.importo) ===
            Math.abs(
              normalizzaNumero(
                dati.importo ??
                  normalizzaNumero(dati.prezzoUnitario) *
                    Math.max(normalizzaNumero(dati.quantita, 1), 0)
              )
            ) &&
          String(v.tipo) === String(dati.tipo || "aggiunta").toLowerCase()
      );
      if (duplicato) {
        return {
          success: true,
          variante: duplicato,
          duplicato: true,
        };
      }

      const variante = inserisci(
        creaVarianteModel({
          ...dati,
          cantiereId,
          titolo,
          descrizione: String(dati.descrizione || titolo).trim(),
          stato: STATI_VARIANTE.PROPOSTA,
          autore: opzioni.by || dati.autore || null,
          creatoAt: now(),
        })
      );

      registraEvento(EVENTI_VARIANTE.CREATA, {
        cantiereId,
        varianteId: variante.id,
        by: opzioni.by || null,
        meta: { titolo: variante.titolo },
      });

      return { success: true, variante, duplicato: false };
    } catch (errore) {
      scriviTutte(snapshot);
      scriviTimeline(snapshotTl);
      return {
        success: false,
        error: errore?.message || "creazione_fallita",
      };
    }
  }

  function transizione(varianteId, statoTarget, eventoTipo, opzioni = {}) {
    const snapshot = leggiTutte().map((v) => ({ ...v }));
    const snapshotTl = (leggiTimeline() || []).map((e) => ({ ...e }));

    try {
      const corrente = trova(varianteId);
      if (!corrente) {
        return { success: false, error: "variante_non_trovata" };
      }
      if (corrente.stato === STATI_VARIANTE.ANNULLATA) {
        return {
          success: false,
          error: "variante_annullata",
          variante: corrente,
        };
      }
      if (corrente.stato === statoTarget) {
        return { success: true, variante: corrente, already: true };
      }

      const aggiornata = aggiorna(varianteId, {
        stato: statoTarget,
        [`${statoTarget}At`]: now(),
        [`${statoTarget}By`]: opzioni.by || null,
      });

      if (!aggiornata) {
        throw new Error("aggiornamento_fallito");
      }

      registraEvento(eventoTipo, {
        cantiereId: aggiornata.cantiereId,
        varianteId: aggiornata.id,
        by: opzioni.by || null,
      });

      return { success: true, variante: aggiornata };
    } catch (errore) {
      scriviTutte(snapshot);
      scriviTimeline(snapshotTl);
      return {
        success: false,
        error: errore?.message || "transizione_fallita",
      };
    }
  }

  function approvaVariante(varianteId, opzioni = {}) {
    return transizione(
      varianteId,
      STATI_VARIANTE.APPROVATA,
      EVENTI_VARIANTE.APPROVATA,
      opzioni
    );
  }

  function eseguiVariante(varianteId, opzioni = {}) {
    const corrente = trova(varianteId);
    if (
      corrente &&
      corrente.stato !== STATI_VARIANTE.APPROVATA &&
      corrente.stato !== STATI_VARIANTE.ESEGUITA
    ) {
      // consente proposta → eseguita passando da approvata implicita? Spec: esegui dopo approva.
      if (corrente.stato === STATI_VARIANTE.PROPOSTA) {
        return {
          success: false,
          error: "richiede_approvazione",
          variante: corrente,
        };
      }
    }
    return transizione(
      varianteId,
      STATI_VARIANTE.ESEGUITA,
      EVENTI_VARIANTE.ESEGUITA,
      opzioni
    );
  }

  function annullaVariante(varianteId, opzioni = {}) {
    return transizione(
      varianteId,
      STATI_VARIANTE.ANNULLATA,
      EVENTI_VARIANTE.ANNULLATA,
      opzioni
    );
  }

  /**
   * Somma firmata delle sole varianti approvate/eseguite.
   * @param {string|number} cantiereId
   * @param {object=} cantiere
   */
  function calcolaTotaleVarianti(cantiereId, cantiere) {
    return ottieniVarianti(cantiereId, cantiere)
      .filter(varianteIncideSulTotale)
      .reduce((acc, v) => acc + importoSegnatoVariante(v), 0);
  }

  /**
   * Totale cantiere dinamico = preventivo + varianti economiche.
   * NON scrive sul preventivo.
   * @param {object} cantiere
   */
  function calcolaTotaleCantiere(cantiere) {
    const preventivoOriginale = risolviPreventivoOriginale(cantiere);
    const cantiereId = cantiere?.id;
    const varianti =
      cantiereId !== null && cantiereId !== undefined && cantiereId !== ""
        ? ottieniVarianti(cantiereId, cantiere)
        : (Array.isArray(cantiere?.varianti)
            ? cantiere.varianti.map((v) => daVarianteLegacy(v, cantiereId))
            : []);
    const deltaVarianti = varianti
      .filter(varianteIncideSulTotale)
      .reduce((acc, v) => acc + importoSegnatoVariante(v), 0);

    return {
      preventivoOriginale,
      deltaVarianti,
      totaleAggiornato: preventivoOriginale + deltaVarianti,
      numeroVarianti: varianti.length,
      numeroEconomiche: varianti.filter(varianteIncideSulTotale).length,
      varianti,
    };
  }

  function ottieniTimeline(cantiereId) {
    const elenco = leggiTimeline() || [];
    if (cantiereId === undefined || cantiereId === null) return elenco;
    return elenco.filter(
      (e) => String(e.cantiereId) === String(cantiereId)
    );
  }

  return {
    creaVariante,
    approvaVariante,
    eseguiVariante,
    annullaVariante,
    ottieniVarianti,
    calcolaTotaleVarianti,
    calcolaTotaleCantiere,
    ottieniTimeline,
    risolviPreventivoOriginale,
    importoSegnatoVariante,
  };
}

/** Istanza di default (repository reali). */
export const variantiService = creaVariantiService();

export const creaVariante = (dati, opzioni) =>
  variantiService.creaVariante(dati, opzioni);
export const approvaVariante = (id, opzioni) =>
  variantiService.approvaVariante(id, opzioni);
export const eseguiVariante = (id, opzioni) =>
  variantiService.eseguiVariante(id, opzioni);
export const annullaVariante = (id, opzioni) =>
  variantiService.annullaVariante(id, opzioni);
export const ottieniVarianti = (cantiereId, cantiere) =>
  variantiService.ottieniVarianti(cantiereId, cantiere);
export const calcolaTotaleVarianti = (cantiereId, cantiere) =>
  variantiService.calcolaTotaleVarianti(cantiereId, cantiere);
export const calcolaTotaleCantiere = (cantiere) =>
  variantiService.calcolaTotaleCantiere(cantiere);
export const ottieniTimelineVarianti = (cantiereId) =>
  variantiService.ottieniTimeline(cantiereId);

export {
  importoSegnatoVariante,
  STATI_VARIANTE,
  TIPI_VARIANTE,
} from "./variantiTypes";
