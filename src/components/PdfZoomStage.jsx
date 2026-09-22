import { useEffect, useRef, useState } from "react";

import { usePinchZoomPan } from "../features/cantieri/utils/usePinchZoomPan";
import {
  caricaDocumentoPdf,
  renderPaginePdfSuContenitore,
} from "./pdfCanvasRenderer";

/**
 * Viewer PDF same-document: pagine su canvas + pinch/pan/double-tap condiviso.
 * Usato da PdfAnteprima quando abilitaZoom (Progetto elettrico).
 */
export default function PdfZoomStage({
  blobUrl,
  titolo = "PDF",
  zoomApiRef,
  onScaleChange,
}) {
  const pagesRef = useRef(null);
  const [stato, setStato] = useState("caricamento");
  const [errore, setErrore] = useState("");
  const [pagine, setPagine] = useState(0);
  const attivo = Boolean(blobUrl);

  const zoom = usePinchZoomPan({
    enabled: attivo,
  });

  const resetZoom = zoom.reset;

  useEffect(() => {
    if (zoomApiRef) {
      zoomApiRef.current = {
        scale: zoom.stato.scale,
        zoomIn: zoom.zoomIn,
        zoomOut: zoom.zoomOut,
        reset: zoom.reset,
        canZoomIn: zoom.canZoomIn,
        canZoomOut: zoom.canZoomOut,
      };
    }
    onScaleChange?.({
      scale: zoom.stato.scale,
      canZoomIn: zoom.canZoomIn,
      canZoomOut: zoom.canZoomOut,
    });
  }, [
    zoomApiRef,
    onScaleChange,
    zoom.stato.scale,
    zoom.zoomIn,
    zoom.zoomOut,
    zoom.reset,
    zoom.canZoomIn,
    zoom.canZoomOut,
  ]);

  useEffect(() => {
    let annullato = false;
    let documento = null;

    async function carica() {
      if (!blobUrl || !pagesRef.current) return;
      setStato("caricamento");
      setErrore("");
      setPagine(0);
      resetZoom();

      try {
        documento = await caricaDocumentoPdf(blobUrl);
        if (annullato) {
          documento.destroy?.();
          return;
        }
        const esito = await renderPaginePdfSuContenitore(
          documento,
          pagesRef.current
        );
        if (annullato) return;
        setPagine(esito.pagine);
        setStato("pronto");
      } catch (err) {
        if (annullato) return;
        setErrore(
          err?.message ? String(err.message) : "Impossibile aprire il PDF."
        );
        setStato("errore");
      }
    }

    carica();

    return () => {
      annullato = true;
      documento?.destroy?.();
    };
  }, [blobUrl, resetZoom]);

  return (
    <div
      className="pdf-zoom-stage"
      data-testid="pdf-zoom-stage"
      data-stato={stato}
      aria-label={titolo}
      {...(attivo
        ? {
            ref: zoom.containerRef,
            onTouchStart: zoom.onTouchStart,
            onTouchMove: zoom.onTouchMove,
            onTouchEnd: zoom.onTouchEnd,
            style: zoom.stageStyle,
          }
        : {})}
    >
      {stato === "caricamento" ? (
        <p className="pdf-anteprima-empty" role="status">
          Caricamento PDF…
        </p>
      ) : null}

      {stato === "errore" ? (
        <p className="pdf-anteprima-empty" role="alert">
          {errore || "Anteprima PDF non disponibile."}
        </p>
      ) : null}

      <div
        className="pdf-zoom-stage-content"
        style={attivo ? zoom.contentStyle : undefined}
        data-testid="pdf-zoom-stage-content"
        data-zoomed={zoom.isZoomed ? "true" : "false"}
        data-pagine={pagine}
        {...(attivo ? { ref: zoom.contentRef } : {})}
      >
        <div ref={pagesRef} className="pdf-zoom-stage-pages" />
      </div>
    </div>
  );
}
