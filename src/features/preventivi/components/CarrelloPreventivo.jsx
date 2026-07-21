import { memo, useCallback, useState } from "react";
import { ChevronDown, Settings, ShoppingCart } from "lucide-react";

import { formatEuro } from "../../../utils/preventivi";
import RigaCarrello from "./RigaCarrello";

function CarrelloPreventivo({
  lavorazioni,
  totale,
  numeroVoci,
  onAumentaQuantita,
  onDiminuisciQuantita,
  onRimuoviLavorazione,
  onContinua,
  onApriAvanzate,
  disabilitato,
}) {
  const [espanso, setEspanso] = useState(true);
  const haVoci = lavorazioni.length > 0;

  const toggleEspanso = useCallback(() => {
    setEspanso((valore) => !valore);
  }, []);

  return (
    <div
      className="fixed bottom-[88px] left-0 right-0 z-40 px-4 safe-bottom"
      aria-label="Carrello preventivo"
    >
      <div className="max-w-xl mx-auto bg-[#0d1320]/95 backdrop-blur-2xl border border-white/10 rounded-[22px] shadow-[0_16px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {haVoci ? (
          <>
            <button
              type="button"
              onClick={toggleEspanso}
              className="w-full px-4 py-2.5 flex items-center justify-between gap-3 border-b border-white/8"
              aria-expanded={espanso}
              aria-controls="carrello-preventivo-voci"
            >
              <span className="flex items-center gap-2 text-sm font-black text-yellow-100">
                <ShoppingCart size={16} aria-hidden="true" />
                Carrello · {numeroVoci} {numeroVoci === 1 ? "voce" : "voci"}
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${
                  espanso ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {espanso ? (
              <div
                id="carrello-preventivo-voci"
                className="px-3 max-h-[min(40vh,220px)] overflow-y-auto"
              >
                {lavorazioni.map((lavorazione, indice) => (
                  <RigaCarrello
                    key={lavorazione.id || `${lavorazione.nome}-${indice}`}
                    indice={indice}
                    lavorazione={lavorazione}
                    onAumentaQuantita={onAumentaQuantita}
                    onDiminuisciQuantita={onDiminuisciQuantita}
                    onRimuoviLavorazione={onRimuoviLavorazione}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {onApriAvanzate ? (
          <div className="px-3 pb-1">
            <button
              type="button"
              onClick={onApriAvanzate}
              className="text-sm font-bold text-yellow-200/90 py-1 flex items-center gap-1.5 min-h-11"
            >
              <Settings size={15} aria-hidden="true" />
              Impostazioni avanzate
            </button>
          </div>
        ) : null}

        <div className="p-3 flex items-center justify-between gap-3">
          <div className="px-1 min-w-0">
            {!haVoci ? (
              <p className="text-[11px] text-white/45 font-bold uppercase">
                Carrello vuoto
              </p>
            ) : null}
            <p className="text-2xl font-black leading-tight truncate">
              {formatEuro(totale)}
            </p>
          </div>

          <button
            type="button"
            onClick={onContinua}
            disabled={disabilitato}
            aria-disabled={disabilitato}
            aria-describedby={disabilitato ? "carrello-preventivo-hint" : undefined}
            className="h-14 px-5 btn-primary font-black disabled:opacity-40 shrink-0"
          >
            Continua
          </button>
        </div>

        {disabilitato ? (
          <p id="carrello-preventivo-hint" className="sr-only">
            Aggiungi almeno una lavorazione per continuare.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default memo(CarrelloPreventivo);
