import { STATI_VARIANTE_LABEL, TIPI_VARIANTE_LABEL } from "../../../domain/varianti";
import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoVariante(variante, azione = "creata") {
  if (!variante) return null;
  const titolo = variante.titolo || variante.descrizione || "Variante";
  const tipo = TIPI_VARIANTE_LABEL[variante.tipo] || variante.tipo || "Variante";
  const stato = STATI_VARIANTE_LABEL[variante.stato] || variante.stato || "";
  const actionLabel = {
    creata: "Variante aggiunta",
    approvata: "Variante approvata",
    eseguita: "Variante eseguita",
    annullata: "Variante annullata",
  }[azione] || "Variante";

  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.VARIANTE,
    title: actionLabel,
    description: [tipo, titolo, stato].filter(Boolean).join(" · "),
    meta: { varianteId: variante.id || null, azione },
  });
}
