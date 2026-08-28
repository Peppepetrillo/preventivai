import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Voce sezione "Da fare" — Home Oggi (UX-8.2).
 */
export default function HomeDaFareItem({ voce }) {
  if (!voce) return null;

  return (
    <Link
      to={voce.link}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-white/10 bg-black/[0.18] px-4 py-4 min-h-[64px]"
      data-testid={voce.testId}
      aria-label={`${voce.sottotitolo}: ${voce.titolo}`}
    >
      <div className="min-w-0 flex-1">
        {voce.importoLabel ? (
          <p className="text-lg font-semibold text-yellow-200 tabular-nums">
            {voce.importoLabel}
          </p>
        ) : null}
        <p className="ds-text-primary font-medium truncate">{voce.titolo}</p>
        <p className="ds-text-secondary text-sm mt-0.5">{voce.sottotitolo}</p>
      </div>
      <ChevronRight
        size={20}
        className="text-slate-400 shrink-0"
        aria-hidden="true"
      />
    </Link>
  );
}
