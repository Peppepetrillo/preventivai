import { useMemo } from "react";
import {
  Archive,
  Bell,
  ChevronRight,
  HardHat,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import AssistantCard from "../components/assistant/AssistantCard";
import { ROUTES } from "../app/routes";
import GiornataCard from "../features/agenda/components/GiornataCard";
import { calcolaOggi } from "../features/oggi/oggiService";
import { leggiAttivita } from "../domain/attivita";
import { leggiListaSpesa } from "../domain/listaSpesa";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri } from "../repositories/cantieriRepository";
import { leggiDatiAzienda } from "../repositories/impostazioniRepository";
import { leggiPreventivi } from "../repositories/preventiviRepository";
import { PreventivAISuggestions } from "../features/intelligence";

const AZIONI_RAPIDE = [
  {
    titolo: "Nuovo Preventivo",
    link: ROUTES.preventivi,
    icon: Plus,
    primario: true,
    testId: "entry-nuovo-preventivo",
  },
  {
    titolo: "Nuovo Cantiere",
    link: `${ROUTES.cantieri}?nuovo=1`,
    icon: HardHat,
    primario: false,
    testId: "entry-nuovo-cantiere",
  },
  {
    titolo: "Clienti",
    link: ROUTES.clienti,
    icon: Users,
    primario: false,
    testId: "entry-clienti",
  },
  {
    titolo: "Archivio",
    link: ROUTES.archivio,
    icon: Archive,
    primario: false,
    testId: "entry-archivio",
  },
];

/**
 * Home Oggi — schermata iniziale operativa (mobile-first).
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

  const riepilogoVisibile = oggi.riepilogo.filter((voce) => voce.conteggio > 0);

  return (
    <PageWrapper>
      <div className="pro-page text-white space-y-5" data-testid="home-oggi">
        <header className="pt-1">
          <h1 className="ds-page-title">
            {oggi.saluto}
            {oggi.nome ? ` ${oggi.nome}` : ""}
          </h1>
          <p className="mt-2 ds-text-primary text-slate-300">{oggi.dataLabel}</p>
          <p className="mt-1.5 ds-text-secondary">{oggi.frase}</p>
        </header>

        <section
          className="pro-panel p-4"
          aria-labelledby="home-riepilogo-title"
          data-testid="home-riepilogo"
        >
          <h2 id="home-riepilogo-title" className="ds-card-title">
            Oggi
          </h2>

          {oggi.vuoto && riepilogoVisibile.length === 0 ? (
            <p className="mt-3 ds-text-secondary" data-testid="home-oggi-vuoto">
              Niente in sospeso. Parti da un&apos;azione rapida.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {riepilogoVisibile.map((voce) => (
                <li key={voce.id}>
                  <Link
                    to={voce.link}
                    className="flex flex-col justify-center min-h-[72px] rounded-[16px] border border-white/10 bg-black/25 px-3 py-3"
                    data-testid={`home-riepilogo-${voce.id}`}
                  >
                    <span className="text-2xl font-semibold tabular-nums text-yellow-200">
                      {voce.conteggio}
                    </span>
                    <span className="ds-text-secondary text-xs mt-1 leading-snug">
                      {voce.etichetta}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {oggi.promemoria.length > 0 ? (
          <section
            className="pro-panel p-4"
            aria-labelledby="home-promemoria-title"
            data-testid="home-promemoria"
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell size={18} className="text-yellow-200 shrink-0" aria-hidden="true" />
              <h2 id="home-promemoria-title" className="ds-card-title">
                Promemoria
              </h2>
            </div>
            <ul className="space-y-2">
              {oggi.promemoria.map((voce) => (
                <li key={voce.id}>
                  <Link
                    to={ROUTES.agenda}
                    className="flex items-center gap-3 min-h-[48px] rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block ds-text-primary truncate">
                        {voce.titolo || "Promemoria"}
                      </span>
                      <span className="block ds-text-secondary text-xs mt-0.5">
                        {[voce.data, voce.ora].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <GiornataCard riepilogo={oggi.giornata} />

        <section aria-labelledby="home-azioni-title">
          <h2 id="home-azioni-title" className="ds-card-title mb-3 px-0.5">
            Azioni rapide
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {AZIONI_RAPIDE.map((azione) => {
              const Icon = azione.icon;
              return (
                <Link
                  key={azione.titolo}
                  to={azione.link}
                  data-testid={azione.testId}
                  className={`${
                    azione.primario ? "btn-primary" : "btn-secondary"
                  } min-h-[52px] px-4 flex items-center justify-center gap-2 text-[15px] font-semibold`}
                >
                  <Icon size={20} aria-hidden="true" />
                  {azione.titolo}
                </Link>
              );
            })}
          </div>
        </section>

        {oggi.assistantCards.length > 0 ? (
          <section
            aria-labelledby="home-assistant-title"
            data-testid="home-assistant"
          >
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <Sparkles
                size={18}
                className="text-yellow-200 shrink-0"
                aria-hidden="true"
              />
              <h2 id="home-assistant-title" className="ds-card-title">
                Suggerimenti
              </h2>
            </div>
            <div className="grid gap-3">
              {oggi.assistantCards.map((card) => (
                <AssistantCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        ) : null}

        <section
          className="pro-panel p-5"
          aria-labelledby="home-continua-title"
        >
          <p className="section-label">Riprendi</p>
          <h2 id="home-continua-title" className="ds-card-title mt-1">
            Continua dove hai lasciato
          </h2>

          {!oggi.continua ? (
            <p className="mt-4 ds-text-secondary">
              Ancora nessun lavoro da riprendere.
            </p>
          ) : (
            <Link
              to={oggi.continua.link}
              className="mt-4 flex items-center gap-3 rounded-[16px] border border-white/12 bg-black/[0.2] p-4 min-h-[72px]"
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
          )}
        </section>

        <PreventivAISuggestions
          scope="home"
          cantieri={cantieri}
          preventivi={preventivi}
        />
      </div>
    </PageWrapper>
  );
}
