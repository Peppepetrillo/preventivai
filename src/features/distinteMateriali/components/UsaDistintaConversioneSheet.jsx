import { ClipboardList } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";

/**
 * Consenso in conversione Preventivo → Cantiere quando esiste una distinta.
 */
export default function UsaDistintaConversioneSheet({
  open,
  onClose,
  distinta = null,
  onUsaDistinta,
  onContinuaSenza,
}) {
  const nVoci = Array.isArray(distinta?.voci) ? distinta.voci.length : 0;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Distinta materiali"
      descrizione="È disponibile una distinta materiali collegata a questo preventivo."
    >
      <div className="space-y-4 pb-2">
        {distinta ? (
          <div className="pro-panel px-4 py-3 flex items-start gap-3">
            <ClipboardList
              size={20}
              aria-hidden="true"
              className="text-yellow-300 shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <p className="ds-card-title truncate">{distinta.titolo}</p>
              <p className="ds-text-secondary text-sm mt-1">
                {nVoci} {nVoci === 1 ? "materiale" : "materiali"}
              </p>
            </div>
          </div>
        ) : null}

        <p className="ds-text-secondary text-sm">
          Puoi proiettare i materiali sul nuovo cantiere e in lista spesa, oppure
          continuare senza.
        </p>

        <button
          type="button"
          onClick={onUsaDistinta}
          className="btn-primary w-full min-h-[52px] font-bold"
          data-testid="conversione-usa-distinta"
        >
          Usa distinta
        </button>
        <button
          type="button"
          onClick={onContinuaSenza}
          className="btn-secondary w-full min-h-[48px] font-bold"
          data-testid="conversione-continua-senza"
        >
          Continua senza
        </button>
      </div>
    </BottomSheet>
  );
}
