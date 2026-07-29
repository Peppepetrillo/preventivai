import { ChevronLeft, ChevronRight } from "lucide-react";
import { etichettaGiornoNav } from "../agendaSelectors";

export default function AgendaGiornoNav({
  giorno,
  oggi = new Date(),
  onGiornoPrecedente,
  onOggi,
  onGiornoSuccessivo,
}) {
  const etichetta = etichettaGiornoNav(giorno, oggi);

  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <button
        type="button"
        onClick={onGiornoPrecedente}
        className="btn-secondary w-11 h-11 p-0 flex items-center justify-center shrink-0"
        aria-label="Giorno precedente"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        onClick={onOggi}
        className="flex-1 min-w-0 text-center"
        aria-label="Torna a oggi"
      >
        <p className="section-label">Agenda</p>
        <h1 className="ds-page-title mt-0.5">{etichetta}</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {giorno.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </button>

      <button
        type="button"
        onClick={onGiornoSuccessivo}
        className="btn-secondary w-11 h-11 p-0 flex items-center justify-center shrink-0"
        aria-label="Giorno successivo"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
