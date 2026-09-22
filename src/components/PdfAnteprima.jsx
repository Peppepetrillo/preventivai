import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Download, Minus, Plus, Share2, X } from "lucide-react";

import {
  condividiDaBlobUrl,
  scaricaDaBlobUrl,
  urlPdfFitWidth,
} from "./pdfAnteprimaUtils";
import PdfZoomStage from "./PdfZoomStage";

const DURATA_MS = 250;

/**
 * Anteprima PDF fullscreen mobile.
 * Solo UI: nessuna generazione PDF / Proposal / Listino.
 *
 * Zoom (abilitaZoom): canvas same-document + pinch/pan/double-tap condiviso
 * con CantiereFotoViewer (non iframe nativo — inaffidabile in WKWebView).
 * Senza zoom: iframe FitH per anteprima/condivisione rapida.
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
  const [zoomLabel, setZoomLabel] = useState(100);
  const [canZoomIn, setCanZoomIn] = useState(true);
  const [canZoomOut, setCanZoomOut] = useState(false);
  const chiudiTimer = useRef(null);
  const zoomApiRef = useRef(null);

  const onScaleChange = useCallback((info) => {
    if (!info) return;
    setZoomLabel(Math.round((info.scale || 1) * 100));
    setCanZoomIn(Boolean(info.canZoomIn));
    setCanZoomOut(Boolean(info.canZoomOut));
  }, []);

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
    }, DURATA_MS);
    return () => {
      if (chiudiTimer.current) clearTimeout(chiudiTimer.current);
    };
  }, [aperto]);

  useEffect(() => {
    if (!montato) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [montato]);

  useEffect(() => {
    if (!aperto) {
      setZoomLabel(100);
      setCanZoomIn(true);
      setCanZoomOut(false);
      zoomApiRef.current?.reset?.();
    }
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
    zoomApiRef.current?.zoomIn?.();
  }

  function zoomOut() {
    zoomApiRef.current?.zoomOut?.();
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
              disabled={!canZoomOut}
              onClick={zoomOut}
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <span
              className="pdf-anteprima-zoom-label"
              data-testid="pdf-anteprima-zoom-label"
            >
              {zoomLabel}%
            </span>
            <button
              type="button"
              className="pdf-anteprima-btn pdf-anteprima-btn--ghost"
              aria-label="Aumenta zoom"
              data-testid="pdf-anteprima-zoom-in"
              disabled={!canZoomIn}
              onClick={zoomIn}
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div
          className="pdf-anteprima-viewer"
          data-testid="pdf-anteprima-viewer"
          data-mode={abilitaZoom ? "canvas-zoom" : "iframe"}
        >
          {blobUrl && abilitaZoom ? (
            <PdfZoomStage
              blobUrl={blobUrl}
              titolo={titolo}
              zoomApiRef={zoomApiRef}
              onScaleChange={onScaleChange}
            />
          ) : null}

          {blobUrl && !abilitaZoom ? (
            <div className="pdf-anteprima-frame-wrap">
              <iframe
                title={titolo}
                src={viewerSrc}
                className="pdf-anteprima-frame"
                allow="fullscreen"
              />
            </div>
          ) : null}

          {!blobUrl ? (
            <div className="pdf-anteprima-empty">
              {inElaborazione
                ? "Generazione anteprima…"
                : "Anteprima non disponibile."}
            </div>
          ) : null}
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
