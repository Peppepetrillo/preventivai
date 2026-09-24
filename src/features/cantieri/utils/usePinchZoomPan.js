import { useCallback, useEffect, useRef, useState } from "react";

import {
  applicaDoppioTap,
  applicaPan,
  applicaZoomAt,
  centroTouches,
  distanzaTouches,
  stileTransformZoom,
  ZOOM_MAX,
  ZOOM_MIN,
} from "./pinchZoomPan";

const ZOOM_STEP = 0.25;

/**
 * Hook gesture pinch/pan/double-tap per viewer fullscreen.
 * Durante il gesto aggiorna il DOM via rAF; React state solo a fine gesto / +/-.
 * @param {{ enabled?: boolean }=} opzioni
 */
export function usePinchZoomPan({ enabled = true } = {}) {
  const [stato, setStato] = useState({ scale: ZOOM_MIN, x: 0, y: 0 });
  const statoRef = useRef(stato);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const lastTapRef = useRef(0);
  const rafRef = useRef(0);
  const pendingRef = useRef(null);

  useEffect(() => {
    statoRef.current = stato;
  }, [stato]);

  const applicaStileContenuto = useCallback((prossimo) => {
    const el = contentRef.current;
    if (!el) return;
    const stile = stileTransformZoom(prossimo);
    el.style.transform = stile.transform;
    el.style.transformOrigin = stile.transformOrigin;
    el.style.willChange = stile.willChange;
    el.style.touchAction = stile.touchAction;
  }, []);

  const schedulaStato = useCallback(
    (prossimo) => {
      pendingRef.current = prossimo;
      statoRef.current = prossimo;
      applicaStileContenuto(prossimo);
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        if (pendingRef.current) {
          setStato(pendingRef.current);
          pendingRef.current = null;
        }
      });
    },
    [applicaStileContenuto]
  );

  const commitStato = useCallback(
    (prossimo) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      pendingRef.current = null;
      statoRef.current = prossimo;
      applicaStileContenuto(prossimo);
      setStato(prossimo);
    },
    [applicaStileContenuto]
  );

  const reset = useCallback(() => {
    commitStato({ scale: ZOOM_MIN, x: 0, y: 0 });
    pinchRef.current = null;
    panRef.current = null;
  }, [commitStato]);

  useEffect(() => {
    if (!enabled) {
      pinchRef.current = null;
      panRef.current = null;
      statoRef.current = { scale: ZOOM_MIN, x: 0, y: 0 };
      applicaStileContenuto({ scale: ZOOM_MIN, x: 0, y: 0 });
      setStato({ scale: ZOOM_MIN, x: 0, y: 0 });
    }
  }, [enabled, applicaStileContenuto]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const zoomIn = useCallback(() => {
    const attuale = statoRef.current;
    const centro = {
      cx: (containerRef.current?.clientWidth || 0) / 2,
      cy: (containerRef.current?.clientHeight || 0) / 2,
    };
    commitStato(
      applicaZoomAt(
        attuale,
        (attuale.scale + ZOOM_STEP) / Math.max(attuale.scale, 0.01),
        centro
      )
    );
  }, [commitStato]);

  const zoomOut = useCallback(() => {
    const attuale = statoRef.current;
    const centro = {
      cx: (containerRef.current?.clientWidth || 0) / 2,
      cy: (containerRef.current?.clientHeight || 0) / 2,
    };
    const target = Math.max(ZOOM_MIN, attuale.scale - ZOOM_STEP);
    commitStato(
      applicaZoomAt(attuale, target / Math.max(attuale.scale, 0.01), centro)
    );
  }, [commitStato]);

  const onTouchStart = useCallback(
    (evento) => {
      if (!enabled) return;
      const touches = evento.touches;
      if (touches.length === 2) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        pinchRef.current = {
          distanza: distanzaTouches(touches[0], touches[1]),
          centro: centroTouches(touches[0], touches[1], rect),
          stato: { ...statoRef.current },
        };
        panRef.current = null;
        return;
      }
      if (touches.length === 1 && statoRef.current.scale > ZOOM_MIN + 0.01) {
        panRef.current = {
          x: touches[0].clientX,
          y: touches[0].clientY,
          stato: { ...statoRef.current },
        };
      }
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (evento) => {
      if (!enabled) return;
      const touches = evento.touches;
      if (touches.length === 2 && pinchRef.current) {
        evento.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const dist = distanzaTouches(touches[0], touches[1]);
        const factor = dist / Math.max(pinchRef.current.distanza, 1);
        const centro = centroTouches(touches[0], touches[1], rect);
        schedulaStato(
          applicaZoomAt(pinchRef.current.stato, factor, centro)
        );
        return;
      }
      if (touches.length === 1 && panRef.current) {
        evento.preventDefault();
        const dx = touches[0].clientX - panRef.current.x;
        const dy = touches[0].clientY - panRef.current.y;
        schedulaStato(applicaPan(panRef.current.stato, { dx, dy }));
      }
    },
    [enabled, schedulaStato]
  );

  const onTouchEnd = useCallback(
    (evento) => {
      if (!enabled) return;
      if (evento.touches.length < 2) pinchRef.current = null;
      if (evento.touches.length === 0) panRef.current = null;

      if (evento.changedTouches.length === 1 && evento.touches.length === 0) {
        const now = Date.now();
        if (now - lastTapRef.current < 280) {
          const rect = containerRef.current?.getBoundingClientRect();
          const t = evento.changedTouches[0];
          if (rect) {
            commitStato(
              applicaDoppioTap(statoRef.current, {
                cx: t.clientX - rect.left,
                cy: t.clientY - rect.top,
              })
            );
          }
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      }
    },
    [enabled, commitStato]
  );

  return {
    stato,
    reset,
    zoomIn,
    zoomOut,
    canZoomIn: stato.scale < ZOOM_MAX - 0.001,
    canZoomOut: stato.scale > ZOOM_MIN + 0.001,
    containerRef,
    contentRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    stageStyle: { touchAction: "none", overflow: "hidden" },
    contentStyle: stileTransformZoom(stato),
    isZoomed: stato.scale > ZOOM_MIN + 0.01,
  };
}
