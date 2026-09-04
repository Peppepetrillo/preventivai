import { AlertTriangle, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import NumericInput from "../../../components/NumericInput";
import { formatEuro } from "../../../utils/preventivi";
import {
  analizzaAssistenteEconomicoDecisionaleCantiere,
  calcolaAzioneSegnaleGestionale,
  costruisciVerificaOperazioneEconomica,
  ETICHETTE_EFFETTO_SCENARIO_ECONOMICO,
  ETICHETTE_STATO_CONTROLLO_ECONOMICO,
  formattaPercentualeMargine,
  LIVELLO_SEGNALE_GESTIONALE,
  ORIGINE_AZIONE_GESTIONALE,
  PRIORITA_OPERATIVA_TIPO,
  simulaScenarioEconomicoCantiere,
  snapshotEconomicoRealeCantiere,
  STATO_CONTROLLO_ECONOMICO,
  TIPO_SCENARIO_ECONOMICO,
  TIPO_SEGNALE_GESTIONALE
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
  operazioneRegistrata = null,
  operazioneRegistrataTick = 0,
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

  const [tipoScenario, setTipoScenario] = useState(null);
  const [importoScenario, setImportoScenario] = useState("");
  const [registrazioneInCorso, setRegistrazioneInCorso] = useState(false);
  const [verifica, setVerifica] = useState(null);
  const attesaRegistrazioneRef = useRef(null);
  const ultimoTickVerificaRef = useRef(0);
  const registrazioneLockRef = useRef(false);

  const simulazione = useMemo(() => {
    if (!tipoScenario) return null;
    return simulaScenarioEconomicoCantiere(cantiere, {
      tipo: tipoScenario,
      importo: importoScenario,
    });
  }, [cantiere, tipoScenario, importoScenario]);

  const azioneRegistraScenario =
    tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa
      ? calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.nessuna_spesa)
      : tipoScenario === TIPO_SCENARIO_ECONOMICO.incasso
        ? calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.nessun_incasso)
        : null;

  const chiudiScenario = () => {
    setTipoScenario(null);
    setImportoScenario("");
    setRegistrazioneInCorso(false);
    attesaRegistrazioneRef.current = null;
    registrazioneLockRef.current = false;
  };

  const chiudiVerifica = () => {
    setVerifica(null);
  };

  const avviaRegistrazioneReale = () => {
    if (
      registrazioneLockRef.current ||
      registrazioneInCorso ||
      !azioneRegistraScenario?.disponibile ||
      !onAzioneGestionale
    ) {
      return;
    }
    if (!simulazione?.disponibile) return;

    const importo =
      tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa
        ? simulazione.importoSpesa
        : simulazione.importoIncasso;
    if (!(importo > 0)) return;

    registrazioneLockRef.current = true;
    attesaRegistrazioneRef.current = {
      tipo: tipoScenario,
      importo,
      prima: snapshotEconomicoRealeCantiere(cantiere),
    };
    setRegistrazioneInCorso(true);
    setVerifica(null);
    onAzioneGestionale({
      ...azioneRegistraScenario,
      contesto: {
        ...(azioneRegistraScenario.contesto || {}),
        importo,
        origine: ORIGINE_AZIONE_GESTIONALE.assistente_economico,
      },
    });
  };

  useEffect(() => {
    const attesa = attesaRegistrazioneRef.current;
    if (!attesa || !operazioneRegistrataTick) return;
    if (operazioneRegistrataTick === ultimoTickVerificaRef.current) return;

    const tipoOperazione = String(operazioneRegistrata?.tipo || "").trim();
    if (tipoOperazione && tipoOperazione !== attesa.tipo) return;

    const dopo = snapshotEconomicoRealeCantiere(cantiere);
    const datiAggiornati =
      attesa.tipo === TIPO_SCENARIO_ECONOMICO.spesa
        ? dopo.totaleSpese > attesa.prima.totaleSpese ||
          dopo.conteggioSpese > attesa.prima.conteggioSpese
        : dopo.incassato > attesa.prima.incassato ||
          dopo.conteggioPagamenti > attesa.prima.conteggioPagamenti;

    // Attende il cantiere aggiornato (evita race con tick prematuro).
    if (!datiAggiornati) return;

    ultimoTickVerificaRef.current = operazioneRegistrataTick;
    const esito = costruisciVerificaOperazioneEconomica({
      tipo: attesa.tipo,
      importo: attesa.importo,
      prima: attesa.prima,
      dopo,
      cantiere,
    });

    attesaRegistrazioneRef.current = null;
    registrazioneLockRef.current = false;
    setRegistrazioneInCorso(false);
    setTipoScenario(null);
    setImportoScenario("");
    setVerifica(esito);
  }, [operazioneRegistrataTick, operazioneRegistrata, cantiere]);

  useEffect(() => {
    if (!verifica) return;
    const target = document.getElementById("assistente-verifica");
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [verifica]);

  const classificazione = simulazione?.classificazione || null;
  const importoCta =
    simulazione?.disponibile
      ? tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa
        ? simulazione.importoSpesa
        : simulazione.importoIncasso
      : null;
  const labelCtaRegistrazione =
    importoCta > 0
      ? tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa
        ? `Registra spesa di ${formatEuro(importoCta)}`
        : `Registra incasso di ${formatEuro(importoCta)}`
      : null;

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

      {/* Verifica post-registrazione — v15 */}
      {verifica ? (
        <div
          id="assistente-verifica"
          className="rounded-[var(--radius-card)] border border-emerald-400/30 bg-emerald-400/10 p-5 mb-4 scroll-mt-24"
          data-testid="assistente-verifica"
          aria-labelledby="assistente-verifica-title"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 id="assistente-verifica-title" className="ds-card-title text-base mb-1">
                Verifica
              </h3>
              <p
                className="text-sm font-medium ds-text-primary"
                data-testid="assistente-verifica-ok"
              >
                ✓ Operazione registrata
              </p>
            </div>
            <button
              type="button"
              className="text-sm ds-text-secondary min-h-[44px] px-2"
              data-testid="assistente-verifica-chiudi"
              aria-label="Chiudi verifica"
              onClick={chiudiVerifica}
            >
              Chiudi
            </button>
          </div>

          <p
            className="text-sm ds-text-primary mt-3"
            data-testid="assistente-verifica-messaggio"
          >
            {verifica.messaggio}
          </p>
          <p className="text-xs ds-text-secondary mt-1">
            Questa è ora la situazione reale del cantiere.
          </p>

          {verifica.operazioneLabel ? (
            <p
              className="text-sm tabular-nums mt-3 ds-text-primary"
              data-testid="assistente-verifica-operazione"
            >
              Operazione: {verifica.operazioneLabel}
            </p>
          ) : null}

          {verifica.confronto?.length ? (
            <div
              className="mt-3 space-y-2 text-sm"
              data-testid="assistente-verifica-confronto"
            >
              {verifica.confronto.map((riga) => (
                <p key={riga.etichetta} className="tabular-nums">
                  <span className="ds-text-secondary">{riga.etichetta}:</span>{" "}
                  {riga.prima} → <span className="font-semibold">{riga.ora}</span>
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-4 rounded-[12px] border border-white/10 bg-black/[0.18] p-3">
            <p className="ds-text-secondary text-xs mb-1">Situazione reale aggiornata</p>
            <p
              className="font-semibold ds-text-primary"
              data-testid="assistente-verifica-situazione"
            >
              {situazione.titolo}
            </p>
            <p className="text-sm tabular-nums mt-1">
              Margine{" "}
              <span className="font-semibold">{formatEuro(situazione.margineLordo)}</span>
            </p>
            <p
              className="text-sm tabular-nums mt-1"
              data-testid="assistente-verifica-priorita"
            >
              Priorità: {prioritaOperativa.titolo}
            </p>
          </div>
        </div>
      ) : null}

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

      {/* Simula operazione — Decisione → Azione (v14/v15) */}
      <div
        className="rounded-[14px] border border-white/10 bg-black/[0.12] p-4 mb-4"
        data-testid="assistente-simula-blocco"
        aria-labelledby="assistente-simula-title"
      >
        <h3 id="assistente-simula-title" className="ds-card-title text-base mb-3">
          Simula un&apos;operazione
        </h3>
        <p className="text-xs ds-text-secondary mb-3">
          Scenario simulato — i dati reali del cantiere non cambiano.
        </p>

        {registrazioneInCorso ? (
          <div
            className="rounded-[12px] border border-amber-400/30 bg-amber-400/10 p-3 mb-3"
            data-testid="assistente-simula-registrazione"
            role="status"
          >
            <p className="text-sm ds-text-primary font-medium">
              Completa la registrazione nel form aperto.
            </p>
            <p className="text-xs ds-text-secondary mt-1">
              Dopo il salvataggio vedrai la verifica sulla situazione reale.
            </p>
            <button
              type="button"
              className="text-sm ds-text-secondary min-h-[44px] mt-1 px-1"
              data-testid="assistente-simula-annulla-registrazione"
              onClick={chiudiScenario}
            >
              Annulla
            </button>
          </div>
        ) : null}

        {!tipoScenario ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary min-h-[44px] text-sm flex-1 sm:flex-none"
              data-testid="assistente-simula-spesa"
              aria-label="Simula una spesa"
              disabled={registrazioneInCorso}
              onClick={() => {
                setVerifica(null);
                setTipoScenario(TIPO_SCENARIO_ECONOMICO.spesa);
              }}
            >
              + Spesa
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[44px] text-sm flex-1 sm:flex-none"
              data-testid="assistente-simula-incasso"
              aria-label="Simula un incasso"
              disabled={registrazioneInCorso}
              onClick={() => {
                setVerifica(null);
                setTipoScenario(TIPO_SCENARIO_ECONOMICO.incasso);
              }}
            >
              + Incasso
            </button>
          </div>
        ) : (
          <div className="space-y-4" data-testid="assistente-simula-attivo">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium ds-text-primary">
                {tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa
                  ? "Simulazione spesa"
                  : "Simulazione incasso"}
              </p>
              <button
                type="button"
                className="text-sm ds-text-secondary min-h-[44px] px-2"
                data-testid="assistente-simula-chiudi"
                aria-label="Chiudi simulazione"
                disabled={registrazioneInCorso}
                onClick={chiudiScenario}
              >
                Chiudi
              </button>
            </div>

            <div>
              <label
                htmlFor="assistente-simula-importo"
                className="ds-text-secondary text-sm block mb-1"
              >
                Importo
              </label>
              <NumericInput
                id="assistente-simula-importo"
                value={importoScenario}
                onChange={setImportoScenario}
                placeholder="0,00"
                aria-label="Importo simulazione"
                data-testid="assistente-simula-importo"
                disabled={registrazioneInCorso}
              />
            </div>

            {simulazione?.disponibile ? (
              <div className="space-y-3 text-sm" data-testid="assistente-simula-risultato">
                {simulazione.messaggio ? (
                  <p className="ds-text-primary font-medium">{simulazione.messaggio}</p>
                ) : null}

                {classificazione?.effetto ? (
                  <p
                    className="text-xs ds-text-secondary"
                    data-testid="assistente-simula-classificazione"
                  >
                    {ETICHETTE_EFFETTO_SCENARIO_ECONOMICO[classificazione.effetto] ||
                      classificazione.messaggio}
                    {classificazione.cambiaStato ? " · cambio stato" : ""}
                  </p>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <div
                    className="rounded-[12px] border border-white/10 bg-black/[0.18] p-3"
                    data-testid="assistente-simula-reale"
                  >
                    <p className="ds-text-secondary text-xs mb-2">Dati reali</p>
                    {tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa ? (
                      <p className="tabular-nums">
                        Margine{" "}
                        <span className="font-semibold">
                          {formatEuro(simulazione.reale.margineLordo)}
                        </span>
                      </p>
                    ) : (
                      <>
                        <p className="tabular-nums">
                          Incassato{" "}
                          <span className="font-semibold">
                            {formatEuro(simulazione.reale.incassato)}
                          </span>
                        </p>
                        <p className="tabular-nums mt-1">
                          Rimanenza{" "}
                          <span className="font-semibold">
                            {formatEuro(simulazione.reale.rimanenza)}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                  <div
                    className="rounded-[12px] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-3"
                    data-testid="assistente-simula-scenario"
                  >
                    <p className="ds-text-secondary text-xs mb-2">Scenario simulato</p>
                    {tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa ? (
                      <p className="tabular-nums">
                        Margine{" "}
                        <span className="font-semibold">
                          {formatEuro(simulazione.simulato.margineLordo)}
                        </span>
                      </p>
                    ) : (
                      <>
                        <p className="tabular-nums">
                          Incassato{" "}
                          <span className="font-semibold">
                            {formatEuro(simulazione.simulato.incassato)}
                          </span>
                        </p>
                        <p className="tabular-nums mt-1">
                          Rimanenza{" "}
                          <span className="font-semibold">
                            {formatEuro(simulazione.simulato.rimanenza)}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <p className="tabular-nums ds-text-primary" data-testid="assistente-simula-variazione">
                  Variazione:{" "}
                  {tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa ? (
                    <>
                      {simulazione.variazioni.margine <= 0 ? "−" : "+"}
                      {formatEuro(Math.abs(simulazione.variazioni.margine))} margine
                    </>
                  ) : (
                    <>
                      {simulazione.variazioni.rimanenza <= 0 ? "−" : "+"}
                      {formatEuro(Math.abs(simulazione.variazioni.rimanenza))} rimanenza
                    </>
                  )}
                </p>

                {tipoScenario === TIPO_SCENARIO_ECONOMICO.spesa ? (
                  <p className="tabular-nums ds-text-secondary text-xs">
                    Stato:{" "}
                    {ETICHETTE_STATO_CONTROLLO_ECONOMICO[simulazione.reale.statoControllo] ||
                      "—"}{" "}
                    →{" "}
                    {ETICHETTE_STATO_CONTROLLO_ECONOMICO[simulazione.simulato.statoControllo] ||
                      "—"}
                  </p>
                ) : (
                  <p className="tabular-nums ds-text-secondary text-xs">
                    Margine lordo invariato: {formatEuro(simulazione.reale.margineLordo)}
                  </p>
                )}

                {simulazione.cambioStato?.messaggio ? (
                  <p
                    className="text-xs ds-text-primary"
                    data-testid="assistente-simula-cambio-stato"
                  >
                    {simulazione.cambioStato.messaggio}
                  </p>
                ) : null}

                {azioneRegistraScenario?.disponibile &&
                onAzioneGestionale &&
                labelCtaRegistrazione ? (
                  <button
                    type="button"
                    className="btn-primary w-full sm:w-auto min-h-[48px] text-sm"
                    data-testid="assistente-simula-registra-davvero"
                    aria-label={labelCtaRegistrazione}
                    disabled={registrazioneInCorso}
                    onClick={avviaRegistrazioneReale}
                  >
                    {labelCtaRegistrazione}
                  </button>
                ) : null}
              </div>
            ) : simulazione && !simulazione.disponibile && importoScenario ? (
              <p className="text-sm ds-text-secondary" data-testid="assistente-simula-invalido">
                {simulazione.motivo}
              </p>
            ) : null}
          </div>
        )}
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
