import { useMemo } from "react";
import {
  AlertTriangle,
  ChevronRight,
  HardHat,
  Plus,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import { ROUTES } from "../app/routes";
import GiornataCard from "../features/agenda/components/GiornataCard";
import { preparaAnteprimaGiornata } from "../features/agenda/giornataSelectors";
import { leggiAttivita } from "../domain/attivita";
import { leggiListaSpesa } from "../domain/listaSpesa";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri } from "../repositories/cantieriRepository";
import { leggiDatiAzienda } from "../repositories/impostazioniRepository";
import { leggiPreventivi } from "../repositories/preventiviRepository";
import { PreventivAISuggestions } from "../features/intelligence";
import {
  creaFraseGiornata,
  formattaDataGiornata,
  nomeSalutoDaAzienda,
  salutoOrario,
  selezionaAttenzioni,
  selezionaContinuaDoveHaiLasciato,
  selezionaPreventiviInAttesa,
} from "../features/dashboard/dashboardSelectors";

const AZIONI_RAPIDE = [
  {
    titolo: "Nuovo preventivo",
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
  },
  {
    titolo: "Nuovo Cliente",
    link: `${ROUTES.clienti}?nuovo=1`,
    icon: UserPlus,
    primario: false,
  },
];

/**
 * Home 2.0 — punto di partenza della giornata lavorativa.
 */
export default function Dashboard() {
  const [datiAzienda] = useDatiLocaliSincronizzati(leggiDatiAzienda);
  const [cantieri] = useDatiLocaliSincronizzati(leggiCantieri);
  const [preventivi] = useDatiLocaliSincronizzati(leggiPreventivi);
  const [attivita] = useDatiLocaliSincronizzati(leggiAttivita);
  const [listaSpesa] = useDatiLocaliSincronizzati(leggiListaSpesa);

  const giornata = useMemo(
    () =>
      preparaAnteprimaGiornata(cantieri, new Date(), 5, {
        attivita,
        listaSpesa,
      }),
    [cantieri, attivita, listaSpesa]
  );
  const attenzioni = useMemo(
    () => selezionaAttenzioni({ cantieri, preventivi, massimo: 3 }),
    [cantieri, preventivi]
  );
  const continua = useMemo(
    () => selezionaContinuaDoveHaiLasciato({ cantieri, preventivi }),
    [cantieri, preventivi]
  );
  const preventiviInAttesa = useMemo(
    () => selezionaPreventiviInAttesa(preventivi),
    [preventivi]
  );

  const nome = nomeSalutoDaAzienda(datiAzienda);
  const saluto = salutoOrario();
  const dataGiorno = formattaDataGiornata();
  const haSaldo = attenzioni.some((a) => a.id === "pagamenti");
  const frase = creaFraseGiornata({
    interventiOggi: giornata.totaleLavori,
    preventiviInAttesa: preventiviInAttesa.length,
    haSaldoDaIncassare: haSaldo,
  });

  return (
    <PageWrapper>
      <div className="pro-page text-white space-y-5">
        <header className="pt-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            <span aria-hidden="true">👋 </span>
            {saluto}
            {nome ? ` ${nome}` : ""}
          </h1>
          <p className="mt-2 text-base font-semibold text-slate-300">
            {dataGiorno}
          </p>
          <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
            {frase}
          </p>
        </header>

        <GiornataCard riepilogo={giornata} />

        <section
          className="pro-panel p-5"
          aria-labelledby="home-attenzione-title"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <AlertTriangle
              size={18}
              className="text-amber-300 shrink-0"
              aria-hidden="true"
            />
            <h2
              id="home-attenzione-title"
              className="text-xl font-black tracking-tight"
            >
              Attenzione
            </h2>
          </div>

          {attenzioni.length === 0 ? (
            <p className="text-slate-400 text-sm">Niente di urgente.</p>
          ) : (
            <ul className="space-y-2.5">
              {attenzioni.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.link}
                    className="flex items-center gap-3 min-h-[52px] rounded-[14px] border border-amber-400/20 bg-amber-400/10 px-4 py-3"
                  >
                    <span className="text-amber-200 text-base" aria-hidden="true">
                      ⚠️
                    </span>
                    <span className="flex-1 font-semibold text-amber-50 text-sm sm:text-base">
                      {item.testo}
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-amber-200/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="home-azioni-title">
          <h2
            id="home-azioni-title"
            className="text-xl font-black tracking-tight mb-3 px-0.5"
          >
            Azioni rapide
          </h2>
          <div className="grid gap-3">
            {AZIONI_RAPIDE.map((azione) => {
              const Icon = azione.icon;
              return (
                <Link
                  key={azione.titolo}
                  to={azione.link}
                  data-testid={azione.testId}
                  className={`${
                    azione.primario ? "btn-primary" : "btn-secondary"
                  } min-h-[56px] px-5 flex items-center justify-center gap-3 text-base font-black`}
                >
                  <Icon size={22} aria-hidden="true" />
                  {azione.titolo}
                </Link>
              );
            })}
          </div>
        </section>

        <section
          className="pro-panel p-5"
          aria-labelledby="home-continua-title"
        >
          <p className="section-label">Riprendi</p>
          <h2
            id="home-continua-title"
            className="text-xl font-black tracking-tight mt-1"
          >
            Continua dove hai lasciato
          </h2>

          {!continua ? (
            <p className="mt-4 text-slate-400 text-sm">
              Ancora nessun lavoro da riprendere.
            </p>
          ) : (
            <Link
              to={continua.link}
              className="mt-4 flex items-center gap-3 rounded-[16px] border border-white/12 bg-black/[0.2] p-4 min-h-[72px]"
              aria-label={`Continua ${continua.etichetta} ${continua.titolo}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {continua.etichetta}
                </p>
                <p className="text-base font-bold text-white truncate mt-1">
                  {continua.titolo}
                </p>
                {continua.dettaglio ? (
                  <p className="text-sm text-slate-400 truncate mt-0.5">
                    {continua.dettaglio}
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
