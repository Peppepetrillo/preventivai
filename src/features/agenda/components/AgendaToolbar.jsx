import {
  Plus,
  CheckSquare,
  ClipboardList,
  FileText,
  HardHat,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomSheet from "../../../components/BottomSheet";
import {
  ROUTES,
  routeCantierePagamenti,
  statoNavigazioneCantiere,
  CANTIERE_SEZIONI,
} from "../../../app/routes";

/**
 * FAB contestuale Agenda — unica entrata "+" su /agenda (UX-9.0).
 */
export default function AgendaToolbar({
  onNuovoLavoro,
  onNuovaAttivita,
  onRegistraGiornata,
  cantieriAttivi = [],
}) {
  const [aperto, setAperto] = useState(false);
  const navigate = useNavigate();

  function chiudiE(fn) {
    setAperto(false);
    fn?.();
  }

  function apriPagamentiCantiere() {
    const attivi = cantieriAttivi.filter((c) => c.stato !== "Completato");
    if (attivi.length === 1) {
      navigate(routeCantierePagamenti(attivi[0].id), {
        state: statoNavigazioneCantiere(CANTIERE_SEZIONI.PAGAMENTI),
      });
      return;
    }
    navigate(ROUTES.cantieri);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAperto(true)}
        className="fixed z-30 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] w-14 h-14 rounded-full bg-yellow-400 text-black shadow-[var(--shadow-soft)] flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Nuovo"
        data-testid="agenda-toolbar-plus"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <BottomSheet
        open={aperto}
        onClose={() => setAperto(false)}
        title="Nuovo"
        descrizione="Cosa vuoi aggiungere all'agenda?"
      >
        <div className="grid gap-3 pb-2">
          <button
            type="button"
            onClick={() => chiudiE(onRegistraGiornata)}
            className="btn-primary min-h-[56px] flex items-center justify-center gap-3 text-base font-black"
            data-testid="agenda-registra-giornata"
          >
            <ClipboardList size={22} />
            Registra consuntivo
          </button>
          <button
            type="button"
            onClick={() => chiudiE(onNuovoLavoro)}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-black"
            data-testid="agenda-nuovo-cantiere"
          >
            <HardHat size={22} />
            Cantiere
          </button>
          <button
            type="button"
            onClick={() => chiudiE(() => navigate(ROUTES.preventiviNuovo))}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-black"
            data-testid="agenda-nuovo-preventivo"
          >
            <FileText size={22} />
            Preventivo
          </button>
          <button
            type="button"
            onClick={() => chiudiE(apriPagamentiCantiere)}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-black"
            data-testid="agenda-pagamento-cantiere"
          >
            <Wallet size={22} />
            Pagamento cantiere
          </button>
          <button
            type="button"
            onClick={() => chiudiE(onNuovaAttivita)}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-black"
            data-testid="agenda-nuova-attivita"
          >
            <CheckSquare size={22} />
            Promemoria
          </button>
          <button
            type="button"
            onClick={() => chiudiE(() => navigate(ROUTES.nuovaDistintaMateriali))}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-black"
            data-testid="agenda-lista-materiali"
          >
            <ClipboardList size={22} />
            Lista materiali
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
