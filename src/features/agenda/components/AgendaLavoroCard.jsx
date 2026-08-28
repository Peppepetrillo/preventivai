import { createElement } from "react";
import { Check, Lightbulb, ChevronRight, MapPin, Navigation, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { formatEuro } from "../../../utils/preventivi";
import {
  classeIconaTipoLavoro,
  iconaTipoLavoro,
} from "../utils/tipoLavoroUi";

function AzionePrincipale({
  lavoro,
  onSegnaCompletato,
  onRegistraConsuntivo,
  completamentoInCorso,
}) {
  if (lavoro.kind === "giornata-lavorativa") {
    return (
      <div
        className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black opacity-60 min-h-[48px]"
        data-testid="agenda-consuntivo-registrato"
      >
        <Check size={16} />
        Consuntivo registrato
      </div>
    );
  }

  if (lavoro.kind === "lavoro-giornata") {
    if (lavoro.stato !== "completato") {
      return (
        <button
          type="button"
          onClick={() => onSegnaCompletato?.(lavoro.id)}
          disabled={completamentoInCorso}
          className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black border-emerald-400/30 text-emerald-200 min-h-[48px]"
          data-testid="agenda-segna-giornata-fatta"
        >
          <Check size={16} />
          Segna giornata fatta
        </button>
      );
    }

    if (lavoro.consuntivoMancante) {
      return (
        <button
          type="button"
          onClick={() => onRegistraConsuntivo?.(lavoro)}
          className="btn-primary py-3 flex items-center justify-center gap-2 text-sm font-black min-h-[48px]"
          data-testid="agenda-registra-consuntivo"
        >
          <Check size={16} />
          Registra consuntivo
        </button>
      );
    }

    return (
      <div
        className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black opacity-60 min-h-[48px]"
        data-testid="agenda-giornata-fatta"
      >
        <Check size={16} />
        Giornata fatta
      </div>
    );
  }

  if (lavoro.stato !== "completato") {
    return (
      <button
        type="button"
        onClick={() => onSegnaCompletato?.(lavoro.id)}
        disabled={completamentoInCorso}
        className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black border-emerald-400/30 text-emerald-200 min-h-[48px]"
        data-testid="agenda-lavoro-finito"
      >
        <Check size={16} />
        Lavoro finito
      </button>
    );
  }

  return (
    <div className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black opacity-60 min-h-[48px]">
      <Check size={16} />
      Lavoro finito
    </div>
  );
}

export default function AgendaLavoroCard({
  lavoro,
  onSegnaCompletato,
  onRegistraConsuntivo,
  completamentoInCorso = false,
  onInsight,
}) {
  const telLink = lavoro.telefono
    ? `tel:${lavoro.telefono.replace(/\s/g, "")}`
    : null;
  const navLink = lavoro.indirizzo
    ? `https://maps.google.com/?q=${encodeURIComponent(lavoro.indirizzo)}`
    : null;
  const titoloLavoro = lavoro.cliente || lavoro.titolo;

  return (
    <article className="pro-panel p-0 overflow-hidden ux-enter">
      <Link
        to={lavoro.link}
        className="flex items-start gap-3 p-5 min-h-[72px] active:scale-[0.99] transition-transform"
        aria-label={`Apri lavoro ${titoloLavoro}`}
        data-testid="agenda-lavoro-link"
      >
        <div
          className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${classeIconaTipoLavoro(lavoro.tipoLavoro)}`}
        >
          {createElement(iconaTipoLavoro(lavoro.tipoLavoro), {
            size: 18,
            "aria-hidden": true,
          })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {lavoro.orario ? (
                <p className="text-2xl font-black text-yellow-300 leading-none">
                  {lavoro.orario}
                </p>
              ) : null}
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mt-1">
                {lavoro.tipoLavoroLabel}
              </p>
              <h2 className="ds-card-title mt-0.5 truncate">{titoloLavoro}</h2>
              {lavoro.cliente && lavoro.titolo !== lavoro.cliente ? (
                <p className="ds-text-secondary mt-0.5 truncate">{lavoro.titolo}</p>
              ) : null}
              {lavoro.sottotitoloProgrammazione ? (
                <p className="ds-text-primary text-sm mt-1 truncate" data-testid="agenda-lavoro-programmazione">
                  {lavoro.sottotitoloProgrammazione}
                </p>
              ) : null}
            </div>
            <span className={lavoro.statoBadgeClass}>{lavoro.statoLabel}</span>
          </div>

          {lavoro.indirizzo ? (
            <p className="ds-text-secondary flex items-start gap-1.5 mt-2">
              <MapPin size={14} className="shrink-0 mt-0.5" />
              <span>{lavoro.indirizzo}</span>
            </p>
          ) : null}

          {lavoro.durataStimataLabel ? (
            <p className="ds-text-primary text-sm mt-2">
              {lavoro.kind === "giornata-lavorativa"
                ? `Ore lavorate: ${lavoro.durataStimataLabel}`
                : `Durata prevista: ${lavoro.durataStimataLabel}`}
            </p>
          ) : null}

          {lavoro.checklist.length > 0 ? (
            <ul className="space-y-1.5 mt-2">
              {lavoro.checklist.map((voce) => (
                <li key={voce} className="ds-text-primary text-sm">
                  • {voce}
                </li>
              ))}
            </ul>
          ) : null}

          {lavoro.saldo > 0 ? (
            <p className="text-emerald-300 font-black text-sm mt-2">
              Saldo {formatEuro(lavoro.saldo)}
            </p>
          ) : null}
        </div>
        <ChevronRight
          size={22}
          className="text-yellow-200 shrink-0 mt-2"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </Link>

      <div className="grid grid-cols-2 gap-2 px-5 pb-5">
        {telLink ? (
          <a
            href={telLink}
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black min-h-[48px]"
          >
            <Phone size={16} />
            Chiama
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black opacity-40 cursor-not-allowed min-h-[48px]"
          >
            <Phone size={16} />
            Chiama
          </button>
        )}

        {navLink ? (
          <a
            href={navLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black min-h-[48px]"
          >
            <Navigation size={16} />
            Naviga
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black opacity-40 cursor-not-allowed min-h-[48px]"
          >
            <Navigation size={16} />
            Naviga
          </button>
        )}

        <AzionePrincipale
          lavoro={lavoro}
          onSegnaCompletato={onSegnaCompletato}
          onRegistraConsuntivo={onRegistraConsuntivo}
          completamentoInCorso={completamentoInCorso}
        />

        {onInsight ? (
          <button
            type="button"
            onClick={() => onInsight(lavoro)}
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black min-h-[48px]"
          >
            <Lightbulb size={16} />
            Idea
          </button>
        ) : null}
      </div>
    </article>
  );
}
