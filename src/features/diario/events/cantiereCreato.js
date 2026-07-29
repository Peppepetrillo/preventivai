import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoCantiereCreato(cantiere) {
  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.CANTIERE_CREATO,
    title: "Cantiere creato",
    description: cantiere?.nome || cantiere?.cliente || "Nuovo cantiere registrato.",
  });
}
