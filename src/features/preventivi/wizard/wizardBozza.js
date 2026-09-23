/**
 * Rilevamento bozza wizard con dati reali (non solo step cambiato).
 * Usato per ConfirmDialog su uscita (Back / edge swipe / Android / BottomNav).
 */

import { CONDIZIONI_DEFAULT } from "./wizardConfig";

/**
 * True se l'utente ha inserito dati che andrebbero persi uscendo dal wizard.
 * Bozza vuota (solo step Cliente senza input) → false.
 *
 * @param {object} stato
 * @returns {boolean}
 */
export function wizardHaBozzaConDati(stato = {}) {
  if (String(stato.cliente || "").trim()) return true;
  if (stato.clienteId != null && String(stato.clienteId).trim()) return true;

  if (Array.isArray(stato.lavorazioni) && stato.lavorazioni.length > 0) {
    return true;
  }

  const condizioni = stato.condizioni || {};
  if (Number(condizioni.sconto) > 0) return true;
  if (Number(condizioni.acconto) > 0) return true;
  if (String(condizioni.note || "").trim()) return true;
  if (
    String(condizioni.pagamento || "").trim() &&
    String(condizioni.pagamento).trim() !== CONDIZIONI_DEFAULT.pagamento
  ) {
    return true;
  }
  if (
    Number(condizioni.iva) !== Number(CONDIZIONI_DEFAULT.iva) &&
    Number.isFinite(Number(condizioni.iva))
  ) {
    return true;
  }
  if (
    Number(condizioni.validita) !== Number(CONDIZIONI_DEFAULT.validita) &&
    Number.isFinite(Number(condizioni.validita))
  ) {
    return true;
  }

  const contesto = stato.contesto || {};
  const campiContesto = [
    contesto.descrizione,
    contesto.titolo,
    contesto.indirizzo,
    contesto.note,
    contesto.tipologiaImpianto,
  ];
  if (campiContesto.some((v) => String(v || "").trim())) return true;

  return false;
}
