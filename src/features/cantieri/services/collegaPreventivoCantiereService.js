/**
 * Collegamento inverso: Preventivo → Cantiere/Lavoro già esistente.
 * Nessuna creazione di secondo cantiere; non tocca giornate/spese/pagamenti.
 */

import { isRecordCestinato } from "../../../domain/cestino";
import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../../repositories/cantieriRepository";
import {
  aggiornaPreventivo,
  leggiPreventiviTutti,
} from "../../../repositories/preventiviRepository";

/**
 * @param {string|number} cantiereId
 * @param {string|number} preventivoId
 * @returns {{ success: boolean, cantiere?: object, preventivo?: object, error?: string, creato?: boolean }}
 */
export function collegaPreventivoACantiereEsistente(cantiereId, preventivoId) {
  const idCantiere = String(cantiereId ?? "").trim();
  const idPreventivo = String(preventivoId ?? "").trim();
  if (!idCantiere || !idPreventivo) {
    return { success: false, error: "parametri_mancanti", creato: false };
  }

  const cantieri = leggiCantieriTutti();
  const cantiere = cantieri.find((c) => String(c?.id) === idCantiere);
  if (!cantiere || isRecordCestinato(cantiere)) {
    return { success: false, error: "cantiere_non_trovato", creato: false };
  }

  const preventivi = leggiPreventiviTutti();
  const preventivo = preventivi.find((p) => String(p?.id) === idPreventivo);
  if (!preventivo || isRecordCestinato(preventivo)) {
    return { success: false, error: "preventivo_non_trovato", creato: false };
  }

  if (
    cantiere.preventivoId != null &&
    String(cantiere.preventivoId) !== idPreventivo
  ) {
    return { success: false, error: "cantiere_gia_collegato", creato: false };
  }

  if (
    preventivo.cantiereId != null &&
    String(preventivo.cantiereId) !== idCantiere
  ) {
    return {
      success: false,
      error: "preventivo_altro_cantiere",
      creato: false,
    };
  }

  const riferimento = preventivo.numero || `PREV-${preventivo.id}`;
  const totalePreventivo = Number(preventivo.totale);
  const preventivoImporto = Number.isFinite(totalePreventivo)
    ? totalePreventivo
    : (preventivo.lavorazioni || []).reduce(
        (acc, item) =>
          acc + (Number(item.prezzo) || 0) * (Number(item.quantita) || 0),
        0
      );

  const cantiereAggiornato = {
    ...cantiere,
    preventivoId: preventivo.id,
    preventivoNumero: riferimento,
    preventivoImporto,
    preventivoOriginaleTotale:
      Number(cantiere.preventivoOriginaleTotale) > 0
        ? cantiere.preventivoOriginaleTotale
        : preventivoImporto,
    aggiornatoIl: new Date().toLocaleDateString("it-IT"),
  };

  salvaCantieri(
    cantieri.map((c) =>
      String(c?.id) === idCantiere ? cantiereAggiornato : c
    )
  );

  const preventivoAggiornato = {
    ...preventivo,
    cantiereId: cantiere.id,
  };

  aggiornaPreventivo(preventivo.id, () => preventivoAggiornato);

  return {
    success: true,
    creato: false,
    cantiere: cantiereAggiornato,
    preventivo: preventivoAggiornato,
  };
}
