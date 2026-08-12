import { useCallback, useMemo, useState } from "react";
import {
  CheckSquare,
  ClipboardList,
  FileText,
  HardHat,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { APP_EVENTS } from "../../app/events";
import { ROUTES } from "../../app/routes";
import { useAttivita } from "../../domain/attivita";
import AttivitaFormSheet from "../../features/agenda/components/AttivitaFormSheet";
import NuovoLavoroSheet from "../../features/agenda/components/NuovoLavoroSheet";
import { creaLavoroPianificato } from "../../features/lavori/creaLavoroPianificato";
import { creaLavoroDaCantiere } from "../../features/lavori/lavoriDomain";
import { formattaDataLocale } from "../../features/lavori/schedulingDomain";
import { useDatiLocaliSincronizzati } from "../../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri, salvaCantieri } from "../../repositories/cantieriRepository";
import { notificationService } from "../../services/notificationService";
import GlobalCreateSheet from "./GlobalCreateSheet";
import { useGlobalCreate } from "./GlobalCreateContext";

/**
 * Host globale: menu Nuovo + sheet annidati (lavoro, attività).
 * Navigazione route per preventivo, cliente, distinta.
 */
export default function GlobalCreateHost() {
  const navigate = useNavigate();
  const { menuOpen, closeMenu } = useGlobalCreate();
  const [lavoroAperto, setLavoroAperto] = useState(false);
  const [attivitaAperta, setAttivitaAperta] = useState(false);

  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieri, [
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
        notificationService.planForLavoro(creaLavoroDaCantiere(cantiere), {
          reminderMinutes: cantiere.reminderMinutes,
        });
      }
    },
    [cantieri, setCantieri]
  );

  const salvaAttivita = useCallback(
    (form) => {
      const creata = creaAttivita({
        ...form,
        data: form.data || dataDefault,
      });
      if (creata.reminder) {
        notificationService.planForActivity(creata);
      }
    },
    [creaAttivita, dataDefault]
  );

  const actions = useMemo(
    () => [
      {
        id: "lavoro",
        label: "Lavoro",
        subtitle: "Cantiere o intervento",
        icon: HardHat,
        testId: "global-create-lavoro",
        onPress: () => {
          closeMenu();
          setLavoroAperto(true);
        },
      },
      {
        id: "preventivo",
        label: "Preventivo",
        subtitle: "Dal listino prezzi",
        icon: FileText,
        testId: "global-create-preventivo",
        onPress: () => {
          closeMenu();
          navigate(ROUTES.preventivi);
        },
      },
      {
        id: "cliente",
        label: "Cliente",
        icon: UserPlus,
        testId: "global-create-cliente",
        onPress: () => {
          closeMenu();
          navigate(`${ROUTES.clienti}?nuovo=1`);
        },
      },
      {
        id: "attivita",
        label: "Attività",
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
        label: "Distinta materiali",
        icon: ClipboardList,
        testId: "global-create-distinta",
        onPress: () => {
          closeMenu();
          navigate(ROUTES.nuovaDistintaMateriali);
        },
      },
    ],
    [closeMenu, navigate]
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
