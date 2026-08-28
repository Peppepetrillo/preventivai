import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import { ROUTES, routePreventivo } from "../../../app/routes";
import PageWrapper from "../../../components/PageWrapper";
import SearchInput from "../../../components/SearchInput";
import {
  FILTRI_PREVENTIVO,
  classeColoreStatoPreventivo,
  filtraPreventiviPerStato,
  filtraPreventiviRicerca,
} from "../archivioPreventiviUtils";
import { etichettaStatoUi } from "../utils/preventivoHeroCta";
import { useArchivioPreventivi } from "../../../hooks/useArchivioPreventivi";
import { formatEuro } from "../../../utils/preventivi";
import {
  limitaElencoVisibile,
  PAGINA_LISTA_DEFAULT,
} from "../../../utils/listPerformance";

const CHIP_FILTRI = [
  { id: FILTRI_PREVENTIVO.TUTTI, label: "Tutti" },
  { id: FILTRI_PREVENTIVO.BOZZE, label: "Bozze" },
  { id: FILTRI_PREVENTIVO.INVIATI, label: "Inviati" },
  { id: FILTRI_PREVENTIVO.ACCETTATI, label: "Accettati" },
  { id: FILTRI_PREVENTIVO.IN_CANTIERE, label: "In cantiere" },
];

function filtroDaSearchParams(searchParams) {
  const grezzo = String(searchParams.get("filtro") || FILTRI_PREVENTIVO.TUTTI)
    .trim()
    .toLowerCase();
  // Home "Da inviare" → chip Bozze (stesso significato)
  if (grezzo === FILTRI_PREVENTIVO.DA_INVIARE) {
    return FILTRI_PREVENTIVO.BOZZE;
  }
  const validi = Object.values(FILTRI_PREVENTIVO);
  return validi.includes(grezzo) ? grezzo : FILTRI_PREVENTIVO.TUTTI;
}

function etichettaRigaStato(preventivo) {
  const stato = etichettaStatoUi(preventivo?.stato);
  const data = String(preventivo?.data || "").trim();
  if (data) return `${stato} · ${data}`;
  return stato;
}

/**
 * Lista principale preventivi (UX-8.4).
 */
export default function ListaPreventivi() {
  const preventivi = useArchivioPreventivi();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ricerca, setRicerca] = useState("");
  const [limite, setLimite] = useState(PAGINA_LISTA_DEFAULT);

  const filtroAttivo = filtroDaSearchParams(searchParams);

  useEffect(() => {
    const clienteId = searchParams.get("clienteId");
    if (!clienteId) return;
    navigate(
      `${ROUTES.preventiviNuovo}?clienteId=${encodeURIComponent(clienteId)}`,
      { replace: true }
    );
  }, [searchParams, navigate]);

  const preventiviFiltrati = useMemo(() => {
    const perStato = filtraPreventiviPerStato(preventivi, filtroAttivo);
    return filtraPreventiviRicerca(perStato, ricerca);
  }, [preventivi, filtroAttivo, ricerca]);

  const preventiviVisibili = useMemo(
    () => limitaElencoVisibile(preventiviFiltrati, limite),
    [preventiviFiltrati, limite]
  );

  const rimanenti = Math.max(
    0,
    preventiviFiltrati.length - preventiviVisibili.length
  );

  function impostaFiltro(filtro) {
    setLimite(PAGINA_LISTA_DEFAULT);
    if (!filtro || filtro === FILTRI_PREVENTIVO.TUTTI) {
      setSearchParams({});
      return;
    }
    setSearchParams({ filtro });
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white pb-28">
        <div className="mb-5 pro-panel-strong p-5">
          <p className="section-label">Documenti</p>
          <h1 className="ds-page-title mt-1">Preventivi</h1>
          <p className="ds-text-secondary mt-2">
            Tutti i tuoi preventivi, a colpo d&apos;occhio.
          </p>
        </div>

        <SearchInput
          className="mb-4"
          id="preventivi-ricerca"
          label="Cerca cliente o numero preventivo"
          placeholder="Cerca cliente o numero..."
          value={ricerca}
          onChange={(event) => {
            setRicerca(event.target.value);
            setLimite(PAGINA_LISTA_DEFAULT);
          }}
        />

        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1 scrollbar-none"
          role="tablist"
          aria-label="Filtra per stato"
          data-testid="preventivi-filtri"
        >
          {CHIP_FILTRI.map((chip) => {
            const attivo = filtroAttivo === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={attivo}
                onClick={() => impostaFiltro(chip.id)}
                className={`shrink-0 min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  attivo
                    ? "bg-yellow-400 text-slate-950"
                    : "bg-white/8 text-slate-300 border border-white/10"
                }`}
                data-testid={`preventivi-filtro-${chip.id}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {preventiviFiltrati.length === 0 && (
            <div className="pro-panel p-8 text-center ds-empty">
              <p className="ds-card-title">
                {ricerca || filtroAttivo !== FILTRI_PREVENTIVO.TUTTI
                  ? "Nessun preventivo trovato"
                  : "Non hai ancora preventivi"}
              </p>
              <p className="ds-text-secondary mt-2">
                {ricerca || filtroAttivo !== FILTRI_PREVENTIVO.TUTTI
                  ? "Prova a cambiare ricerca o filtro."
                  : "Crea il primo documento per un cliente."}
              </p>
              {!ricerca && filtroAttivo === FILTRI_PREVENTIVO.TUTTI ? (
                <Link
                  to={ROUTES.preventiviNuovo}
                  className="btn-primary mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 px-6"
                  data-testid="preventivi-empty-nuovo"
                >
                  <Plus size={18} aria-hidden="true" />
                  Nuovo preventivo
                </Link>
              ) : null}
            </div>
          )}

          {preventiviVisibili.map((preventivo) => {
            const numero = preventivo.numero || `PREV-${preventivo.id}`;
            const statoUi = etichettaStatoUi(preventivo.stato);

            return (
              <Link
                key={preventivo.id}
                to={routePreventivo(preventivo.id)}
                className="block pro-panel p-5 min-h-[88px] hover:border-yellow-300/45 transition active:scale-[0.99]"
                data-testid={`preventivo-card-${preventivo.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="ds-card-title truncate">
                      {preventivo.cliente || "Cliente"}
                    </h2>
                    <p className="ds-text-secondary text-sm mt-1">
                      {etichettaRigaStato(preventivo)}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">N. {numero}</p>
                    <p
                      className="text-emerald-300 text-2xl font-bold mt-3 tabular-nums"
                      data-testid={`preventivo-card-totale-${preventivo.id}`}
                    >
                      {formatEuro(preventivo.totale)}
                    </p>
                  </div>
                  <span
                    className={`ds-badge shrink-0 text-white ${classeColoreStatoPreventivo(preventivo.stato)}`}
                  >
                    {statoUi}
                  </span>
                </div>
              </Link>
            );
          })}

          {rimanenti > 0 ? (
            <button
              type="button"
              className="w-full btn-secondary p-4 min-h-[44px]"
              onClick={() => setLimite((n) => n + PAGINA_LISTA_DEFAULT)}
            >
              Mostra altri ({rimanenti})
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          <Link
            to={ROUTES.incassi}
            className="ds-text-secondary text-sm underline underline-offset-2"
            data-testid="preventivi-link-pagamenti-preventivo"
          >
            Pagamenti sui preventivi
          </Link>
        </div>

        <div className="fixed left-0 right-0 z-20 px-4 pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+12px)] pointer-events-none">
          <Link
            to={ROUTES.preventiviNuovo}
            className="pointer-events-auto w-full btn-primary min-h-[52px] flex items-center justify-center gap-2 text-base font-semibold shadow-[var(--shadow-soft)]"
            data-testid="preventivi-nuovo-cta"
          >
            <Plus size={20} aria-hidden="true" />
            Nuovo preventivo
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
