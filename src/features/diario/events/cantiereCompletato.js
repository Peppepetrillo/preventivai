import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoCantiereCompletato(cantiere) {
  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.CANTIERE_COMPLETATO,
    title: "Cantiere completato",
    description: cantiere?.nome || "Lavoro concluso.",
  });
}
