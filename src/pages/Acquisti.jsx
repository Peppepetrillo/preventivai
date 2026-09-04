import { useState } from "react";
import { PartyPopper, Share2, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import SearchInput from "../components/SearchInput";
import AcquistiAggregatoRow from "../features/acquisti/components/AcquistiAggregatoRow";
import AcquistiCondividiSheet from "../features/acquisti/components/AcquistiCondividiSheet";
import AcquistiGruppoLavoro from "../features/acquisti/components/AcquistiGruppoLavoro";
import {
  FILTRO_ACQUISTI,
  useAcquistiUi,
  VISTA_ACQUISTI
} from "../features/acquisti/hooks/useAcquistiUi";
import { MODALITA_CONDIVIDI_ACQUISTI } from "../features/acquisti/acquistiTestoService";

const VISTE = [
  { id: VISTA_ACQUISTI.perLavoro, etichetta: "Per lavoro" },
  { id: VISTA_ACQUISTI.tutto, etichetta: "Tutto" },
];

const FILTRI = [
  { id: FILTRO_ACQUISTI.daComprare, etichetta: "Da comprare" },
  { id: FILTRO_ACQUISTI.tutti, etichetta: "Tutti" },
];

/**
 * Pagina Acquisti — UI + condivisione (Step 8.2 / 8.3).
 * Fonte: listaSpesa esistente. Nessun nuovo storage/repository.
 */
export default function Acquisti() {
  const {
    lista,
    vista,
    setVista,
    filtro,
    setFiltro,
    ricerca,
    aggiornaRicerca,
    gruppi,
    aggregati,
    sintesi,
    vuoto,
    senzaRisultati,
    espansi,
    toggleVoce,
    toggleAggregato,
    toggleEspanso,
  } = useAcquistiUi();

  const [showCondividi, setShowCondividi] = useState(false);
  const [messaggio, setMessaggio] = useState("");

  function flash(msg) {
    setMessaggio(msg);
    window.setTimeout(() => setMessaggio(""), 2200);
  }

  const sintesiLabel = [
    sintesi.materiali === 1
      ? "1 materiale"
      : `${sintesi.materiali} materiali`,
    sintesi.lavori > 0
      ? sintesi.lavori === 1
        ? "1 lavoro"
        : `${sintesi.lavori} lavori`
      : null,
    sintesi.quantitaTotale != null && sintesi.unita
      ? `${sintesi.quantitaTotale} ${sintesi.unita}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const modalitaIniziale =
    vista === VISTA_ACQUISTI.tutto
      ? MODALITA_CONDIVIDI_ACQUISTI.perFornitore
      : MODALITA_CONDIVIDI_ACQUISTI.perLavoro;

  return (
    <PageWrapper>
      <div className="pro-page text-white" data-testid="acquisti-page">
        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <PageBackLink
                className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 text-slate-300"
                testId="acquisti-back"
              />
              <h1 className="ds-page-title mt-1 flex items-center gap-2">
                <ShoppingCart
                  size={22}
                  className="text-yellow-300 shrink-0"
                  aria-hidden="true"
                />
                Acquisti
              </h1>
              <p
                className="ds-text-secondary mt-2"
                data-testid="acquisti-sintesi"
              >
                {sintesi.materiali === 0
                  ? "Niente da comprare al momento."
                  : sintesiLabel}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className="ds-badge-count"
                aria-label={`${sintesi.materiali} da comprare`}
              >
                {sintesi.materiali}
              </span>
              <button
                type="button"
                onClick={() => setShowCondividi(true)}
                className="btn-secondary min-h-[44px] px-3 text-xs font-bold inline-flex items-center gap-1.5"
                data-testid="acquisti-condividi"
                aria-label="Condividi"
              >
                <Share2 size={16} aria-hidden="true" />
                Condividi
              </button>
            </div>
          </div>
        </header>

        {messaggio ? (
          <div
            className="pro-panel px-3.5 py-3 mb-3 text-sm text-yellow-100 border-yellow-300/30"
            role="status"
            data-testid="acquisti-flash"
          >
            {messaggio}
          </div>
        ) : null}

        <div
          className="flex gap-2 mb-3 overflow-x-auto pb-0.5"
          role="tablist"
          aria-label="Vista acquisti"
        >
          {VISTE.map((voce) => {
            const attivo = vista === voce.id;
            return (
              <button
                key={voce.id}
                type="button"
                role="tab"
                aria-selected={attivo}
                onClick={() => setVista(voce.id)}
                className={`ds-chip ${attivo ? "ds-chip-active" : ""}`}
                data-testid={`acquisti-vista-${voce.id}`}
              >
                {voce.etichetta}
              </button>
            );
          })}
        </div>

        <SearchInput
          className="mb-3"
          label="Cerca materiale"
          placeholder="Cerca materiale..."
          value={ricerca}
          onChange={aggiornaRicerca}
        />

        <div
          className="flex gap-2 mb-4 overflow-x-auto pb-0.5"
          role="tablist"
          aria-label="Filtro acquistato"
        >
          {FILTRI.map((voce) => {
            const attivo = filtro === voce.id;
            return (
              <button
                key={voce.id}
                type="button"
                role="tab"
                aria-selected={attivo}
                onClick={() => setFiltro(voce.id)}
                className={`ds-chip ${attivo ? "ds-chip-active" : ""}`}
                data-testid={`acquisti-filtro-${voce.id}`}
              >
                {voce.etichetta}
              </button>
            );
          })}
        </div>

        {vuoto ? (
          <div
            className="ds-empty pro-panel px-4 py-10 text-center"
            data-testid="acquisti-empty"
          >
            <PartyPopper
              className="mx-auto mb-3 text-yellow-300"
              size={36}
              aria-hidden="true"
            />
            <p className="ds-card-title">Non hai nulla da comprare</p>
            <p className="ds-text-secondary mt-2">
              Quando aggiungi materiali ai cantieri, li trovi qui.
            </p>
            <Link
              to={ROUTES.agenda}
              className="btn-primary mt-5 inline-flex min-h-[48px] items-center gap-2 px-5 font-bold"
              data-testid="acquisti-empty-cta"
            >
              Torna all&apos;Agenda
            </Link>
          </div>
        ) : senzaRisultati ? (
          <div
            className="ds-empty pro-panel px-4 py-8 text-center"
            data-testid="acquisti-no-results"
          >
            <p className="ds-card-title">Nessun risultato</p>
            <p className="ds-text-secondary mt-2">
              Prova un altro nome o togli il filtro.
            </p>
          </div>
        ) : vista === VISTA_ACQUISTI.perLavoro ? (
          <div className="space-y-6" data-testid="acquisti-vista-lavoro-list">
            {gruppi.map((gruppo) => (
              <AcquistiGruppoLavoro
                key={gruppo.lavoroId || "senza-lavoro"}
                gruppo={gruppo}
                onToggleVoce={toggleVoce}
                vociContesto={lista}
              />
            ))}
          </div>
        ) : (
          <ul
            className="space-y-3"
            role="list"
            data-testid="acquisti-vista-tutto-list"
          >
            {aggregati.map((agg) => (
              <li key={agg.chiave}>
                <AcquistiAggregatoRow
                  aggregato={agg}
                  espanso={espansi.has(agg.chiave)}
                  onToggleEspanso={toggleEspanso}
                  onToggleAggregato={toggleAggregato}
                  onToggleVoce={toggleVoce}
                  vociContesto={lista}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCondividi ? (
        <AcquistiCondividiSheet
          key={`condividi-${modalitaIniziale}`}
          open={showCondividi}
          onClose={() => setShowCondividi(false)}
          voci={lista}
          modalitaIniziale={modalitaIniziale}
          onMessaggio={flash}
        />
      ) : null}
    </PageWrapper>
  );
}
