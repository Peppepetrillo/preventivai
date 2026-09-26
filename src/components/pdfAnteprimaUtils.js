import { condividiBlob, esportaBlob } from "../utils/nativeExport";

/**
 * URL PDF con hint fit-to-width per viewer che supportano i fragment.
 * @param {string} blobUrl
 * @returns {string}
 */
export function urlPdfFitWidth(blobUrl) {
  if (!blobUrl) return "";
  const base = String(blobUrl).split("#")[0];
  return `${base}#view=FitH&zoom=page-width`;
}

/**
 * Scarica/esporta un PDF da blob URL (solo UI, nessuna generazione).
 * Su iOS Capacitor usa Share invece di <a download>.
 * @param {string} blobUrl
 * @param {string} nomeFile
 */
export async function scaricaDaBlobUrl(blobUrl, nomeFile = "Preventivo.pdf") {
  const risposta = await fetch(blobUrl);
  const blob = await risposta.blob();
  await esportaBlob(blob, nomeFile, { titolo: nomeFile });
}

/**
 * Condivide un PDF via Share Sheet nativo (non download/export).
 * @param {string} blobUrl
 * @param {string} nomeFile
 * @param {string} titolo
 * @param {Blob=} blobNoto Blob già disponibile (evita fetch su blob: URL in WKWebView)
 * @returns {Promise<{ success: boolean, error?: string, fallback?: string, annullato?: boolean }>}
 */
export async function condividiDaBlobUrl(
  blobUrl,
  nomeFile = "Preventivo.pdf",
  titolo = "Anteprima PDF",
  blobNoto = null
) {
  let blob = blobNoto;
  if (!blob && blobUrl) {
    const risposta = await fetch(blobUrl);
    blob = await risposta.blob();
  }
  if (!blob) {
    return { success: false, error: "blob_mancante" };
  }

  const esito = await condividiBlob(blob, nomeFile, { titolo });
  if (esito.success) {
    return {
      success: true,
      fallback: esito.metodo === "download" ? "download" : undefined,
    };
  }
  if (esito.annullato || esito.error === "annullato") {
    return { success: false, error: "annullato", annullato: true };
  }
  return { success: false, error: esito.error || "share_fallito" };
}
