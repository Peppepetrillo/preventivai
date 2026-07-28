import { useRef } from "react";

const SOGLIA_PX = 72;

/**
 * Riga swipe-to-action (destra = azione primaria).
 * Solo UX: nessuna persistenza propria.
 */
export default function SwipeableRow({
  children,
  onSwipeRight,
  azioneDestraLabel = "Comprato",
  disabled = false,
  className = "",
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const deltaX = useRef(0);
  const tracking = useRef(false);
  const rowRef = useRef(null);
  const bloccatoVerticale = useRef(false);

  function applicaTrasforma(x) {
    const el = rowRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(x, 120));
    el.style.transform = clamped ? `translate3d(${clamped}px,0,0)` : "";
  }

  function resetTrasforma(animated = true) {
    const el = rowRef.current;
    if (!el) return;
    if (animated) {
      el.style.transition = `transform var(--duration-fast) var(--ease-standard)`;
    }
    el.style.transform = "";
    window.setTimeout(() => {
      if (el) el.style.transition = "";
    }, 180);
  }

  function onTouchStart(event) {
    if (disabled) return;
    const t = event.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    deltaX.current = 0;
    tracking.current = true;
    bloccatoVerticale.current = false;
  }

  function onTouchMove(event) {
    if (!tracking.current || disabled) return;
    const t = event.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (!bloccatoVerticale.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      tracking.current = false;
      resetTrasforma(false);
      return;
    }
    if (dx > 8) {
      bloccatoVerticale.current = true;
      deltaX.current = dx;
      applicaTrasforma(dx);
      if (event.cancelable) event.preventDefault();
    }
  }

  function onTouchEnd() {
    if (!tracking.current || disabled) {
      tracking.current = false;
      return;
    }
    tracking.current = false;
    if (deltaX.current >= SOGLIA_PX) {
      resetTrasforma(true);
      onSwipeRight?.();
    } else {
      resetTrasforma(true);
    }
    deltaX.current = 0;
  }

  return (
    <div className={`relative overflow-hidden rounded-[14px] ${className}`}>
      <div
        className="absolute inset-0 flex items-center pl-4 bg-emerald-500/90 text-slate-950 font-black text-sm pointer-events-none"
        aria-hidden="true"
      >
        ✔ {azioneDestraLabel}
      </div>
      <div
        ref={rowRef}
        className="relative touch-pan-y bg-[#0b1220] will-change-transform"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
