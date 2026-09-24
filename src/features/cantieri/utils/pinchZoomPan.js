/**
 * Pinch / pan / double-tap zoom — logica pura + hook leggero.
 * Usato da CantiereFotoViewer e PdfAnteprima (wrapper).
 */

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;

/**
 * @param {{ scale: number, x: number, y: number }} stato
 * @param {number} factor
 * @param {{ cx: number, cy: number }} punto — centro pinch in coordinate container
 */
export function applicaZoomAt(stato, factor, punto) {
  const prev = stato.scale;
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev * factor));
  if (next === prev) return stato;

  const ratio = next / prev;
  const x = punto.cx - (punto.cx - stato.x) * ratio;
  const y = punto.cy - (punto.cy - stato.y) * ratio;

  if (next <= ZOOM_MIN + 0.001) {
    return { scale: ZOOM_MIN, x: 0, y: 0 };
  }
  return { scale: next, x, y };
}

/**
 * @param {{ scale: number, x: number, y: number }} stato
 * @param {{ dx: number, dy: number }} delta
 */
export function applicaPan(stato, delta) {
  if (stato.scale <= ZOOM_MIN + 0.001) {
    return { scale: ZOOM_MIN, x: 0, y: 0 };
  }
  return {
    scale: stato.scale,
    x: stato.x + delta.dx,
    y: stato.y + delta.dy,
  };
}

/**
 * Doppio tap: alterna 1 ↔ 2.5 centrato sul punto.
 */
export function applicaDoppioTap(stato, punto) {
  if (stato.scale > 1.2) {
    return { scale: ZOOM_MIN, x: 0, y: 0 };
  }
  return applicaZoomAt({ scale: 1, x: 0, y: 0 }, 2.5, punto);
}

export function distanzaTouches(a, b) {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

export function centroTouches(a, b, rect) {
  const mx = (a.clientX + b.clientX) / 2;
  const my = (a.clientY + b.clientY) / 2;
  return {
    cx: mx - rect.left,
    cy: my - rect.top,
  };
}

export function stileTransformZoom(stato) {
  return {
    transform: `translate3d(${stato.x}px, ${stato.y}px, 0) scale(${stato.scale})`,
    transformOrigin: "0 0",
    touchAction: "none",
    willChange: "transform",
  };
}
