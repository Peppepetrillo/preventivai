import { useRef, useState } from "react";

import ConfirmDialog from "../components/ConfirmDialog";
import { aggiungiInsight } from "../domain/insights";
import AgendaHeader from "../features/agenda/components/AgendaHeader";
import AgendaMeseView from "../features/agenda/components/AgendaMeseView";
import AgendaPreparazioneCard from "../features/agenda/components/AgendaPreparazioneCard";
import AgendaToolbar from "../features/agenda/components/AgendaToolbar";
import AttivitaFormSheet from "../features/agenda/components/AttivitaFormSheet";
import InsightRapidoSheet from "../features/agenda/components/InsightRapidoSheet";
import NuovoLavoroSheet from "../features/agenda/components/NuovoLavoroSheet";
import {
  AgendaGiornoContenuto,
  default as AgendaSettimanaView,
} from "../features/agenda/components/AgendaSettimanaView";
import GiornataLavorativaSheet from "../features/cantieri/components/GiornataLavorativaSheet";
import { useAgenda } from "../features/agenda/hooks/useAgenda";
import { prefillConsuntivoDaPrevisto } from "../features/agenda/prefillConsuntivoDaPrevisto";
import { aggiungiGiorni } from "../features/agenda/agendaSelectors";

const SOGLIA_SWIPE = 60;

export default function Agenda() {
  const {
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
  } = useAgenda();

  const [formAttivitaAperto, setFormAttivitaAperto] = useState(false);
  const [lavoroSheetAperto, setLavoroSheetAperto] = useState(false);
  const [registroSheetAperto, setRegistroSheetAperto] = useState(false);
  const [attivitaInModifica, setAttivitaInModifica] = useState(null);
  const [insightAperto, setInsightAperto] = useState(false);
  const [insightContesto, setInsightContesto] = useState(null);
  const [consuntivoPrompt, setConsuntivoPrompt] = useState(null);
  const [prefillConsuntivo, setPrefillConsuntivo] = useState(null);
  const touchStart = useRef(null);

  function onTouchStart(event) {
    touchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  function onTouchEnd(event) {
    if (!touchStart.current || vista === "settimana" || vista === "mese") return;
    const dx = event.changedTouches[0].clientX - touchStart.current.x;
    const dy = event.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < SOGLIA_SWIPE || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) setGiorno((g) => aggiungiGiorni(g, -1));
    else setGiorno((g) => aggiungiGiorni(g, 1));
  }

  function apriNuovaAttivita() {
    setAttivitaInModifica(null);
    setFormAttivitaAperto(true);
  }

  function salvaAttivita(form) {
    if (attivitaInModifica?.id) {
      aggiornaAttivita(attivitaInModifica.id, form);
    } else {
      creaAttivita({
        ...form,
        data: form.data || dataDefaultAttivita,
      });
    }
    setAttivitaInModifica(null);
  }

  function apriInsight(lavoro) {
    setInsightContesto({
      cantiereId: lavoro.cantiereId || lavoro.id,
      lavoroId: lavoro.id,
      cliente: lavoro.cliente,
      titolo: lavoro.titolo,
    });
    setInsightAperto(true);
  }

  function gestisciSegnaCompletato(lavoroId) {
    const lavoro = lavori.find((item) => String(item.id) === String(lavoroId));
    segnaCompletato(lavoroId);

    if (lavoro?.kind === "lavoro-giornata") {
      const prefill = prefillConsuntivoDaPrevisto(lavoro);
      if (prefill) {
        setConsuntivoPrompt(prefill);
      }
    }
  }

  function apriConsuntivoDaPrevisto(prefill) {
    setConsuntivoPrompt(null);
    setPrefillConsuntivo(prefill);
    setRegistroSheetAperto(true);
  }

  function gestisciRegistraConsuntivo(lavoro) {
    const prefill = prefillConsuntivoDaPrevisto(lavoro);
    if (prefill) {
      apriConsuntivoDaPrevisto(prefill);
    }
  }

  return (
    <div
      className="pro-page text-white pb-24"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AgendaHeader
        vista={vista}
        onCambiaVista={cambiaVista}
        giorno={giorno}
        oggi={oggi}
        onGiornoPrecedente={vaiGiornoPrecedente}
        onOggi={vaiOggi}
        onGiornoSuccessivo={vaiGiornoSuccessivo}
        nascondiNavGiorno={vista === "settimana" || vista === "mese"}
        acquistiDaComprare={acquistiDaComprare}
      />

      {vista !== "settimana" && vista !== "mese" ? (
        <AgendaPreparazioneCard riepilogo={riepilogoPreparazione} />
      ) : null}

      {vista === "mese" ? (
        <AgendaMeseView
          giorno={giorno}
          oggi={oggi}
          cantieri={cantieriAttivi}
          onSelezionaGiorno={selezionaGiornoMese}
        />
      ) : vista === "settimana" ? (
        <AgendaSettimanaView
          giorni={settimana}
          attivitaPerGiorno={attivitaPerGiorno}
        />
      ) : (
        <AgendaGiornoContenuto
          lavori={lavori}
          attivita={attivita}
          onSegnaCompletato={gestisciSegnaCompletato}
          onRegistraConsuntivo={gestisciRegistraConsuntivo}
          completamentoId={completamentoId}
          onCompletaAttivita={completaAttivita}
          onModificaAttivita={(item) => {
            setAttivitaInModifica(item);
            setFormAttivitaAperto(true);
          }}
          onEliminaAttivita={eliminaAttivita}
          onInsight={apriInsight}
          onRegistraGiornata={() => {
            setPrefillConsuntivo(null);
            setRegistroSheetAperto(true);
          }}
          onNuovoLavoro={() => setLavoroSheetAperto(true)}
        />
      )}

      <AgendaToolbar
        cantieriAttivi={cantieriAttivi}
        onNuovoLavoro={() => setLavoroSheetAperto(true)}
        onNuovaAttivita={apriNuovaAttivita}
        onRegistraGiornata={() => {
          setPrefillConsuntivo(null);
          setRegistroSheetAperto(true);
        }}
      />

      <ConfirmDialog
        open={Boolean(consuntivoPrompt)}
        title="Vuoi registrare ora il consuntivo?"
        description="Hai segnato il previsto come fatto. Il consuntivo registra ore, operai e lavoro realmente svolto."
        confirmLabel="Registra consuntivo"
        cancelLabel="Più tardi"
        danger={false}
        onConfirm={() => apriConsuntivoDaPrevisto(consuntivoPrompt)}
        onCancel={() => setConsuntivoPrompt(null)}
        testId="consuntivo-dopo-previsto"
      />

      <NuovoLavoroSheet
        aperto={lavoroSheetAperto}
        onChiudi={() => setLavoroSheetAperto(false)}
        onSalva={creaLavoro}
        dataDefault={dataDefaultAttivita}
        title="Nuovo cantiere"
        descrizione="Pianifica senza uscire dall'agenda."
      />

      <GiornataLavorativaSheet
        open={registroSheetAperto}
        onClose={() => {
          setRegistroSheetAperto(false);
          setPrefillConsuntivo(null);
        }}
        cantieriOpzioni={cantieriAttivi}
        dataDefault={dataDefaultAttivita}
        valoriIniziali={prefillConsuntivo}
        onSalva={(payload) => {
          registraGiornataLavorativa(payload);
          setPrefillConsuntivo(null);
        }}
      />

      <AttivitaFormSheet
        aperto={formAttivitaAperto}
        onChiudi={() => {
          setFormAttivitaAperto(false);
          setAttivitaInModifica(null);
        }}
        onSalva={salvaAttivita}
        attivita={attivitaInModifica}
        dataDefault={dataDefaultAttivita}
      />

      <InsightRapidoSheet
        aperto={insightAperto}
        onChiudi={() => setInsightAperto(false)}
        contesto={insightContesto || {}}
        onSalva={(dati) => aggiungiInsight(dati)}
      />
    </div>
  );
}
