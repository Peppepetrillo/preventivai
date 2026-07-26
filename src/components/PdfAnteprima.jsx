import { useEffect, useId, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";

const DURATA_MS = 250;

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
 * Scarica un PDF da blob URL (solo UI, nessuna generazione).
 * @param {string} blobUrl
 * @param {string} nomeFile
 */
export async function scaricaDaBlobUrl(blobUrl, nomeFile = "Preventivo.pdf") {
  const risposta = await fetch(blobUrl);
  const blob = await risposta.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeFile;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Condivide un PDF da blob URL via Web Share API se disponibile.
 * @param {string} blobUrl
 * @param {string} nomeFile
 * @param {string} titolo
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function condividiDaBlobUrl(
  blobUrl,
  nomeFile = "Preventivo.pdf",
  titolo = "Anteprima PDF"
) {
  const risposta = await fetch(blobUrl);
  const blob = await risposta.blob();
  const file = new File([blob], nomeFile, {
    type: blob.type || "application/pdf",
  });

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const payload = { files: [file], title: titolo };
      if (
        typeof navigator.canShare === "function" &&
        !navigator.canShare(payload)
      ) {
        await navigator.share({ title: titolo, text: titolo, url: blobUrl });
        return { success: true };
      }
      await navigator.share(payload);
      return { success: true };
    } catch (errore) {
      if (errore?.name === "AbortError") {
        return { success: false, error: "annullato" };
      }
      // fallback download
    }
  }

  await scaricaDaBlobUrl(blobUrl, nomeFile);
  return { success: true, fallback: "download" };
}

/**
 * Anteprima PDF fullscreen mobile.
 * Solo UI: nessuna generazione PDF / Proposal / Listino.
 *
 * @param {{
 *   aperto: boolean,
 *   blobUrl?: string,
 *   titolo?: string,
 *   nomeFile?: string,
 *   onChiudi?: () => void,
 *   onRigenera?: () => void,
 *   onCondividi?: () => void|Promise<void>,
 *   onScarica?: () => void|Promise<void>,
 *   inElaborazione?: boolean,
 * }} props
 */
export default function PdfAnteprima({
  aperto,
  blobUrl,
  titolo = "Anteprima PDF",
  nomeFile = "Preventivo.pdf",
  onChiudi,
  onRigenera,
  onCondividi,
  onScarica,
  inElaborazione = false,
}) {
  const titleId = useId();
  const [montato, setMontato] = useState(false);
  const [apertoVisivo, setApertoVisivo] = useState(false);
  const [busy, setBusy] = useState(false);
  const chiudiTimer = useRef(null);

  useEffect(() => {
    if (aperto) {
      if (chiudiTimer.current) {
        clearTimeout(chiudiTimer.current);
        chiudiTimer.current = null;
      }
      setMontato(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setApertoVisivo(true));
      });
      return () => cancelAnimationFrame(id);
    }

    setApertoVisivo(false);
    chiudiTimer.current = setTimeout(() => {
      setMontato(false);
      chiudiTimer.current = null;
    }, DURATA_MS);
    return () => {
      if (chiudiTimer.current) clearTimeout(chiudiTimer.current);
    };
  }, [aperto]);

  useEffect(() => {
    if (!montato) return undefined;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, [montato]);

  useEffect(() => {
    if (!montato || typeof onChiudi !== "function") return undefined;
    function onKey(event) {
      if (event.key === "Escape") onChiudi();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [montato, onChiudi]);

  if (!montato) return null;

  async function handleCondividi() {
    if (busy || !blobUrl) return;
    setBusy(true);
    try {
      if (typeof onCondividi === "function") {
        await onCondividi();
      } else {
        await condividiDaBlobUrl(blobUrl, nomeFile, titolo);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleScarica() {
    if (busy || !blobUrl) return;
    setBusy(true);
    try {
      if (typeof onScarica === "function") {
        await onScarica();
      } else {
        await scaricaDaBlobUrl(blobUrl, nomeFile);
      }
    } finally {
      setBusy(false);
    }
  }

  const viewerSrc = urlPdfFitWidth(blobUrl);

  return (
    <div
      className={`pdf-anteprima-root ${apertoVisivo ? "is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="pdf-anteprima-shell">
        <header className="pdf-anteprima-header">
          <button
            type="button"
            onClick={onChiudi}
            className="pdf-anteprima-btn pdf-anteprima-btn--ghost"
            aria-label="Chiudi anteprima PDF"
          >
            <X size={20} aria-hidden="true" />
            <span>Chiudi</span>
          </button>

          <h2 id={titleId} className="pdf-anteprima-title">
            Anteprima PDF
          </h2>

          <button
            type="button"
            onClick={handleCondividi}
            disabled={busy || !blobUrl || inElaborazione}
            className="pdf-anteprima-btn pdf-anteprima-btn--accent"
            aria-label="Condividi PDF"
          >
            <Share2 size={18} aria-hidden="true" />
            <span>Condividi</span>
          </button>
        </header>

        <div className="pdf-anteprima-viewer">
          {blobUrl ? (
            <iframe
              title={titolo}
              src={viewerSrc}
              className="pdf-anteprima-frame"
            />
          ) : (
            <div className="pdf-anteprima-empty">
              {inElaborazione
                ? "Generazione anteprima…"
                : "Anteprima non disponibile."}
            </div>
          )}
        </div>

        {typeof onRigenera === "function" ? (
          <div className="pdf-anteprima-meta">
            <button
              type="button"
              onClick={onRigenera}
              disabled={inElaborazione}
              className="pdf-anteprima-rigenera"
            >
              {inElaborazione ? "Generazione…" : "Aggiorna anteprima"}
            </button>
          </div>
        ) : null}

        <footer className="pdf-anteprima-toolbar">
          <button
            type="button"
            onClick={handleCondividi}
            disabled={busy || !blobUrl || inElaborazione}
            className="pdf-anteprima-btn pdf-anteprima-btn--primary"
          >
            <Share2 size={18} aria-hidden="true" />
            <span>Condividi PDF</span>
          </button>
          <button
            type="button"
            onClick={handleScarica}
            disabled={busy || !blobUrl || inElaborazione}
            className="pdf-anteprima-btn pdf-anteprima-btn--secondary"
          >
            <Download size={18} aria-hidden="true" />
            <span>Scarica PDF</span>
          </button>
          <button
            type="button"
            onClick={onChiudi}
            className="pdf-anteprima-btn pdf-anteprima-btn--ghost"
          >
            <X size={18} aria-hidden="true" />
            <span>Chiudi</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
