import { useMemo } from "react";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import AssistantCard from "../components/assistant/AssistantCard";
import { ROUTES } from "../app/routes";
import HomeDaFareItem from "../features/oggi/components/HomeDaFareItem";
import HomeLavoroCard from "../features/oggi/components/HomeLavoroCard";
import { calcolaOggi } from "../features/oggi/oggiService";
import { PreventivAISuggestions } from "../features/intelligence";
import { leggiAttivita } from "../domain/attivita";
import { leggiListaSpesa } from "../domain/listaSpesa";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri } from "../repositories/cantieriRepository";
import { leggiDatiAzienda } from "../repositories/impostazioniRepository";
import { leggiPreventivi } from "../repositories/preventiviRepository";

/**
 * Home Oggi — punto di partenza operativo (UX-8.2).
 */
export default function Dashboard() {
  const [datiAzienda] = useDatiLocaliSincronizzati(leggiDatiAzienda);
  const [cantieri] = useDatiLocaliSincronizzati(leggiCantieri);
  const [preventivi] = useDatiLocaliSincronizzati(leggiPreventivi);
  const [attivita] = useDatiLocaliSincronizzati(leggiAttivita);
  const [listaSpesa] = useDatiLocaliSincronizzati(leggiListaSpesa);

  const oggi = useMemo(
    () =>
      calcolaOggi({
        cantieri,
        preventivi,
        listaSpesa,
        attivita,
        datiAzienda,
      }),
    [cantieri, preventivi, listaSpesa, attivita, datiAzienda]
  );

  const lavoriOggi = oggi.giornata?.lavori || [];
  const riepilogoVisibile = oggi.riepilogo.filter((voce) => voce.conteggio > 0);
  const haSuggerimenti =
    oggi.assistantCards.length > 0 || cantieri.length > 0 || preventivi.length > 0;

  return (
    <PageWrapper>
      <div className="pro-page text-white space-y-6 pb-4" data-testid="home-oggi">
        <header className="pt-1">
          <h1 className="ds-page-title">
            {oggi.saluto}
            {oggi.nome ? ` ${oggi.nome}` : ""}
          </h1>
          <p className="mt-2 ds-text-primary text-slate-300">{oggi.dataLabel}</p>
          <p className="mt-1.5 ds-text-secondary" data-testid="home-frase">
            {oggi.frase}
          </p>
        </header>

        <section aria-labelledby="home-oggi-title" data-testid="home-sezione-oggi">
          <h2 id="home-oggi-title" className="ds-card-title mb-3 px-0.5">
            Oggi
          </h2>

          {lavoriOggi.length === 0 ? (
            <div
              className="pro-panel p-5 ds-empty"
              data-testid="home-oggi-vuoto"
            >
              <p className="ds-card-title">Giornata libera</p>
              <p className="ds-text-secondary mt-2">
                Non hai lavori programmati per oggi.
              </p>
              <Link
                to={ROUTES.agenda}
                className="btn-secondary mt-4 min-h-[48px] inline-flex items-center justify-center gap-2 px-4"
                data-testid="home-apri-agenda-vuoto"
              >
                <CalendarDays size={18} aria-hidden="true" />
                Apri Agenda
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {lavoriOggi.map((lavoro) => (
                <li key={lavoro.id}>
                  <HomeLavoroCard lavoro={lavoro} />
                </li>
              ))}
            </ul>
          )}

          {lavoriOggi.length > 0 ? (
            <Link
              to={ROUTES.agenda}
              className="btn-secondary w-full mt-4 min-h-[48px] flex items-center justify-center gap-2"
              data-testid="home-apri-agenda"
            >
              <CalendarDays size={18} aria-hidden="true" />
              Apri Agenda
            </Link>
          ) : null}
        </section>

        {oggi.daFare.length > 0 ? (
          <section
            aria-labelledby="home-da-fare-title"
            data-testid="home-sezione-da-fare"
          >
            <h2 id="home-da-fare-title" className="ds-card-title mb-3 px-0.5">
              Da fare
            </h2>
            <ul className="space-y-2">
              {oggi.daFare.map((voce) => (
                <li key={voce.id}>
                  <HomeDaFareItem voce={voce} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-label="Azione principale">
          <Link
            to={ROUTES.preventiviNuovo}
            className="btn-primary w-full min-h-[52px] flex items-center justify-center gap-2 text-base font-semibold"
            data-testid="home-nuovo-preventivo"
          >
            <FileText size={20} aria-hidden="true" />
            Nuovo preventivo
          </Link>
        </section>

        {oggi.continua ? (
          <section
            className="pro-panel p-5"
            aria-labelledby="home-continua-title"
            data-testid="home-sezione-continua"
          >
            <p className="section-label">Continua</p>
            <h2 id="home-continua-title" className="ds-card-title mt-1">
              Continua da dove hai lasciato
            </h2>
            <Link
              to={oggi.continua.link}
              className="mt-4 flex items-center gap-3 rounded-[16px] border border-white/12 bg-black/[0.2] p-4 min-h-[72px]"
              data-testid="home-continua-link"
              aria-label={`Continua ${oggi.continua.etichetta} ${oggi.continua.titolo}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {oggi.continua.etichetta}
                </p>
                <p className="ds-text-primary truncate mt-1">
                  {oggi.continua.titolo}
                </p>
                {oggi.continua.dettaglio ? (
                  <p className="ds-text-secondary truncate mt-0.5">
                    {oggi.continua.dettaglio}
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
          </section>
        ) : null}

        {haSuggerimenti ? (
          <details
            className="pro-panel p-4"
            data-testid="home-suggerimenti"
          >
            <summary className="ds-card-title cursor-pointer min-h-[44px] flex items-center gap-2 list-none">
              <Sparkles size={18} className="text-yellow-200 shrink-0" aria-hidden="true" />
              Suggerimenti
            </summary>
            <div className="mt-4 space-y-3">
              {oggi.assistantCards.map((card) => (
                <AssistantCard key={card.id} card={card} />
              ))}
              <PreventivAISuggestions
                scope="home"
                cantieri={cantieri}
                preventivi={preventivi}
              />
            </div>
          </details>
        ) : null}

        {riepilogoVisibile.length > 0 ? (
          <section
            className="pro-panel p-4 opacity-90"
            aria-labelledby="home-numeri-title"
            data-testid="home-riepilogo"
          >
            <h2 id="home-numeri-title" className="ds-text-secondary text-sm mb-3">
              In sintesi
            </h2>
            <ul className="grid grid-cols-2 gap-2">
              {riepilogoVisibile.map((voce) => (
                <li key={voce.id}>
                  <Link
                    to={voce.link}
                    className="flex flex-col justify-center min-h-[56px] rounded-[16px] border border-white/8 bg-black/20 px-3 py-2"
                    data-testid={`home-riepilogo-${voce.id}`}
                  >
                    <span className="text-lg font-semibold tabular-nums text-slate-200">
                      {voce.conteggio}
                    </span>
                    <span className="ds-text-secondary text-xs mt-0.5 leading-snug">
                      {voce.etichetta}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PageWrapper>
  );
}
