import { useCallback, useMemo, useState } from "react";
import {
  CheckSquare,
  ClipboardList,
  FileText,
  HardHat,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { APP_EVENTS } from "../../app/events";
import { ROUTES, routeCantierePagamenti, statoNavigazioneCantiere, CANTIERE_SEZIONI } from "../../app/routes";
import { filtraRecordAttivi } from "../../domain/cestino";
import { useAttivita } from "../../domain/attivita";
import AttivitaFormSheet from "../../features/agenda/components/AttivitaFormSheet";
import NuovoLavoroSheet from "../../features/agenda/components/NuovoLavoroSheet";
import { creaLavoroPianificato } from "../../features/lavori/creaLavoroPianificato";
import { creaLavoroDaCantiere } from "../../features/lavori/lavoriDomain";
import { formattaDataLocale } from "../../features/lavori/schedulingDomain";
import { useDatiLocaliSincronizzati } from "../../hooks/useDatiLocaliSincronizzati";
import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../repositories/cantieriRepository";
import { notificationService } from "../../services/notificationService";
import GlobalCreateSheet from "./GlobalCreateSheet";
import { useGlobalCreate } from "./GlobalCreateContext";

/**
 * Host globale: menu Nuovo + sheet annidati (cantiere, promemoria).
 * Navigazione route per preventivo, pagamento, lista materiali.
 */
export default function GlobalCreateHost() {
  const navigate = useNavigate();
  const { menuOpen, closeMenu } = useGlobalCreate();
  const [lavoroAperto, setLavoroAperto] = useState(false);
  const [attivitaAperta, setAttivitaAperta] = useState(false);

  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieriTutti, [
    APP_EVENTS.cloudSyncAggiornata,
  ]);
  const { crea: creaAttivita } = useAttivita();

  const dataDefault = useMemo(() => formattaDataLocale(new Date()), []);

  const creaLavoro = useCallback(
    (form) => {
      const cantiere = creaLavoroPianificato(form);
      const aggiornati = [...cantieri, cantiere];
      salvaCantieri(aggiornati);
      setCantieri(aggiornati);

      if (cantiere.reminderEnabled) {
        void notificationService.resyncNotificheLavoro(cantiere, {
          lavoro: creaLavoroDaCantiere(cantiere),
          reminderMinutes: cantiere.reminderMinutes,
        });
      }
    },
    [cantieri, setCantieri]
  );

  const salvaAttivita = useCallback(
    (form) => {
      creaAttivita({
        ...form,
        data: form.data || dataDefault,
      });
    },
    [creaAttivita, dataDefault]
  );

  const apriPagamenti = useCallback(() => {
    closeMenu();
    const attivi = filtraRecordAttivi(cantieri).filter(
      (c) => c.stato !== "Completato"
    );
    if (attivi.length === 1) {
      navigate(routeCantierePagamenti(attivi[0].id), {
        state: statoNavigazioneCantiere(CANTIERE_SEZIONI.PAGAMENTI),
      });
      return;
    }
    navigate(ROUTES.cantieri);
  }, [cantieri, closeMenu, navigate]);

  const actions = useMemo(
    () => [
      {
        id: "preventivo",
        label: "Preventivo",
        subtitle: "Cliente, listino e riepilogo",
        icon: FileText,
        testId: "global-create-preventivo",
        onPress: () => {
          closeMenu();
          navigate(ROUTES.preventiviNuovo);
        },
      },
      {
        id: "lavoro",
        label: "Cantiere",
        subtitle: "Nuovo cantiere o intervento",
        icon: HardHat,
        testId: "global-create-lavoro",
        onPress: () => {
          closeMenu();
          setLavoroAperto(true);
        },
      },
      {
        id: "pagamento",
        label: "Pagamento cantiere",
        subtitle: "Registra un pagamento ricevuto",
        icon: Wallet,
        testId: "global-create-pagamento",
        onPress: apriPagamenti,
      },
      {
        id: "attivita",
        label: "Promemoria",
        subtitle: "Promemoria o telefonata",
        icon: CheckSquare,
        testId: "global-create-attivita",
        onPress: () => {
          closeMenu();
          setAttivitaAperta(true);
        },
      },
      {
        id: "distinta",
        label: "Lista materiali",
        icon: ClipboardList,
        testId: "global-create-distinta",
        onPress: () => {
          closeMenu();
          navigate(ROUTES.nuovaDistintaMateriali);
        },
      },
    ],
    [apriPagamenti, closeMenu, navigate]
  );

  return (
    <>
      <GlobalCreateSheet
        open={menuOpen}
        onClose={closeMenu}
        actions={actions}
      />

      <NuovoLavoroSheet
        aperto={lavoroAperto}
        onChiudi={() => setLavoroAperto(false)}
        onSalva={creaLavoro}
        dataDefault={dataDefault}
      />

      <AttivitaFormSheet
        aperto={attivitaAperta}
        onChiudi={() => setAttivitaAperta(false)}
        onSalva={salvaAttivita}
        dataDefault={dataDefault}
      />
    </>
  );
}
