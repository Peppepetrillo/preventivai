import { useRef, useState } from "react";

import { aggiungiInsight } from "../domain/insights";
import { notificationService } from "../services/notificationService";
import AgendaHeader from "../features/agenda/components/AgendaHeader";
import AgendaPreparazioneCard from "../features/agenda/components/AgendaPreparazioneCard";
import AgendaToolbar from "../features/agenda/components/AgendaToolbar";
import AttivitaFormSheet from "../features/agenda/components/AttivitaFormSheet";
import InsightRapidoSheet from "../features/agenda/components/InsightRapidoSheet";
import {
  AgendaGiornoContenuto,
  default as AgendaSettimanaView,
} from "../features/agenda/components/AgendaSettimanaView";
import { useAgenda } from "../features/agenda/hooks/useAgenda";
import { aggiungiGiorni } from "../features/agenda/agendaSelectors";

const SOGLIA_SWIPE = 60;

export default function Agenda() {
  const {
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
  } = useAgenda();

  const [formAperto, setFormAperto] = useState(false);
  const [attivitaInModifica, setAttivitaInModifica] = useState(null);
  const [insightAperto, setInsightAperto] = useState(false);
  const [insightContesto, setInsightContesto] = useState(null);
  const touchStart = useRef(null);

  function onTouchStart(event) {
    touchStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  function onTouchEnd(event) {
    if (!touchStart.current || vista === "settimana") return;
    const dx = event.changedTouches[0].clientX - touchStart.current.x;
    const dy = event.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < SOGLIA_SWIPE || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) setGiorno((g) => aggiungiGiorni(g, -1));
    else setGiorno((g) => aggiungiGiorni(g, 1));
  }

  function apriNuovaAttivita() {
    setAttivitaInModifica(null);
    setFormAperto(true);
  }

  function salvaAttivita(form) {
    if (attivitaInModifica?.id) {
      aggiornaAttivita(attivitaInModifica.id, form);
    } else {
      const creata = creaAttivita({
        ...form,
        data: form.data || dataDefaultAttivita,
      });
      if (creata.reminder) {
        notificationService.planForActivity(creata);
      }
    }
    setAttivitaInModifica(null);
  }

  function apriInsight(lavoro) {
    setInsightContesto({
      cantiereId: lavoro.id,
      lavoroId: lavoro.id,
      cliente: lavoro.cliente,
      titolo: lavoro.titolo,
    });
    setInsightAperto(true);
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
        nascondiNavGiorno={vista === "settimana"}
      />

      {vista !== "settimana" ? (
        <AgendaPreparazioneCard riepilogo={riepilogoPreparazione} />
      ) : null}

      {vista === "settimana" ? (
        <AgendaSettimanaView
          giorni={settimana}
          attivitaPerGiorno={attivitaPerGiorno}
        />
      ) : (
        <AgendaGiornoContenuto
          lavori={lavori}
          attivita={attivita}
          onSegnaCompletato={segnaCompletato}
          completamentoId={completamentoId}
          onCompletaAttivita={completaAttivita}
          onModificaAttivita={(item) => {
            setAttivitaInModifica(item);
            setFormAperto(true);
          }}
          onEliminaAttivita={eliminaAttivita}
          onInsight={apriInsight}
        />
      )}

      <AgendaToolbar onNuovaAttivita={apriNuovaAttivita} />

      <AttivitaFormSheet
        aperto={formAperto}
        onChiudi={() => {
          setFormAperto(false);
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
