import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HardHat, History, Lightbulb } from "lucide-react";

import {
  ROUTES,
  routeCantierePagamenti,
} from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri } from "../repositories/cantieriRepository";
import { classeBadgeStatoCantiere } from "../ui/designSystem";
import {
  aggregaStoricoLavori,
  AMBITO_STORICO,
  ETICHETTE_AMBITO_STORICO,
  ETICHETTE_ORDINAMENTO_STORICO,
  formatEuro,
  ORDINAMENTO_STORICO,
} from "../features/storico/storicoLavoriService";

const FILTRI_AMBITO = [AMBITO_STORICO.conclusi, AMBITO_STORICO.tutti];

const ORDINAMENTI = [
  ORDINAMENTO_STORICO.recenti,
  ORDINAMENTO_STORICO.saldo_alto,
  ORDINAMENTO_STORICO.saldo_basso,
  ORDINAMENTO_STORICO.piu_giornate,
  ORDINAMENTO_STORICO.piu_ore,
  ORDINAMENTO_STORICO.maggiori_uscite,
];

function formatOre(valore) {
  const n = Number(valore) || 0;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
}

function tonoSaldo(valore) {
  if (valore > 0) return "text-emerald-300";
  if (valore < 0) return "text-rose-300";
  return "text-white";
}

/**
 * Storico lavori — lettura operativa dei lavori registrati.
 * Tap → tab Economico del cantiere esistente (nessun dettaglio duplicato).
 */
export default function Storico() {
  const [cantieri] = useDatiLocaliSincronizzati(leggiCantieri);
  const [ambito, setAmbito] = useState(AMBITO_STORICO.conclusi);
  const [ordinamento, setOrdinamento] = useState(ORDINAMENTO_STORICO.recenti);

  const aggregato = useMemo(
    () =>
      aggregaStoricoLavori(cantieri || [], {
        ambito,
        ordinamento,
        limiteLavori: 40,
      }),
    [cantieri, ambito, ordinamento]
  );

  const titoloConteggio =
    aggregato.lavoriAnalizzati === 1
      ? "1 lavoro"
      : `${aggregato.lavoriAnalizzati} lavori`;

  return (
    <PageWrapper>
      <div className="pro-page text-white" data-testid="pagina-storico">
        <Link
          to={ROUTES.altro}
          className="ds-back-link mb-5"
          data-testid="storico-back"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Altro
        </Link>

        <header className="pro-panel-strong p-5 mb-4">
          <p className="section-label">Lavori</p>
          <h1 className="ds-page-title mt-1 flex items-center gap-2">
            <History
              size={22}
              className="text-yellow-300 shrink-0"
              aria-hidden="true"
            />
            Storico
          </h1>
          <p className="ds-text-primary mt-3" data-testid="storico-conteggio">
            {titoloConteggio}
            {ambito === AMBITO_STORICO.conclusi ? " completati" : " analizzati"}
          </p>
          <p className="ds-text-secondary mt-1">
            Come sono andati i lavori che hai già registrato.
          </p>
        </header>

        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-3"
          role="tablist"
          aria-label="Ambito storico"
        >
          {FILTRI_AMBITO.map((id) => {
            const attivo = ambito === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={attivo}
                onClick={() => setAmbito(id)}
                className={`ds-chip min-h-[44px] ${attivo ? "ds-chip-active" : ""}`}
                data-testid={`storico-filtro-${id}`}
              >
                {ETICHETTE_AMBITO_STORICO[id]}
              </button>
            );
          })}
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-4"
          role="listbox"
          aria-label="Ordina storico"
        >
          {ORDINAMENTI.map((id) => {
            const attivo = ordinamento === id;
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={attivo}
                onClick={() => setOrdinamento(id)}
                className={`ds-chip min-h-[44px] ${attivo ? "ds-chip-active" : ""}`}
                data-testid={`storico-ordina-${id}`}
              >
                {ETICHETTE_ORDINAMENTO_STORICO[id]}
              </button>
            );
          })}
        </div>

        <section
          className="pro-panel p-4 mb-4"
          aria-label="Riepilogo storico"
          data-testid="storico-riepilogo"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="section-label">Giornate</p>
              <p
                className="ds-text-primary mt-1 tabular-nums"
                data-testid="storico-kpi-giornate"
              >
                {aggregato.totaleGiornate}
              </p>
            </div>
            <div>
              <p className="section-label">Ore</p>
              <p
                className="ds-text-primary mt-1 tabular-nums"
                data-testid="storico-kpi-ore"
              >
                {formatOre(aggregato.totaleOre)}
              </p>
            </div>
            <div>
              <p className="section-label">Entrate</p>
              <p
                className="ds-text-primary mt-1 tabular-nums text-emerald-300"
                data-testid="storico-kpi-entrate"
              >
                {formatEuro(aggregato.totaleEntrate)}
              </p>
            </div>
            <div>
              <p className="section-label">Uscite</p>
              <p
                className="ds-text-primary mt-1 tabular-nums text-rose-300"
                data-testid="storico-kpi-uscite"
              >
                {formatEuro(aggregato.totaleUscite)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="section-label">Saldo</p>
            <p
              className={`ds-card-title mt-1 tabular-nums ${tonoSaldo(
                aggregato.saldoComplessivo
              )}`}
              data-testid="storico-kpi-saldo"
            >
              {formatEuro(aggregato.saldoComplessivo)}
            </p>
          </div>
          <span className="sr-only" data-testid="storico-kpi-lavori">
            {aggregato.lavoriAnalizzati}
          </span>
        </section>

        {aggregato.insight.length > 0 ? (
          <section
            className="mb-5"
            aria-labelledby="storico-insight-title"
            data-testid="storico-insight"
          >
            <h2
              id="storico-insight-title"
              className="ds-section-title mb-3 flex items-center gap-2"
            >
              <Lightbulb
                size={18}
                className="text-yellow-300 shrink-0"
                aria-hidden="true"
              />
              In sintesi
            </h2>
            <ul className="flex flex-col gap-2">
              {aggregato.insight.map((voce) => (
                <li
                  key={voce.id}
                  className="pro-panel px-4 py-3 ds-text-secondary"
                  data-testid={`storico-insight-${voce.id}`}
                >
                  {voce.testo}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="storico-lista-title">
          <h2 id="storico-lista-title" className="ds-section-title mb-3">
            Lavori
          </h2>

          {aggregato.lavori.length === 0 ? (
            <div className="pro-panel ds-empty" data-testid="storico-vuoto">
              <div className="ds-empty-icon" aria-hidden="true">
                <HardHat size={28} />
              </div>
              <p className="ds-card-title">Nessun lavoro</p>
              <p className="ds-text-secondary mt-2 max-w-sm mx-auto">
                {ambito === AMBITO_STORICO.conclusi
                  ? "Quando chiudi un cantiere come Completato, compare qui con giornate e conti reali."
                  : "Non ci sono cantieri da mostrare."}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="storico-lista">
              {aggregato.lavori.map((lavoro) => (
                <li key={lavoro.cantiereId}>
                  <Link
                    to={routeCantierePagamenti(lavoro.cantiereId)}
                    className="pro-panel p-4 block min-h-[64px]"
                    data-testid={`storico-lavoro-${lavoro.cantiereId}`}
                    data-cantiere-id={lavoro.cantiereId}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="ds-card-title truncate">{lavoro.nome}</p>
                        {lavoro.cliente ? (
                          <p className="ds-text-secondary mt-1 truncate">
                            {lavoro.cliente}
                          </p>
                        ) : null}
                      </div>
                      <span className={classeBadgeStatoCantiere(lavoro.stato)}>
                        {lavoro.stato}
                      </span>
                    </div>

                    <p
                      className={`ds-card-title mt-3 tabular-nums ${tonoSaldo(
                        lavoro.saldo
                      )}`}
                    >
                      Saldo {formatEuro(lavoro.saldo)}
                    </p>

                    <p className="ds-text-secondary mt-2">
                      {lavoro.contaGiornate}{" "}
                      {lavoro.contaGiornate === 1 ? "giornata" : "giornate"}
                      {" · "}
                      {formatOre(lavoro.oreLavorate)} ore
                    </p>

                    <p className="ds-text-secondary mt-1">
                      <span className="text-emerald-300 tabular-nums">
                        Entrate {formatEuro(lavoro.entrate)}
                      </span>
                      {" · "}
                      <span className="text-rose-300 tabular-nums">
                        Uscite {formatEuro(lavoro.uscite)}
                      </span>
                    </p>

                    {lavoro.daIncassare > 0 ? (
                      <p className="ds-text-secondary mt-1">
                        Da incassare{" "}
                        <span className="text-amber-200 tabular-nums">
                          {formatEuro(lavoro.daIncassare)}
                        </span>
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageWrapper>
  );
}
