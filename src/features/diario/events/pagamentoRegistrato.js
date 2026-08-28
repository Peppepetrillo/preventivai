import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";
import { formatEuro } from "../../../utils/preventivi";

/**
 * Evento Diario leggero dopo salvataggio pagamento (UX-7.5).
 * NON è source of truth per l'incassato — usa cantiere.pagamenti[].
 *
 * @param {number|object} importoDeltaOPagamento
 *   Legacy: delta numerico. Oppure `{ pagamentoId, importo, tipo, metodo }`.
 * @param {number=} totaleIncassato
 */
export function creaEventoPagamentoRegistrato(
  importoDeltaOPagamento,
  totaleIncassato
) {
  if (
    importoDeltaOPagamento &&
    typeof importoDeltaOPagamento === "object"
  ) {
    const pagamento = importoDeltaOPagamento;
    const importo = Number(pagamento.importo) || 0;
    if (!(importo > 0)) return null;
    return createDiarioEvent({
      type: DIARIO_EVENT_TYPES.PAGAMENTO,
      title: "Pagamento registrato",
      description: `Registrato pagamento ${formatEuro(importo)}`,
      meta: {
        pagamentoId: pagamento.pagamentoId || pagamento.id || "",
        importo,
        tipo: pagamento.tipo || "acconto",
        metodo: pagamento.metodo || "altro",
        totaleIncassato: Number(totaleIncassato) || 0,
      },
    });
  }

  const delta = Number(importoDeltaOPagamento) || 0;
  if (delta === 0) return null;
  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.PAGAMENTO,
    title: "Pagamento",
    description:
      delta > 0
        ? `Registrato pagamento ${formatEuro(delta)}`
        : `Aggiornato pagamento ${formatEuro(delta)}`,
    meta: { importoDelta: delta, totaleIncassato: Number(totaleIncassato) || 0 },
  });
}
