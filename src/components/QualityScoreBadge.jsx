/**
 * Badge score Controllo Qualità.
 * 90–100 verde · 70–89 arancione · 0–69 rosso
 */

/**
 * @param {number} score
 * @returns {"verde"|"arancione"|"rosso"}
 */
export function fasciaScoreQualita(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n >= 90) return "verde";
  if (n >= 70) return "arancione";
  return "rosso";
}

const STILI = {
  verde: {
    emoji: "🟢",
    className: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    label: "Ottimo",
  },
  arancione: {
    emoji: "🟠",
    className: "bg-amber-500/15 text-amber-100 border-amber-400/30",
    label: "Attenzione",
  },
  rosso: {
    emoji: "🔴",
    className: "bg-red-500/15 text-red-200 border-red-400/30",
    label: "Critico",
  },
};

/**
 * @param {{ score: number, className?: string }} props
 */
export default function QualityScoreBadge({ score = 0, className = "" }) {
  const fascia = fasciaScoreQualita(score);
  const stile = STILI[fascia];
  const valore = Math.max(0, Math.min(100, Number(score) || 0));

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[14px] border px-3.5 py-2 min-h-[44px] ${stile.className} ${className}`}
      data-fascia={fascia}
      aria-label={`Punteggio qualità ${valore} su 100, ${stile.label}`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {stile.emoji}
      </span>
      <span className="text-lg font-black tabular-nums tracking-tight">
        {valore}
        <span className="text-sm font-semibold opacity-80"> /100</span>
      </span>
    </span>
  );
}
