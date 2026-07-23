import { useMemo, useState } from "react";
import {
  ChevronRight,
  HardHat,
  MapPin,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { routeCantiere } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import SearchInput from "../components/SearchInput";
import NuovoCantiereForm from "../features/cantieri/components/NuovoCantiereForm";
import { riepilogoEconomicoCantiere } from "../features/cantieri/cantiereVariantiDomain";
import { calcolaAvanzamentoChecklist } from "../features/cantieri/cantieriDomain";
import { useCantieri } from "../features/cantieri/hooks/useCantieri";
import { formatEuro } from "../utils/preventivi";
import {
  limitaElencoVisibile,
  PAGINA_LISTA_DEFAULT,
} from "../utils/listPerformance";
import { classeBadgeStatoCantiere } from "../ui/designSystem";

const FILTRI = [
  { id: "attivi", etichetta: "Attivi" },
  { id: "tutti", etichetta: "Tutti" },
  { id: "completati", etichetta: "Completati" },
];

/**
 * Filtro UI locale (non dominio).
 * @param {object[]} cantieri
 * @param {string} query
 */
function filtraCantieriLocali(cantieri, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return Array.isArray(cantieri) ? cantieri : [];
  return (cantieri || []).filter((cantiere) => {
    const nome = String(cantiere?.nome || "").toLowerCase();
    const cliente = String(cantiere?.cliente || "").toLowerCase();
    const indirizzo = String(cantiere?.indirizzo || "").toLowerCase();
    const stato = String(cantiere?.stato || "").toLowerCase();
    return (
      nome.includes(q) ||
      cliente.includes(q) ||
      indirizzo.includes(q) ||
      stato.includes(q)
    );
  });
}

/**
 * Ordine operativo in sola presentazione: lavoro vivo prima.
 * @param {object[]} cantieri
 */
function ordinaCantieriOperativi(cantieri) {
  const peso = (stato) => {
    if (stato === "In corso") return 0;
    if (stato === "Da iniziare") return 1;
    if (stato === "Completato") return 3;
    return 2;
  };
  return [...(cantieri || [])].sort(
    (a, b) => peso(a?.stato) - peso(b?.stato)
  );
}

/**
 * Lista ufficiale dei cantieri (+ creazione).
 * Il dettaglio operativo vive su /cantiere/:id (route canonica RC-1B).
 * Non usare location.state per selezionare un cantiere.
 */
export default function Cantieri() {
  const navigate = useNavigate();
  const {
    cantieri,
    nuovoCantiere,
    messaggio,
    aggiornaCampoNuovoCantiere,
    aggiungiCantiere,
  } = useCantieri();
  const [limite, setLimite] = useState(PAGINA_LISTA_DEFAULT);
  const [ricerca, setRicerca] = useState("");
  const [filtro, setFiltro] = useState("attivi");
  const [formAperto, setFormAperto] = useState(false);

  const cantieriPreparati = useMemo(() => {
    let elenco = filtraCantieriLocali(cantieri, ricerca);
    if (filtro === "attivi") {
      elenco = elenco.filter((c) => c.stato !== "Completato");
    } else if (filtro === "completati") {
      elenco = elenco.filter((c) => c.stato === "Completato");
    }
    return ordinaCantieriOperativi(elenco).map((cantiere) => {
      const economico = riepilogoEconomicoCantiere(cantiere);
      return {
        cantiere,
        progresso: calcolaAvanzamentoChecklist(cantiere.checklist || []),
        economico,
      };
    });
  }, [cantieri, ricerca, filtro]);

  const cantieriVisibili = useMemo(
    () => limitaElencoVisibile(cantieriPreparati, limite),
    [cantieriPreparati, limite]
  );
  const rimanenti = Math.max(0, cantieriPreparati.length - cantieriVisibili.length);
  const listaVuota = cantieri.length === 0;
  const ricercaOFiltroVuoto =
    !listaVuota && cantieriPreparati.length === 0;
  const mostraForm = formAperto || listaVuota;
  const conteggioAttivi = useMemo(
    () => cantieri.filter((c) => c.stato !== "Completato").length,
    [cantieri]
  );

  function gestisciCreaCantiere() {
    const creato = aggiungiCantiere();
    if (creato?.id) {
      setFormAperto(false);
      navigate(routeCantiere(creato.id));
    }
  }

  function aggiornaRicerca(event) {
    setRicerca(event.target.value);
    setLimite(PAGINA_LISTA_DEFAULT);
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-label">Operatività</p>
              <h1 className="ds-page-title mt-1">Cantieri</h1>
              <p className="ds-text-secondary mt-2">
                Trova il cantiere, leggi lo stato, apri con un tocco.
              </p>
            </div>
            <span
              className="ds-badge-count shrink-0"
              aria-label={`${conteggioAttivi} cantieri attivi`}
            >
              {conteggioAttivi}
            </span>
          </div>
        </header>

        {messaggio ? (
          <div className="pro-panel px-3.5 py-3 mb-3 text-sm text-yellow-100 border-yellow-300/30">
            {messaggio}
          </div>
        ) : null}

        {!listaVuota ? (
          <>
            <SearchInput
              className="mb-3"
              label="Cerca cantiere"
              placeholder="Cliente, cantiere o indirizzo"
              value={ricerca}
              onChange={aggiornaRicerca}
            />

            <div
              className="flex gap-2 mb-3 overflow-x-auto pb-0.5"
              role="tablist"
              aria-label="Filtra cantieri"
            >
              {FILTRI.map((voce) => {
                const attivo = filtro === voce.id;
                return (
                  <button
                    key={voce.id}
                    type="button"
                    role="tab"
                    aria-selected={attivo}
                    onClick={() => {
                      setFiltro(voce.id);
                      setLimite(PAGINA_LISTA_DEFAULT);
                    }}
                    className={`ds-chip ${
                      attivo ? "ds-chip-active" : ""
                    }`}
                  >
                    {voce.etichetta}
                  </button>
                );
              })}
            </div>

            <div className="mb-3">
              {mostraForm ? (
                <div className="pro-panel px-3.5 py-3.5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-sm font-bold text-slate-200">Nuovo cantiere</p>
                    <button
                      type="button"
                      onClick={() => setFormAperto(false)}
                      className="text-xs font-bold text-slate-400 px-2 py-2 min-h-[44px]"
                    >
                      Chiudi
                    </button>
                  </div>
                  <NuovoCantiereForm
                    compatto
                    cantiere={nuovoCantiere}
                    onAggiornaCampo={aggiornaCampoNuovoCantiere}
                    onCreaCantiere={gestisciCreaCantiere}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setFormAperto(true)}
                  className="w-full btn-secondary min-h-[48px] px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <Plus size={18} aria-hidden="true" />
                  Nuovo cantiere
                </button>
              )}
            </div>
          </>
        ) : null}

        <section aria-labelledby="elenco-cantieri">
          <div className="flex items-center gap-2.5 mb-2.5">
            <HardHat size={20} className="text-yellow-300 shrink-0" aria-hidden="true" />
            <h2 id="elenco-cantieri" className="ds-section-title">
              Elenco
            </h2>
          </div>

          {listaVuota ? (
            <div className="pro-panel ds-empty">
              <div className="ds-empty-icon" aria-hidden="true">
                <HardHat size={28} />
              </div>
              <p className="ds-card-title">Nessun cantiere ancora</p>
              <p className="ds-text-secondary mt-2 max-w-sm mx-auto">
                Crea il primo cantiere o converti un preventivo accettato: lo
                ritrovi qui ogni giorno.
              </p>
              <div className="mt-6 text-left max-w-lg mx-auto">
                <NuovoCantiereForm
                  compatto
                  cantiere={nuovoCantiere}
                  onAggiornaCampo={aggiornaCampoNuovoCantiere}
                  onCreaCantiere={gestisciCreaCantiere}
                />
              </div>
            </div>
          ) : null}

          {ricercaOFiltroVuoto ? (
            <div className="pro-panel ds-empty">
              <div className="ds-empty-icon" aria-hidden="true">
                <HardHat size={22} />
              </div>
              <p className="ds-card-title">Nessun risultato</p>
              <p className="ds-text-secondary mt-2">
                Prova un altro nome, cliente, indirizzo o filtro.
              </p>
              <button
                type="button"
                className="btn-secondary mt-6 px-4 text-sm"
                onClick={() => {
                  setRicerca("");
                  setFiltro("attivi");
                  setLimite(PAGINA_LISTA_DEFAULT);
                }}
              >
                Mostra cantieri attivi
              </button>
            </div>
          ) : null}

          {!listaVuota && !ricercaOFiltroVuoto ? (
            <div className="grid gap-2.5">
              {cantieriVisibili.map(({ cantiere, progresso, economico }) => {
                const titolo =
                  cantiere.cliente || cantiere.nome || "Cliente non indicato";
                const sottotitolo =
                  cantiere.cliente && cantiere.nome ? cantiere.nome : null;
                const haVarianti = economico.numeroVarianti > 0;
                const mostraEuro = economico.totaleAggiornato > 0;

                return (
                  <Link
                    key={cantiere.id}
                    to={routeCantiere(cantiere.id)}
                    className="pro-panel ds-card-link px-4 py-3"
                    aria-label={`Apri cantiere ${titolo}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={classeBadgeStatoCantiere(cantiere.stato)}>
                            {cantiere.stato || "—"}
                          </span>
                          {haVarianti ? (
                            <span className="ds-badge ds-badge-varianti">
                              {economico.numeroVarianti}{" "}
                              {economico.numeroVarianti === 1
                                ? "variante"
                                : "varianti"}
                              {economico.deltaVarianti !== 0
                                ? ` · ${economico.deltaVarianti > 0 ? "+" : ""}${formatEuro(economico.deltaVarianti)}`
                                : ""}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="ds-card-title mt-2 truncate">
                          {titolo}
                        </h3>
                        {sottotitolo ? (
                          <p className="ds-text-secondary mt-1 truncate">
                            {sottotitolo}
                          </p>
                        ) : null}
                        {cantiere.indirizzo ? (
                          <p className="flex items-center gap-2 text-[14px] text-slate-500 mt-1 truncate">
                            <MapPin
                              size={14}
                              className="shrink-0 opacity-80"
                              aria-hidden="true"
                            />
                            <span className="truncate">{cantiere.indirizzo}</span>
                          </p>
                        ) : null}

                        <div className="mt-3">
                          <div className="flex items-center justify-between gap-2 text-[12px] mb-1">
                            <span className="text-slate-400">Checklist</span>
                            <span className="font-semibold text-yellow-100 tabular-nums">
                              {progresso}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full bg-white/10 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={progresso}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Avanzamento checklist ${progresso}%`}
                          >
                            <div
                              className="h-full bg-yellow-400"
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 text-[14px]">
                          {mostraEuro ? (
                            <span className="font-semibold text-emerald-300 tabular-nums truncate">
                              {formatEuro(economico.totaleAggiornato)}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                          {cantiere.aggiornatoIl ? (
                            <span className="text-slate-500 shrink-0 tabular-nums text-[12px]">
                              Agg. {cantiere.aggiornatoIl}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className="w-10 h-10 rounded-[16px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5"
                        aria-hidden="true"
                      >
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                  </Link>
                );
              })}

              {rimanenti > 0 ? (
                <button
                  type="button"
                  className="w-full btn-secondary min-h-[48px] p-3.5 text-sm font-bold"
                  onClick={() => setLimite((n) => n + PAGINA_LISTA_DEFAULT)}
                >
                  Mostra altri ({rimanenti})
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </PageWrapper>
  );
}
