import { Link } from "react-router-dom";

import { routeCantiere } from "../../../app/routes";
import AgendaActivityCard from "./AgendaActivityCard";
import AgendaSection from "./AgendaSection";
import AgendaTimeline from "./AgendaTimeline";

/**
 * Vista settimanale: giorni con lavori e attività.
 */
export default function AgendaSettimanaView({
  giorni = [],
  attivitaPerGiorno = {},
  onSegnaCompletato,
  completamentoId,
  onCompletaAttivita,
  onModificaAttivita,
  onEliminaAttivita,
}) {
  return (
    <div className="space-y-6">
      {giorni.map(({ giorno, lavori }) => {
        const chiave = giorno.toLocaleDateString("it-IT");
        const attivitaGiorno = attivitaPerGiorno[chiave] || [];
        const etichetta = giorno.toLocaleDateString("it-IT", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

        return (
          <section key={chiave} className="pro-panel p-4">
            <h2 className="ds-card-title capitalize mb-3">{etichetta}</h2>
            {lavori.length === 0 && attivitaGiorno.length === 0 ? (
              <p className="ds-text-secondary text-sm">Niente in programma.</p>
            ) : (
              <div className="space-y-4">
                {lavori.length > 0 ? (
                  <ul className="space-y-2">
                    {lavori.map((lavoro) => (
                      <li key={lavoro.id}>
                        <Link
                          to={lavoro.link || routeCantiere(lavoro.id)}
                          className="flex items-center justify-between gap-3 min-h-[48px] rounded-[14px] border border-white/10 bg-black/[0.14] px-3 py-2"
                        >
                          <span className="min-w-0">
                            <span className="text-yellow-300 text-sm font-black">
                              {lavoro.orario || "—"}
                            </span>
                            <span className="ds-text-primary text-sm ml-2 truncate">
                              {lavoro.cliente || lavoro.titolo}
                            </span>
                          </span>
                          <span className="ds-badge ds-badge-da-iniziare shrink-0">
                            {lavoro.tipoLavoroLabel || "Lavoro"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {attivitaGiorno.length > 0 ? (
                  <ul className="space-y-2">
                    {attivitaGiorno.map((attivita) => (
                      <li
                        key={attivita.id}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <span className="text-yellow-300 font-black w-12 shrink-0">
                          {attivita.ora || "—"}
                        </span>
                        <span className="truncate">{attivita.titolo}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function AgendaGiornoContenuto({
  lavori,
  attivita,
  onSegnaCompletato,
  completamentoId,
  onCompletaAttivita,
  onModificaAttivita,
  onEliminaAttivita,
  onInsight,
}) {
  return (
    <>
      <AgendaSection
        titolo="Lavori"
        count={lavori.length}
        empty="Nessun lavoro programmato."
      >
        <AgendaTimeline
          lavori={lavori}
          onSegnaCompletato={onSegnaCompletato}
          completamentoId={completamentoId}
          onInsight={onInsight}
        />
      </AgendaSection>

      <AgendaSection
        titolo="Attività"
        count={attivita.length}
        empty="Nessuna attività. Tocca + per aggiungerne una."
      >
        <div className="space-y-3">
          {attivita.map((item) => (
            <AgendaActivityCard
              key={item.id}
              attivita={item}
              onCompleta={onCompletaAttivita}
              onModifica={onModificaAttivita}
              onElimina={onEliminaAttivita}
            />
          ))}
        </div>
      </AgendaSection>
    </>
  );
}
