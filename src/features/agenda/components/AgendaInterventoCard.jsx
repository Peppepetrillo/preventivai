import { Check, HardHat, MapPin, Navigation, Phone, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { formatEuro } from "../../../utils/preventivi";
import {
  classeBadgeStatoAgenda,
  etichettaStatoAgenda,
} from "../agendaSelectors";

export default function AgendaInterventoCard({
  intervento,
  onSegnaCompletato,
  completamentoInCorso = false,
}) {
  const telLink = intervento.telefono
    ? `tel:${intervento.telefono.replace(/\s/g, "")}`
    : null;
  const navLink = intervento.indirizzo
    ? `https://maps.google.com/?q=${encodeURIComponent(intervento.indirizzo)}`
    : null;

  return (
    <article className="pro-panel p-5 ux-enter">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {intervento.orario ? (
            <p className="text-2xl font-black text-yellow-300 leading-none">
              {intervento.orario}
            </p>
          ) : null}
          <h2 className="ds-card-title mt-1 truncate">{intervento.titolo}</h2>
          {intervento.cliente && intervento.cliente !== intervento.titolo ? (
            <p className="ds-text-secondary mt-0.5">{intervento.cliente}</p>
          ) : null}
        </div>
        <span className={classeBadgeStatoAgenda(intervento.stato)}>
          {etichettaStatoAgenda(intervento.stato)}
        </span>
      </div>

      {intervento.indirizzo ? (
        <p className="ds-text-secondary flex items-start gap-1.5 mb-3">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <span>{intervento.indirizzo}</span>
        </p>
      ) : null}

      {intervento.checklist.length > 0 ? (
        <ul className="space-y-1.5 mb-3">
          {intervento.checklist.map((voce) => (
            <li key={voce} className="ds-text-primary text-sm flex items-start gap-2">
              <Square size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <span>{voce}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {intervento.saldo > 0 ? (
        <p className="text-emerald-300 font-black text-sm mb-4">
          Saldo {formatEuro(intervento.saldo)}
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
          to={intervento.link}
          className="btn-primary py-3 flex items-center justify-center gap-2 text-sm font-black"
        >
          <HardHat size={16} />
          Apri Cantiere
        </Link>

        {intervento.stato !== "completato" ? (
          <button
            type="button"
            onClick={() => onSegnaCompletato?.(intervento.id)}
            disabled={completamentoInCorso}
            className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm font-black border-emerald-400/30 text-emerald-200"
          >
            <Check size={16} />
            Completato
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
