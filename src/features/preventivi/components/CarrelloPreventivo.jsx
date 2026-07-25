import { memo, useCallback, useState } from "react";
import { ChevronDown, Settings, ShoppingCart } from "lucide-react";

import { formatEuro } from "../../../utils/preventivi";
import RigaCarrello from "./RigaCarrello";

function CarrelloPreventivo({
  lavorazioni,
  totale,
  numeroVoci,
  prezzoListinoPerNome,
  onAumentaQuantita,
  onDiminuisciQuantita,
  onImpostaQuantita,
  onImpostaPrezzo,
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
      <div className="max-w-xl mx-auto bg-[var(--panel-strong)] backdrop-blur-2xl border border-white/10 rounded-[20px] shadow-[var(--shadow-soft)] overflow-hidden">
        {haVoci ? (
          <>
            <button
              type="button"
              onClick={toggleEspanso}
              className="w-full px-4 py-2 flex items-center justify-between gap-3 border-b border-white/[0.06] min-h-[44px]"
              aria-expanded={espanso}
              aria-controls="carrello-preventivo-voci"
            >
              <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-200">
                <ShoppingCart size={16} className="text-yellow-300" aria-hidden="true" />
                Carrello · {numeroVoci} {numeroVoci === 1 ? "voce" : "voci"}
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-500 transition-transform duration-200 ${
                  espanso ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {espanso ? (
              <div
                id="carrello-preventivo-voci"
                className="px-3 max-h-[min(52vh,360px)] overflow-y-auto overscroll-contain"
              >
                {lavorazioni.map((lavorazione, indice) => (
                  <RigaCarrello
                    key={lavorazione.id || `${lavorazione.nome}-${indice}`}
                    indice={indice}
                    lavorazione={lavorazione}
                    prezzoListino={
                      prezzoListinoPerNome?.get?.(
                        lavorazione.listinoId || lavorazione.nome
                      ) ??
                      prezzoListinoPerNome?.get?.(lavorazione.nome)
                    }
                    onAumentaQuantita={onAumentaQuantita}
                    onDiminuisciQuantita={onDiminuisciQuantita}
                    onImpostaQuantita={onImpostaQuantita}
                    onImpostaPrezzo={onImpostaPrezzo}
                    onRimuoviLavorazione={onRimuoviLavorazione}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {onApriAvanzate ? (
          <div className="px-3">
            <button
              type="button"
              onClick={onApriAvanzate}
              className="text-[14px] font-medium text-slate-400 py-1 flex items-center gap-1.5 min-h-[44px]"
            >
              <Settings size={15} aria-hidden="true" />
              Impostazioni avanzate
            </button>
          </div>
        ) : null}

        <div className="px-3 py-3 flex items-center justify-between gap-3 border-t border-white/[0.06]">
          <div className="px-1 min-w-0">
            {!haVoci ? (
              <p className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
                Carrello vuoto
              </p>
            ) : (
              <p className="text-[12px] font-medium text-slate-500">Totale</p>
            )}
            <p className="ds-page-title text-yellow-100 truncate leading-tight">
              {formatEuro(totale)}
            </p>
          </div>

          <button
            type="button"
            onClick={onContinua}
            disabled={disabilitato}
            aria-disabled={disabilitato}
            aria-describedby={disabilitato ? "carrello-preventivo-hint" : undefined}
            className="min-h-[48px] px-5 btn-primary text-[15px] font-semibold disabled:opacity-40 shrink-0"
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
