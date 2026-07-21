import { memo } from "react";
import { Minus, Plus } from "lucide-react";

function Stepper({
  valore,
  onDiminuisci,
  onAumenta,
  nomeVoce = "voce",
}) {
  return (
    <div
      className="inline-flex items-center rounded-[12px] border border-white/10 bg-black/20"
      role="group"
      aria-label={`Quantità ${nomeVoce}`}
    >
      <button
        type="button"
        onClick={onDiminuisci}
        className="w-9 h-9 flex items-center justify-center text-yellow-200"
        aria-label={`Diminuisci quantità di ${nomeVoce}`}
      >
        <Minus size={16} aria-hidden="true" />
      </button>

      <span
        className="min-w-[2rem] text-center text-sm font-black tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {valore}
      </span>

      <button
        type="button"
        onClick={onAumenta}
        className="w-9 h-9 flex items-center justify-center text-yellow-200"
        aria-label={`Aumenta quantità di ${nomeVoce}`}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default memo(Stepper);
