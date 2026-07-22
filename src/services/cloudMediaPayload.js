import { STORAGE_KEYS } from "../app/storageKeys";

/**
 * Path Storage immutabile: evita upsert (RLS senza UPDATE affidabile).
 * Ogni upload riuscito usa un oggetto nuovo; i riferimenti restano su storagePath.
 */
export function creaPathFotoCantiereImmutabile({
  utenteId,
  cantiereId,
  fotoId,
  estensione = "jpeg",
}) {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = String(estensione || "jpeg").replace(/^\./, "");
  return `${utenteId}/${cantiereId}/${fotoId}-${token}.${ext}`;
}

/**
 * Rimuove blob `data:` a piena risoluzione dal payload destinato ad `app_records`.
 * La copia locale può ancora contenere `src` data: per ritentare l'upload.
 * La miniatura (thumb) può restare inline per la lista offline; il full-size no.
 */
export function sanitizzaCantieriPerAppRecords(cantieri) {
  if (!Array.isArray(cantieri)) return cantieri;

  return cantieri.map((cantiere) => {
    if (!cantiere || typeof cantiere !== "object") return cantiere;
    if (!Array.isArray(cantiere.foto)) return cantiere;

    return {
      ...cantiere,
      foto: cantiere.foto.map((foto) => {
        if (!foto || typeof foto !== "object") return foto;
        const src = String(foto.src || "");
        if (!src.startsWith("data:")) return foto;
        return {
          ...foto,
          src: "",
        };
      }),
    };
  });
}

/**
 * Prepara il valore da accodare/upsertare sul cloud.
 * @param {string} chiave
 * @param {unknown} valore
 */
export function preparaPayloadCloud(chiave, valore) {
  if (chiave === STORAGE_KEYS.cantieri) {
    return sanitizzaCantieriPerAppRecords(valore);
  }
  return valore;
}

/**
 * True se qualche foto ha ancora un `src` data: (full image in app_records).
 */
export function payloadContieneDataUrl(valore) {
  if (!Array.isArray(valore)) return false;
  return valore.some((cantiere) =>
    (cantiere?.foto || []).some((foto) =>
      String(foto?.src || "").startsWith("data:")
    )
  );
}
