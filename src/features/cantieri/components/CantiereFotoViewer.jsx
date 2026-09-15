import { useEffect } from "react";
import { X } from "lucide-react";

import OverlayPortal from "../../../components/OverlayPortal";

/**
 * Viewer foto cantiere full-screen (Web + Capacitor).
 * Portal + overlayLock: sopra BottomNav su iPhone.
 */
export default function CantiereFotoViewer({
  open,
  src = "",
  titolo = "Foto cantiere",
  loading = false,
  errore = "",
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(evento) {
      if (evento.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <OverlayPortal
      open={open}
      className="ds-fullscreen-overlay"
      aria-label={titolo}
      testId="cantiere-foto-viewer"
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

      <div className="flex-1 min-h-0 flex items-center justify-center px-3 pb-4">
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
            src={src}
            alt={titolo}
            className="max-h-full max-w-full object-contain"
            data-testid="cantiere-foto-viewer-img"
          />
        ) : null}
      </div>
    </OverlayPortal>
  );
}
