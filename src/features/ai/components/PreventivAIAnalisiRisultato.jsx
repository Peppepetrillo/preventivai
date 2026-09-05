import {
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Target,
} from "lucide-react";

import { ETICHETTE_CONFIDENZA_AI } from "../aiTypes";

function rigaConfronto(item) {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    if (item.etichetta && item.valore) {
      return `${item.etichetta}: ${item.valore}`;
    }
    return item.valore || item.etichetta || "";
  }
  return "";
}

/**
 * Risultato analisi — solo lettura, nessuna mutazione preventivo.
 */
export default function PreventivAIAnalisiRisultato({
  esito,
  onTornaAlPreventivo,
  onRipeti,
}) {
  const insight = esito?.insight || {};
  const contesto = esito?.contesto || {};
  const n = Number(insight.numeroLavoriSimili) || 0;
  const confidenza =
    insight.livelloConfidenzaEtichetta ||
    ETICHETTE_CONFIDENZA_AI[insight.livelloConfidenza] ||
    "Dati disponibili";

  const titoliDati = (insight.datiDiConfronto || [])
    .map(rigaConfronto)
    .filter(Boolean);

  return (
    <div className="space-y-5" data-testid="preventivai-intelligence-risultato">
      <header className="space-y-2">
        <p className="section-label">
          {insight.titolo || "Confronto basato sui dati disponibili"}
        </p>
        <p
          className="ds-text-primary"
          data-testid="preventivai-intelligence-sintesi"
        >
          {n > 0
            ? `Ho trovato ${n} ${
                n === 1
                  ? "lavoro potenzialmente simile"
                  : "lavori potenzialmente simili"
              }.`
            : "Non ho trovato lavori potenzialmente simili."}
        </p>
        <p
          className="ds-badge ds-badge-da-iniziare inline-flex"
          data-testid="preventivai-intelligence-confidenza"
        >
          {confidenza}
        </p>
        {esito?.usatoProvider ? (
          <p
            className="ds-text-secondary text-sm"
            data-testid="preventivai-intelligence-fonte-ai"
          >
            Analisi AI sui tuoi dati storici.
          </p>
        ) : null}
        {esito?.motivoFallback ? (
          <p
            className="ds-text-secondary text-sm"
            data-testid="preventivai-intelligence-fonte-fallback"
          >
            Analisi AI non disponibile. Ecco cosa mostrano i tuoi dati:
          </p>
        ) : null}
      </header>

      {titoliDati.length > 0 ? (
        <section className="pro-panel p-4 space-y-2" aria-labelledby="pai-dati">
          <div className="flex items-center gap-2 text-slate-200">
            <BarChart3 size={18} aria-hidden="true" />
            <h3 id="pai-dati" className="ds-card-title">
              Cosa dicono i tuoi dati
            </h3>
          </div>
          <ul className="space-y-1.5 ds-text-secondary text-sm">
            {titoliDati.map((riga, i) => (
              <li key={`d-${i}`}>• {riga}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {insight.valutazione || insight.motivazione ? (
        <section className="pro-panel p-4 space-y-2" aria-labelledby="pai-valuta">
          <div className="flex items-center gap-2 text-slate-200">
            <Lightbulb size={18} aria-hidden="true" />
            <h3 id="pai-valuta" className="ds-card-title">
              Cosa valutare
            </h3>
          </div>
          {insight.valutazione ? (
            <p
              className="ds-text-primary text-sm"
              data-testid="preventivai-intelligence-valutazione"
            >
              {insight.valutazione}
            </p>
          ) : null}
          {insight.motivazione ? (
            <p className="ds-text-secondary text-sm">{insight.motivazione}</p>
          ) : null}
        </section>
      ) : null}

      {(insight.rischi || []).length > 0 ? (
        <section className="pro-panel p-4 space-y-2" aria-labelledby="pai-rischi">
          <div className="flex items-center gap-2 text-amber-100">
            <AlertTriangle size={18} aria-hidden="true" />
            <h3 id="pai-rischi" className="ds-card-title">
              Attenzione
            </h3>
          </div>
          <ul className="space-y-1.5 text-sm text-amber-50/90">
            {insight.rischi.map((riga, i) => (
              <li key={`r-${i}`}>• {riga}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {insight.suggerimento || (insight.cosaControllare || []).length > 0 ? (
        <section
          className="pro-panel p-4 space-y-2"
          aria-labelledby="pai-suggerimento"
        >
          <div className="flex items-center gap-2 text-slate-200">
            <Target size={18} aria-hidden="true" />
            <h3 id="pai-suggerimento" className="ds-card-title">
              Suggerimento
            </h3>
          </div>
          {insight.suggerimento ? (
            <p className="ds-text-primary text-sm">{insight.suggerimento}</p>
          ) : null}
          {(insight.cosaControllare || []).length > 0 ? (
            <ul className="space-y-1.5 ds-text-secondary text-sm">
              {insight.cosaControllare.map((riga, i) => (
                <li key={`c-${i}`}>• {riga}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {contesto.nuovoLavoro?.categoriaEtichetta ? (
        <p className="ds-text-secondary text-xs px-1">
          Classificazione: {contesto.nuovoLavoro.categoriaEtichetta}
        </p>
      ) : null}

      <div className="grid gap-2">
        {typeof onRipeti === "function" ? (
          <button
            type="button"
            className="btn-secondary w-full min-h-[48px]"
            data-testid="preventivai-intelligence-ripeti"
            onClick={onRipeti}
          >
            Ripeti analisi
          </button>
        ) : null}
        <button
          type="button"
          className="btn-primary w-full min-h-[48px]"
          data-testid="preventivai-intelligence-torna"
          onClick={onTornaAlPreventivo}
        >
          Torna al preventivo
        </button>
      </div>
    </div>
  );
}
