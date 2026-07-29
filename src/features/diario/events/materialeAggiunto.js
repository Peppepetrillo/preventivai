import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoMaterialeAggiunto(materiale) {
  const quantita = Number(materiale?.quantita) || 0;
  const unita = materiale?.unita || "cad";
  const nome = materiale?.nome || "Materiale";
  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.MATERIALE,
    title: "Materiale",
    description:
      quantita > 0 ? `Aggiunti: ${quantita} ${unita} ${nome}` : `Aggiunto: ${nome}`,
    meta: { materialeId: materiale?.id || null },
  });
}
