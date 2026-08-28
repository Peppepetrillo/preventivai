import { useMemo, useState } from "react";
import { ClipboardList, ChevronRight } from "lucide-react";

import {
  formattaDataGiornataLunga,
  formattaNomiOperai,
  leggiRegistroGiornate,
  riepilogoRegistroCantiere,
} from "../services/registroGiornateService";
import GiornataLavorativaSheet from "./GiornataLavorativaSheet";

/**
 * Storico registro lavori sul cantiere (UX-7.4).
 */
export default function RegistroLavoriSection({
  cantiere,
  onAggiungi,
  onAggiorna,
  onElimina,
}) {
  const [sheetAperto, setSheetAperto] = useState(false);
  const [inModifica, setInModifica] = useState(null);

  const giornate = useMemo(() => leggiRegistroGiornate(cantiere), [cantiere]);
  const riepilogo = useMemo(
    () => riepilogoRegistroCantiere(cantiere),
    [cantiere]
  );

  function apriNuova() {
    setInModifica(null);
    setSheetAperto(true);
  }

  function gestisciSalva(payload) {
    if (inModifica?.id) {
      onAggiorna?.(inModifica.id, payload);
    } else {
      onAggiungi?.(payload);
    }
  }

  return (
    <section
      id="sezione-registro-lavori"
      className="mb-5 scroll-mt-24"
      data-testid="cantiere-registro-lavori"
      aria-labelledby="registro-lavori-title"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 id="registro-lavori-title" className="ds-card-title">
          Fatto
        </h2>
        <button
          type="button"
          onClick={apriNuova}
          className="btn-primary min-h-[44px] px-3 flex items-center gap-2 text-sm font-bold"
          data-testid="registro-aggiungi"
        >
          <ClipboardList size={18} aria-hidden="true" />
          Consuntivo
        </button>
      </div>

      {giornate.length > 0 ? (
        <div className="pro-panel p-4 mb-3 flex gap-4">
          <div>
            <p className="ds-text-secondary text-xs">Giornate</p>
            <p className="ds-text-primary text-lg font-semibold">
              {riepilogo.giornateLavorate}
            </p>
          </div>
          <div>
            <p className="ds-text-secondary text-xs">Ore lavorate</p>
            <p className="ds-text-primary text-lg font-semibold">
              {riepilogo.totaleOreLavorate}
            </p>
          </div>
        </div>
      ) : null}

      {giornate.length === 0 ? (
        <div className="ds-empty pro-panel p-5" data-testid="registro-empty">
          <p className="ds-card-title">Nessuna giornata registrata</p>
          <p className="ds-text-secondary mt-2">
            Registra il consuntivo: operai, ore e lavoro svolto.
          </p>
          <button
            type="button"
            onClick={apriNuova}
            className="btn-primary mt-4 min-h-[48px] w-full"
          >
            Registra consuntivo
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {[...giornate].reverse().map((giornata) => (
            <li key={giornata.id}>
              <button
                type="button"
                onClick={() => {
                  setInModifica(giornata);
                  setSheetAperto(true);
                }}
                className="pro-panel w-full p-4 text-left min-h-[72px] active:scale-[0.99] transition-transform"
                data-testid={`registro-giornata-${giornata.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="ds-text-primary font-medium">
                      {formattaDataGiornataLunga(giornata.data)}
                    </p>
                    <p className="ds-text-secondary mt-1">
                      {formattaNomiOperai(giornata.operai)}
                      {giornata.oreLavorate > 0
                        ? ` · ${giornata.oreLavorate}h`
                        : ""}
                    </p>
                    {giornata.attivita ? (
                      <p className="ds-text-primary mt-1 truncate">
                        {giornata.attivita}
                      </p>
                    ) : null}
                    {giornata.note ? (
                      <p className="ds-text-secondary text-sm mt-1 line-clamp-2">
                        “{giornata.note}”
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-500 shrink-0 mt-1"
                    aria-hidden="true"
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <GiornataLavorativaSheet
        open={sheetAperto}
        onClose={() => setSheetAperto(false)}
        giornata={inModifica}
        cantiereIdFisso={String(cantiere?.id || "")}
        onSalva={gestisciSalva}
        onElimina={(id) => onElimina?.(id)}
      />
    </section>
  );
}
