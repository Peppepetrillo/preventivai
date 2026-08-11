import { ChevronRight } from "lucide-react";

/**
 * Card famiglia — intera superficie tappabile.
 */
export default function CatalogoMaterialiFamigliaCard({
  famiglia,
  onApri,
}) {
  const nVarianti = Array.isArray(famiglia?.varianti)
    ? famiglia.varianti.length
    : 0;
  const inattiva = famiglia?.attiva === false;

  return (
    <button
      type="button"
      onClick={() => onApri?.(famiglia.id)}
      className={`pro-panel w-full min-h-[64px] px-4 py-3.5 text-left flex items-center gap-3 active:scale-[0.99] transition-transform ${
        inattiva ? "opacity-55" : ""
      }`}
      aria-label={`${famiglia.nome}, ${nVarianti} varianti`}
    >
      <div className="min-w-0 flex-1">
        <p className="ds-card-title truncate">{famiglia.nome}</p>
        <p className="ds-text-secondary text-xs mt-1">
          {nVarianti} {nVarianti === 1 ? "variante" : "varianti"} ·{" "}
          {famiglia.unitaDefault}
          {famiglia.personalizzata ? " · personalizzato" : ""}
          {inattiva ? " · disattivato" : ""}
        </p>
      </div>
      <ChevronRight size={18} className="text-slate-500 shrink-0" aria-hidden="true" />
    </button>
  );
}
