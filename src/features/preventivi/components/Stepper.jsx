import { memo, useCallback, useState } from "react";
import { Minus, Plus } from "lucide-react";

import NumericInput from "../../../components/NumericInput";

/**
 * Stepper quantità — Design System: target ≥44pt, densità carrello opzionale.
 */
function Stepper({
  valore,
  onDiminuisci,
  onAumenta,
  onImpostaValore,
  nomeVoce = "voce",
  compatto = false,
}) {
  const [inModifica, setInModifica] = useState(false);
  const hit = compatto
    ? "min-w-[44px] min-h-[44px]"
    : "min-w-[44px] min-h-[44px]";

  const avviaModifica = useCallback(() => {
    if (!onImpostaValore) return;
    setInModifica(true);
  }, [onImpostaValore]);

  const conferma = useCallback(
    (prossimo) => {
      if (typeof prossimo !== "number") return;
      onImpostaValore?.(prossimo);
    },
    [onImpostaValore]
  );

  return (
    <div
      className={`inline-flex items-center rounded-[16px] border border-white/10 ${
        compatto ? "bg-white/[0.04]" : "bg-black/20"
      }`}
      role="group"
      aria-label={`Quantità ${nomeVoce}`}
    >
      <button
        type="button"
        onClick={onDiminuisci}
        className={`${hit} flex items-center justify-center text-slate-300`}
        aria-label={`Diminuisci quantità di ${nomeVoce}`}
      >
        <Minus size={compatto ? 15 : 16} aria-hidden="true" />
      </button>

      {inModifica && onImpostaValore ? (
        <NumericInput
          autoFocus
          aria-label={`Modifica quantità di ${nomeVoce}`}
          value={valore}
          inputMode="numeric"
          className="w-12 min-h-[44px] text-center text-[16px] font-semibold tabular-nums bg-transparent outline-none text-white"
          onChange={(prossimo) => conferma(prossimo)}
          onBlur={() => setInModifica(false)}
        />
      ) : (
        <button
          type="button"
          onClick={avviaModifica}
          disabled={!onImpostaValore}
          className={`${hit} px-0.5 text-center text-[15px] font-semibold tabular-nums text-white disabled:pointer-events-none`}
          aria-live="polite"
          aria-atomic="true"
          aria-label={
            onImpostaValore
              ? `Quantità ${nomeVoce}: ${valore}. Tocca per modificare`
              : `Quantità ${nomeVoce}: ${valore}`
          }
        >
          {valore}
        </button>
      )}

      <button
        type="button"
        onClick={onAumenta}
        className={`${hit} flex items-center justify-center text-slate-300`}
        aria-label={`Aumenta quantità di ${nomeVoce}`}
      >
        <Plus size={compatto ? 15 : 16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default memo(Stepper);
