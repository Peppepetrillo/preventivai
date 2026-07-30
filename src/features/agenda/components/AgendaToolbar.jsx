import { Plus, CheckSquare, HardHat } from "lucide-react";
import { useState } from "react";

import BottomSheet from "../../../components/BottomSheet";

/**
 * Pulsante + con scelta Nuovo Lavoro / Nuova Attività
 */
export default function AgendaToolbar({ onNuovoLavoro, onNuovaAttivita }) {
  const [aperto, setAperto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAperto(true)}
        className="fixed z-30 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] w-14 h-14 rounded-full bg-yellow-400 text-black shadow-[var(--shadow-soft)] flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Nuovo"
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
            onClick={() => {
              setAperto(false);
              onNuovoLavoro?.();
            }}
            className="btn-primary min-h-[56px] flex items-center justify-center gap-3 text-base font-black"
          >
            <HardHat size={22} />
            Lavoro
          </button>
          <button
            type="button"
            onClick={() => {
              setAperto(false);
              onNuovaAttivita?.();
            }}
            className="btn-secondary min-h-[56px] flex items-center justify-center gap-3 text-base font-black"
          >
            <CheckSquare size={22} />
            Attività
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
