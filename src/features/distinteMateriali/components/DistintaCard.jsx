import { Copy, Pencil, Trash2 } from "lucide-react";

/**
 * Card distinta in elenco — superficie tappabile + azioni.
 */
export default function DistintaCard({
  distinta,
  onApri,
  onDuplica,
  onElimina,
}) {
  const nVoci = Array.isArray(distinta?.voci) ? distinta.voci.length : 0;
  const data = formattaData(distinta?.updatedAt || distinta?.createdAt);

  return (
    <article className="pro-panel overflow-hidden">
      <button
        type="button"
        onClick={() => onApri?.(distinta.id)}
        className="w-full text-left px-4 py-3.5 min-h-[64px]"
        aria-label={`Apri ${distinta.titolo}`}
      >
        <p className="ds-card-title truncate">{distinta.titolo}</p>
        <p className="ds-text-secondary text-sm mt-1">
          {distinta.clienteNome ? `${distinta.clienteNome} · ` : ""}
          {nVoci} {nVoci === 1 ? "voce" : "voci"}
          {data ? ` · ${data}` : ""}
        </p>
      </button>

      <div className="flex border-t border-white/10">
        <button
          type="button"
          onClick={() => onApri?.(distinta.id)}
          className="flex-1 min-h-[48px] text-sm font-bold text-yellow-200 flex items-center justify-center gap-1.5"
        >
          <Pencil size={16} aria-hidden="true" />
          Apri
        </button>
        <button
          type="button"
          onClick={() => onDuplica?.(distinta.id)}
          className="flex-1 min-h-[48px] text-sm font-bold text-slate-300 flex items-center justify-center gap-1.5 border-l border-white/10"
        >
          <Copy size={16} aria-hidden="true" />
          Duplica
        </button>
        <button
          type="button"
          onClick={() => onElimina?.(distinta.id)}
          className="flex-1 min-h-[48px] text-sm font-bold text-red-300 flex items-center justify-center gap-1.5 border-l border-white/10"
        >
          <Trash2 size={16} aria-hidden="true" />
          Elimina
        </button>
      </div>
    </article>
  );
}

function formattaData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("it-IT");
}
