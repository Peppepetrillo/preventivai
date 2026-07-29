import { useCallback, useMemo, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

import { APP_EVENTS } from "../app/events";
import { aggiornaCantiere } from "../features/cantieri/cantieriDomain";
import AgendaGiornoNav from "../features/agenda/components/AgendaGiornoNav";
import AgendaInterventoCard from "../features/agenda/components/AgendaInterventoCard";
import AgendaPreparazioneCard from "../features/agenda/components/AgendaPreparazioneCard";
import {
  aggiungiGiorni,
  inizioGiornata,
  preparaRiepilogoGiornoSuccessivo,
  selezionaInterventiGiorno,
} from "../features/agenda/agendaSelectors";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri, salvaCantieri } from "../repositories/cantieriRepository";

const SOGLIA_SWIPE = 60;

export default function Agenda() {
  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieri, [
    APP_EVENTS.cloudSyncAggiornata,
  ]);
  const [giorno, setGiorno] = useState(() => inizioGiornata(new Date()));
  const [completamentoId, setCompletamentoId] = useState(null);
  const touchStart = useRef(null);

  const oggi = useMemo(() => inizioGiornata(new Date()), []);

  const interventi = useMemo(
    () => selezionaInterventiGiorno(cantieri, giorno, oggi),
    [cantieri, giorno, oggi]
  );

  const riepilogoPreparazione = useMemo(
    () => preparaRiepilogoGiornoSuccessivo(cantieri, giorno, oggi),
    [cantieri, giorno, oggi]
  );

  const segnaCompletato = useCallback(
    (cantiereId) => {
      setCompletamentoId(cantiereId);
      const aggiornati = cantieri.map((cantiere) =>
        String(cantiere.id) === String(cantiereId)
          ? aggiornaCantiere(cantiere, { stato: "Completato" })
          : cantiere
      );
      salvaCantieri(aggiornati);
      setCantieri(aggiornati);
      setCompletamentoId(null);
    },
    [cantieri, setCantieri]
  );

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
        onGiornoPrecedente={() => setGiorno((g) => aggiungiGiorni(g, -1))}
        onOggi={() => setGiorno(oggi)}
        onGiornoSuccessivo={() => setGiorno((g) => aggiungiGiorni(g, 1))}
      />

      <AgendaPreparazioneCard riepilogo={riepilogoPreparazione} />

      {interventi.length === 0 ? (
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
        <ol className="relative space-y-0">
          {interventi.map((intervento, index) => (
            <li key={intervento.id} className="relative pl-8 pb-6 last:pb-0">
              {index < interventi.length - 1 ? (
                <span
                  className="absolute left-[11px] top-8 bottom-0 w-px bg-white/10"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={`absolute left-0 top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${
                  intervento.stato === "completato"
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                    : intervento.stato === "in-corso"
                      ? "border-blue-400 bg-blue-400/20 text-blue-200"
                      : "border-slate-500 bg-slate-800 text-slate-400"
                }`}
                aria-hidden="true"
              >
                {intervento.orario
                  ? intervento.orario.slice(0, 5)
                  : index + 1}
              </span>
              <AgendaInterventoCard
                intervento={intervento}
                onSegnaCompletato={segnaCompletato}
                completamentoInCorso={completamentoId === intervento.id}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
