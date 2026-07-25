/**
 * Badge origine / affidabilità Base Tecnica.
 */

import { etichettaAffidabilita, etichettaOrigine } from "./knowledgeExplanationUtils";

const STILI_AFFIDABILITA = {
  ALTO: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  MEDIO: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  BASSO: "border-white/15 bg-white/[0.06] text-slate-300",
};

function KnowledgeBadge({ tipo, valore, className = "" }) {
  if (!valore) return null;

  if (tipo === "origine") {
    return (
      <span
        className={`inline-flex items-center rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-slate-200 ${className}`}
      >
        {etichettaOrigine(valore?.tipo || valore)}
      </span>
    );
  }

  if (tipo === "affidabilita") {
    const stile = STILI_AFFIDABILITA[valore] || STILI_AFFIDABILITA.BASSO;
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${stile} ${className}`}
      >
        Affidabilità: {etichettaAffidabilita(valore)}
      </span>
    );
  }

  return null;
}

export default KnowledgeBadge;
