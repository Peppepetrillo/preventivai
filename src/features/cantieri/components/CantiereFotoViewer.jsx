import { useEffect } from "react";
import { X } from "lucide-react";

import { usePinchZoomPan } from "../utils/usePinchZoomPan";

/**
 * Viewer foto cantiere full-screen (Web + Capacitor).
 * Nessun window.open: l'immagine resta nell'app.
 * Pinch / pan / doppio tap quando `abilitaZoom` (progetti elettrici).
 */
export default function CantiereFotoViewer({
  open,
  src = "",
  titolo = "Foto cantiere",
  loading = false,
  errore = "",
  onClose,
  abilitaZoom = false,
}) {
  const zoom = usePinchZoomPan({ enabled: open && abilitaZoom && Boolean(src) });

  const resetZoom = zoom.reset;

  useEffect(() => {
    if (!open) {
      resetZoom();
      return undefined;
    }

    function onKeyDown(evento) {
      if (evento.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, resetZoom]);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black safe-top safe-bottom"
      role="dialog"
      aria-modal="true"
      aria-label={titolo}
      data-testid="cantiere-foto-viewer"
      data-zoom-enabled={abilitaZoom ? "true" : "false"}
    >
      <div className="flex items-center justify-end shrink-0 px-3 pt-2 pb-1">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-transform duration-150"
          aria-label="Chiudi foto"
          data-testid="cantiere-foto-viewer-chiudi"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <div
        className="flex-1 min-h-0 flex items-center justify-center px-3 pb-4"
        {...(abilitaZoom
          ? {
              ref: zoom.containerRef,
              onTouchStart: zoom.onTouchStart,
              onTouchMove: zoom.onTouchMove,
              onTouchEnd: zoom.onTouchEnd,
              style: zoom.stageStyle,
            }
          : {})}
        data-testid="cantiere-foto-viewer-stage"
      >
        {loading ? (
          <p className="ds-text-secondary text-center" role="status">
            Caricamento foto...
          </p>
        ) : null}

        {!loading && errore ? (
          <p className="text-sm text-red-200 text-center px-4" role="alert">
            {errore}
          </p>
        ) : null}

        {!loading && !errore && src ? (
          <img
            ref={abilitaZoom ? zoom.contentRef : undefined}
            src={src}
            alt={titolo}
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
            style={abilitaZoom ? zoom.contentStyle : undefined}
            data-testid="cantiere-foto-viewer-img"
            data-zoomed={zoom.isZoomed ? "true" : "false"}
          />
        ) : null}
      </div>
    </div>
  );
}
