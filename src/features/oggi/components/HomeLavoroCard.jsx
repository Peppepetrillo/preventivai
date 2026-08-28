import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { classeBadgeStatoAgenda } from "../../agenda/agendaSelectors";

/**
 * Card lavoro del giorno — Home Oggi (UX-8.2).
 */
export default function HomeLavoroCard({ lavoro }) {
  if (!lavoro) return null;

  const nome = lavoro.cliente || lavoro.titolo || "Lavoro";
  const attivita =
    lavoro.attivitaGiornata ||
    lavoro.tipoLavoroLabel ||
    (lavoro.titolo !== nome ? lavoro.titolo : "");
  const operai =
    Number(lavoro.operai) > 1 ? `${lavoro.operai} operai` : "";

  return (
    <Link
      to={lavoro.link}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-white/10 bg-black/[0.22] p-4 min-h-[72px] active:scale-[0.99] transition-transform"
      data-testid={`home-lavoro-${lavoro.id}`}
      aria-label={`Apri lavoro ${nome}`}
    >
      <div className="min-w-0 flex-1">
        {lavoro.orario ? (
          <p className="text-sm font-semibold text-yellow-200 tabular-nums">
            {lavoro.orario}
          </p>
        ) : null}
        <p className="ds-text-primary font-semibold truncate mt-0.5">{nome}</p>
        {attivita ? (
          <p className="ds-text-secondary text-sm mt-1 line-clamp-2">{attivita}</p>
        ) : null}
        {operai ? (
          <p className="ds-text-secondary text-xs mt-1">{operai}</p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {lavoro.stato ? (
          <span className={classeBadgeStatoAgenda(lavoro.stato)}>
            {lavoro.statoLabel || lavoro.stato}
          </span>
        ) : null}
        <ChevronRight
          size={22}
          className="text-yellow-200"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
