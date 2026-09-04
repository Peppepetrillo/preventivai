import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, ChevronRight, Wallet } from "lucide-react";

import { ROUTES, routeCantiere } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri } from "../repositories/cantieriRepository";
import {
  aggregaEconomiaAttivita,
  ETICHETTE_PERIODO_ECONOMIA,
  formatEuro,
  PERIODO_ECONOMIA,
  TIPO_MOVIMENTO_ECONOMIA,
} from "../features/economia/economiaService";

const FILTRI_PERIODO = [
  PERIODO_ECONOMIA.questo_mese,
  PERIODO_ECONOMIA.mese_scorso,
];

function destinazioneMovimento(movimento) {
  const id = movimento?.cantiereId;
  if (!id) return ROUTES.cantieri;
  const sezione =
    movimento.tipo === TIPO_MOVIMENTO_ECONOMIA.uscita
      ? "sezione-spese"
      : "sezione-pagamenti";
  return `${routeCantiere(id)}?sezione=${encodeURIComponent(sezione)}`;
}

function MetricaCard({ label, valore, tono = "default", testId }) {
  const tonoClasse =
    tono === "positivo"
      ? "text-emerald-300"
      : tono === "negativo"
        ? "text-rose-300"
        : tono === "saldo"
          ? valore >= 0
            ? "text-emerald-300"
            : "text-rose-300"
          : "text-white";

  return (
    <div className="pro-panel p-4" data-testid={testId}>
      <p className="section-label">{label}</p>
      <p className={`ds-card-title mt-2 tabular-nums ${tonoClasse}`}>
        {formatEuro(valore)}
      </p>
    </div>
  );
}

/**
 * Economia v0 — cruscotto aggregato movimenti di cassa reali.
 * SoT: cantiere.pagamenti[] + cantiere.spese[]. Nessuna registrazione da qui.
 */
export default function Economia() {
  const [cantieri] = useDatiLocaliSincronizzati(leggiCantieri);
  const [periodo, setPeriodo] = useState(PERIODO_ECONOMIA.questo_mese);

  const aggregato = useMemo(
    () =>
      aggregaEconomiaAttivita(cantieri || [], {
        periodo,
        riferimento: new Date(),
      }),
    [cantieri, periodo]
  );

  return (
    <PageWrapper>
      <div className="pro-page text-white" data-testid="pagina-economia">
        <Link
          to={ROUTES.altro}
          className="ds-back-link mb-5"
          data-testid="economia-back"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Altro
        </Link>

        <header className="pro-panel-strong p-5 mb-4">
          <p className="section-label">Attività</p>
          <h1 className="ds-page-title mt-1 flex items-center gap-2">
            <Wallet
              size={22}
              className="text-yellow-300 shrink-0"
              aria-hidden="true"
            />
            Economia
          </h1>
          <p className="ds-text-secondary mt-2">
            Entrate e uscite reali dei cantieri. Non è contabilità.
          </p>
        </header>

        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-4"
          role="tablist"
          aria-label="Periodo economia"
        >
          {FILTRI_PERIODO.map((id) => {
            const attivo = periodo === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={attivo}
                onClick={() => setPeriodo(id)}
                className={`ds-chip min-h-[44px] ${attivo ? "ds-chip-active" : ""}`}
                data-testid={`economia-filtro-${id}`}
              >
                {ETICHETTE_PERIODO_ECONOMIA[id]}
              </button>
            );
          })}
        </div>

        <section
          className="grid grid-cols-2 gap-3 mb-6"
          aria-label="Riepilogo economico"
        >
          <MetricaCard
            label="Entrate"
            valore={aggregato.entrate}
            tono="positivo"
            testId="economia-entrate"
          />
          <MetricaCard
            label="Uscite"
            valore={aggregato.uscite}
            tono="negativo"
            testId="economia-uscite"
          />
          <MetricaCard
            label="Saldo"
            valore={aggregato.saldo}
            tono="saldo"
            testId="economia-saldo"
          />
          <MetricaCard
            label="Da incassare"
            valore={aggregato.daIncassare}
            testId="economia-da-incassare"
          />
        </section>

        <section aria-labelledby="economia-movimenti-title">
          <h2 id="economia-movimenti-title" className="ds-section-title mb-3">
            Ultimi movimenti
          </h2>

          {aggregato.movimenti.length === 0 ? (
            <div className="pro-panel ds-empty" data-testid="economia-vuoto">
              <div className="ds-empty-icon" aria-hidden="true">
                <Wallet size={28} />
              </div>
              <p className="ds-card-title">Nessun movimento</p>
              <p className="ds-text-secondary mt-2 max-w-sm mx-auto">
                Nel periodo selezionato non ci sono pagamenti o spese
                registrati nei cantieri.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="economia-lista-movimenti">
              {aggregato.movimenti.map((movimento) => {
                const entrata =
                  movimento.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata;
                const Icon = entrata ? ArrowDownLeft : ArrowUpRight;
                return (
                  <li key={movimento.id}>
                    <Link
                      to={destinazioneMovimento(movimento)}
                      className="pro-panel p-4 flex items-start gap-3 min-h-[64px]"
                      data-testid={`economia-movimento-${movimento.id}`}
                      data-cantiere-id={movimento.cantiereId}
                    >
                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-[16px] shrink-0 ${
                          entrata
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-rose-400/15 text-rose-300"
                        }`}
                        aria-hidden="true"
                      >
                        <Icon size={22} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`ds-text-primary tabular-nums font-semibold ${
                            entrata ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          {entrata ? "+" : "−"} {formatEuro(movimento.importo)}
                        </p>
                        <p className="ds-text-primary mt-0.5 truncate">
                          {movimento.descrizione}
                        </p>
                        <p className="ds-text-secondary mt-1">
                          {movimento.data}
                        </p>
                        <p className="ds-text-secondary truncate">
                          {movimento.etichettaCantiere}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-6">
          <Link
            to={ROUTES.storico}
            className="pro-panel p-4 flex items-center justify-between gap-3 min-h-[64px]"
            data-testid="economia-link-storico"
          >
            <div className="min-w-0">
              <p className="ds-card-title">Storico lavori</p>
              <p className="ds-text-secondary mt-1">
                Giornate e conti dei lavori già fatti
              </p>
            </div>
            <ChevronRight
              size={20}
              className="text-slate-500 shrink-0"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
