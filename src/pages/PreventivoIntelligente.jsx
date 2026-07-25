import { useId, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  Building2,
  Check,
  ChevronDown,
  Eye,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import NumericInput from "../components/NumericInput";
import { KNOWLEDGE_CATEGORIES } from "../domain/knowledge/knowledgeCategories";
import { KNOWLEDGE_ORIGINE } from "../domain/knowledge/knowledgePriorityService";
import { generaPropostaPreventivo } from "../domain/knowledge/preventivoIntelligenteService";
import {
  getNumeroRegole,
  getRegolePerCategoria,
} from "../domain/knowledge/knowledgeStatistics";
import { salvaOsservazione } from "../domain/brain/brainObservationService";
import {
  analizzaOsservazioni,
  ottieniPattern,
} from "../domain/brain/brainPatternService";
import {
  accettaPattern,
  rifiutaPattern,
} from "../domain/brain/brainLearningService";
import { BRAIN_PATTERN_STATI } from "../domain/brain/brainPatternTypes";

const TIPI_IMMOBILE = [
  { id: "appartamento", label: "Appartamento" },
  { id: "villa", label: "Villa" },
  { id: "ufficio", label: "Ufficio" },
  { id: "negozio", label: "Negozio" },
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

const EXTRA_OPZIONI = [
  { id: "predisposizioneClima", label: "Predisposizione Clima" },
  { id: "videosorveglianza", label: "Videosorveglianza" },
  { id: "allarme", label: "Allarme" },
  { id: "domotica", label: "Domotica" },
  { id: "fotovoltaico", label: "Fotovoltaico" },
  { id: "ricaricaAuto", label: "Ricarica Auto" },
  { id: "automazioneCancello", label: "Automazione Cancello" },
];

const FORM_INIZIALE = {
  tipoImmobile: "appartamento",
  superficieMq: "",
  numeroLivelli: "1",
  statoImmobile: "nuova-costruzione",
  serieCivile: "living-now",
  livelloImpianto: "standard",
  extra: Object.fromEntries(EXTRA_OPZIONI.map((voce) => [voce.id, false])),
};

/**
 * Preventivo Intelligente — raccolta dati per il Knowledge Engine.
 * Nessuna generazione preventivo in questo sprint.
 */
export default function PreventivoIntelligente() {
  const baseId = useId();
  const [form, setForm] = useState(FORM_INIZIALE);
  const [proposta, setProposta] = useState(null);
  const [errore, setErrore] = useState("");
  const [patterns, setPatterns] = useState(() => ottieniPattern());
  const [patternApertoId, setPatternApertoId] = useState(null);

  function aggiornaCampo(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function toggleExtra(extraId) {
    setForm((prev) => ({
      ...prev,
      extra: {
        ...prev.extra,
        [extraId]: !prev.extra[extraId],
      },
    }));
  }

  function generaProposta() {
    setErrore("");
    const input = {
      ...form,
      superficieMq:
        form.superficieMq === "" || form.superficieMq === null
          ? null
          : Number(form.superficieMq),
    };

    const risultato = generaPropostaPreventivo(input);

    if (risultato?.success && risultato.proposta) {
      setProposta(risultato.proposta);

      // Brain: osserva + memorizza, poi ricalcola pattern (solo proposta, no auto-conoscenza).
      salvaOsservazione(input, risultato.proposta, {});
      const analisi = analizzaOsservazioni();
      setPatterns(analisi.patterns || []);
      return;
    }

    setProposta(null);
    setErrore("Impossibile generare la proposta. Riprova.");
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <Link
          to={ROUTES.dashboard}
          className="text-slate-400 mb-4 inline-flex min-h-[44px] items-center"
        >
          ← Home
        </Link>

        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-[16px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
              <Zap size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="section-label">Knowledge</p>
              <h1 className="ds-page-title mt-1">Preventivo Intelligente</h1>
              <p className="ds-text-secondary mt-2">
                Descrivi immobile e impianto. Il Rule Engine costruisce la
                proposta.
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
        </section>

        <section className="pro-panel px-4 py-4 mb-4" aria-labelledby={`${baseId}-extra`}>
          <h2 id={`${baseId}-extra`} className="ds-section-title mb-3">
            Extra
          </h2>
          <ul className="space-y-2" role="list">
            {EXTRA_OPZIONI.map((voce) => {
              const checked = Boolean(form.extra[voce.id]);
              const inputId = `${baseId}-extra-${voce.id}`;
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
                      onChange={() => toggleExtra(voce.id)}
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

        <button
          type="button"
          onClick={generaProposta}
          className="w-full btn-primary min-h-[56px] px-5 py-4 text-base font-semibold flex items-center justify-center gap-2"
        >
          <Sparkles size={20} aria-hidden="true" />
          Genera Proposta
        </button>

        {proposta ? <PropostaPreventivoCard proposta={proposta} /> : null}

        <BrainInsights
          patterns={patterns}
          patternApertoId={patternApertoId}
          onVisualizza={(id) =>
            setPatternApertoId((corrente) => (corrente === id ? null : id))
          }
          onInsegnami={(id) => {
            const risultato = accettaPattern(id);
            if (risultato.success) {
              setPatterns(ottieniPattern());
            }
          }}
          onIgnora={(id) => {
            const risultato = rifiutaPattern(id);
            if (risultato.success) {
              setPatterns(ottieniPattern());
            }
          }}
        />

        <KnowledgeEngineInfo
          regoleApplicate={proposta?.regoleApplicate || []}
        />
      </div>
    </PageWrapper>
  );
}

function BrainInsights({
  patterns,
  patternApertoId,
  onVisualizza,
  onInsegnami,
  onIgnora,
}) {
  const elenco = Array.isArray(patterns) ? patterns : [];

  return (
    <section
      className="pro-panel px-4 py-4 mt-4"
      aria-labelledby="brain-insights-title"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <Brain
          size={18}
          className="text-yellow-300 shrink-0"
          aria-hidden="true"
        />
        <h2 id="brain-insights-title" className="ds-section-title">
          Brain Insights
        </h2>
      </div>

      {elenco.length === 0 ? (
        <p className="ds-text-secondary text-sm">
          Nessun pattern ancora. Servono almeno 5 osservazioni simili con
          ripetizione ≥ 80%.
        </p>
      ) : (
        <ul className="space-y-2" role="list">
          {elenco.map((pattern) => {
            const aperto = patternApertoId === pattern.id;
            const accettato = pattern.stato === BRAIN_PATTERN_STATI.ACCETTATO;
            const rifiutato = pattern.stato === BRAIN_PATTERN_STATI.RIFIUTATO;
            const daConfermare = !accettato && !rifiutato;

            return (
              <li
                key={pattern.id}
                className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">
                        {pattern.nome}
                      </p>
                      {accettato ? (
                        <span className="inline-flex items-center rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                          Insegnato
                        </span>
                      ) : null}
                    </div>
                    <p className="ds-text-secondary text-xs mt-1">
                      Affidabilità {pattern.affidabilita}% ·{" "}
                      {pattern.osservazioni} osservazioni
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onVisualizza(pattern.id)}
                    className="btn-secondary min-h-[44px] px-3 text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    aria-expanded={aperto}
                  >
                    <Eye size={14} aria-hidden="true" />
                    Visualizza
                  </button>
                </div>

                {aperto ? (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3">
                    <p className="text-[12px] font-medium text-slate-400">
                      Categoria · {pattern.categoria}
                    </p>
                    <p className="text-sm text-white font-semibold">
                      {pattern.suggerimento?.testo || "—"}
                    </p>
                    <p className="ds-text-secondary text-xs">
                      Stato: {pattern.stato}
                    </p>

                    {daConfermare ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onInsegnami(pattern.id)}
                          className="btn-primary min-h-[44px] px-3 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Check size={14} aria-hidden="true" />
                          Insegnami
                        </button>
                        <button
                          type="button"
                          onClick={() => onIgnora(pattern.id)}
                          className="btn-secondary min-h-[44px] px-3 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <X size={14} aria-hidden="true" />
                          Ignora
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function KnowledgeEngineInfo({ regoleApplicate }) {
  const numeroRegole = useMemo(() => getNumeroRegole(), []);
  const perCategoria = useMemo(() => getRegolePerCategoria(), []);
  const categoriePopolate = KNOWLEDGE_CATEGORIES.filter(
    (categoria) => (perCategoria[categoria] || 0) > 0
  );

  return (
    <section
      className="pro-panel px-4 py-4 mt-4 mb-2"
      aria-labelledby="knowledge-engine-info-title"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <BookOpen
          size={18}
          className="text-yellow-300 shrink-0"
          aria-hidden="true"
        />
        <h2 id="knowledge-engine-info-title" className="ds-section-title">
          Knowledge Engine
        </h2>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <dt className="text-[12px] font-medium text-slate-400">
            Regole disponibili
          </dt>
          <dd className="ds-card-title mt-1 tabular-nums">{numeroRegole}</dd>
        </div>
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <dt className="text-[12px] font-medium text-slate-400">
            Categorie
          </dt>
          <dd className="ds-card-title mt-1 tabular-nums">
            {KNOWLEDGE_CATEGORIES.length}
          </dd>
        </div>
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <dt className="text-[12px] font-medium text-slate-400">
            Regole applicate
          </dt>
          <dd className="ds-card-title mt-1 tabular-nums">
            {regoleApplicate.length}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <h3 className="text-[12px] font-medium text-slate-400 mb-2">
          Categorie con regole
        </h3>
        {categoriePopolate.length === 0 ? (
          <p className="ds-text-secondary text-sm">Nessuna categoria popolata.</p>
        ) : (
          <ul className="flex flex-wrap gap-2" role="list">
            {categoriePopolate.map((categoria) => (
              <li key={categoria} className="ds-chip">
                {categoria}
                <span className="ml-1.5 tabular-nums text-yellow-200/90">
                  {perCategoria[categoria]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {regoleApplicate.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-[12px] font-medium text-slate-400 mb-2">
            Ultime regole applicate
          </h3>
          <ul className="space-y-1.5" role="list">
            {regoleApplicate.map((regola) => (
              <li
                key={regola.id}
                className="flex items-center justify-between gap-2 rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-white truncate">
                  {regola.nome}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 shrink-0">
                  {regola.id}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function PropostaPreventivoCard({ proposta }) {
  const punti =
    proposta.puntiStimati === null || proposta.puntiStimati === undefined
      ? "—"
      : proposta.puntiStimati;
  const quadro = proposta.quadroSuggerito || "—";
  const suggerimenti = proposta.suggerimenti || [];
  const regole = proposta.regoleApplicate || [];
  const [percheAperto, setPercheAperto] = useState(null);

  return (
    <section
      className="pro-panel-strong px-4 py-4 mt-4"
      aria-labelledby="proposta-preventivo-title"
    >
      <p className="section-label">Rule Engine</p>
      <h2 id="proposta-preventivo-title" className="ds-section-title mt-1">
        Proposta preventivo
      </h2>

      <dl className="mt-4 grid gap-3">
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <dt className="text-[12px] font-medium text-slate-400">
            Punti stimati
          </dt>
          <dd className="ds-card-title mt-1 tabular-nums">{punti}</dd>
        </div>
        <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
          <dt className="text-[12px] font-medium text-slate-400">
            Quadro suggerito
          </dt>
          <dd className="ds-card-title mt-1">{quadro}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <h3 className="text-[12px] font-medium text-slate-400 mb-2">
          Suggerimenti
        </h3>
        {suggerimenti.length === 0 ? (
          <p className="ds-text-secondary text-sm">Nessun suggerimento.</p>
        ) : (
          <ul className="space-y-2" role="list">
            {suggerimenti.map((voce, indice) => {
              const titolo =
                typeof voce === "string" ? voce : voce.titolo || "—";
              const origine =
                typeof voce === "object" ? voce.origine : KNOWLEDGE_ORIGINE.BASE;
              const labelOrigine =
                typeof voce === "object"
                  ? voce.labelOrigine
                  : "Conoscenza Base";
              const affidabilita =
                typeof voce === "object" ? voce.affidabilita : null;
              const perche =
                typeof voce === "object"
                  ? voce.percheBrain || voce.perche
                  : null;
              const chiave = `${origine}-${titolo}-${indice}`;
              const aperto = percheAperto === chiave;
              const iconaOrigine =
                origine === KNOWLEDGE_ORIGINE.BRAIN ? "🧠" : "📘";

              return (
                <li
                  key={chiave}
                  className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                >
                  <p className="text-sm font-semibold text-white">{titolo}</p>
                  <p className="ds-text-secondary text-xs mt-1.5">
                    Origine {iconaOrigine} {labelOrigine}
                    {affidabilita !== null && affidabilita !== undefined
                      ? ` · Affidabilità ${affidabilita}%`
                      : ""}
                    {typeof voce === "object" && voce.rafforzatoDalBrain
                      ? " · Rafforzato dal Brain"
                      : ""}
                  </p>
                  {perche ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPercheAperto((corrente) =>
                            corrente === chiave ? null : chiave
                          )
                        }
                        className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-yellow-200/90"
                        aria-expanded={aperto}
                      >
                        Perché?
                        <ChevronDown
                          size={14}
                          className={aperto ? "rotate-180" : ""}
                          aria-hidden="true"
                        />
                      </button>
                      {aperto ? (
                        <p className="ds-text-secondary text-xs mt-1.5 leading-relaxed">
                          {perche}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-[12px] font-medium text-slate-400 mb-2">
          Regole applicate
        </h3>
        {regole.length === 0 ? (
          <p className="ds-text-secondary text-sm">Nessuna regola applicata.</p>
        ) : (
          <ul className="space-y-1.5" role="list">
            {regole.map((regola) => (
              <li
                key={regola.id}
                className="flex items-center justify-between gap-2 rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
              >
                <span className="text-sm font-semibold text-white truncate">
                  {regola.nome}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 shrink-0">
                  {regola.origine === KNOWLEDGE_ORIGINE.BRAIN ? "🧠 " : "📘 "}
                  {regola.id}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
