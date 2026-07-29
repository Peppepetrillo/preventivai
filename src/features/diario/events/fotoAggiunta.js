import { createDiarioEvent } from "./createDiarioEvent";
import { DIARIO_EVENT_TYPES } from "./constants";

export function creaEventoFotoAggiunta(foto) {
  return createDiarioEvent({
    type: DIARIO_EVENT_TYPES.FOTO,
    title: "Foto aggiunta",
    description: foto?.nome || "Nuova foto salvata nel cantiere.",
    attachments: foto
      ? [
          {
            id: foto.id,
            type: "image",
            src: foto.src || "",
            thumbnail: foto.miniatura || foto.src || "",
            alt: foto.nome || "Foto cantiere",
          },
        ]
      : [],
    meta: { fotoId: foto?.id || null },
  });
}
