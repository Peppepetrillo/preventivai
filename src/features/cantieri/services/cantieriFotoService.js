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

export async function apriFotoCantiere(foto) {
  if (foto.storagePath) {
    const urlFirmato = await creaUrlFirmatoFotoCantiere(foto.storagePath);

    if (urlFirmato) {
      window.open(urlFirmato, "_blank", "noopener,noreferrer");
      return;
    }
  }

  window.open(foto.src, "_blank", "noopener,noreferrer");
}
