import { Check, MapPin, Navigation, Phone } from "lucide-react";
import { Link } from "react-router-dom";

import { formatEuro } from "../../../utils/preventivi";
import {
  classeIconaTipoLavoro,
  iconaTipoLavoro,
} from "../utils/tipoLavoroUi";

export default function AgendaLavoroCard({
  lavoro,
  onSegnaCompletato,
  completamentoInCorso = false,
}) {
  const telLink = lavoro.telefono
    ? `tel:${lavoro.telefono.replace(/\s/g, "")}`
    : null;
  const navLink = lavoro.indirizzo
    ? `https://maps.google.com/?q=${encodeURIComponent(lavoro.indirizzo)}`
    : null;
  const IconaTipo = iconaTipoLavoro(lavoro.tipoLavoro);

  return (
    <article className="pro-panel p-5 ux-enter">
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${classeIconaTipoLavoro(lavoro.tipoLavoro)}`}
        >
          <IconaTipo size={18} aria-hidden="true" />
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
              <h2 className="ds-card-title mt-0.5 truncate">{lavoro.cliente || lavoro.titolo}</h2>
              {lavoro.cliente && lavoro.titolo !== lavoro.cliente ? (
                <p className="ds-text-secondary mt-0.5 truncate">{lavoro.titolo}</p>
              ) : null}
            </div>
            <span className={lavoro.statoBadgeClass}>{lavoro.statoLabel}</span>
          </div>
        </div>
      </div>

      {lavoro.indirizzo ? (
        <p className="ds-text-secondary flex items-start gap-1.5 mb-3">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <span>{lavoro.indirizzo}</span>
        </p>
      ) : null}

      {lavoro.durataStimataLabel ? (
        <p className="ds-text-primary text-sm mb-3">
          Durata prevista: {lavoro.durataStimataLabel}
        </p>
      ) : null}

      {lavoro.checklist.length > 0 ? (
        <ul className="space-y-1.5 mb-3">
          {lavoro.checklist.map((voce) => (
            <li key={voce} className="ds-text-primary text-sm">
              • {voce}
            </li>
          ))}
        </ul>
      ) : null}

      {lavoro.saldo > 0 ? (
        <p className="text-emerald-300 font-black text-sm mb-4">
          Saldo {formatEuro(lavoro.saldo)}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {telLink ? (
          <a
            href={telLink}
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black"
          >
            <Phone size={16} />
            Chiama
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black opacity-40 cursor-not-allowed"
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
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black"
          >
            <Navigation size={16} />
            Naviga
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black opacity-40 cursor-not-allowed"
          >
            <Navigation size={16} />
            Naviga
          </button>
        )}

        <Link
          to={lavoro.link}
          className="btn-primary py-3 flex items-center justify-center gap-2 text-sm font-black"
        >
          <IconaTipo size={16} />
          Apri lavoro
        </Link>

        {lavoro.stato !== "completato" ? (
          <button
            type="button"
            onClick={() => onSegnaCompletato?.(lavoro.id)}
            disabled={completamentoInCorso}
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black border-emerald-400/30 text-emerald-200"
          >
            <Check size={16} />
            Segna completato
          </button>
        ) : (
          <div className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black opacity-60">
            <Check size={16} />
            Fatto
          </div>
        )}
      </div>
    </article>
  );
}
