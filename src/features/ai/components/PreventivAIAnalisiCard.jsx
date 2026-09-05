import { useRef, useState } from "react";
import { Brain, Loader2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import { analizzaNuovoLavoroIntelligence } from "../aiInsightsService";
import PreventivAIAnalisiRisultato from "./PreventivAIAnalisiRisultato";

/**
 * CTA opzionale PreventivAI Intelligence — non obbligatoria nel wizard.
 * Non modifica il preventivo.
 */
export default function PreventivAIAnalisiCard({
  tipoLavoro = "",
  tipologiaImpianto = "",
  lavorazioni = [],
}) {
  const [aperto, setAperto] = useState(false);
  const [caricamento, setCaricamento] = useState(false);
  const [esito, setEsito] = useState(null);
  const [errore, setErrore] = useState("");
  const inCorsoRef = useRef(false);

  function payloadNuovoLavoro() {
    return {
      tipoLavoro,
      tipologiaImpianto,
      lavorazioni,
      titolo: tipologiaImpianto || tipoLavoro || "",
      descrizione: lavorazioni
        .map((v) => v?.nome)
        .filter(Boolean)
        .slice(0, 12)
        .join(", "),
    };
  }

  async function avviaAnalisi({ forzaFallback = false } = {}) {
    if (inCorsoRef.current) return;
    inCorsoRef.current = true;
    setErrore("");
    setCaricamento(true);
    setAperto(true);
    try {
      const risultato = await analizzaNuovoLavoroIntelligence({
        nuovoLavoro: payloadNuovoLavoro(),
        forzaFallback,
      });
      setEsito(risultato);
      if (risultato.motivoFallback && risultato.messaggioUtente) {
        setErrore(risultato.messaggioUtente);
      }
    } catch {
      setErrore("Non riesco a completare l'analisi in questo momento.");
      setEsito(null);
    } finally {
      setCaricamento(false);
      inCorsoRef.current = false;
    }
  }

  function chiudi() {
    if (caricamento) return;
    setAperto(false);
  }

  return (
    <>
      <section
        className="pro-panel p-4 space-y-3"
        data-testid="preventivai-intelligence-card"
        aria-labelledby="preventivai-intelligence-titolo"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-[14px] bg-amber-400/15 p-2 text-amber-200">
            <Brain size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="preventivai-intelligence-titolo"
              className="ds-card-title"
            >
              PreventivAI
            </h2>
            <p className="ds-text-secondary text-sm mt-1">
              Confronta questo lavoro con i tuoi cantieri precedenti. Opzionale.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary w-full min-h-[48px]"
          data-testid="preventivai-intelligence-analizza"
          onClick={() => avviaAnalisi()}
          disabled={caricamento}
          aria-busy={caricamento}
        >
          {caricamento ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              Analisi in corso…
            </span>
          ) : (
            "Analizza con PreventivAI"
          )}
        </button>
      </section>

      <BottomSheet
        open={aperto}
        onClose={chiudi}
        title="Analisi PreventivAI"
        descrizione="Confronto basato sui tuoi dati"
        altezza="90%"
      >
        <div className="px-1 pb-6" data-testid="preventivai-intelligence-sheet">
          {caricamento ? (
            <div
              className="py-10 text-center space-y-3"
              data-testid="preventivai-intelligence-loading"
            >
              <Loader2
                size={28}
                className="animate-spin mx-auto text-amber-200"
                aria-hidden="true"
              />
              <p className="ds-text-secondary">
                PreventivAI sta analizzando i tuoi dati…
              </p>
            </div>
          ) : null}

          {!caricamento && errore ? (
            <div className="mb-4 space-y-3" role="alert">
              <p
                className="text-amber-100 text-sm"
                data-testid="preventivai-intelligence-errore"
              >
                {errore}
              </p>
              <div className="grid gap-2">
                {esito?.puoRiprovare !== false ? (
                  <button
                    type="button"
                    className="btn-secondary min-h-[44px]"
                    data-testid="preventivai-intelligence-riprova"
                    onClick={() => avviaAnalisi()}
                  >
                    Riprova
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-secondary min-h-[44px]"
                  data-testid="preventivai-intelligence-usa-dati"
                  onClick={() => avviaAnalisi({ forzaFallback: true })}
                >
                  Usa analisi dati
                </button>
              </div>
            </div>
          ) : null}

          {!caricamento && esito ? (
            <PreventivAIAnalisiRisultato
              esito={esito}
              onTornaAlPreventivo={chiudi}
              onRipeti={() => avviaAnalisi()}
            />
          ) : null}
        </div>
      </BottomSheet>
    </>
  );
}
