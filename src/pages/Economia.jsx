import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Wallet,
} from "lucide-react";

import { ROUTES, routeCantiere } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import BottomSheet from "../components/BottomSheet";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri } from "../repositories/cantieriRepository";
import { CATEGORIE_SPESA } from "../features/cantieri/services/speseCantiereService";
import {
  aggregaEconomiaAttivita,
  CATEGORIE_ENTRATA_ECONOMIA,
  ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA,
  ETICHETTE_CATEGORIA_USCITA_ECONOMIA,
  ETICHETTE_PERIODO_ECONOMIA,
  formatEuro,
  PERIODO_ECONOMIA,
  TIPO_MOVIMENTO_ECONOMIA,
} from "../features/economia/economiaService";
import { registraMovimentoEconomia } from "../features/economia/economiaRegistrazioneService";
import { leggiMovimentiEconomiaGenerali } from "../features/economia/economiaMovimentiRepository";

const FILTRI_PERIODO = [
  PERIODO_ECONOMIA.questo_mese,
  PERIODO_ECONOMIA.mese_scorso,
];

const CATEGORIE_USCITA_FORM = [
  CATEGORIE_SPESA.manodopera,
  CATEGORIE_SPESA.materiali,
  CATEGORIE_SPESA.subappalto,
  CATEGORIE_SPESA.carburante,
  CATEGORIE_SPESA.trasferta,
  CATEGORIE_SPESA.attrezzatura,
  CATEGORIE_SPESA.altro,
];

const CATEGORIE_ENTRATA_FORM = Object.values(CATEGORIE_ENTRATA_ECONOMIA);

function oggiIt() {
  return new Date().toLocaleDateString("it-IT");
}

function destinazioneMovimento(movimento) {
  const id = movimento?.cantiereId;
  if (!id) return null;
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

function statoFormIniziale(tipo) {
  return {
    tipo,
    importo: "",
    data: oggiIt(),
    categoria:
      tipo === TIPO_MOVIMENTO_ECONOMIA.entrata
        ? CATEGORIE_ENTRATA_ECONOMIA.incasso_cantiere
        : CATEGORIE_SPESA.manodopera,
    descrizione: "",
    cantiereId: "",
  };
}

/**
 * Economia — cruscotto attività + registrazione entrate/uscite.
 * SoT: cantiere.pagamenti/spese + movimenti generali (senza duplicazione).
 */
export default function Economia() {
  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieri);
  const [tickGenerali, setTickGenerali] = useState(0);
  const [periodo, setPeriodo] = useState(PERIODO_ECONOMIA.questo_mese);
  const [formAperto, setFormAperto] = useState(null);
  const [form, setForm] = useState(() =>
    statoFormIniziale(TIPO_MOVIMENTO_ECONOMIA.uscita)
  );
  const [erroreForm, setErroreForm] = useState("");
  const [feedback, setFeedback] = useState("");

  const aggregato = useMemo(() => {
    void tickGenerali;
    return aggregaEconomiaAttivita(cantieri || [], {
      periodo,
      riferimento: new Date(),
      movimentiGenerali: undefined,
    });
  }, [cantieri, periodo, tickGenerali]);

  function apriForm(tipo) {
    setForm(statoFormIniziale(tipo));
    setErroreForm("");
    setFormAperto(tipo);
  }

  function chiudiForm() {
    setFormAperto(null);
    setErroreForm("");
  }

  function aggiornaForm(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function registra() {
    const esito = registraMovimentoEconomia({
      tipo: form.tipo,
      importo: Number(String(form.importo).replace(",", ".")),
      data: form.data,
      categoria: form.categoria,
      descrizione: form.descrizione,
      cantiereId: form.cantiereId || null,
    });

    if (!esito.success) {
      setErroreForm("Controlla importo, data e categoria.");
      return;
    }

    setCantieri(leggiCantieri());
    setTickGenerali((n) => n + 1);
    void leggiMovimentiEconomiaGenerali();
    setFeedback(
      form.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata
        ? "Entrata registrata"
        : "Uscita registrata"
    );
    window.setTimeout(() => setFeedback(""), 2200);
    chiudiForm();
  }

  const categorieForm =
    form.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata
      ? CATEGORIE_ENTRATA_FORM
      : CATEGORIE_USCITA_FORM;
  const etichetteCategoria =
    form.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata
      ? ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA
      : ETICHETTE_CATEGORIA_USCITA_ECONOMIA;

  return (
    <PageWrapper>
      <div className="pro-page text-white" data-testid="pagina-economia">
        <PageBackLink testId="economia-back" />

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
            Movimenti reali di denaro: entrate, uscite e saldo. Il «da
            incassare» sotto è quanto resta sui cantieri, non sui preventivi.
          </p>
        </header>

        {feedback ? (
          <div
            className="pro-panel px-3.5 py-3 mb-3 text-sm text-yellow-100 border-yellow-300/30"
            data-testid="economia-feedback"
          >
            {feedback}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            className="btn-primary min-h-[48px] font-bold flex items-center justify-center gap-2"
            onClick={() => apriForm(TIPO_MOVIMENTO_ECONOMIA.entrata)}
            data-testid="economia-aggiungi-entrata"
          >
            <Plus size={18} aria-hidden="true" />
            Entrata
          </button>
          <button
            type="button"
            className="btn-secondary min-h-[48px] font-bold flex items-center justify-center gap-2"
            onClick={() => apriForm(TIPO_MOVIMENTO_ECONOMIA.uscita)}
            data-testid="economia-aggiungi-uscita"
          >
            <Plus size={18} aria-hidden="true" />
            Uscita
          </button>
        </div>

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
            label="Da incassare (cantieri)"
            valore={aggregato.daIncassare}
            testId="economia-da-incassare"
          />
        </section>

        <section className="mb-6" aria-labelledby="economia-uscite-cat-title">
          <h2 id="economia-uscite-cat-title" className="ds-section-title mb-3">
            Uscite per categoria
          </h2>
          <div
            className="grid grid-cols-2 gap-2"
            data-testid="economia-uscite-categorie"
          >
            {(aggregato.riepilogoUscite || []).map((voce) => (
              <div
                key={voce.key}
                className="pro-panel p-3"
                data-testid={`economia-cat-${voce.key}`}
              >
                <p className="section-label">{voce.label}</p>
                <p className="ds-text-primary mt-1 tabular-nums">
                  {formatEuro(voce.importo)}
                </p>
              </div>
            ))}
          </div>
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
                Registra un&apos;entrata o un&apos;uscita, oppure aggiungi
                pagamenti e spese nei cantieri.
              </p>
            </div>
          ) : (
            <ul
              className="flex flex-col gap-3"
              data-testid="economia-lista-movimenti"
            >
              {aggregato.movimenti.map((movimento) => {
                const entrata =
                  movimento.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata;
                const Icon = entrata ? ArrowDownLeft : ArrowUpRight;
                const destinazione = destinazioneMovimento(movimento);
                const contenuto = (
                  <>
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
                      <p className="ds-text-secondary mt-1">{movimento.data}</p>
                      {movimento.etichettaCantiere ? (
                        <p className="ds-text-secondary truncate">
                          {movimento.etichettaCantiere}
                        </p>
                      ) : null}
                    </div>
                  </>
                );

                return (
                  <li key={movimento.id}>
                    {destinazione ? (
                      <Link
                        to={destinazione}
                        className="pro-panel p-4 flex items-start gap-3 min-h-[64px]"
                        data-testid={`economia-movimento-${movimento.id}`}
                        data-cantiere-id={movimento.cantiereId}
                      >
                        {contenuto}
                      </Link>
                    ) : (
                      <div
                        className="pro-panel p-4 flex items-start gap-3 min-h-[64px]"
                        data-testid={`economia-movimento-${movimento.id}`}
                      >
                        {contenuto}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-6 space-y-3">
          <Link
            to={ROUTES.incassi}
            className="pro-panel p-4 flex items-center justify-between gap-3 min-h-[64px]"
            data-testid="economia-link-incassi"
          >
            <div className="min-w-0">
              <p className="ds-card-title">Incassi sui preventivi</p>
              <p className="ds-text-secondary mt-1">
                Quanto hai già preso e quanto resta prima del cantiere
              </p>
            </div>
            <ChevronRight
              size={20}
              className="text-slate-500 shrink-0"
              aria-hidden="true"
            />
          </Link>
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

      <BottomSheet
        open={Boolean(formAperto)}
        onClose={chiudiForm}
        title={
          formAperto === TIPO_MOVIMENTO_ECONOMIA.entrata
            ? "+ Entrata"
            : "+ Uscita"
        }
        descrizione="Cantiere opzionale. Senza cantiere resta un movimento generale."
      >
        <div className="space-y-4" data-testid="economia-form-movimento">
          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Importo (€)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="input-pro mt-1.5 w-full min-h-[48px] text-[16px]"
              value={form.importo}
              onChange={(e) => aggiornaForm("importo", e.target.value)}
              data-testid="economia-form-importo"
            />
          </label>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Data
            </span>
            <input
              className="input-pro mt-1.5 w-full min-h-[48px] text-[16px]"
              value={form.data}
              onChange={(e) => aggiornaForm("data", e.target.value)}
              placeholder="gg/mm/aaaa"
              data-testid="economia-form-data"
            />
          </label>

          <fieldset>
            <legend className="ds-text-secondary text-xs font-bold uppercase tracking-wide mb-2">
              Categoria
            </legend>
            <div className="flex flex-wrap gap-2">
              {categorieForm.map((cat) => {
                const attiva = form.categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => aggiornaForm("categoria", cat)}
                    className={`min-h-[44px] px-3 rounded-[14px] text-sm font-bold border ${
                      attiva
                        ? "border-yellow-400 bg-yellow-400/20 text-yellow-100"
                        : "border-white/10 bg-black/20 text-slate-300"
                    }`}
                    data-testid={`economia-form-cat-${cat}`}
                  >
                    {etichetteCategoria[cat] || cat}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Descrizione
            </span>
            <input
              className="input-pro mt-1.5 w-full min-h-[48px] text-[16px]"
              value={form.descrizione}
              onChange={(e) => aggiornaForm("descrizione", e.target.value)}
              placeholder="Es. Acconto squadra"
              data-testid="economia-form-descrizione"
            />
          </label>

          <label className="block">
            <span className="ds-text-secondary text-xs font-bold uppercase tracking-wide">
              Cantiere / Lavoro (opzionale)
            </span>
            <select
              className="input-pro mt-1.5 w-full min-h-[48px] text-[16px]"
              value={form.cantiereId}
              onChange={(e) => aggiornaForm("cantiereId", e.target.value)}
              data-testid="economia-form-cantiere"
            >
              <option value="">Nessun cantiere</option>
              {(cantieri || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cliente || c.nome || c.id}
                </option>
              ))}
            </select>
          </label>

          {erroreForm ? (
            <p className="text-rose-300 text-sm" data-testid="economia-form-errore">
              {erroreForm}
            </p>
          ) : null}

          <button
            type="button"
            className="btn-primary w-full min-h-[52px] font-black"
            onClick={registra}
            data-testid="economia-form-registra"
          >
            Registra
          </button>
        </div>
      </BottomSheet>
    </PageWrapper>
  );
}
