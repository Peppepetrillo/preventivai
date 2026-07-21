import { memo } from "react";

import { KIT_LISTINO } from "../kitListinoDomain";

function KitRapidiBar({ onAggiungiKit }) {
  return (
    <section className="space-y-2" aria-label="Kit rapidi">
      <p className="text-xs font-bold uppercase text-slate-500 px-1">
        Kit rapidi
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {KIT_LISTINO.map((kit) => (
          <button
            key={kit.id}
            type="button"
            onClick={() => onAggiungiKit(kit)}
            className="shrink-0 px-4 py-3 rounded-[14px] bg-white/8 border border-white/10 text-left min-w-[132px] active:scale-[0.98] transition hover:border-yellow-300/35"
            aria-label={`Aggiungi kit ${kit.nome}`}
          >
            <p className="font-black text-sm leading-tight">{kit.nome}</p>
            <p className="text-xs text-slate-500 mt-1">
              {kit.voci.length} voci
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default memo(KitRapidiBar);
