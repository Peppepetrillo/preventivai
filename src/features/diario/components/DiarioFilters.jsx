export default function DiarioFilters({ filters = [], value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => {
        const attivo = filter.id === value;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange?.(filter.id)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              attivo
                ? "bg-yellow-400 text-slate-950"
                : "bg-white/5 text-slate-300 border border-white/10"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
