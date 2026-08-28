import { Link } from "react-router-dom";

import { routeCantiere } from "../../../app/routes";
import AgendaTimeline from "./AgendaTimeline";

/**
 * Vista settimanale: giorni con lavori e attività.
 */
export default function AgendaSettimanaView({
  giorni = [],
  attivitaPerGiorno = {},
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
                            {lavoro.kind === "giornata-lavorativa"
                              ? lavoro.sottotitoloProgrammazione || "Consuntivo"
                              : lavoro.tipoLavoroLabel || "Lavoro"}
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
  onRegistraConsuntivo,
  completamentoId,
  onCompletaAttivita,
  onModificaAttivita,
  onEliminaAttivita,
  onInsight,
  onRegistraGiornata,
  onNuovoLavoro,
}) {
  const totale = (lavori?.length || 0) + (attivita?.length || 0);

  if (totale === 0) {
    return (
      <div className="ds-empty pro-panel p-8 text-center">
        <p className="ds-card-title">Giornata libera</p>
        <p className="ds-text-secondary mt-2">
          Nessun lavoro o promemoria in programma.
        </p>
        <div className="mt-4 grid gap-2">
          {onRegistraGiornata ? (
            <button
              type="button"
              onClick={onRegistraGiornata}
              className="btn-primary min-h-[48px] w-full"
              data-testid="agenda-empty-registra-consuntivo"
            >
              Registra consuntivo
            </button>
          ) : null}
          {onNuovoLavoro ? (
            <button
              type="button"
              onClick={onNuovoLavoro}
              className="btn-secondary min-h-[48px] w-full"
              data-testid="agenda-empty-pianifica-cantiere"
            >
              Pianifica cantiere
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Timeline">
      <div className="flex items-center justify-between gap-3 mb-3 px-0.5">
        <h2 className="ds-card-title">Timeline</h2>
        <span className="ds-badge ds-badge-da-iniziare">{totale}</span>
      </div>
      <AgendaTimeline
        lavori={lavori}
        attivita={attivita}
        onSegnaCompletato={onSegnaCompletato}
        onRegistraConsuntivo={onRegistraConsuntivo}
        completamentoId={completamentoId}
        onInsight={onInsight}
        onCompletaAttivita={onCompletaAttivita}
        onModificaAttivita={onModificaAttivita}
        onEliminaAttivita={onEliminaAttivita}
      />
    </section>
  );
}
