import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";
import { formatEuro } from "../../../utils/preventivi";

export function creaEventoPagamentoRegistrato(importoDelta, totaleIncassato) {
  const delta = Number(importoDelta) || 0;
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
