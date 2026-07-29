import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoStatoCambiato(statoPrecedente, statoNuovo) {
  if (!statoNuovo || statoPrecedente === statoNuovo) return null;
  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.STATO_CAMBIATO,
    title: "Stato aggiornato",
    description: statoPrecedente
      ? `${statoPrecedente} -> ${statoNuovo}`
      : statoNuovo,
    meta: { statoPrecedente, statoNuovo },
  });
}
