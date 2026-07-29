import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoCantiereAvviato(cantiere) {
  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.CANTIERE_AVVIATO,
    title: "Cantiere avviato",
    description: cantiere?.nome || "Lavoro avviato.",
  });
}
