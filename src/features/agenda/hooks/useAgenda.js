import { useCallback, useMemo, useState } from "react";

import { APP_EVENTS } from "../../../app/events";
import { aggiornaCantiere } from "../../cantieri/cantieriDomain";
import { useDatiLocaliSincronizzati } from "../../../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri, salvaCantieri } from "../../../repositories/cantieriRepository";
import {
  aggiungiGiorni,
  inizioGiornata,
  preparaRiepilogoGiornoSuccessivo,
  selezionaInterventiGiorno,
} from "../agendaSelectors";

/**
 * Hook agenda operativa — giorno, lavori, completamento.
 */
export function useAgenda() {
  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieri, [
    APP_EVENTS.cloudSyncAggiornata,
  ]);
  const [giorno, setGiorno] = useState(() => inizioGiornata(new Date()));
  const [completamentoId, setCompletamentoId] = useState(null);

  const oggi = useMemo(() => inizioGiornata(new Date()), []);

  const lavori = useMemo(
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

  const vaiGiornoPrecedente = useCallback(
    () => setGiorno((g) => aggiungiGiorni(g, -1)),
    []
  );
  const vaiGiornoSuccessivo = useCallback(
    () => setGiorno((g) => aggiungiGiorni(g, 1)),
    []
  );
  const vaiOggi = useCallback(() => setGiorno(oggi), [oggi]);

  return {
    cantieri,
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
  };
}
