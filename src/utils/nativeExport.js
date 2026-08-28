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

/**
 * Su web: download via <a download>.
 * Su native / Safari-PWA con file sharing: Web Share API con File.
 * @param {Blob} blob
 * @param {string} nomeFile
 * @param {{ titolo?: string }=} opzioni
 * @returns {Promise<{ success: boolean, metodo?: string, error?: string }>}
 */
export async function esportaBlob(blob, nomeFile, opzioni = {}) {
  if (!blob) {
    return { success: false, error: "blob_mancante" };
  }

  const titolo = opzioni.titolo || nomeFile || "Documento";
  const fileName = nomeFile || "documento.pdf";
  const file = new File([blob], fileName, {
    type: blob.type || "application/pdf",
  });

  const nativo = isPiattaformaNativa();
  const puoShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (nativo && puoShare) {
    try {
      const payload = { files: [file], title: titolo };
      if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
        await navigator.share({ title: titolo, text: titolo });
        return { success: true, metodo: "share_testo" };
      }
      await navigator.share(payload);
      return { success: true, metodo: "share" };
    } catch (errore) {
      if (errore?.name === "AbortError") {
        return { success: false, error: "annullato" };
      }
      // Nessun fallback download su native: non funziona in WKWebView.
      return { success: false, error: errore?.message || "share_fallito" };
    }
  }

  // UX-6.6: Safari / PWA iPhone — Share Sheet se supporta File
  if (
    !nativo &&
    puoShare &&
    typeof navigator.canShare === "function"
  ) {
    const payload = { files: [file], title: titolo };
    if (navigator.canShare(payload)) {
      try {
        await navigator.share(payload);
        return { success: true, metodo: "share" };
      } catch (errore) {
        if (errore?.name === "AbortError") {
          return { success: false, error: "annullato" };
        }
        // Fall-through al download tradizionale.
      }
    }
  }

  if (typeof document === "undefined") {
    return { success: false, error: "document_assente" };
  }

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
