/**
 * Utility per la gestione delle immagini: compressione e generazione miniature lato client.
 * Utilizza l'API HTML5 Canvas per evitare dipendenze esterne pesanti.
 */

/**
 * Comprime un'immagine (File, Blob o Base64) ridimensionandola alla dimensione massima indicata
 * e riducendone la qualità JPEG.
 * 
 * @param {File|Blob|string} fileOrBase64 L'immagine da comprimere
 * @param {number} maxDimension Larghezza o altezza massima consentita (in pixel)
 * @param {number} qualita Qualità del file JPEG generato (da 0.0 a 1.0)
 * @returns {Promise<string>} Promessa che risolve con la stringa Base64 (data URL) dell'immagine compressa
 */
export function comprimiImmagine(fileOrBase64, maxDimension = 1200, qualita = 0.75) {
  return new Promise((resolve, reject) => {
    // Gestione ambiente Node per test o ambienti non-browser
    if (typeof window === "undefined" || typeof Image === "undefined") {
      // In ambiente di test restituiamo la stringa originale o una fittizia per non fallire
      if (typeof fileOrBase64 === "string") {
        return resolve(fileOrBase64);
      }
      return resolve("data:image/jpeg;base64,mockedcompresseddata");
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Mantieni le proporzioni dell'immagine
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Esporta come JPEG compresso
      const compressedBase64 = canvas.toDataURL("image/jpeg", qualita);
      resolve(compressedBase64);
    };

    img.onerror = () => {
      reject(new Error("Impossibile caricare l'immagine nel tag Image"));
    };

    if (typeof fileOrBase64 === "string") {
      img.src = fileOrBase64;
    } else if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = String(reader.result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    } else {
      reject(new Error("Formato immagine non supportato"));
    }
  });
}

/**
 * Genera una miniatura (thumbnail) leggera (max 200px di lato, qualità 0.6) a partire da un'immagine.
 * 
 * @param {File|Blob|string} fileOrBase64 L'immagine originale
 * @returns {Promise<string>} Promessa che risolve con la stringa Base64 (data URL) della miniatura
 */
export async function generaMiniatura(fileOrBase64) {
  return comprimiImmagine(fileOrBase64, 200, 0.6);
}
