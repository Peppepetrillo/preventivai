import AgendaLavoroCard from "./AgendaLavoroCard";

export default function AgendaTimeline({
  lavori = [],
  onSegnaCompletato,
  completamentoId = null,
}) {
  if (lavori.length === 0) return null;

  return (
    <ol className="relative space-y-0">
      {lavori.map((lavoro, index) => (
        <li key={lavoro.id} className="relative pl-8 pb-6 last:pb-0">
          {index < lavori.length - 1 ? (
            <span
              className="absolute left-[11px] top-8 bottom-0 w-px bg-white/10"
              aria-hidden="true"
            />
          ) : null}
          <span
            className={`absolute left-0 top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${
              lavoro.stato === "completato"
                ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                : lavoro.stato === "in-corso"
                  ? "border-blue-400 bg-blue-400/20 text-blue-200"
                  : "border-slate-500 bg-slate-800 text-slate-400"
            }`}
            aria-hidden="true"
          >
            {lavoro.orario ? lavoro.orario.slice(0, 5) : index + 1}
          </span>
          <AgendaLavoroCard
            lavoro={lavoro}
            onSegnaCompletato={onSegnaCompletato}
            completamentoInCorso={completamentoId === lavoro.id}
          />
        </li>
      ))}
    </ol>
  );
}
