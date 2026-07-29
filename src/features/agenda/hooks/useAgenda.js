import { useCallback, useMemo, useState } from "react";

import { APP_EVENTS } from "../../../app/events";
import {
  selezionaAttivitaGiorno,
  useAttivita,
} from "../../../domain/attivita";
import { aggiornaCantiere } from "../../cantieri/cantieriDomain";
import { useDatiLocaliSincronizzati } from "../../../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri, salvaCantieri } from "../../../repositories/cantieriRepository";
import {
  aggiungiGiorni,
  differenzaGiorni,
  inizioGiornata,
  preparaRiepilogoGiornoSuccessivo,
  selezionaInterventiGiorno,
} from "../agendaSelectors";
import { selezionaInterventiSettimana } from "../settimanaSelectors";

/**
 * Hook agenda operativa — lavori, attività, vista giorno/settimana.
 */
export function useAgenda() {
  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieri, [
    APP_EVENTS.cloudSyncAggiornata,
  ]);
  const {
    crea: creaAttivita,
    aggiorna: aggiornaAttivita,
    completa: completaAttivita,
    elimina: eliminaAttivita,
    attivita: tutteAttivita,
  } = useAttivita();

  const [modalitaSettimana, setModalitaSettimana] = useState(false);
  const [giorno, setGiorno] = useState(() => inizioGiornata(new Date()));
  const [completamentoId, setCompletamentoId] = useState(null);

  const oggi = useMemo(() => inizioGiornata(new Date()), []);

  const vista = useMemo(() => {
    if (modalitaSettimana) return "settimana";
    const diff = differenzaGiorni(giorno, oggi);
    if (diff === 0) return "oggi";
    if (diff === 1) return "domani";
    return "oggi";
  }, [modalitaSettimana, giorno, oggi]);

  const lavori = useMemo(
    () => selezionaInterventiGiorno(cantieri, giorno, oggi),
    [cantieri, giorno, oggi]
  );

  const attivita = useMemo(
    () => selezionaAttivitaGiorno(tutteAttivita, giorno),
    [tutteAttivita, giorno]
  );

  const settimana = useMemo(
    () =>
      modalitaSettimana
        ? selezionaInterventiSettimana(cantieri, oggi, oggi)
        : [],
    [modalitaSettimana, cantieri, oggi]
  );

  const attivitaPerGiorno = useMemo(() => {
    if (!modalitaSettimana) return {};
    const mappa = {};
    for (const { giorno: g } of settimana) {
      const chiave = g.toLocaleDateString("it-IT");
      mappa[chiave] = selezionaAttivitaGiorno(tutteAttivita, g);
    }
    return mappa;
  }, [modalitaSettimana, settimana, tutteAttivita]);

  const riepilogoPreparazione = useMemo(
    () => preparaRiepilogoGiornoSuccessivo(cantieri, giorno, oggi),
    [cantieri, giorno, oggi]
  );

  const dataDefaultAttivita = useMemo(
    () => giorno.toLocaleDateString("it-IT"),
    [giorno]
  );

  const cambiaVista = useCallback(
    (nuovaVista) => {
      if (nuovaVista === "settimana") {
        setModalitaSettimana(true);
        return;
      }
      setModalitaSettimana(false);
      if (nuovaVista === "oggi") setGiorno(oggi);
      else if (nuovaVista === "domani") setGiorno(aggiungiGiorni(oggi, 1));
    },
    [oggi]
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

  const vaiGiornoPrecedente = useCallback(() => {
    setModalitaSettimana(false);
    setGiorno((g) => aggiungiGiorni(g, -1));
  }, []);
  const vaiGiornoSuccessivo = useCallback(() => {
    setModalitaSettimana(false);
    setGiorno((g) => aggiungiGiorni(g, 1));
  }, []);
  const vaiOggi = useCallback(() => {
    setModalitaSettimana(false);
    setGiorno(oggi);
  }, [oggi]);

  return {
    cantieri,
    giorno,
    oggi,
    vista,
    cambiaVista,
    lavori,
    attivita,
    settimana,
    attivitaPerGiorno,
    riepilogoPreparazione,
    completamentoId,
    dataDefaultAttivita,
    segnaCompletato,
    creaAttivita,
    aggiornaAttivita,
    completaAttivita,
    eliminaAttivita,
    vaiGiornoPrecedente,
    vaiGiornoSuccessivo,
    vaiOggi,
    setGiorno,
  };
}
