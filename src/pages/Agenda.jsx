import { CalendarDays } from "lucide-react";
import { useRef } from "react";

import AgendaGiornoNav from "../features/agenda/components/AgendaGiornoNav";
import AgendaPreparazioneCard from "../features/agenda/components/AgendaPreparazioneCard";
import AgendaTimeline from "../features/agenda/components/AgendaTimeline";
import { useAgenda } from "../features/agenda/hooks/useAgenda";
import { aggiungiGiorni } from "../features/agenda/agendaSelectors";

const SOGLIA_SWIPE = 60;

export default function Agenda() {
  const {
    giorno,
    oggi,
    lavori,
    riepilogoPreparazione,
    completamentoId,
    segnaCompletato,
    vaiGiornoPrecedente,
    vaiGiornoSuccessivo,
    vaiOggi,
    setGiorno,
  } = useAgenda();
  const touchStart = useRef(null);

  function onTouchStart(event) {
    touchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  function onTouchEnd(event) {
    if (!touchStart.current) return;
    const dx = event.changedTouches[0].clientX - touchStart.current.x;
    const dy = event.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < SOGLIA_SWIPE || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) setGiorno((g) => aggiungiGiorni(g, -1));
    else setGiorno((g) => aggiungiGiorni(g, 1));
  }

  return (
    <div
      className="pro-page text-white"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AgendaGiornoNav
        giorno={giorno}
        oggi={oggi}
        onGiornoPrecedente={vaiGiornoPrecedente}
        onOggi={vaiOggi}
        onGiornoSuccessivo={vaiGiornoSuccessivo}
      />

      <AgendaPreparazioneCard riepilogo={riepilogoPreparazione} />

      {lavori.length === 0 ? (
        <div className="ds-empty pro-panel p-8 text-center">
          <CalendarDays
            size={32}
            className="mx-auto text-slate-500 mb-3"
            aria-hidden="true"
          />
          <p className="font-black">Nessun intervento</p>
          <p className="ds-text-secondary mt-1">
            Non ci sono lavori programmati per questo giorno.
          </p>
        </div>
      ) : (
        <AgendaTimeline
          lavori={lavori}
          onSegnaCompletato={segnaCompletato}
          completamentoId={completamentoId}
        />
      )}
    </div>
  );
}
