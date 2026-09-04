import { Capacitor } from "@capacitor/core";

/**
 * Helper export/apertura URL sicuri su Capacitor (WKWebView).
 * Nessuna nuova feature: solo evitare doc.save / <a download> / window.open inaffidabili.
 *
 * Capacitor.isNativePlatform() è true sia su iPhone sia su iPad:
 * stesso percorso Share Sheet (UX-6.6). Non serve un ramo device-specific.
 */

export function isPiattaformaNativa() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function creaFileDaBlob(blob, nomeFile) {
  const fileName = nomeFile || "documento.pdf";
  return new File([blob], fileName, {
    type: blob.type || "application/pdf",
  });
}

function navigatorSupportaShare() {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

function isErroreAnnullamentoShare(errore) {
  return errore?.name === "AbortError";
}

/**
 * Scarica un blob su web via <a download>.
 * @param {Blob} blob
 * @param {string} nomeFile
 * @returns {{ success: boolean, metodo?: string, error?: string }}
 */
function scaricaBlobWeb(blob, nomeFile) {
  if (typeof document === "undefined") {
    return { success: false, error: "document_assente" };
  }

  const fileName = nomeFile || "documento.pdf";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return { success: true, metodo: "download" };
}

/**
 * Apre il foglio di condivisione nativo con un file allegato.
 * Su iOS/Capacitor non usa canShare come gate: spesso restituisce false
 * pur supportando navigator.share({ files }).
 *
 * @param {Blob} blob
 * @param {string} nomeFile
 * @param {{ titolo?: string }=} opzioni
 * @returns {Promise<{ success: boolean, metodo?: string, error?: string, annullato?: boolean }>}
 */
export async function condividiBlob(blob, nomeFile, opzioni = {}) {
  if (!blob) {
    return { success: false, error: "blob_mancante" };
  }

  if (!navigatorSupportaShare()) {
    if (isPiattaformaNativa()) {
      return { success: false, error: "share_non_supportato" };
    }
    return scaricaBlobWeb(blob, nomeFile);
  }

  const titolo = opzioni.titolo || nomeFile || "Documento";
  const fileName = nomeFile || "documento.pdf";
  const file = creaFileDaBlob(blob, fileName);
  const payload = { files: [file], title: titolo };

  try {
    await navigator.share(payload);
    return { success: true, metodo: "share" };
  } catch (errore) {
    if (isErroreAnnullamentoShare(errore)) {
      return { success: false, error: "annullato", annullato: true };
    }

    if (isPiattaformaNativa()) {
      return { success: false, error: errore?.message || "share_fallito" };
    }

    // Web: fallback download solo se la share non è disponibile o fallisce.
    return scaricaBlobWeb(blob, fileName);
  }
}

/**
 * Su web: download via <a download>.
 * Su native: Share Sheet con File (stesso meccanismo di condividiBlob).
 * @param {Blob} blob
 * @param {string} nomeFile
 * @param {{ titolo?: string }=} opzioni
 * @returns {Promise<{ success: boolean, metodo?: string, error?: string, annullato?: boolean }>}
 */
export async function esportaBlob(blob, nomeFile, opzioni = {}) {
  if (!blob) {
    return { success: false, error: "blob_mancante" };
  }

  const nativo = isPiattaformaNativa();

  if (nativo) {
    return condividiBlob(blob, nomeFile, opzioni);
  }

  // UX-6.6: Safari / PWA iPhone — Share Sheet se supporta File
  if (navigatorSupportaShare() && typeof navigator.canShare === "function") {
    const titolo = opzioni.titolo || nomeFile || "Documento";
    const fileName = nomeFile || "documento.pdf";
    const file = creaFileDaBlob(blob, fileName);
    const payload = { files: [file], title: titolo };

    if (navigator.canShare(payload)) {
      try {
        await navigator.share(payload);
        return { success: true, metodo: "share" };
      } catch (errore) {
        if (isErroreAnnullamentoShare(errore)) {
          return { success: false, error: "annullato", annullato: true };
        }
        // Fall-through al download tradizionale.
      }
    }
  }

  return scaricaBlobWeb(blob, nomeFile);
}

/**
 * Apre URL esterni (es. wa.me). Su native evita window.open.
 * @param {string} url
 */
export function apriUrlEsterno(url) {
  const destinazione = String(url || "").trim();
  if (!destinazione) return;

  if (isPiattaformaNativa() && typeof globalThis.location !== "undefined") {
    globalThis.location.href = destinazione;
    return;
  }

  if (typeof globalThis.open === "function") {
    globalThis.open(destinazione, "_blank", "noopener,noreferrer");
    return;
  }

  if (typeof globalThis.location !== "undefined") {
    globalThis.location.href = destinazione;
  }
}
