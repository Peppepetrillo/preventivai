import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  EDGE_SWIPE_CONFIG,
  isEdgeSwipeDisabilitato
} from "../app/navigationConfig";
import {
  eseguiNavigazioneIndietro,
  isOverlayNavigazioneAperto,
  targetEscludeEdgeSwipe
} from "./navigateBack";

/**
 * Host globale edge-swipe-back (bordo sinistro → stessa destinazione di PageBackLink).
 * Montare una sola volta dentro HashRouter.
 */
export default function EdgeSwipeBackHost() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { edgeWidthPx, minDistancePx, maxVerticalDriftPx } =
      EDGE_SWIPE_CONFIG;

    /** @type {{ x: number, y: number, attivo: boolean }|null} */
    let gesto = null;

    function onTouchStart(event) {
      if (isEdgeSwipeDisabilitato(location.pathname)) return;
      if (isOverlayNavigazioneAperto()) return;
      if (event.touches.length !== 1) return;

      const t = event.touches[0];
      if (t.clientX > edgeWidthPx) return;
      if (targetEscludeEdgeSwipe(event.target)) return;

      gesto = { x: t.clientX, y: t.clientY, attivo: true };
    }

    function onTouchMove(event) {
      if (!gesto?.attivo) return;
      const t = event.touches[0];
      const dx = t.clientX - gesto.x;
      const dy = t.clientY - gesto.y;
      if (Math.abs(dy) > maxVerticalDriftPx && Math.abs(dy) > Math.abs(dx)) {
        gesto.attivo = false;
        gesto = null;
        return;
      }
      // Evita che lo scroll “rubi” il gesto orizzontale confermato
      if (dx > 12 && event.cancelable) {
        event.preventDefault();
      }
    }

    function onTouchEnd(event) {
      if (!gesto?.attivo) {
        gesto = null;
        return;
      }
      const t = event.changedTouches[0];
      const dx = t.clientX - gesto.x;
      const dy = t.clientY - gesto.y;
      const ok =
        dx >= minDistancePx && Math.abs(dy) <= maxVerticalDriftPx;
      gesto = null;
      if (!ok) return;
      if (isOverlayNavigazioneAperto()) return;
      if (isEdgeSwipeDisabilitato(location.pathname)) return;
      eseguiNavigazioneIndietro(navigate, location.pathname);
    }

    function onTouchCancel() {
      gesto = null;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [location.pathname, navigate]);

  return null;
}
