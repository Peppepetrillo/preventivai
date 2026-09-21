import { useCallback, useEffect, useRef, useState } from "react";

import {
  applicaDoppioTap,
  applicaPan,
  applicaZoomAt,
  centroTouches,
  distanzaTouches,
  stileTransformZoom,
  ZOOM_MIN,
} from "./pinchZoomPan";

/**
 * Hook gesture pinch/pan/double-tap per viewer fullscreen.
 * @param {{ enabled?: boolean }=} opzioni
 */
export function usePinchZoomPan({ enabled = true } = {}) {
  const [stato, setStato] = useState({ scale: ZOOM_MIN, x: 0, y: 0 });
  const statoRef = useRef(stato);
  const containerRef = useRef(null);
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const lastTapRef = useRef(0);

  useEffect(() => {
    statoRef.current = stato;
  }, [stato]);

  const reset = useCallback(() => {
    setStato({ scale: ZOOM_MIN, x: 0, y: 0 });
    pinchRef.current = null;
    panRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) reset();
  }, [enabled, reset]);

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
        setStato(
          applicaZoomAt(pinchRef.current.stato, factor, centro)
        );
        return;
      }
      if (touches.length === 1 && panRef.current) {
        evento.preventDefault();
        const dx = touches[0].clientX - panRef.current.x;
        const dy = touches[0].clientY - panRef.current.y;
        setStato(
          applicaPan(panRef.current.stato, { dx, dy })
        );
      }
    },
    [enabled]
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
            setStato(
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
    [enabled]
  );

  const bindProps = {
    ref: containerRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    style: { touchAction: "none", overflow: "hidden" },
  };

  return {
    stato,
    reset,
    bindProps,
    contentStyle: stileTransformZoom(stato),
    isZoomed: stato.scale > ZOOM_MIN + 0.01,
  };
}
