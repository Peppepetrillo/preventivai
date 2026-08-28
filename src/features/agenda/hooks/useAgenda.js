import { useCallback, useMemo, useState } from "react";

import { APP_EVENTS } from "../../../app/events";
import {
  selezionaAttivitaGiorno,
  useAttivita,
} from "../../../domain/attivita";
import { aggiornaCantiere } from "../../cantieri/cantieriDomain";
import {
  aggiornaGiornataProgrammata,
  STATI_GIORNATA,
} from "../../cantieri/services/programmazioneCantiereService";
import { aggiungiGiornataLavorativa } from "../../cantieri/services/registroGiornateService";
import { creaLavoroPianificato } from "../../lavori/creaLavoroPianificato";
import { creaLavoroDaCantiere } from "../../lavori/lavoriDomain";
import { notificationService } from "../../../services/notificationService";
import { useDatiLocaliSincronizzati } from "../../../hooks/useDatiLocaliSincronizzati";
import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../../repositories/cantieriRepository";
import { filtraRecordAttivi } from "../../../domain/cestino";
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
  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieriTutti, [
    APP_EVENTS.cloudSyncAggiornata,
  ]);
  const cantieriAttivi = useMemo(
    () => filtraRecordAttivi(cantieri),
    [cantieri]
  );
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
  const [modalitaMese, setModalitaMese] = useState(false);
  const [giorno, setGiorno] = useState(() => inizioGiornata(new Date()));
  const [completamentoId, setCompletamentoId] = useState(null);

  const oggi = useMemo(() => inizioGiornata(new Date()), []);

  const vista = useMemo(() => {
    if (modalitaMese) return "mese";
    if (modalitaSettimana) return "settimana";
    const diff = differenzaGiorni(giorno, oggi);
    if (diff === 0) return "oggi";
    if (diff === 1) return "domani";
    return "calendario";
  }, [modalitaSettimana, modalitaMese, giorno, oggi]);

  const lavori = useMemo(
    () => selezionaInterventiGiorno(cantieriAttivi, giorno, oggi),
    [cantieriAttivi, giorno, oggi]
  );

  const attivita = useMemo(
    () => selezionaAttivitaGiorno(tutteAttivita, giorno),
    [tutteAttivita, giorno]
  );

  const settimana = useMemo(
    () =>
      modalitaSettimana
        ? selezionaInterventiSettimana(cantieriAttivi, oggi, oggi)
        : [],
    [modalitaSettimana, cantieriAttivi, oggi]
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
      preparaRiepilogoGiornoSuccessivo(cantieriAttivi, giorno, oggi, {
        listaSpesa,
      }),
    [cantieriAttivi, giorno, oggi, listaSpesa]
  );

  const dataDefaultAttivita = useMemo(
    () => giorno.toLocaleDateString("it-IT"),
    [giorno]
  );

  const cambiaVista = useCallback(
    (nuovaVista) => {
      if (nuovaVista === "mese") {
        setModalitaMese(true);
        setModalitaSettimana(false);
        return;
      }
      if (nuovaVista === "settimana") {
        setModalitaSettimana(true);
        setModalitaMese(false);
        return;
      }
      setModalitaSettimana(false);
      setModalitaMese(false);
      if (nuovaVista === "oggi") setGiorno(oggi);
      else if (nuovaVista === "domani") setGiorno(aggiungiGiorni(oggi, 1));
    },
    [oggi]
  );

  const segnaCompletato = useCallback(
    (lavoroId) => {
      setCompletamentoId(lavoroId);
      const idStr = String(lavoroId || "");
      const separatore = idStr.indexOf(":");
      const cantiereId =
        separatore > 0 ? idStr.slice(0, separatore) : idStr;
      const giornataId = separatore > 0 ? idStr.slice(separatore + 1) : "";

      const aggiornati = cantieri.map((cantiere) => {
        if (String(cantiere.id) !== String(cantiereId)) return cantiere;
        if (giornataId) {
          return aggiornaCantiere(
            aggiornaGiornataProgrammata(cantiere, giornataId, {
              stato: STATI_GIORNATA.completata,
            }),
            {}
          );
        }
        return aggiornaCantiere(cantiere, {
          stato: "Completato",
          statoPianificazione: "completato",
        });
      });
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
          setModalitaMese(false);
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

  const registraGiornataLavorativa = useCallback(
    (payload) => {
      const cantiereId = String(payload?.cantiereId || "");
      if (!cantiereId) return { success: false, error: "cantiere_obbligatorio" };

      let trovato = false;
      const aggiornati = cantieri.map((cantiere) => {
        if (String(cantiere.id) !== cantiereId) return cantiere;
        trovato = true;
        return aggiornaCantiere(
          aggiungiGiornataLavorativa(cantiere, payload),
          {}
        );
      });

      if (!trovato) return { success: false, error: "cantiere_non_trovato" };

      salvaCantieri(aggiornati);
      setCantieri(aggiornati);

      const match = String(payload.data || "").match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );
      if (match) {
        setModalitaSettimana(false);
        setModalitaMese(false);
        setGiorno(
          inizioGiornata(
            new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
          )
        );
      }

      return { success: true };
    },
    [cantieri, setCantieri]
  );

  const vaiGiornoPrecedente = useCallback(() => {
    setModalitaSettimana(false);
    setModalitaMese(false);
    setGiorno((g) => aggiungiGiorni(g, -1));
  }, []);
  const vaiGiornoSuccessivo = useCallback(() => {
    setModalitaSettimana(false);
    setModalitaMese(false);
    setGiorno((g) => aggiungiGiorni(g, 1));
  }, []);
  const vaiOggi = useCallback(() => {
    setModalitaSettimana(false);
    setModalitaMese(false);
    setGiorno(oggi);
  }, [oggi]);

  const selezionaGiornoMese = useCallback((data) => {
    setModalitaMese(false);
    setModalitaSettimana(false);
    setGiorno(inizioGiornata(data));
  }, []);

  const acquistiDaComprare = useMemo(
    () => selezionaDaComprare(listaSpesa).length,
    [listaSpesa]
  );

  return {
    cantieri,
    cantieriAttivi,
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
    registraGiornataLavorativa,
    creaAttivita,
    aggiornaAttivita,
    completaAttivita,
    eliminaAttivita,
    vaiGiornoPrecedente,
    vaiGiornoSuccessivo,
    vaiOggi,
    selezionaGiornoMese,
    setGiorno,
  };
}
