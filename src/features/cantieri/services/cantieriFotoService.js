import { creaFoto } from "../cantieriDomain";
import {
  creaUrlFirmatoFotoCantiere,
  eliminaFotoCantiereStorage,
} from "../../../services/cloudSyncService";
import { comprimiImmagine, generaMiniatura } from "../../../utils/immagini";

export function fileFotoValido(file) {
  return Boolean(file?.type?.startsWith("image/"));
}

export async function preparaFotoCantiere(file) {
  const [imgCompressa, miniatura] = await Promise.all([
    comprimiImmagine(file, 1200, 0.7),
    generaMiniatura(file),
  ]);

  return {
    ...creaFoto({
      nome: file.name,
      src: imgCompressa,
    }),
    miniatura,
    daSincronizzare: true,
  };
}

export function eliminaStorageFotoCantiere(foto) {
  eliminaFotoCantiereStorage(foto?.storagePath);
}

export function eliminaStorageFotoCantieri(foto = []) {
  eliminaFotoCantiereStorage(foto.map((elemento) => elemento.storagePath));
}

/**
 * Risolve l'src visualizzabile in-app (data URL locale o URL firmato Storage).
 * Non apre finestre esterne: il caller mostra il viewer.
 * @param {object} foto
 * @returns {Promise<string>}
 */
export async function risolviSrcFotoCantiere(foto) {
  if (!foto || typeof foto !== "object") return "";

  if (foto.storagePath) {
    try {
      const urlFirmato = await creaUrlFirmatoFotoCantiere(foto.storagePath);
      if (urlFirmato) return urlFirmato;
    } catch {
      // Fallback al riferimento locale sotto.
    }
  }

  const srcLocale = String(foto.src || "").trim();
  if (srcLocale) return srcLocale;

  return String(foto.miniatura || "").trim();
}

/**
 * @deprecated Preferire `risolviSrcFotoCantiere` + viewer in-app.
 * Mantenuta come alias: non usa più window.open.
 */
export async function apriFotoCantiere(foto) {
  return risolviSrcFotoCantiere(foto);
}
