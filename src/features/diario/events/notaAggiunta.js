import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoNotaAggiunta(testo, { manuale = false } = {}) {
  const contenuto = String(testo || "").trim();
  if (!contenuto) return null;
  return createDiarioEvent({
    type: manuale ? DIARIO_EVENT_TYPES.NOTA_MANUALE : DIARIO_EVENT_TYPES.NOTA,
    title: "Nota",
    description: contenuto,
  });
}
