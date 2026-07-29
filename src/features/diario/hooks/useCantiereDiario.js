import { useMemo, useState } from "react";
import { DIARIO_FILTERS } from "../events/constants";
import {
  filterDiarioEvents,
  groupDiarioEventsByDay,
  leggiDiarioCantiere,
  searchDiarioEvents,
  serializeDiarioEvent,
} from "../timeline/diarioTimeline";

export function useCantiereDiario(cantiere, now = new Date()) {
  const [filtro, setFiltro] = useState("tutti");
  const [query, setQuery] = useState("");

  const eventi = useMemo(
    () => leggiDiarioCantiere(cantiere).map(serializeDiarioEvent),
    [cantiere]
  );

  const filtrati = useMemo(() => {
    const perFiltro = filterDiarioEvents(eventi, filtro);
    return searchDiarioEvents(perFiltro, query);
  }, [eventi, filtro, query]);

  const gruppi = useMemo(
    () => groupDiarioEventsByDay(filtrati, now),
    [filtrati, now]
  );

  return {
    filters: DIARIO_FILTERS,
    filtro,
    setFiltro,
    query,
    setQuery,
    eventi,
    filtrati,
    gruppi,
  };
}
