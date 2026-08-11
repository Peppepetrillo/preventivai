/**
 * Riga variante — tap apre modifica.
 */
export default function CatalogoMaterialiVarianteRow({
  variante,
  unitaDefault = "pz",
  onApri,
}) {
  const unita = variante?.unita || unitaDefault;
  const inattiva = variante?.attiva === false;
  const prezzo =
    variante?.prezzoIndicativo != null &&
    Number.isFinite(Number(variante.prezzoIndicativo))
      ? Number(variante.prezzoIndicativo)
      : null;

  return (
    <button
      type="button"
      onClick={() => onApri?.(variante)}
      className={`pro-panel w-full min-h-[56px] px-4 py-3 text-left flex items-center justify-between gap-3 ${
        inattiva ? "opacity-55" : ""
      }`}
      aria-label={`${variante.etichetta}, ${unita}`}
    >
      <div className="min-w-0">
        <p className="ds-text-primary truncate">{variante.etichetta}</p>
        <p className="ds-text-secondary text-xs mt-1">
          {unita}
          {inattiva ? " · disattivata" : ""}
        </p>
      </div>
      {prezzo != null ? (
        <span className="ds-badge shrink-0 tabular-nums">
          {prezzo.toLocaleString("it-IT", {
            style: "currency",
            currency: "EUR",
          })}
        </span>
      ) : (
        <span className="ds-text-secondary text-xs shrink-0">—</span>
      )}
    </button>
  );
}
