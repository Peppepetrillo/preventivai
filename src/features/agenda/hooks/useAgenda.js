import { useCallback, useMemo, useState } from "react";

import { APP_EVENTS } from "../../../app/events";
import {
  selezionaAttivitaGiorno,
  useAttivita,
} from "../../../domain/attivita";
import { aggiornaCantiere } from "../../cantieri/cantieriDomain";
import { creaLavoroPianificato } from "../../lavori/creaLavoroPianificato";
import { creaLavoroDaCantiere } from "../../lavori/lavoriDomain";
import { notificationService } from "../../../services/notificationService";
import { useDatiLocaliSincronizzati } from "../../../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri, salvaCantieri } from "../../../repositories/cantieriRepository";
import { leggiListaSpesa, selezionaDaComprare } from "../../../domain/listaSpesa";
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
  const [listaSpesa] = useDatiLocaliSincronizzati(leggiListaSpesa, [
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
    return "calendario";
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
    () =>
      preparaRiepilogoGiornoSuccessivo(cantieri, giorno, oggi, { listaSpesa }),
    [cantieri, giorno, oggi, listaSpesa]
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
          ? aggiornaCantiere(cantiere, {
              stato: "Completato",
              statoPianificazione: "completato",
            })
          : cantiere
      );
      salvaCantieri(aggiornati);
      setCantieri(aggiornati);
      setCompletamentoId(null);
    },
    [cantieri, setCantieri]
  );

  const creaLavoro = useCallback(
    (form) => {
      const cantiere = creaLavoroPianificato(form);
      const aggiornati = [...cantieri, cantiere];
      salvaCantieri(aggiornati);
      setCantieri(aggiornati);

      if (cantiere.reminderEnabled) {
        notificationService.planForLavoro(creaLavoroDaCantiere(cantiere), {
          reminderMinutes: cantiere.reminderMinutes,
        });
      }

      if (cantiere.scheduledDate) {
        const data = cantiere.scheduledDate;
        const match = String(data).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) {
          setModalitaSettimana(false);
          setGiorno(
            inizioGiornata(
              new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
            )
          );
        }
      }

      return cantiere;
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

  const acquistiDaComprare = useMemo(
    () => selezionaDaComprare(listaSpesa).length,
    [listaSpesa]
  );

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
    acquistiDaComprare,
    completamentoId,
    dataDefaultAttivita,
    segnaCompletato,
    creaLavoro,
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
