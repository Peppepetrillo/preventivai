import AgendaActivityCard from "./AgendaActivityCard";
import AgendaLavoroCard from "./AgendaLavoroCard";
import TimelineItem from "./TimelineItem";
import { unificaTimelineGiorno } from "../timelineSelectors";

/**
 * Timeline unificata lavori + attività, ordinata per ora.
 */
export default function AgendaTimeline({
  lavori = [],
  attivita = [],
  onSegnaCompletato,
  completamentoId = null,
  onInsight,
  onCompletaAttivita,
  onModificaAttivita,
  onEliminaAttivita,
}) {
  const items = unificaTimelineGiorno(lavori, attivita);

  if (items.length === 0) return null;

  return (
    <ol className="relative space-y-0" aria-label="Timeline giornata">
      {items.map((item, index) => (
        <TimelineItem
          key={item.id}
          ora={item.ora}
          statoGlifo={item.statoGlifo}
          statoLabel={item.statoLabel}
          isLast={index === items.length - 1}
        >
          {item.kind === "lavoro" ? (
            <AgendaLavoroCard
              lavoro={item.payload}
              onSegnaCompletato={onSegnaCompletato}
              completamentoInCorso={completamentoId === item.payload.id}
              onInsight={onInsight}
            />
          ) : (
            <AgendaActivityCard
              attivita={item.payload}
              onCompleta={onCompletaAttivita}
              onModifica={onModificaAttivita}
              onElimina={onEliminaAttivita}
            />
          )}
        </TimelineItem>
      ))}
    </ol>
  );
}
