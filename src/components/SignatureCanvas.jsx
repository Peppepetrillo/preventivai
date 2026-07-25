import { useEffect, useRef, useState } from "react";
import { Eraser, Check } from "lucide-react";

/**
 * Canvas firma a mano libera (touch + mouse).
 * Controllato: Cancella / Conferma.
 */
export default function SignatureCanvas({
  onConferma,
  onAnnulla,
  altezza = 180,
  etichettaConferma = "Conferma firma",
}) {
  const canvasRef = useRef(null);
  const disegnoRef = useRef(false);
  const ultimoPuntoRef = useRef(null);
  const [vuoto, setVuoto] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    function ridimensiona() {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.4;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      setVuoto(true);
      ultimoPuntoRef.current = null;
    }

    ridimensiona();
    window.addEventListener("resize", ridimensiona);
    return () => window.removeEventListener("resize", ridimensiona);
  }, []);

  function puntoDaEvento(evento) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source =
      evento.touches && evento.touches[0]
        ? evento.touches[0]
        : evento.changedTouches && evento.changedTouches[0]
          ? evento.changedTouches[0]
          : evento;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  }

  function inizia(evento) {
    evento.preventDefault();
    disegnoRef.current = true;
    ultimoPuntoRef.current = puntoDaEvento(evento);
  }

  function muovi(evento) {
    if (!disegnoRef.current) return;
    evento.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const prossimo = puntoDaEvento(evento);
    const precedente = ultimoPuntoRef.current;
    if (precedente) {
      ctx.beginPath();
      ctx.moveTo(precedente.x, precedente.y);
      ctx.lineTo(prossimo.x, prossimo.y);
      ctx.stroke();
    }
    ultimoPuntoRef.current = prossimo;
    setVuoto(false);
  }

  function termina(evento) {
    if (evento) evento.preventDefault();
    disegnoRef.current = false;
    ultimoPuntoRef.current = null;
  }

  function cancella() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setVuoto(true);
  }

  function conferma() {
    if (vuoto || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onConferma?.(dataUrl);
  }

  return (
    <div className="space-y-3">
      <div
        className="rounded-[14px] border border-white/15 bg-white overflow-hidden touch-none"
        style={{ height: altezza }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          aria-label="Area firma"
          onMouseDown={inizia}
          onMouseMove={muovi}
          onMouseUp={termina}
          onMouseLeave={termina}
          onTouchStart={inizia}
          onTouchMove={muovi}
          onTouchEnd={termina}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={cancella}
          className="btn-secondary min-h-[44px] px-4 text-sm font-semibold flex items-center gap-2"
        >
          <Eraser size={16} aria-hidden="true" />
          Cancella
        </button>
        {onAnnulla ? (
          <button
            type="button"
            onClick={onAnnulla}
            className="btn-secondary min-h-[44px] px-4 text-sm font-semibold"
          >
            Annulla
          </button>
        ) : null}
        <button
          type="button"
          onClick={conferma}
          disabled={vuoto}
          className="btn-primary min-h-[44px] px-4 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Check size={16} aria-hidden="true" />
          {etichettaConferma}
        </button>
      </div>
    </div>
  );
}
