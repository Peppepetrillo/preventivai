import { AlertTriangle, Info } from "lucide-react";
import { useMemo } from "react";

import { formatEuro } from "../../../utils/preventivi";
import {
  analizzaAssistenteEconomicoDecisionaleCantiere,
  formattaPercentualeMargine,
  LIVELLO_SEGNALE_GESTIONALE,
  PRIORITA_OPERATIVA_TIPO,
  STATO_CONTROLLO_ECONOMICO,
} from "../services/speseCantiereService";

function classeSituazione(stato) {
  switch (stato) {
    case STATO_CONTROLLO_ECONOMICO.positivo:
      return "text-emerald-100 border-emerald-400/30 bg-emerald-400/10";
    case STATO_CONTROLLO_ECONOMICO.attenzione:
      return "text-amber-100 border-amber-400/30 bg-amber-400/10";
    case STATO_CONTROLLO_ECONOMICO.critico:
      return "text-red-200 border-red-400/30 bg-red-500/10";
    default:
      return "text-slate-300 border-white/10 bg-black/[0.18]";
  }
}

function IconaSegnale({ livello }) {
  if (livello === LIVELLO_SEGNALE_GESTIONALE.critico) {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" aria-hidden />;
  }
  if (livello === LIVELLO_SEGNALE_GESTIONALE.attenzione) {
    return (
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
    );
  }
  return <Info className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />;
}

function CtaAzioneGestionale({ azione, onAzioneGestionale, testIdPrefix = "gestionale" }) {
  if (!azione?.disponibile || !onAzioneGestionale) return null;

  return (
    <button
      type="button"
      className="btn-secondary w-full sm:w-auto mt-3 min-h-[44px] text-sm"
      data-testid={`${testIdPrefix}-azione-${azione.tipo}`}
      aria-label={azione.label}
      onClick={() => onAzioneGestionale(azione)}
    >
      {azione.label}
    </button>
  );
}

/**
 * Controllo gestionale — Decisione → Azione → Verifica (v13–v15).
 */
export default function RiepilogoEconomicoSection({
  cantiere,
  onAzioneGestionale,
}) {
  const decisionale = useMemo(
    () => analizzaAssistenteEconomicoDecisionaleCantiere(cantiere),
    [cantiere]
  );
  const contestuale = decisionale.assistente;
  const operativo = contestuale.operativo;
  const assistente = contestuale.assistente;
  const proattivo = contestuale.proattivo;
  const gestionale = assistente.controllo;

  const percentualeIncassoLabel =
    formattaPercentualeMargine(gestionale.percentualeIncasso) ||
    "Percentuale incasso non disponibile";
  const percentualeMargineLabel =
    formattaPercentualeMargine(gestionale.percentualeMargine) ||
    "Non disponibile";
  const incidenzaSpeseLabel =
    formattaPercentualeMargine(gestionale.incidenzaSpese) ||
    "Non disponibile";
  const assorbimentoLabel =
    gestionale.incidenzaSpese != null
      ? formattaPercentualeMargine(gestionale.incidenzaSpese)?.replace("%", "") ||
        "—"
      : "—";

  const { materiali } = gestionale;
  const {
    situazione,
    problemaPrincipale,
    segnaliSecondari,
  } = assistente;
  const { rischioPrincipale, prevenzione } = proattivo;
  const { cambiamenti, prioritaOperativa } = operativo;
  const {
    decisionePrincipale,
    impattoEconomico,
    motivo,
    evidenze,
    cosaControllare,
    azioneRaccomandata,
    alternativa,
  } = decisionale;

  const mostraCtaProblema =
    problemaPrincipale?.azione?.disponibile &&
    prioritaOperativa.tipo === PRIORITA_OPERATIVA_TIPO.nessuna;

  return (
    <section
      className="pro-panel p-5 mb-5 scroll-mt-24"
      aria-labelledby="controllo-gestionale-title"
      data-testid="cantiere-riepilogo-economico"
    >
      <h2 id="controllo-gestionale-title" className="ds-page-title mb-4">
        Controllo gestionale
      </h2>

      {/* 1. Situazione del cantiere */}
      <div
        className={`rounded-[var(--radius-card)] border p-5 mb-4 ${classeSituazione(
          situazione.stato
        )}`}
        data-testid="assistente-situazione-cantiere"
      >
        <p className="ds-text-secondary text-sm mb-1">Situazione del cantiere</p>
        <p
          className="text-2xl font-semibold ds-text-primary"
          data-testid="gestionale-situazione-stato"
        >
          {situazione.titolo}
        </p>
        <p
          className="text-sm ds-text-primary mt-2"
          data-testid="assistente-situazione-messaggio"
        >
          {situazione.messaggio}
        </p>
        <div className="mt-3 grid gap-1 sm:grid-cols-2 text-sm tabular-nums">
          <p>
            Margine{" "}
            <span className="font-semibold" data-testid="redditivita-percentuale">
              {percentualeMargineLabel}
            </span>
          </p>
          <p>
            Margine lordo{" "}
            <span className="font-semibold" data-testid="riepilogo-margine-lordo">
              {formatEuro(situazione.margineLordo)}
            </span>
          </p>
        </div>
        <span className="sr-only" data-testid="gestionale-situazione">
          {situazione.titolo}. {situazione.messaggio}
        </span>
        <span className="sr-only" data-testid="controllo-economico-stato">
          {situazione.titolo}
        </span>
      </div>

      {/* 2. Da decidere ora — decisionale v13 */}
      <div
        className="rounded-[var(--radius-card)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 p-5 mb-4"
        data-testid="assistente-da-fare-ora"
        aria-labelledby="assistente-decidere-title"
      >
        <div className="contents" data-testid="assistente-da-decidere-ora">
        <h3 id="assistente-decidere-title" className="ds-card-title text-base mb-2">
          Da decidere ora
        </h3>
        <p
          className="text-lg font-semibold ds-text-primary"
          data-testid="assistente-decisione-principale"
        >
          {decisionePrincipale.titolo}
        </p>
        <span className="sr-only" data-testid="assistente-da-fare-priorita">
          {prioritaOperativa.titolo}
        </span>

        <div className="mt-4 space-y-4">
          <div data-testid="assistente-impatto-economico">
            <p className="ds-text-secondary text-sm mb-1">Impatto economico</p>
            <p className="text-sm font-medium ds-text-primary tabular-nums">
              {impattoEconomico.messaggio}
            </p>
          </div>

          <div data-testid="assistente-perche" aria-labelledby="assistente-perche-title">
            <p id="assistente-perche-title" className="ds-text-secondary text-sm mb-1">
              Perché?
            </p>
            <p
              className="text-sm ds-text-primary"
              data-testid="assistente-spiegazione-priorita"
            >
              {motivo}
            </p>
            <span className="sr-only" data-testid="assistente-da-fare-perche">
              {motivo}
            </span>
          </div>

          {evidenze.length > 0 ? (
            <div
              data-testid="assistente-evidenze"
              aria-labelledby="assistente-evidenze-title"
            >
              <p id="assistente-evidenze-title" className="ds-text-secondary text-sm mb-2">
                Evidenze
              </p>
              <ul className="space-y-2 text-sm">
                {evidenze.map((evidenza) => (
                  <li
                    key={`${evidenza.etichetta}-${evidenza.valore}`}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-black/[0.18] px-3 py-2 tabular-nums"
                    data-testid={`assistente-evidenza-${evidenza.etichetta.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span className="ds-text-secondary">{evidenza.etichetta}</span>
                    <span className="font-semibold ds-text-primary">{evidenza.valore}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {cosaControllare.length > 0 ? (
            <div
              data-testid="assistente-cosa-controllare"
              aria-labelledby="assistente-controllare-title"
            >
              <p id="assistente-controllare-title" className="ds-text-secondary text-sm mb-2">
                Cosa controllare
              </p>
              <ul className="space-y-1 text-sm ds-text-primary list-disc pl-4">
                {cosaControllare.map((voce) => (
                  <li key={voce}>{voce}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {azioneRaccomandata.messaggio ? (
            <div data-testid="assistente-azione-raccomandata">
              <p className="ds-text-secondary text-sm mb-1">Azione raccomandata</p>
              <p className="text-sm font-medium ds-text-primary">
                {azioneRaccomandata.messaggio}
              </p>
            </div>
          ) : null}

          {alternativa?.messaggio ? (
            <p className="text-xs ds-text-secondary" data-testid="assistente-alternativa">
              {alternativa.messaggio}
            </p>
          ) : null}
        </div>

        {azioneRaccomandata.azione?.disponibile ? (
          <CtaAzioneGestionale
            azione={azioneRaccomandata.azione}
            onAzioneGestionale={onAzioneGestionale}
            testIdPrefix="gestionale"
          />
        ) : null}
        {!azioneRaccomandata.azione?.disponibile ? (
          <p className="sr-only" data-testid="assistente-da-fare-nessuna-azione">
            Nessuna CTA disponibile
          </p>
        ) : null}
        </div>
      </div>

      {/* 3. Cosa è cambiato */}
      <div
        className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4 mb-4"
        data-testid="assistente-cosa-e-cambiato"
        aria-labelledby="assistente-cambiamenti-title"
      >
        <h3 id="assistente-cambiamenti-title" className="ds-card-title text-base mb-2">
          Cosa è cambiato
        </h3>
        {cambiamenti.disponibile ? (
          <ul className="space-y-1 text-sm ds-text-primary list-disc pl-4">
            {cambiamenti.elementi.map((voce) => (
              <li key={voce}>{voce}</li>
            ))}
          </ul>
        ) : (
          <p
            className="text-sm ds-text-primary"
            data-testid="assistente-cambiamenti-non-disponibile"
          >
            {cambiamenti.messaggio}
          </p>
        )}
        <span className="sr-only" data-testid="assistente-evoluzione-tendenza">
          {proattivo.evoluzione?.tendenza}
        </span>
        <span className="sr-only" data-testid="assistente-evoluzione-economica">
          {proattivo.evoluzione?.messaggio}
        </span>
      </div>

      {/* Compatibilità v9/v10 — contenuti accessibili ma non duplicati visivamente */}
      <div className="sr-only" aria-hidden="false">
      {/* Problema principale */}
      <div
        className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4 mb-4"
        data-testid="assistente-problema-principale"
        aria-labelledby="assistente-problema-title"
      >
        <h3 id="assistente-problema-title" className="ds-card-title text-base mb-2">
          Problema principale
        </h3>
        {problemaPrincipale ? (
          <div
            data-testid={`gestionale-segnale-${problemaPrincipale.tipo}`}
          >
            <div className="flex items-start gap-2 ds-text-primary text-sm">
              <IconaSegnale livello={problemaPrincipale.livello} />
              <div className="flex-1 min-w-0">
                <p>{problemaPrincipale.messaggio}</p>
                {problemaPrincipale.spiegazione ? (
                  <p
                    className="text-sm text-slate-300 mt-1"
                    data-testid="assistente-problema-spiegazione"
                  >
                    {problemaPrincipale.spiegazione}
                  </p>
                ) : null}
                {problemaPrincipale.dettaglio ? (
                  <p
                    className="text-xs text-slate-400 mt-1 tabular-nums"
                    data-testid={`gestionale-segnale-dettaglio-${problemaPrincipale.tipo}`}
                  >
                    {problemaPrincipale.dettaglio}
                  </p>
                ) : null}
                {problemaPrincipale.materiale ? (
                  <div
                    className="mt-2 rounded-[12px] border border-white/10 bg-black/[0.18] p-3 text-xs space-y-1"
                    data-testid="assistente-problema-materiale"
                  >
                    <p className="font-medium ds-text-primary">
                      {problemaPrincipale.materiale.nome}
                    </p>
                    <p className="tabular-nums text-slate-400">
                      Previsto{" "}
                      {problemaPrincipale.materiale.previsto != null
                        ? formatEuro(problemaPrincipale.materiale.previsto)
                        : "Non disponibile"}
                      {" · "}
                      Reale{" "}
                      {problemaPrincipale.materiale.reale != null
                        ? formatEuro(problemaPrincipale.materiale.reale)
                        : "Non registrato"}
                      {problemaPrincipale.materiale.scostamento != null
                        ? ` · Scostamento ${formatEuro(problemaPrincipale.materiale.scostamento)}`
                        : ""}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            {mostraCtaProblema ? (
              <CtaAzioneGestionale
                azione={problemaPrincipale.azione}
                onAzioneGestionale={onAzioneGestionale}
                testIdPrefix="gestionale"
              />
            ) : null}
          </div>
        ) : (
          <p className="text-sm ds-text-primary">
            Non risultano criticità economiche.
          </p>
        )}
      </div>

      {/* 4. Rischio da prevenire */}
      {rischioPrincipale ? (
        <div
          className="rounded-[14px] border border-amber-400/20 bg-amber-400/5 p-4 mb-4"
          data-testid="assistente-rischio-prevenire"
          aria-labelledby="assistente-rischio-title"
        >
          <h3 id="assistente-rischio-title" className="ds-card-title text-base mb-2">
            Rischio da prevenire
          </h3>
          <div className="flex items-start gap-2 text-sm ds-text-primary">
            <IconaSegnale livello={rischioPrincipale.livello} />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{rischioPrincipale.titolo}</p>
              <p className="mt-1">{rischioPrincipale.messaggio}</p>
              {rischioPrincipale.spiegazione ? (
                <p
                  className="text-sm text-slate-300 mt-1"
                  data-testid="assistente-rischio-spiegazione"
                >
                  {rischioPrincipale.spiegazione}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Prevenzione */}
      {prevenzione?.messaggio ? (
        <div
          className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4 mb-4"
          data-testid="assistente-prevenzione"
          aria-labelledby="assistente-prevenzione-title"
        >
          <h3 id="assistente-prevenzione-title" className="ds-card-title text-base mb-2">
            Prevenzione
          </h3>
          <p className="text-sm ds-text-primary">{prevenzione.messaggio}</p>
        </div>
      ) : null}
      </div>

      <div
        className="space-y-4"
        data-testid="cantiere-controllo-economico"
      >
        {/* 4. Avanzamento economico */}
        <div
          className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4"
          data-testid="gestionale-avanzamento"
        >
          <p className="ds-text-secondary text-sm mb-2">Avanzamento economico</p>
          <p
            className="ds-text-primary font-semibold tabular-nums mb-3"
            data-testid="gestionale-percentuale-incasso"
          >
            Incassato: {percentualeIncassoLabel} del valore del cantiere
          </p>
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <p className="tabular-nums">
              Totale{" "}
              <span
                className="font-semibold block"
                data-testid="riepilogo-totale-cantiere"
              >
                {formatEuro(gestionale.totaleCantiere)}
              </span>
            </p>
            <p className="tabular-nums">
              Incassato{" "}
              <span
                className="font-semibold block"
                data-testid="riepilogo-incassato"
              >
                {formatEuro(gestionale.incassato)}
              </span>
            </p>
            <p className="tabular-nums">
              Rimanenza{" "}
              <span
                className="font-semibold block"
                data-testid="riepilogo-rimanenza"
              >
                {formatEuro(gestionale.rimanenza)}
              </span>
            </p>
          </div>
        </div>

        {/* 5. Destinazione incassi */}
        <div
          className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4"
          data-testid="gestionale-destinazione-incassi"
        >
          <p className="ds-text-secondary text-sm mb-3">Destinazione degli incassi</p>
          <div className="space-y-2 text-sm">
            <p className="tabular-nums ds-text-primary">
              Incassato{" "}
              <span className="font-semibold">
                {formatEuro(gestionale.incassato)}
              </span>
            </p>
            <p className="text-slate-500 pl-2">↓</p>
            <p className="tabular-nums ds-text-primary">
              Spese{" "}
              <span className="font-semibold" data-testid="riepilogo-spese">
                {formatEuro(gestionale.totaleSpese)}
              </span>
            </p>
            <p className="text-slate-500 pl-2">↓</p>
            <p className="tabular-nums ds-text-primary">
              Margine lordo{" "}
              <span className="font-semibold">
                {formatEuro(gestionale.margineLordo)}
              </span>
            </p>
          </div>
          {gestionale.incidenzaSpese != null ? (
            <p
              className="text-sm ds-text-secondary mt-3"
              data-testid="controllo-incidenza-spese"
            >
              Per ogni €100 incassati, €{assorbimentoLabel} sono stati assorbiti
              dalle spese (incidenza {incidenzaSpeseLabel}).
            </p>
          ) : (
            <p
              className="text-sm ds-text-secondary mt-3"
              data-testid="controllo-incidenza-spese"
            >
              Incidenza spese non disponibile senza incassi.
            </p>
          )}
        </div>

        {/* 6. Costi principali */}
        {gestionale.costiPrincipali.length > 0 ? (
          <div
            className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4"
            data-testid="gestionale-costi-principali"
          >
            <p className="ds-text-secondary text-sm mb-2">Costi principali</p>
            <div className="space-y-3 text-sm">
              {gestionale.costiPrincipali.map((voce) => (
                <div key={voce.categoria} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="ds-text-primary font-medium">
                      {voce.etichetta}
                    </span>
                    <span className="tabular-nums ds-text-primary shrink-0 font-semibold">
                      {formatEuro(voce.importo)}
                    </span>
                  </div>
                  {voce.percentualeSuTotaleSpese != null ? (
                    <p className="text-xs text-slate-400 tabular-nums">
                      {formattaPercentualeMargine(voce.percentualeSuTotaleSpese)} sul
                      totale spese
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            <span className="sr-only" data-testid="redditivita-spese-categoria">
              {gestionale.costiPrincipali.map((v) => v.etichetta).join(", ")}
            </span>
          </div>
        ) : null}

        {/* 7. Materiali */}
        {(materiali.haPrevisto || materiali.haReale) && (
          <div
            className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4"
            data-testid="riepilogo-costi-materiali"
          >
            <p className="ds-text-secondary text-sm mb-2">
              Materiali: controllo previsto / reale
            </p>
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              <p className="tabular-nums ds-text-primary">
                Previsto{" "}
                {materiali.haPrevisto
                  ? formatEuro(materiali.totalePrevisto)
                  : "Non disponibile"}
              </p>
              <p className="tabular-nums ds-text-primary">
                Reale{" "}
                {materiali.haReale
                  ? formatEuro(materiali.totaleReale)
                  : "Non registrato"}
              </p>
              <p
                className="tabular-nums ds-text-primary"
                data-testid="controllo-scostamento-materiali"
              >
                Scostamento{" "}
                {materiali.scostamento == null
                  ? "Non calcolabile"
                  : formatEuro(materiali.scostamento)}
              </p>
            </div>
            <p
              className="text-sm ds-text-secondary mt-2"
              data-testid="controllo-messaggio-scostamento"
            >
              {gestionale.alertMateriali}
            </p>
          </div>
        )}

        {/* 8. Da tenere d'occhio (segnali secondari) */}
        <div
          className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4"
          data-testid="gestionale-da-tenere-docchio"
        >
          <p className="ds-text-secondary text-sm mb-2">Da tenere d&apos;occhio</p>
          {segnaliSecondari.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {segnaliSecondari.map((segnale) => (
                <li
                  key={segnale.tipo}
                  className="rounded-[12px] border border-white/10 bg-black/[0.18] p-3"
                  data-testid={`gestionale-segnale-${segnale.tipo}`}
                >
                  <div className="flex items-start gap-2 ds-text-primary">
                    <IconaSegnale livello={segnale.livello} />
                    <div className="flex-1 min-w-0">
                      <p>{segnale.messaggio}</p>
                      {segnale.dettaglio ? (
                        <p
                          className="text-xs text-slate-400 mt-1 tabular-nums"
                          data-testid={`gestionale-segnale-dettaglio-${segnale.tipo}`}
                        >
                          {segnale.dettaglio}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <CtaAzioneGestionale
                    azione={segnale.azione}
                    onAzioneGestionale={onAzioneGestionale}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm ds-text-primary">
              {problemaPrincipale
                ? "Nessun altro segnale da monitorare."
                : "Non risultano criticità economiche."}
            </p>
          )}
        </div>
      </div>

      {/* 9. Riepilogo rapido KPI */}
      <div
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
        data-testid="gestionale-riepilogo-rapido"
      >
        {[
          {
            label: "Valore cantiere",
            valore: formatEuro(gestionale.totaleCantiere),
            nota: percentualeIncassoLabel.includes("non disponibile")
              ? null
              : `${percentualeIncassoLabel} incassato`,
          },
          {
            label: "Incassato",
            valore: formatEuro(gestionale.incassato),
            nota: null,
          },
          {
            label: "Spese",
            valore: formatEuro(gestionale.totaleSpese),
            nota:
              gestionale.incidenzaSpese != null
                ? `${incidenzaSpeseLabel} dell'incassato`
                : null,
          },
          {
            label: "Margine",
            valore: formatEuro(gestionale.margineLordo),
            nota: percentualeMargineLabel,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[14px] border border-white/10 bg-black/[0.18] p-3"
          >
            <p className="ds-text-secondary text-xs">{kpi.label}</p>
            <p className="font-semibold tabular-nums mt-1 ds-text-primary">
              {kpi.valore}
            </p>
            {kpi.nota ? (
              <p className="text-[11px] text-slate-500 mt-1">{kpi.nota}</p>
            ) : null}
          </div>
        ))}
      </div>

      <span className="sr-only" data-testid="cantiere-redditivita">
        {situazione.titolo}
      </span>
      <span className="sr-only" data-testid="redditivita-stato">
        {situazione.titolo}
      </span>
    </section>
  );
}
