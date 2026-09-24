import { TIPI_CONDIVISIONE } from "../../../domain/condivisione";
import {
  STATI_PREVENTIVO,
  normalizzaStatoPreventivo,
} from "../../../domain/workflow";

/**
 * Soft prompt «Segna come inviato?» dopo condivisione riuscita.
 * Solo su Bozza e solo per canali verso il cliente (non scarica locale).
 * Non cambia stato da sola: serve conferma esplicita.
 *
 * @param {string=} statoPreventivo
 * @param {{ condivisione?: { tipo?: string }, tipo?: string }=} esito
 * @returns {boolean}
 */
export function deveChiedereSegnaInviatoDopoShare(statoPreventivo, esito) {
  if (normalizzaStatoPreventivo(statoPreventivo) !== STATI_PREVENTIVO.BOZZA) {
    return false;
  }
  const tipo = esito?.condivisione?.tipo || esito?.tipo || "";
  if (!tipo) return true;
  if (
    tipo === TIPI_CONDIVISIONE.DOWNLOAD ||
    tipo === "download" ||
    tipo === "scarica"
  ) {
    return false;
  }
  return true;
}
