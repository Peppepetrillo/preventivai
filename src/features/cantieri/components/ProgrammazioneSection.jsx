import { useMemo, useState } from "react";
import { CalendarPlus, ChevronRight } from "lucide-react";

import { prefillConsuntivoDaGiornataProgrammata } from "../../agenda/prefillConsuntivoDaPrevisto";
import {
  calcolaOreUomo,
  classeBadgeStatoGiornata,
  etichettaStatoGiornata,
  formattaDataGiornataLunga,
  leggiProgrammazione,
  normalizzaStatoGiornata,
  STATI_GIORNATA,
} from "../services/programmazioneCantiereService";
import { giornataProgrammataConsuntivoMancante } from "../../agenda/giornataConsuntivoUi";
import GiornataLavorativaSheet from "./GiornataLavorativaSheet";
import GiornataProgrammataSheet from "./GiornataProgrammataSheet";

/**
 * Lista programmazione cantiere + sheet (UX-7.3).
 */
export default function ProgrammazioneSection({
  cantiere,
  onAggiungiGiornata,
  onAggiornaGiornata,
  onEliminaGiornata,
  onRegistraConsuntivo,
}) {
  const [sheetAperto, setSheetAperto] = useState(false);
  const [giornataInModifica, setGiornataInModifica] = useState(null);
  const [consuntivoSheetAperto, setConsuntivoSheetAperto] = useState(false);
  const [prefillConsuntivo, setPrefillConsuntivo] = useState(null);

  const giornate = useMemo(
    () => leggiProgrammazione(cantiere),
    [cantiere]
  );

  function apriNuova() {
    setGiornataInModifica(null);
    setSheetAperto(true);
  }

  function apriModifica(giornata) {
    setGiornataInModifica(giornata);
    setSheetAperto(true);
  }

  function apriConsuntivoDaPrevisto(giornata) {
    const prefill = prefillConsuntivoDaGiornataProgrammata(cantiere, giornata);
    if (!prefill) return;
    setPrefillConsuntivo(prefill);
    setConsuntivoSheetAperto(true);
  }

  function gestisciSalva(payload) {
    if (giornataInModifica?.id) {
      onAggiornaGiornata?.(giornataInModifica.id, payload);
    } else {
      onAggiungiGiornata?.(payload);
    }
  }

  function gestisciSalvaConsuntivo(payload) {
    onRegistraConsuntivo?.(payload);
    setConsuntivoSheetAperto(false);
    setPrefillConsuntivo(null);
  }

  return (
    <section
      id="sezione-programmazione"
      className="mb-5 scroll-mt-24"
      data-testid="cantiere-programmazione"
      aria-labelledby="programmazione-title"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 id="programmazione-title" className="ds-card-title">
          Previsto
        </h2>
        <button
          type="button"
          onClick={apriNuova}
          className="btn-primary min-h-[44px] px-3 flex items-center gap-2 text-sm font-bold"
          data-testid="programmazione-aggiungi"
        >
          <CalendarPlus size={18} aria-hidden="true" />
          Giornata
        </button>
      </div>

      {giornate.length === 0 ? (
        <div className="ds-empty pro-panel p-5" data-testid="programmazione-empty">
          <p className="ds-card-title">Nessuna giornata</p>
          <p className="ds-text-secondary mt-2">
            Pianifica i giorni in cantiere: operai, ore e attività.
          </p>
          <button
            type="button"
            onClick={apriNuova}
            className="btn-primary mt-4 min-h-[48px] w-full"
          >
            Aggiungi la prima giornata
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {giornate.map((giornata) => {
            const oreUomo = calcolaOreUomo(giornata);
            const consuntivoMancante = giornataProgrammataConsuntivoMancante(
              cantiere,
              giornata
            );
            const badgeLabel = consuntivoMancante
              ? "Consuntivo da registrare"
              : normalizzaStatoGiornata(giornata.stato) === STATI_GIORNATA.completata
                ? "Fatta"
                : etichettaStatoGiornata(giornata.stato);
            const badgeClass = consuntivoMancante
              ? "ds-badge ds-badge-sospeso"
              : classeBadgeStatoGiornata(giornata.stato);

            return (
              <li key={giornata.id}>
                <div className="pro-panel overflow-hidden">
                  <button
                    type="button"
                    onClick={() => apriModifica(giornata)}
                    className="w-full p-4 text-left min-h-[72px] active:scale-[0.99] transition-transform"
                    data-testid={`programmazione-giornata-${giornata.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="ds-text-primary font-medium">
                          {formattaDataGiornataLunga(giornata.data)}
                        </p>
                        <p className="ds-text-secondary mt-1">
                          {giornata.operai}{" "}
                          {giornata.operai === 1 ? "operaio" : "operai"}
                          {giornata.orePreviste > 0
                            ? ` · ${giornata.orePreviste} h`
                            : ""}
                          {oreUomo > 0 ? ` · ${oreUomo} ore uomo` : ""}
                        </p>
                        {giornata.attivita ? (
                          <p className="ds-text-primary mt-1 truncate">
                            {giornata.attivita}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={badgeClass}
                          data-testid={
                            consuntivoMancante
                              ? `programmazione-consuntivo-mancante-${giornata.id}`
                              : undefined
                          }
                        >
                          {badgeLabel}
                        </span>
                        <ChevronRight
                          size={18}
                          className="text-slate-500"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </button>
                  {consuntivoMancante ? (
                    <div className="px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => apriConsuntivoDaPrevisto(giornata)}
                        className="btn-primary w-full min-h-[48px]"
                        data-testid={`programmazione-registra-consuntivo-${giornata.id}`}
                      >
                        Registra consuntivo
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <GiornataProgrammataSheet
        open={sheetAperto}
        onClose={() => setSheetAperto(false)}
        giornata={giornataInModifica}
        onSalva={gestisciSalva}
        onElimina={(id) => onEliminaGiornata?.(id)}
      />

      <GiornataLavorativaSheet
        open={consuntivoSheetAperto}
        onClose={() => {
          setConsuntivoSheetAperto(false);
          setPrefillConsuntivo(null);
        }}
        cantiereIdFisso={String(cantiere?.id || "")}
        valoriIniziali={prefillConsuntivo}
        onSalva={gestisciSalvaConsuntivo}
      />
    </section>
  );
}
