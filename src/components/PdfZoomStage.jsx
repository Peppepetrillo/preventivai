import { useEffect, useRef, useState } from "react";

import { usePinchZoomPan } from "../features/cantieri/utils/usePinchZoomPan";
import {
  caricaDocumentoPdf,
  deveRirenderizzarePerZoom,
  renderPaginePdfSuContenitore,
} from "./pdfCanvasRenderer";

const RERENDER_DEBOUNCE_MS = 180;

/**
 * Viewer PDF same-document: pagine su canvas + pinch/pan/double-tap condiviso.
 * Usato da PdfAnteprima quando abilitaZoom (Progetto elettrico).
 *
 * Pinch resta su CSS transform; a fine gesto (debounce) si re-renderizza
 * il bitmap alla densità coerente con lo zoom, evitando sgranatura.
 */
export default function PdfZoomStage({
  blobUrl,
  titolo = "PDF",
  zoomApiRef,
  onScaleChange,
}) {
  const pagesRef = useRef(null);
  const documentoRef = useRef(null);
  const renderGenRef = useRef(0);
  const zoomRenderizzatoRef = useRef(1);
  const [stato, setStato] = useState("caricamento");
  const [errore, setErrore] = useState("");
  const [pagine, setPagine] = useState(0);
  const [zoomRenderHd, setZoomRenderHd] = useState(1);
  const attivo = Boolean(blobUrl);

  const zoom = usePinchZoomPan({
    enabled: attivo,
  });

  const resetZoom = zoom.reset;
  const scaleAttuale = zoom.stato.scale;

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
    const signal = { aborted: false };

    async function carica() {
      if (!blobUrl || !pagesRef.current) return;
      setStato("caricamento");
      setErrore("");
      setPagine(0);
      resetZoom();
      zoomRenderizzatoRef.current = 1;
      setZoomRenderHd(1);
      renderGenRef.current += 1;
      const gen = renderGenRef.current;

      try {
        documento = await caricaDocumentoPdf(blobUrl);
        if (annullato || gen !== renderGenRef.current) {
          documento.destroy?.();
          return;
        }
        documentoRef.current = documento;
        const esito = await renderPaginePdfSuContenitore(
          documento,
          pagesRef.current,
          { zoomRender: 1, signal }
        );
        if (annullato || gen !== renderGenRef.current) return;
        zoomRenderizzatoRef.current = esito.zoomRender;
        setZoomRenderHd(esito.zoomRender);
        setPagine(esito.pagine);
        setStato("pronto");
      } catch (err) {
        if (annullato || gen !== renderGenRef.current) return;
        if (err?.name === "AbortError") return;
        setErrore(
          err?.message ? String(err.message) : "Impossibile aprire il PDF."
        );
        setStato("errore");
      }
    }

    carica();

    return () => {
      annullato = true;
      signal.aborted = true;
      renderGenRef.current += 1;
      documentoRef.current = null;
      documento?.destroy?.();
    };
  }, [blobUrl, resetZoom]);

  // Re-render HD dopo settle dello zoom (pinch / +/- / double-tap).
  useEffect(() => {
    if (stato !== "pronto") return undefined;
    if (!documentoRef.current || !pagesRef.current) return undefined;
    if (
      !deveRirenderizzarePerZoom(scaleAttuale, zoomRenderizzatoRef.current)
    ) {
      return undefined;
    }

    const signal = { aborted: false };
    const timer = setTimeout(async () => {
      const documento = documentoRef.current;
      const contenitore = pagesRef.current;
      if (!documento || !contenitore) return;
      if (
        !deveRirenderizzarePerZoom(scaleAttuale, zoomRenderizzatoRef.current)
      ) {
        return;
      }

      renderGenRef.current += 1;
      const gen = renderGenRef.current;
      const targetZoom = Math.max(1, scaleAttuale);

      try {
        const esito = await renderPaginePdfSuContenitore(
          documento,
          contenitore,
          { zoomRender: targetZoom, signal }
        );
        if (signal.aborted || gen !== renderGenRef.current) return;
        zoomRenderizzatoRef.current = esito.zoomRender;
        setZoomRenderHd(esito.zoomRender);
      } catch (err) {
        if (signal.aborted || err?.name === "AbortError") return;
        // Mantieni bitmap precedente: niente errore bloccante su re-render.
      }
    }, RERENDER_DEBOUNCE_MS);

    return () => {
      signal.aborted = true;
      clearTimeout(timer);
    };
  }, [scaleAttuale, stato]);

  return (
    <div
      className="pdf-zoom-stage"
      data-testid="pdf-zoom-stage"
      data-stato={stato}
      data-zoom-render={String(zoomRenderHd)}
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
