import {
  Plus,
  CheckSquare,
  ClipboardList,
  FileText,
  HardHat,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomSheet from "../../../components/BottomSheet";
import { ROUTES } from "../../../app/routes";

/**
 * FAB contestuale Agenda — azioni essenziali (UX simplify).
 * Pagamento / lista materiali restano da GlobalCreate o dal cantiere.
 */
export default function AgendaToolbar({
  onNuovoLavoro,
  onNuovaAttivita,
  onRegistraGiornata,
}) {
  const [aperto, setAperto] = useState(false);
  const navigate = useNavigate();

  function chiudiE(fn) {
    setAperto(false);
    fn?.();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAperto(true)}
                    className="fixed z-30 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] ds-nav-fab"
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
            className="btn-primary min-h-[56px] flex items-center justify-center gap-3 text-base font-semibold"
            data-testid="agenda-registra-giornata"
          >
            <ClipboardList size={22} />
            Registra consuntivo
          </button>
          <button
            type="button"
            onClick={() => chiudiE(onNuovoLavoro)}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-semibold"
            data-testid="agenda-nuovo-cantiere"
          >
            <HardHat size={22} />
            Lavoro
          </button>
          <button
            type="button"
            onClick={() => chiudiE(onNuovaAttivita)}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-semibold"
            data-testid="agenda-nuova-attivita"
          >
            <CheckSquare size={22} />
            Promemoria
          </button>
          <button
            type="button"
            onClick={() => chiudiE(() => navigate(ROUTES.preventiviNuovo))}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-semibold"
            data-testid="agenda-nuovo-preventivo"
          >
            <FileText size={22} />
            Preventivo
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
