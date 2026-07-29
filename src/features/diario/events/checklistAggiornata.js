import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoChecklistAggiornata({
  azione = "aggiornata",
  testo = "",
  completata = null,
} = {}) {
  let description = testo || "Checklist aggiornata.";
  if (azione === "aggiunta") description = `Aggiunta: ${testo}`;
  if (azione === "rimossa") description = `Rimossa: ${testo}`;
  if (azione === "completata") description = `Completata: ${testo}`;
  if (azione === "riaperta") description = `Riaperta: ${testo}`;

  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.CHECKLIST,
    title: "Checklist",
    description,
    meta: { azione, completata },
  });
}
