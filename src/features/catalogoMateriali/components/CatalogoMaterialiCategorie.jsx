import { ChevronRight } from "lucide-react";

/**
 * Griglia categorie — tutta la card tappabile.
 */
export default function CatalogoMaterialiCategorie({
  categorie = [],
  conteggi = {},
  onApri,
}) {
  return (
    <ul className="grid grid-cols-2 gap-3" role="list">
      {categorie.map(({ id, label, Icon }) => {
        const count = conteggi[id] || 0;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onApri?.(id)}
              className="pro-panel w-full min-h-[96px] px-3.5 py-3.5 text-left flex flex-col justify-between gap-3 active:scale-[0.98] transition-transform"
              aria-label={`${label}, ${count} famiglie`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <ChevronRight
                  size={18}
                  className="text-slate-500 mt-1 shrink-0"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="ds-text-primary text-sm leading-snug">{label}</p>
                <p className="ds-text-secondary text-xs mt-1">
                  {count} {count === 1 ? "famiglia" : "famiglie"}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
