import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  ShoppingCart,
  Wallet,
} from "lucide-react";

import { ROUTES } from "../../../app/routes";
import { formatEuro } from "../../../utils/preventivi";
import {
  classeIconaTipoLavoro,
  iconaTipoLavoro,
} from "../utils/tipoLavoroUi";

export default function GiornataCard({ riepilogo }) {
  if (!riepilogo) return null;

  const {
    lavori = [],
    totaleLavori = 0,
    orePreviste,
    materialiDaComprare = [],
    materialiDaPortare = [],
    pagamentiPrevisti = [],
    lavoriUrgenti = [],
    haContenuto,
  } = riepilogo;

  return (
    <section
      className="pro-panel-strong p-5"
      aria-labelledby="home-giornata-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">Pianificazione</p>
          <h2
            id="home-giornata-title"
            className="text-2xl sm:text-3xl font-black tracking-tight mt-1"
          >
            La tua giornata
          </h2>
        </div>
        <Link
          to={ROUTES.agenda}
          className="btn-secondary px-3 py-2 text-xs font-black shrink-0"
        >
          Agenda
        </Link>
      </div>

      {!haContenuto ? (
        <p className="mt-5 text-slate-400 text-sm leading-relaxed">
          Nessun lavoro in programma. Buona giornata.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Lavori oggi
              </p>
              <p className="text-2xl font-black mt-1">{totaleLavori}</p>
            </div>
            <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                <Clock size={12} />
                Ore previste
              </p>
              <p className="text-2xl font-black mt-1">{orePreviste?.label || "—"}</p>
            </div>
          </div>

          {lavori.length > 0 ? (
            <ul className="space-y-3">
              {lavori.map((lavoro) => {
                const IconaTipo = iconaTipoLavoro(lavoro.tipoLavoro);
                return (
                  <li key={lavoro.id}>
                    <Link
                      to={lavoro.link}
                      className="flex items-center gap-3 rounded-[16px] border border-white/12 bg-black/[0.22] p-4 min-h-[72px] active:scale-[0.99] transition-transform"
                      aria-label={`Apri lavoro ${lavoro.cliente || lavoro.titolo}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${classeIconaTipoLavoro(lavoro.tipoLavoro)}`}
                      >
                        <IconaTipo size={18} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {lavoro.orario ? (
                          <p className="text-xs font-bold uppercase tracking-wide text-yellow-200 tabular-nums">
                            {lavoro.orario}
                            {lavoro.durataStimataLabel
                              ? ` · ${lavoro.durataStimataLabel}`
                              : ""}
                          </p>
                        ) : null}
                        <p className="text-base font-bold text-white truncate mt-0.5">
                          {lavoro.cliente || lavoro.titolo}
                        </p>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                          {lavoro.tipoLavoroLabel} · {lavoro.statoLabel}
                        </p>
                        {lavoro.indirizzo ? (
                          <p className="text-sm text-slate-400 mt-1 flex items-start gap-1.5">
                            <MapPin
                              size={14}
                              className="shrink-0 mt-0.5 text-slate-500"
                              aria-hidden="true"
                            />
                            <span className="line-clamp-2">{lavoro.indirizzo}</span>
                          </p>
                        ) : null}
                      </div>
                      <ChevronRight
                        size={22}
                        className="text-yellow-200 shrink-0"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {materialiDaComprare.length > 0 ? (
            <div className="rounded-[14px] border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="text-sm font-black text-amber-100 flex items-center gap-2">
                <ShoppingCart size={16} />
                Materiale da comprare
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-50/90">
                {materialiDaComprare.slice(0, 4).map((m) => (
                  <li key={m.nome}>
                    {m.nome} · {m.quantita} {m.unita}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {materialiDaPortare.length > 0 ? (
            <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
              <p className="text-sm font-black text-slate-200 flex items-center gap-2">
                <Package size={16} />
                Materiale da portare
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {materialiDaPortare.slice(0, 4).map((m) => (
                  <li key={m.nome}>
                    {m.nome} · {m.quantita} {m.unita}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {pagamentiPrevisti.length > 0 ? (
            <div className="rounded-[14px] border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-sm font-black text-emerald-100 flex items-center gap-2">
                <Wallet size={16} />
                Pagamenti previsti
              </p>
              <ul className="mt-2 space-y-1 text-sm text-emerald-50/90">
                {pagamentiPrevisti.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    {p.cliente} · {p.importoLabel}
                  </li>
                ))}
              </ul>
              {pagamentiPrevisti.length > 1 ? (
                <p className="text-xs text-emerald-200/80 mt-2">
                  Totale {formatEuro(riepilogo.totalePagamentiPrevisti || 0)}
                </p>
              ) : null}
            </div>
          ) : null}

          {lavoriUrgenti.length > 0 ? (
            <div className="rounded-[14px] border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-sm font-black text-red-100 flex items-center gap-2">
                <AlertTriangle size={16} />
                Lavori urgenti
              </p>
              <ul className="mt-2 space-y-1 text-sm text-red-50/90">
                {lavoriUrgenti.slice(0, 3).map((l) => (
                  <li key={l.id}>
                    {l.cliente || l.titolo}
                    {l.checklist.length > 0
                      ? ` · ${l.checklist.length} attività`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {totaleLavori > lavori.length ? (
            <Link
              to={ROUTES.agenda}
              className="flex items-center justify-center gap-2 text-sm font-black text-yellow-200"
            >
              <CalendarDays size={16} />
              Vedi tutti i lavori ({totaleLavori})
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
