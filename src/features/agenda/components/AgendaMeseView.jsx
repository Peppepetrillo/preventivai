import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { selezionaInterventiGiorno } from "../agendaSelectors";
import {
  costruisciGrigliaCalendario,
  stessoGiorno,
} from "./DateCalendarSheet";

/**
 * Vista mese Agenda (UX-7.4): griglia + indicatori impegni/registro.
 */
export default function AgendaMeseView({
  giorno,
  oggi,
  cantieri = [],
  onSelezionaGiorno,
}) {
  const [meseVisibile, setMeseVisibile] = useState(() => ({
    anno: giorno.getFullYear(),
    mese: giorno.getMonth(),
  }));

  const celle = useMemo(
    () => costruisciGrigliaCalendario(meseVisibile.anno, meseVisibile.mese),
    [meseVisibile]
  );

  const titolo = new Date(
    meseVisibile.anno,
    meseVisibile.mese,
    1
  ).toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  function spostaMese(delta) {
    setMeseVisibile((prev) => {
      const d = new Date(prev.anno, prev.mese + delta, 1);
      return { anno: d.getFullYear(), mese: d.getMonth() };
    });
  }

  return (
    <div className="pro-panel p-4" data-testid="agenda-mese-view">
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={() => spostaMese(-1)}
          className="btn-secondary min-h-[44px] min-w-[44px] px-2"
          aria-label="Mese precedente"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="ds-card-title capitalize">{titolo}</h2>
        <button
          type="button"
          onClick={() => spostaMese(1)}
          className="btn-secondary min-h-[44px] min-w-[44px] px-2"
          aria-label="Mese successivo"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["L", "M", "M", "G", "V", "S", "D"].map((g, i) => (
          <div
            key={`${g}-${i}`}
            className="text-center text-[11px] font-bold text-slate-500 py-1"
          >
            {g}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celle.map(({ data, meseCorrente }) => {
          const lavori = selezionaInterventiGiorno(cantieri, data, oggi);
          const haContenuto = lavori.length > 0;
          const selezionato = stessoGiorno(data, giorno);
          const eOggi = stessoGiorno(data, oggi);

          return (
            <button
              key={data.toISOString()}
              type="button"
              onClick={() => onSelezionaGiorno?.(data)}
              className={`min-h-[48px] rounded-[12px] flex flex-col items-center justify-center gap-0.5 text-sm ${
                selezionato
                  ? "bg-yellow-400 text-black font-bold"
                  : meseCorrente
                    ? "bg-white/5 text-slate-200"
                    : "text-slate-600"
              } ${eOggi && !selezionato ? "ring-1 ring-yellow-400/50" : ""}`}
            >
              <span>{data.getDate()}</span>
              {haContenuto ? (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selezionato ? "bg-black" : "bg-yellow-400"
                  }`}
                  aria-hidden="true"
                />
              ) : (
                <span className="w-1.5 h-1.5" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
      <p className="ds-text-secondary text-xs mt-3 text-center">
        Tocca un giorno per aprire la timeline.
      </p>
    </div>
  );
}
