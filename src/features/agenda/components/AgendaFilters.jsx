/**
 * Filtri vista Agenda: Oggi · Domani · Settimana
 */
export default function AgendaFilters({ vista, onCambiaVista }) {
  const voci = [
    { id: "oggi", label: "Oggi" },
    { id: "domani", label: "Domani" },
    { id: "settimana", label: "Settimana" },
  ];

  return (
    <div
      className="flex gap-2 mb-4 overflow-x-auto pb-1"
      role="tablist"
      aria-label="Vista agenda"
    >
      {voci.map((voce) => {
        const attiva = vista === voce.id;
        return (
          <button
            key={voce.id}
            type="button"
            role="tab"
            aria-selected={attiva}
            onClick={() => onCambiaVista?.(voce.id)}
            className={`min-h-[44px] px-4 rounded-full text-sm font-black shrink-0 transition-colors ${
              attiva
                ? "bg-yellow-400 text-black"
                : "bg-white/10 text-slate-300"
            }`}
          >
            {voce.label}
          </button>
        );
      })}
    </div>
  );
}
