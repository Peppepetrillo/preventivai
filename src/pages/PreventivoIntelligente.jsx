import { Fragment, useEffect, useId, useState } from "react";
import {
  Building2,
  ChevronDown,
  FilePlus2,
  Sparkles,
  Zap
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { routePreventivo } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import NumericInput from "../components/NumericInput";
import KnowledgeExplanationCard from "../components/knowledge/KnowledgeExplanationCard";
import { risolviSpiegazioneLavorazione } from "../components/knowledge/knowledgeExplanationUtils";
import AssistenteSopralluogoPanel from "../components/sopralluogo/AssistenteSopralluogoPanel";
import {
  generaPreventivoEconomico,
  convertiProposalInPreventivo
} from "../domain/preventivi";
import { salvaOsservazione } from "../domain/brain/brainObservationService";
import { analizzaOsservazioni } from "../domain/brain/brainPatternService";
import {
  assicuratiSessioneAttiva,
  chiudiSessione,
  collegaPreventivoASessione,
  nuovaSessioneSopralluogo
} from "../domain/sopralluogoSession";
import { leggiPreventivi, salvaNuovoPreventivo } from "../repositories/preventiviRepository";
import { formatEuro } from "../utils/preventivi";

const TIPI_IMMOBILE = [
  { id: "appartamento", label: "Appartamento" },
  { id: "villa", label: "Villa" },
  { id: "ufficio", label: "Ufficio" },
  { id: "negozio", label: "Negozio" },
  { id: "garage", label: "Garage" },
  { id: "altro", label: "Altro" },
];

const LIVELLI = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4+", label: "4+" },
];

const STATI_IMMOBILE = [
  { id: "nuova-costruzione", label: "Nuova costruzione" },
  { id: "ristrutturazione", label: "Ristrutturazione" },
  { id: "ampliamento", label: "Ampliamento" },
];

const SERIE_CIVILI = [
  { id: "living-now", label: "Living Now" },
  { id: "matix-go", label: "MatixGO" },
  { id: "vimar", label: "Vimar" },
  { id: "gewiss", label: "Gewiss" },
  { id: "altro", label: "Altro" },
];

const LIVELLI_IMPIANTO = [
  { id: "base", label: "Base" },
  { id: "standard", label: "Standard" },
  { id: "premium", label: "Premium" },
];

const CUCINA_OPZIONI = [
  { id: "standard", label: "Standard" },
  { id: "induzione", label: "Induzione" },
];

/** Flag impianto KE 2.0 — indipendenti, mappati 1:1 alle regole caratteristiche. */
const CARATTERISTICHE_FLAG = [
  { id: "climatizzazione", label: "Climatizzazione" },
  { id: "citofono", label: "Citofono" },
  { id: "videocitofono", label: "Videocitofono" },
  { id: "impiantoTv", label: "Impianto TV" },
  { id: "reteDati", label: "Rete dati / LAN" },
  { id: "allarme", label: "Allarme" },
  { id: "videosorveglianza", label: "Videosorveglianza" },
  { id: "cancelloAutomatico", label: "Cancello automatico" },
  { id: "predisposizioneFotovoltaico", label: "Predisposizione fotovoltaico" },
  { id: "predisposizioneColonnina", label: "Colonnina ricarica" },
  { id: "domotica", label: "Domotica" },
];

const FORM_INIZIALE = {
  tipoImmobile: "appartamento",
  superficieMq: "",
  numeroLivelli: "1",
  numeroLocali: "",
  numeroBagni: "",
  cucina: "standard",
  statoImmobile: "nuova-costruzione",
  serieCivile: "living-now",
  livelloImpianto: "standard",
  cliente: "",
  climatizzazione: false,
  citofono: false,
  videocitofono: false,
  impiantoTv: false,
  reteDati: false,
  allarme: false,
  videosorveglianza: false,
  cancelloAutomatico: false,
  predisposizioneFotovoltaico: false,
  predisposizioneColonnina: false,
  domotica: false,
};

/**
 * Preventivo Intelligente — proposta economica (Proposal Service).
 * La UI riceve solo PreventivoProposal, non conosce il Knowledge Engine.
 */
export default function PreventivoIntelligente() {
  const baseId = useId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const clienteIdParam = searchParams.get("clienteId");

  const [form, setForm] = useState(() => {
    if (clienteIdParam) {
      try {
        const clienti = JSON.parse(localStorage.getItem("clienti") || "[]");
        const c = clienti.find((x) => String(x.id) === clienteIdParam);
        if (c) return { ...FORM_INIZIALE, cliente: c.nome || "" };
      } catch {
        // silent
      }
    }
    return FORM_INIZIALE;
  });

  const clienteIdEffettivo = (() => {
    if (!clienteIdParam) return null;
    try {
      const clienti = JSON.parse(localStorage.getItem("clienti") || "[]");
      const c = clienti.find((x) => String(x.id) === clienteIdParam);
      if (c && form.cliente === c.nome) return c.id;
    } catch {
      // silent
    }
    return null;
  })();
  const [proposal, setProposal] = useState(null);
  const [errore, setErrore] = useState("");
  const [ragionamentoAperto, setRagionamentoAperto] = useState(false);
  const [creazioneInCorso, setCreazioneInCorso] = useState(false);
  const [sessione, setSessione] = useState(null);

  useEffect(() => {
    setSessione(assicuratiSessioneAttiva());
  }, []);

  function aggiornaCampo(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function toggleCaratteristica(campo) {
    setForm((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  }

  function generaProposta() {
    setErrore("");
    const sessioneCorrente = sessione || assicuratiSessioneAttiva();
    if (!sessione) setSessione(sessioneCorrente);

    const input = {
      ...form,
      superficieMq:
        form.superficieMq === "" || form.superficieMq === null
          ? null
          : Number(form.superficieMq),
      numeroLocali:
        form.numeroLocali === "" || form.numeroLocali === null
          ? null
          : Number(form.numeroLocali),
      numeroBagni:
        form.numeroBagni === "" || form.numeroBagni === null
          ? null
          : Number(form.numeroBagni),
    };

    const risultato = generaPreventivoEconomico(input, {
      sessionId: sessioneCorrente.id,
      preventivoId: sessioneCorrente.preventivoId || null,
    });

    if (risultato?.success && risultato.proposal) {
      setProposal(risultato.proposal);
      setRagionamentoAperto(false);

      // Side-effect Brain: non deve bloccare la visualizzazione della proposal.
      try {
        const conoscenza = risultato.proposal.conoscenzaProposta;
        if (conoscenza) {
          salvaOsservazione(input, conoscenza, {});
          analizzaOsservazioni();
        }
      } catch {
        // ignora errori Brain in generazione
      }
      return;
    }

    setProposal(null);
    setErrore(
      risultato?.error === "proposta_knowledge_fallita"
        ? "Il Knowledge Engine non ha prodotto una proposta. Riprova."
        : "Impossibile generare la proposta. Riprova."
    );
  }

  function creaPreventivoDaProposal() {
    if (!proposal || creazioneInCorso) return;
    setCreazioneInCorso(true);
    setErrore("");

    try {
      const archivio = leggiPreventivi();
      const preventivo = convertiProposalInPreventivo(proposal, {
        archivio,
        cliente: form.cliente,
        clienteId: clienteIdEffettivo,
        form,
      });
      salvaNuovoPreventivo(preventivo);
      if (sessione?.id) {
        const aggiornata = collegaPreventivoASessione(
          sessione.id,
          preventivo.id
        );
        setSessione(aggiornata);
      }
      navigate(routePreventivo(preventivo.id));
    } catch {
      setErrore("Impossibile creare il preventivo. Riprova.");
      setCreazioneInCorso(false);
    }
  }

  function onChiudiSessione() {
    if (!sessione?.id) return;
    chiudiSessione(sessione.id);
    setSessione(null);
    setProposal(null);
  }

  function onNuovaSessione() {
    const nuova = nuovaSessioneSopralluogo();
    setSessione(nuova);
    setProposal(null);
  }

  const haProposta = Boolean(proposal);

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <PageBackLink className="ds-back-link mb-4" testId="preventivo-intelligente-back" />

        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-[16px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
              <Zap size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Preventivo</p>
              <h1 className="ds-page-title mt-1">Preventivo Intelligente</h1>
              <p className="ds-text-secondary mt-2">
                Descrivi immobile e impianto. Ottieni subito un preventivo
                economico suggerito.
              </p>
            </div>
          </div>
        </header>

        {errore ? (
          <div
            className="pro-panel px-3.5 py-3 mb-3 text-sm text-amber-100 border-amber-300/30"
            role="alert"
          >
            {errore}
          </div>
        ) : null}

        <section className="pro-panel px-4 py-4 mb-3" aria-labelledby={`${baseId}-immobile`}>
          <div className="flex items-center gap-2.5 mb-4">
            <Building2 size={18} className="text-yellow-300 shrink-0" aria-hidden="true" />
            <h2 id={`${baseId}-immobile`} className="ds-section-title">
              Immobile
            </h2>
          </div>

          <CampoLabel etichetta="Cliente (opzionale)" htmlFor={`${baseId}-cliente`}>
            <input
              id={`${baseId}-cliente`}
              type="text"
              value={form.cliente}
              onChange={(event) => aggiornaCampo("cliente", event.target.value)}
              placeholder="Es. Rossi Mario"
              className="input-pro mt-2"
              autoComplete="organization"
            />
          </CampoLabel>

          <CampoLabel etichetta="Tipo immobile">
            <ChipGroup
              nome="tipo-immobile"
              opzioni={TIPI_IMMOBILE}
              valore={form.tipoImmobile}
              onChange={(id) => aggiornaCampo("tipoImmobile", id)}
            />
          </CampoLabel>

          <CampoLabel etichetta="Superficie (mq)" htmlFor={`${baseId}-mq`}>
            <NumericInput
              id={`${baseId}-mq`}
              min="0"
              value={form.superficieMq}
              inputMode="decimal"
              onChange={(valore) => aggiornaCampo("superficieMq", valore)}
              placeholder="Es. 110"
              className="input-pro mt-2"
            />
          </CampoLabel>

          <CampoLabel etichetta="Numero livelli">
            <ChipGroup
              nome="numero-livelli"
              opzioni={LIVELLI}
              valore={form.numeroLivelli}
              onChange={(id) => aggiornaCampo("numeroLivelli", id)}
            />
          </CampoLabel>

          <div className="grid gap-3 sm:grid-cols-2">
            <CampoLabel etichetta="Numero locali" htmlFor={`${baseId}-locali`}>
              <NumericInput
                id={`${baseId}-locali`}
                min="0"
                value={form.numeroLocali}
                inputMode="numeric"
                onChange={(valore) => aggiornaCampo("numeroLocali", valore)}
                placeholder="Es. 4"
                className="input-pro mt-2"
              />
            </CampoLabel>
            <CampoLabel etichetta="Numero bagni" htmlFor={`${baseId}-bagni`}>
              <NumericInput
                id={`${baseId}-bagni`}
                min="0"
                value={form.numeroBagni}
                inputMode="numeric"
                onChange={(valore) => aggiornaCampo("numeroBagni", valore)}
                placeholder="Es. 2"
                className="input-pro mt-2"
              />
            </CampoLabel>
          </div>

          <CampoLabel etichetta="Stato immobile">
            <ChipGroup
              nome="stato-immobile"
              opzioni={STATI_IMMOBILE}
              valore={form.statoImmobile}
              onChange={(id) => aggiornaCampo("statoImmobile", id)}
            />
          </CampoLabel>
        </section>

        <section className="pro-panel px-4 py-4 mb-3" aria-labelledby={`${baseId}-impianto`}>
          <h2 id={`${baseId}-impianto`} className="ds-section-title mb-4">
            Impianto
          </h2>

          <CampoLabel etichetta="Serie civile" htmlFor={`${baseId}-serie`}>
            <select
              id={`${baseId}-serie`}
              value={form.serieCivile}
              onChange={(event) => aggiornaCampo("serieCivile", event.target.value)}
              className="input-pro mt-2"
            >
              {SERIE_CIVILI.map((serie) => (
                <option key={serie.id} value={serie.id}>
                  {serie.label}
                </option>
              ))}
            </select>
          </CampoLabel>

          <CampoLabel etichetta="Livello impianto">
            <ChipGroup
              nome="livello-impianto"
              opzioni={LIVELLI_IMPIANTO}
              valore={form.livelloImpianto}
              onChange={(id) => aggiornaCampo("livelloImpianto", id)}
            />
          </CampoLabel>

          <CampoLabel etichetta="Cucina">
            <ChipGroup
              nome="cucina"
              opzioni={CUCINA_OPZIONI}
              valore={form.cucina}
              onChange={(id) => aggiornaCampo("cucina", id)}
            />
          </CampoLabel>
        </section>

        <section className="pro-panel px-4 py-4 mb-4" aria-labelledby={`${baseId}-caratteristiche`}>
          <h2 id={`${baseId}-caratteristiche`} className="ds-section-title mb-3">
            Caratteristiche impianto
          </h2>
          <ul className="space-y-2" role="list">
            {CARATTERISTICHE_FLAG.map((voce) => {
              const checked = Boolean(form[voce.id]);
              const inputId = `${baseId}-flag-${voce.id}`;
              return (
                <li key={voce.id}>
                  <label
                    htmlFor={inputId}
                    className="flex items-center justify-between gap-3 min-h-[48px] rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white">
                      {voce.label}
                    </span>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCaratteristica(voce.id)}
                      className="sr-only peer"
                    />
                    <span
                      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
                        checked ? "bg-yellow-400" : "bg-white/15"
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                          checked ? "translate-x-5" : ""
                        }`}
                      />
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <AssistenteSopralluogoPanel
          form={form}
          proposal={proposal}
          onProposalAggiornata={setProposal}
          sessione={sessione}
          onChiudiSessione={onChiudiSessione}
          onNuovaSessione={onNuovaSessione}
          preventivoId={sessione?.preventivoId || null}
        />

        <button
          type="button"
          onClick={generaProposta}
          className="w-full btn-primary min-h-[56px] px-5 py-4 text-base font-semibold flex items-center justify-center gap-2"
        >
          <Sparkles size={20} aria-hidden="true" />
          {haProposta ? "Aggiorna proposta" : "Genera proposta"}
        </button>

        {proposal ? (
          <>
            <RiepilogoCard proposal={proposal} />
            <PreventivoSuggeritoCard
              proposal={proposal}
              onCrea={creaPreventivoDaProposal}
              creazioneInCorso={creazioneInCorso}
            />
            <RagionamentoCard
              proposal={proposal}
              aperto={ragionamentoAperto}
              onToggle={() => setRagionamentoAperto((v) => !v)}
            />
          </>
        ) : null}
      </div>
    </PageWrapper>
  );
}

function RiepilogoCard({ proposal }) {
  const r = proposal.riepilogo || {};
  const mq =
    r.superficieMq === null || r.superficieMq === undefined
      ? "—"
      : r.superficieMq;
  const livello = r.livelloImpianto || "—";
  const punti =
    r.puntiStimati === null || r.puntiStimati === undefined
      ? "—"
      : r.puntiStimati;
  const quadro = r.quadroSuggerito || "—";

  return (
    <section
      className="pro-panel-strong px-4 py-4 mt-4"
      aria-labelledby="riepilogo-proposta-title"
    >
      <p className="section-label">Proposta</p>
      <h2 id="riepilogo-proposta-title" className="ds-section-title mt-1">
        Riepilogo
      </h2>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <RiepilogoVoce etichetta="mq" valore={mq} />
        <RiepilogoVoce etichetta="Livello" valore={livello} />
        <RiepilogoVoce etichetta="Punti stimati" valore={punti} />
        <RiepilogoVoce etichetta="Quadro suggerito" valore={quadro} />
      </dl>
    </section>
  );
}

function RiepilogoVoce({ etichetta, valore }) {
  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
      <dt className="text-[12px] font-medium text-slate-400">{etichetta}</dt>
      <dd className="ds-card-title mt-1 tabular-nums capitalize">{valore}</dd>
    </div>
  );
}

function PreventivoSuggeritoCard({ proposal, onCrea, creazioneInCorso }) {
  const lavorazioni = proposal.lavorazioni || [];
  const iva = proposal.ivaPercentuale ?? 22;

  return (
    <section
      className="pro-panel-strong px-4 py-4 mt-3"
      aria-labelledby="preventivo-suggerito-title"
    >
      <p className="section-label">Prezzo</p>
      <h2 id="preventivo-suggerito-title" className="ds-section-title mt-1">
        Preventivo suggerito
      </h2>

      {lavorazioni.length === 0 ? (
        <p className="ds-text-secondary text-sm mt-4">
          Nessuna lavorazione suggerita.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-medium uppercase tracking-wide text-slate-500 border-b border-white/[0.08]">
                <th className="py-2 pr-2 font-medium">Descrizione</th>
                <th className="py-2 px-2 font-medium text-right">Qtà</th>
                <th className="py-2 px-2 font-medium text-right">Prezzo u.</th>
                <th className="py-2 pl-2 font-medium text-right">Totale</th>
              </tr>
            </thead>
            <tbody>
              {lavorazioni.map((lav) => {
                const spiegazione = risolviSpiegazioneLavorazione(
                  lav,
                  proposal
                );
                return (
                  <Fragment key={lav.id || lav.catalogoId || lav.descrizione}>
                    <tr className="border-b border-white/[0.04] align-top">
                      <td className="py-3 pr-2">
                        <p className="font-semibold text-white leading-snug">
                          {lav.descrizione}
                        </p>
                        {!lav.prezzoConfigurato ? (
                          <span className="mt-1.5 inline-flex items-center rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                            Prezzo non configurato
                          </span>
                        ) : null}
                        {spiegazione ? (
                          <KnowledgeExplanationCard
                            spiegazione={spiegazione}
                          />
                        ) : null}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums text-slate-300">
                        {lav.quantita}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums text-slate-300">
                        {lav.prezzoConfigurato
                          ? formatEuro(lav.prezzoUnitario)
                          : "—"}
                      </td>
                      <td className="py-3 pl-2 text-right tabular-nums font-semibold text-white">
                        {lav.prezzoConfigurato ? formatEuro(lav.totale) : "—"}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 rounded-[16px] border border-yellow-400/25 bg-yellow-400/10 px-4 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-yellow-100/80">
              Totale finale (IVA {iva}%)
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Imponibile {formatEuro(proposal.subtotale)} · IVA{" "}
              {formatEuro(proposal.totaleIVA)}
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums text-yellow-300">
            {formatEuro(proposal.totale)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCrea}
        disabled={creazioneInCorso || lavorazioni.length === 0}
        className="w-full btn-primary min-h-[52px] mt-4 px-5 py-3 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <FilePlus2 size={18} aria-hidden="true" />
        {creazioneInCorso ? "Creazione…" : "Crea Preventivo"}
      </button>
    </section>
  );
}

function RagionamentoCard({ proposal, aperto, onToggle }) {
  const regole = proposal.regoleApplicate || [];
  const brain = proposal.brainInsights || {};
  const suggerimentiBrain = brain.suggerimentiBrain || [];
  const patterns = brain.patterns || [];
  const lavorazioni = proposal.lavorazioni || [];
  const conPerche = lavorazioni.filter((l) => l.perche);

  return (
    <section className="pro-panel px-4 py-3 mt-3 mb-2">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 min-h-[48px] text-left"
        aria-expanded={aperto}
      >
        <span className="ds-section-title text-base">
          🧠 Come ha ragionato PreventivAI
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-400 shrink-0 transition-transform ${
            aperto ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {aperto ? (
        <div className="pt-2 pb-2 space-y-4 border-t border-white/[0.06] mt-2">
          <div>
            <h3 className="text-[12px] font-medium text-slate-400 mb-2">
              Regole applicate
            </h3>
            {regole.length === 0 ? (
              <p className="ds-text-secondary text-sm">Nessuna regola.</p>
            ) : (
              <ul className="space-y-1.5" role="list">
                {regole.map((regola) => (
                  <li
                    key={regola.id}
                    className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white"
                  >
                    {regola.nome}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-[12px] font-medium text-slate-400 mb-2">
              Brain Insights
            </h3>
            {suggerimentiBrain.length === 0 && patterns.length === 0 ? (
              <p className="ds-text-secondary text-sm">
                Nessun insight Brain su questa proposta.
              </p>
            ) : (
              <ul className="space-y-1.5" role="list">
                {suggerimentiBrain.map((s, i) => (
                  <li
                    key={`brain-sug-${i}`}
                    className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white"
                  >
                    {s.titolo || s.testo || "—"}
                    {s.affidabilita != null
                      ? ` · ${s.affidabilita}%`
                      : ""}
                  </li>
                ))}
                {patterns.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white"
                  >
                    {p.nome}
                    {p.affidabilita != null ? ` · ${p.affidabilita}%` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-[12px] font-medium text-slate-400 mb-2">
              Origine suggerimenti
            </h3>
            <ul className="space-y-1.5" role="list">
              {lavorazioni.map((lav) => (
                <li
                  key={`orig-${lav.id}`}
                  className="flex items-center justify-between gap-2 rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-white truncate">
                    {lav.descrizione}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 shrink-0">
                    {lav.origine === "BRAIN" ? "🧠 Brain" : "📘 Base"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {conPerche.length > 0 ? (
            <div>
              <h3 className="text-[12px] font-medium text-slate-400 mb-2">
                Perché?
              </h3>
              <ul className="space-y-2" role="list">
                {conPerche.map((lav) => (
                  <li
                    key={`perche-${lav.id}`}
                    className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-white">
                      {lav.descrizione}
                    </p>
                    <p className="ds-text-secondary text-xs mt-1.5 leading-relaxed">
                      {lav.perche}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function CampoLabel({ etichetta, htmlFor, children }) {
  return (
    <div className="mb-4 last:mb-0">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="block text-[12px] font-medium text-slate-400">
          {etichetta}
        </label>
      ) : (
        <p className="text-[12px] font-medium text-slate-400">{etichetta}</p>
      )}
      <div className={htmlFor ? undefined : "mt-2"}>{children}</div>
    </div>
  );
}

function ChipGroup({ nome, opzioni, valore, onChange }) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label={nome}
    >
      {opzioni.map((opzione) => {
        const attivo = valore === opzione.id;
        return (
          <button
            key={opzione.id}
            type="button"
            role="radio"
            aria-checked={attivo}
            onClick={() => onChange(opzione.id)}
            className={`ds-chip ${attivo ? "ds-chip-active" : ""}`}
          >
            {opzione.label}
          </button>
        );
      })}
    </div>
  );
}
