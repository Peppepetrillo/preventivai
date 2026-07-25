import { useId, useState } from "react";
import { MessageCircleQuestion } from "lucide-react";

import {
  ASSISTANT_RISPOSTA_STATO,
  proponiDomandeSopralluogo,
} from "../../domain/assistant";
import {
  DECISION_MAPPINGS,
  DECISION_STATO,
  confermaDecisione,
  confermaEApplicaAProposal,
  ignoraDecisione,
  modificaProposta,
  ottieniDecisionePerDomanda,
  riceviRisposta,
} from "../../domain/assistantDecision";
import {
  MEMORY_STATO,
  ottieniMemoriaPerDomanda,
  registraSceltaAssistente,
} from "../../domain/decisionMemory";
import {
  SESSIONE_STATO,
  aggiungiDecisionIdASessione,
} from "../../domain/sopralluogoSession";

const PRIORITA_STILE = {
  ALTA: "bg-red-500/15 text-red-200 border-red-400/25",
  MEDIA: "bg-amber-500/15 text-amber-100 border-amber-400/25",
  BASSA: "bg-slate-500/20 text-slate-300 border-white/10",
};

const BADGE_MEMORIA = {
  [MEMORY_STATO.CONFERMATA]: {
    label: "✓ Confermata",
    className: "text-emerald-200 border-emerald-400/30 bg-emerald-500/10",
  },
  [MEMORY_STATO.MODIFICATA]: {
    label: "✏ Modificata",
    className: "text-amber-100 border-amber-400/30 bg-amber-500/10",
  },
  [MEMORY_STATO.IGNORATA]: {
    label: "○ Ignorata",
    className: "text-slate-300 border-white/15 bg-white/[0.04]",
  },
};

function BadgeMemoria({ stato }) {
  const meta = BADGE_MEMORIA[stato];
  if (!meta) return null;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/**
 * Assistente Sopralluogo + Decision Flow + Session Memory.
 *
 * @param {{
 *   form: object,
 *   proposal?: object|null,
 *   onProposalAggiornata?: (proposal: object) => void,
 *   sessione?: object|null,
 *   onChiudiSessione?: () => void,
 *   onNuovaSessione?: () => void,
 *   preventivoId?: string|null,
 * }} props
 */
export default function AssistenteSopralluogoPanel({
  form,
  proposal = null,
  onProposalAggiornata,
  sessione = null,
  onChiudiSessione,
  onNuovaSessione,
  preventivoId = null,
}) {
  const baseId = useId();
  const [stati, setStati] = useState({});
  const [bozze, setBozze] = useState({});
  const [apertePerche, setApertePerche] = useState({});
  const [decisioniUi, setDecisioniUi] = useState({});
  const [modificaAperta, setModificaAperta] = useState({});
  const [messaggi, setMessaggi] = useState({});
  const [memoriaTick, setMemoriaTick] = useState(0);

  const sessionId = sessione?.id || null;
  const scopeMemoria = sessionId
    ? { sessionId, preventivoId: preventivoId || sessione?.preventivoId || null }
    : null;

  const domande = proponiDomandeSopralluogo(form || {});

  const consigliate = domande.filter((d) => {
    const statoUi = stati[d.id]?.stato;
    const decisione =
      decisioniUi[d.id] || ottieniDecisionePerDomanda(d.id);
    const memoria = scopeMemoria
      ? ottieniMemoriaPerDomanda(d.id, scopeMemoria)
      : null;

    if (memoria?.stato === MEMORY_STATO.IGNORATA) return true;
    if (memoria?.stato === MEMORY_STATO.CONFERMATA) return true;
    if (memoria?.stato === MEMORY_STATO.MODIFICATA) return true;

    if (decisione?.stato === DECISION_STATO.PROPOSTA) return true;
    if (decisione?.stato === DECISION_STATO.CONFERMATA) return true;
    if (decisione?.stato === DECISION_STATO.IGNORATA) return true;

    if (statoUi === ASSISTANT_RISPOSTA_STATO.IGNORA) return true;
    if (statoUi === ASSISTANT_RISPOSTA_STATO.RISPOSTA && !decisione) {
      return false;
    }

    return (
      !statoUi ||
      statoUi === ASSISTANT_RISPOSTA_STATO.APERTA ||
      statoUi === ASSISTANT_RISPOSTA_STATO.NON_ORA
    );
  });

  void memoriaTick;

  function refreshMemoria() {
    setMemoriaTick((n) => n + 1);
  }

  function resetUiLocale() {
    setStati({});
    setBozze({});
    setDecisioniUi({});
    setModificaAperta({});
    setMessaggi({});
    setApertePerche({});
    refreshMemoria();
  }

  function aggiornaStato(id, stato, testo = "") {
    setStati((prev) => ({
      ...prev,
      [id]: { stato, testo: testo || prev[id]?.testo || "", at: Date.now() },
    }));
  }

  function onRispondi(domanda) {
    const testo = bozze[domanda.id] || "";
    aggiornaStato(domanda.id, ASSISTANT_RISPOSTA_STATO.RISPOSTA, testo);
    const decisione = riceviRisposta(domanda.id, testo);
    setDecisioniUi((prev) => ({ ...prev, [domanda.id]: decisione }));
    setMessaggi((prev) => ({ ...prev, [domanda.id]: "" }));
    if (decisione.stato === DECISION_STATO.PROPOSTA) {
      setModificaAperta((prev) => ({ ...prev, [domanda.id]: false }));
    }
  }

  function onIgnoraDomanda(domanda) {
    aggiornaStato(domanda.id, ASSISTANT_RISPOSTA_STATO.IGNORA);
    const esistente = decisioniUi[domanda.id];
    if (esistente && sessionId) {
      const ignorata = ignoraDecisione(esistente.id, {
        proposal,
        sessionId,
        preventivoId: scopeMemoria?.preventivoId,
      });
      setDecisioniUi((prev) => ({ ...prev, [domanda.id]: ignorata }));
    } else if (sessionId) {
      const mapping = DECISION_MAPPINGS[domanda.id];
      if (mapping) {
        const record = registraSceltaAssistente({
          sessionId,
          domandaId: domanda.id,
          catalogoId: mapping.catalogoId,
          valorePrecedente: null,
          valoreScelto: null,
          tipoAzione: mapping.tipo,
          stato: MEMORY_STATO.IGNORATA,
          preventivoId: scopeMemoria?.preventivoId,
        });
        aggiungiDecisionIdASessione(sessionId, record.id);
      }
    }
    refreshMemoria();
  }

  function onConfermaProposta(domanda) {
    const decisione = decisioniUi[domanda.id];
    if (!decisione || !sessionId) return;

    if (typeof onProposalAggiornata === "function" && proposal) {
      const esito = confermaEApplicaAProposal(decisione.id, proposal, {
        sessionId,
        preventivoId: scopeMemoria?.preventivoId,
      });
      setDecisioniUi((prev) => ({
        ...prev,
        [domanda.id]: esito.decisione || decisione,
      }));
      if (esito.success && esito.proposal) {
        onProposalAggiornata(esito.proposal);
        setMessaggi((prev) => ({
          ...prev,
          [domanda.id]: "Modifica salvata in memoria di sessione e applicata.",
        }));
      } else {
        setMessaggi((prev) => ({
          ...prev,
          [domanda.id]: "Decisione salvata nella sessione di sopralluogo.",
        }));
      }
    } else {
      const confermata = confermaDecisione(decisione.id, {
        proposal,
        sessionId,
        preventivoId: scopeMemoria?.preventivoId,
      });
      setDecisioniUi((prev) => ({ ...prev, [domanda.id]: confermata }));
      setMessaggi((prev) => ({
        ...prev,
        [domanda.id]:
          "Salvata in sessione. Genera una proposta per applicarla.",
      }));
    }
    refreshMemoria();
  }

  function onIgnoraProposta(domanda) {
    const decisione = decisioniUi[domanda.id];
    if (!decisione || !sessionId) return;
    const ignorata = ignoraDecisione(decisione.id, {
      proposal,
      sessionId,
      preventivoId: scopeMemoria?.preventivoId,
    });
    setDecisioniUi((prev) => ({ ...prev, [domanda.id]: ignorata }));
    aggiornaStato(domanda.id, ASSISTANT_RISPOSTA_STATO.IGNORA);
    refreshMemoria();
  }

  function onModificaProposta(domanda) {
    const decisione = decisioniUi[domanda.id];
    if (!decisione) return;
    setModificaAperta((prev) => ({ ...prev, [domanda.id]: true }));
    setBozze((prev) => ({
      ...prev,
      [domanda.id]: String(decisione.risposta ?? prev[domanda.id] ?? ""),
    }));
  }

  function onSalvaModifica(domanda) {
    const decisione = decisioniUi[domanda.id];
    if (!decisione) return;
    const aggiornata = modificaProposta(decisione.id, bozze[domanda.id] || "");
    setDecisioniUi((prev) => ({ ...prev, [domanda.id]: aggiornata }));
    setModificaAperta((prev) => ({ ...prev, [domanda.id]: false }));
  }

  const sessioneAttiva = sessione?.stato === SESSIONE_STATO.ATTIVA;

  if (!sessioneAttiva && consigliate.length === 0) return null;

  return (
    <section
      className="pro-panel px-4 py-4 mb-4"
      aria-labelledby={`${baseId}-title`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-[14px] bg-sky-400/15 text-sky-200 flex items-center justify-center shrink-0">
          <MessageCircleQuestion size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="section-label">Sopralluogo</p>
          <h2 id={`${baseId}-title`} className="ds-section-title mt-1">
            Assistente Sopralluogo
          </h2>
          <p className="ds-text-secondary text-sm mt-1.5">
            Memoria isolata per sessione: le scelte non contaminano altri
            preventivi.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Sopralluogo attivo
            </p>
            <p className="mt-1 text-sm text-white">
              {sessioneAttiva
                ? `Sessione ${String(sessione.id).slice(-8)}`
                : "Nessuna sessione attiva"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-[40px] px-3 py-2 text-sm font-semibold rounded-[12px] border border-white/10 bg-white/[0.04] text-slate-200 disabled:opacity-40"
              disabled={!sessioneAttiva || typeof onChiudiSessione !== "function"}
              onClick={() => {
                onChiudiSessione?.();
                resetUiLocale();
              }}
            >
              Chiudi sessione
            </button>
            <button
              type="button"
              className="btn-primary min-h-[40px] px-3 py-2 text-sm font-semibold"
              disabled={typeof onNuovaSessione !== "function"}
              onClick={() => {
                onNuovaSessione?.();
                resetUiLocale();
              }}
            >
              Nuova sessione
            </button>
          </div>
        </div>
      </div>

      {!sessioneAttiva ? (
        <p className="ds-text-secondary text-sm">
          Avvia una nuova sessione per raccogliere decisioni di sopralluogo.
        </p>
      ) : null}

      {sessioneAttiva && consigliate.length > 0 ? (
        <>
          <h3 className="text-[12px] font-medium uppercase tracking-wide text-slate-500 mb-2">
            Domande consigliate
          </h3>

          <ul className="space-y-3" role="list">
            {consigliate.map((domanda) => {
              const percheAperto = Boolean(apertePerche[domanda.id]);
              const prioritaClass =
                PRIORITA_STILE[domanda.priorita] || PRIORITA_STILE.MEDIA;
              const decisione =
                decisioniUi[domanda.id] ||
                ottieniDecisionePerDomanda(domanda.id);
              const memoria = scopeMemoria
                ? ottieniMemoriaPerDomanda(domanda.id, scopeMemoria)
                : null;
              const inProposta = decisione?.stato === DECISION_STATO.PROPOSTA;
              const inConfermataSessione =
                decisione?.stato === DECISION_STATO.CONFERMATA;
              const inModifica = Boolean(modificaAperta[domanda.id]);
              const memoriaChiusa =
                memoria?.stato === MEMORY_STATO.CONFERMATA ||
                memoria?.stato === MEMORY_STATO.MODIFICATA ||
                memoria?.stato === MEMORY_STATO.IGNORATA;

              return (
                <li
                  key={domanda.id}
                  className="rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${prioritaClass}`}
                    >
                      {domanda.priorita}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {domanda.categoria}
                    </span>
                    {memoria?.stato ? (
                      <BadgeMemoria stato={memoria.stato} />
                    ) : null}
                  </div>

                  <p className="text-sm font-semibold text-white leading-snug">
                    {domanda.domanda}
                  </p>

                  {domanda.percheChiede?.motivazione ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="text-[12px] font-medium text-sky-300 hover:text-sky-200"
                        aria-expanded={percheAperto}
                        onClick={() =>
                          setApertePerche((prev) => ({
                            ...prev,
                            [domanda.id]: !prev[domanda.id],
                          }))
                        }
                      >
                        Perché PreventivAI lo chiede?
                      </button>
                      {percheAperto ? (
                        <p className="mt-1.5 text-[13px] text-slate-300 leading-relaxed">
                          {domanda.percheChiede.motivazione}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {!inProposta && !inConfermataSessione && !memoriaChiusa ? (
                    <div className="mt-3 space-y-2">
                      <label className="block">
                        <span className="sr-only">Risposta</span>
                        <input
                          type="text"
                          value={bozze[domanda.id] || ""}
                          onChange={(e) =>
                            setBozze((prev) => ({
                              ...prev,
                              [domanda.id]: e.target.value,
                            }))
                          }
                          placeholder={
                            domanda.id === "ASK_CLIMA_QUANTI" ||
                            domanda.id === "ASK_UFFICIO_POSTAZIONI_DATI"
                              ? "Es. 3"
                              : "Scrivi una nota breve (opzionale)"
                          }
                          className="input-pro text-sm"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-primary min-h-[40px] px-3 py-2 text-sm font-semibold"
                          onClick={() => onRispondi(domanda)}
                        >
                          Rispondi
                        </button>
                        <button
                          type="button"
                          className="min-h-[40px] px-3 py-2 text-sm font-semibold rounded-[12px] border border-white/10 bg-white/[0.04] text-slate-200"
                          onClick={() => onIgnoraDomanda(domanda)}
                        >
                          Ignora
                        </button>
                        <button
                          type="button"
                          className="min-h-[40px] px-3 py-2 text-sm font-semibold rounded-[12px] border border-white/10 bg-transparent text-slate-400"
                          onClick={() =>
                            aggiornaStato(
                              domanda.id,
                              ASSISTANT_RISPOSTA_STATO.NON_ORA
                            )
                          }
                        >
                          Non ora
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {inProposta ? (
                    <div className="mt-3 rounded-[12px] border border-sky-400/25 bg-sky-400/10 px-3 py-3">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-sky-200">
                        PreventivAI propone una modifica
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-white">
                        {decisione.messaggioProposta ||
                          `Aggiornare ${decisione.azione?.catalogoId}?`}
                      </p>
                      <p className="mt-1 text-[12px] text-slate-300">
                        Risposta: {String(decisione.risposta ?? "")}
                      </p>

                      {inModifica ? (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={bozze[domanda.id] || ""}
                            onChange={(e) =>
                              setBozze((prev) => ({
                                ...prev,
                                [domanda.id]: e.target.value,
                              }))
                            }
                            className="input-pro text-sm"
                            placeholder="Nuova quantità"
                          />
                          <button
                            type="button"
                            className="btn-primary min-h-[40px] px-3 py-2 text-sm font-semibold"
                            onClick={() => onSalvaModifica(domanda)}
                          >
                            Aggiorna proposta
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-primary min-h-[40px] px-3 py-2 text-sm font-semibold"
                            onClick={() => onConfermaProposta(domanda)}
                          >
                            Conferma
                          </button>
                          <button
                            type="button"
                            className="min-h-[40px] px-3 py-2 text-sm font-semibold rounded-[12px] border border-white/10 bg-white/[0.04] text-slate-200"
                            onClick={() => onModificaProposta(domanda)}
                          >
                            Modifica
                          </button>
                          <button
                            type="button"
                            className="min-h-[40px] px-3 py-2 text-sm font-semibold rounded-[12px] border border-white/10 bg-transparent text-slate-400"
                            onClick={() => onIgnoraProposta(domanda)}
                          >
                            Ignora
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {(inConfermataSessione ||
                    memoria?.stato === MEMORY_STATO.CONFERMATA ||
                    memoria?.stato === MEMORY_STATO.MODIFICATA) &&
                  !inProposta ? (
                    <p className="mt-3 text-[13px] text-emerald-200">
                      {messaggi[domanda.id] ||
                        (memoria?.stato === MEMORY_STATO.MODIFICATA
                          ? `Memoria sessione: ${memoria.catalogoId} = ${memoria.valoreScelto}`
                          : `Memoria sessione: ${memoria?.catalogoId || ""} confermata`)}
                    </p>
                  ) : null}

                  {!inConfermataSessione &&
                  memoria?.stato !== MEMORY_STATO.CONFERMATA &&
                  memoria?.stato !== MEMORY_STATO.MODIFICATA &&
                  messaggi[domanda.id] ? (
                    <p className="mt-2 text-[12px] text-slate-300">
                      {messaggi[domanda.id]}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
