import { ChevronDown } from "lucide-react";

/**
 * Sezione collassabile per Dettaglio Preventivo (progressive disclosure).
 */
export default function PreventivoSezioneCollapsible({
  id,
  titolo,
  sottotitolo,
  defaultOpen = false,
  badge = null,
  sectionRef,
  children,
}) {
  return (
    <details
      ref={sectionRef}
      id={id}
      className="pro-panel mb-4 group overflow-hidden"
      defaultOpen={defaultOpen}
      data-testid={`preventivo-sezione-${id}`}
    >
      <summary className="list-none cursor-pointer p-5 min-h-[44px] flex items-center gap-3 select-none">
        <div className="min-w-0 flex-1">
          <h2 className="ds-section-title">{titolo}</h2>
          {sottotitolo ? (
            <p className="ds-text-secondary mt-1">{sottotitolo}</p>
          ) : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
        <ChevronDown
          size={20}
          aria-hidden="true"
          className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="px-5 pb-5 pt-0 border-t border-white/[0.06] space-y-4">
        {children}
      </div>
    </details>
  );
}
