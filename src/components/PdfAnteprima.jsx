import { useEffect, useId, useRef, useState } from "react";
import { Download, Minus, Plus, Share2, X } from "lucide-react";

import {
  condividiDaBlobUrl,
  scaricaDaBlobUrl,
  urlPdfFitWidth,
} from "./pdfAnteprimaUtils";

const DURATA_MS = 250;
const ZOOM_PDF_MIN = 1;
const ZOOM_PDF_MAX = 3;
const ZOOM_PDF_STEP = 0.25;

/**
 * Anteprima PDF fullscreen mobile.
 * Solo UI: nessuna generazione PDF / Proposal / Listino.
 *
 * Zoom: pinch nativo del viewer PDF (touch-action pinch-zoom) + controlli +/-.
 * Non impostiamo touchAction:none sul body (bloccherebbe il pinch su iPhone).
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
 *   abilitaZoom?: boolean,
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
  abilitaZoom = false,
}) {
  const titleId = useId();
  const [montato, setMontato] = useState(false);
  const [apertoVisivo, setApertoVisivo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoomCss, setZoomCss] = useState(ZOOM_PDF_MIN);
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
    document.body.style.overflow = "hidden";
    // Non forzare touchAction:none sul body: su iPhone blocca pinch-zoom
    // del viewer PDF nativo nell'iframe.
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [montato]);

  useEffect(() => {
    if (!aperto) setZoomCss(ZOOM_PDF_MIN);
  }, [aperto, blobUrl]);

  useEffect(() => {
    if (!montato || typeof onChiudi !== "function") return undefined;
    function onKey(event) {
      if (event.key === "Escape") onChiudi();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [montato, onChiudi]);

  if (!montato) return null;

  function zoomIn() {
    setZoomCss((z) => Math.min(ZOOM_PDF_MAX, Number((z + ZOOM_PDF_STEP).toFixed(2))));
  }

  function zoomOut() {
    setZoomCss((z) => Math.max(ZOOM_PDF_MIN, Number((z - ZOOM_PDF_STEP).toFixed(2))));
  }

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
      data-zoom-enabled={abilitaZoom ? "true" : "false"}
      data-testid="pdf-anteprima"
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

        {abilitaZoom ? (
          <div
            className="pdf-anteprima-zoom-bar"
            data-testid="pdf-anteprima-zoom-bar"
          >
            <button
              type="button"
              className="pdf-anteprima-btn pdf-anteprima-btn--ghost"
              aria-label="Riduci zoom"
              data-testid="pdf-anteprima-zoom-out"
              disabled={zoomCss <= ZOOM_PDF_MIN}
              onClick={zoomOut}
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <span
              className="pdf-anteprima-zoom-label"
              data-testid="pdf-anteprima-zoom-label"
            >
              {Math.round(zoomCss * 100)}%
            </span>
            <button
              type="button"
              className="pdf-anteprima-btn pdf-anteprima-btn--ghost"
              aria-label="Aumenta zoom"
              data-testid="pdf-anteprima-zoom-in"
              disabled={zoomCss >= ZOOM_PDF_MAX}
              onClick={zoomIn}
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div
          className="pdf-anteprima-viewer"
          data-testid="pdf-anteprima-viewer"
        >
          {blobUrl ? (
            <div
              className="pdf-anteprima-frame-wrap"
              style={
                abilitaZoom
                  ? {
                      width: `${zoomCss * 100}%`,
                      height: `${zoomCss * 100}%`,
                      minHeight: `${zoomCss * 100}%`,
                    }
                  : undefined
              }
            >
              <iframe
                title={titolo}
                src={viewerSrc}
                className="pdf-anteprima-frame"
                allow="fullscreen"
              />
            </div>
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
