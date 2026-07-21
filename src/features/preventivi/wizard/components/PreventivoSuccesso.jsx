import { FileText, Plus, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

import { routePreventivo } from "../../../../app/routes";
import { formatEuro, calcolaTotali } from "../../../../utils/preventivi";

export default function PreventivoSuccesso({
  preventivo,
  condizioni,
  lavorazioni,
  onNuovoPreventivo,
}) {
  const numero = preventivo.numero || `PREV-${preventivo.id}`;
  const totali = calcolaTotali(
    lavorazioni,
    condizioni.sconto,
    condizioni.iva
  );

  async function condividi() {
    const testo = `Preventivo ${numero} per ${preventivo.cliente} — Totale ${formatEuro(totali.totale)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Preventivo ${numero}`,
          text: testo,
        });
        return;
      } catch (errore) {
        if (errore?.name === "AbortError") return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(testo);
    }
  }

  return (
    <div className="px-4 py-8 space-y-6 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-yellow-400/15 border border-yellow-300/30 flex items-center justify-center">
        <span className="text-4xl" aria-hidden="true">
          ✓
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-black">Preventivo creato!</h2>
        <p className="text-yellow-200 font-bold mt-2">{numero}</p>
        <p className="text-slate-400 text-sm mt-2">
          {preventivo.cliente} · {formatEuro(totali.totale)}
        </p>
        <p className="text-slate-500 text-xs mt-3">
          Il PDF è stato scaricato sul dispositivo.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={condividi}
          className="w-full btn-primary py-4 font-black flex items-center justify-center gap-2"
        >
          <Share2 size={18} aria-hidden="true" />
          Condividi riepilogo
        </button>

        <Link
          to={routePreventivo(preventivo.id)}
          className="w-full btn-secondary py-4 font-black flex items-center justify-center gap-2"
        >
          <FileText size={18} aria-hidden="true" />
          Apri dettaglio
        </Link>
      </div>

      <button
        type="button"
        onClick={onNuovoPreventivo}
        className="text-yellow-200 font-bold text-sm flex items-center justify-center gap-1.5 mx-auto min-h-11"
      >
        <Plus size={16} aria-hidden="true" />
        Nuovo preventivo
      </button>
    </div>
  );
}
