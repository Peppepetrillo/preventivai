import { useCallback, useMemo, useRef, useState } from "react";
import { Trash2, ClipboardList, Lightbulb, MapPin, Navigation, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ROUTES, routePreventivo } from "../../../app/routes";
import { getCantiereAssistant } from "../../../services/assistantService";
import { formatEuro, normalizzaNumero } from "../../../utils/preventivi";
import { ottieniFirma } from "../../../domain/firma";
import { aggiungiInsight } from "../../../domain/insights";
import { calcolaTotaleCantiere, ottieniVarianti } from "../../../domain/varianti";
import { useDatiLocaliSincronizzati } from "../../../hooks/useDatiLocaliSincronizzati";
import { leggiPreventivi } from "../../../repositories/preventiviRepository";
import { PreventivAISuggestions } from "../../intelligence";
import CantiereDiarioSection from "../../diario/components/CantiereDiarioSection";
import CantiereReportPanel from "../../report/components/CantiereReportPanel";
import InsightRapidoSheet from "../../agenda/components/InsightRapidoSheet";
import {
  STATI_CANTIERE,
  calcolaAvanzamentoChecklist,
  valutaPrerequisitiChiusuraCantiere,
} from "../cantieriDomain";
import CantiereAssistantPanel from "./CantiereAssistantPanel";
import CantiereOperativo from "./CantiereOperativo";
import CantiereVarianti from "./CantiereVarianti";

function scorriA(elemento) {
  if (!elemento) return;
  elemento.scrollIntoView({ behavior: "smooth", block: "start" });
}

function telefonoCantiere(cantiere = {}) {
  return String(
    cantiere.telefono ||
      cantiere.extra?.telefono ||
      cantiere.clienteTelefono ||
      ""
  ).trim();
}

/**
 * Dettaglio cantiere 2.0 — strumento di lavoro sul campo.
 * Solo UI/organizzazione: nessun cambio repository / modello / persistenza.
 */
export default function CantiereOverview({
  cantiere,
  avanzamento: avanzamentoProp,
  nuovaChecklist = "",
  nuovoMateriale = { nome: "", quantita: "", unita: "cad" },
  onAggiornaCampo,
  onImpostaChecklist,
  onAggiungiChecklist,
  onAggiornaChecklist,
  onEliminaChecklist,
  onAggiornaCampoMateriale,
  onAggiungiMateriale,
  onEliminaMateriale,
  onAggiungiFoto,
  onEliminaFoto,
  onApriFoto,
  onAggiungiNotaDiario,
  onEliminaCantiere,
  onIniziaLavoro,
  onCompletaLavoro,
  onCreaVariante,
  onSincronizzaVariantePreventivo,
  onApprovaVariante,
  onEseguiVariante,
  onAnnullaVariante,
  variantiTick = 0,
  onAggiungiVariante,
  onEliminaVariante,
}) {
  const navigate = useNavigate();
  const [dialogoChiusura, setDialogoChiusura] = useState(null);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [insightAperto, setInsightAperto] = useState(false);
  const [preventivi] = useDatiLocaliSincronizzati(leggiPreventivi);
  const sezioneModifica = useRef(null);
  const sezioneChecklist = useRef(null);
  const sezioneMateriali = useRef(null);
  const sezioneFoto = useRef(null);
  const sezioneNote = useRef(null);
  const sezioneVarianti = useRef(null);
  const sezionePagamenti = useRef(null);
  const sezioneDocumenti = useRef(null);
  const inputFoto = useRef(null);

  const mostraAzioniDaIniziare = cantiere.stato === "Da iniziare";
  const mostraAzioniInCorso = cantiere.stato === "In corso";
  const avanzamentoChecklist =
    typeof avanzamentoProp === "number"
      ? avanzamentoProp
      : calcolaAvanzamentoChecklist(cantiere.checklist || []);
  const economico = calcolaTotaleCantiere(cantiere);
  const telefono = telefonoCantiere(cantiere);
  const variantiCantiere = useMemo(
    () => {
      void variantiTick;
      return cantiere?.id ? ottieniVarianti(cantiere.id, cantiere) : [];
    },
    [cantiere, variantiTick]
  );

  function chiediConcludiCantiere() {
    const varianti = cantiere?.id ? ottieniVarianti(cantiere.id, cantiere) : [];
    let haFirma = null;
    if (cantiere.preventivoId) {
      try {
        haFirma = Boolean(ottieniFirma(cantiere.preventivoId));
      } catch {
        haFirma = null;
      }
    }
    const esito = valutaPrerequisitiChiusuraCantiere(cantiere, {
      varianti,
      haFirma,
    });
    if (esito.ok) {
      onCompletaLavoro?.();
      return;
    }
    setDialogoChiusura(esito);
  }

  function confermaChiusuraComunque() {
    setDialogoChiusura(null);
    onCompletaLavoro?.();
  }

  const apriSezioneNote = useCallback(() => {
    scorriA(sezioneNote.current);
    const textarea = sezioneNote.current?.querySelector("textarea");
    textarea?.focus();
  }, []);

  const apriSezioneMateriali = useCallback(() => {
    scorriA(sezioneMateriali.current);
  }, []);

  const apriSezioneChecklist = useCallback(() => {
    scorriA(sezioneChecklist.current);
  }, []);

  const apriSezioneVarianti = useCallback(() => {
    scorriA(sezioneVarianti.current);
  }, []);

  const apriSezioneDocumenti = useCallback(() => {
    scorriA(sezioneDocumenti.current);
  }, []);

  const triggerAggiungiFoto = useCallback(() => {
    scorriA(sezioneFoto.current);
    inputFoto.current?.click();
  }, []);

  const gestisciAssistantAction = useCallback(
    (card, action) => {
      if (action === "dismiss") return;

      switch (card?.tipo) {
        case "documentazione":
          triggerAggiungiFoto();
          break;
        case "nota":
          apriSezioneNote();
          break;
        case "variante":
          apriSezioneVarianti();
          break;
        case "economico":
          if (cantiere.preventivoId) {
            navigate(routePreventivo(cantiere.preventivoId));
          } else {
            apriSezioneVarianti();
          }
          break;
        case "materiale":
          apriSezioneMateriali();
          break;
        case "checklist":
          apriSezioneChecklist();
          break;
        case "durata":
        default:
          apriSezioneDocumenti();
          break;
      }
    },
    [
      apriSezioneChecklist,
      apriSezioneDocumenti,
      apriSezioneMateriali,
      apriSezioneNote,
      apriSezioneVarianti,
      cantiere.preventivoId,
      navigate,
      triggerAggiungiFoto,
    ]
  );

  const loadAssistant = useMemo(() => {
    return (opzioni) => {
      const payload = getCantiereAssistant(opzioni);
      if (cantiere.preventivoId) return payload;
      return {
        ...payload,
        cards: (payload.cards || []).filter((card) => card?.tipo !== "economico"),
      };
    };
  }, [cantiere.preventivoId]);

  function toggleMaterialeAcquistato(materialeId) {
    if (typeof onAggiornaCampo !== "function") return;
    const materiali = (cantiere.materiali || []).map((item) =>
      String(item.id) === String(materialeId)
        ? { ...item, acquistato: !item.acquistato }
        : item
    );
    onAggiornaCampo({ materiali });
  }

  const nomeCantiere =
    cantiere.nome ||
    (cantiere.preventivoNumero
      ? `Cantiere ${cantiere.preventivoNumero}`
      : "Cantiere");

  return (
    <div className="pb-36">
      <Link to={ROUTES.cantieri} className="ds-back-link mb-4">
        ← Cantieri
      </Link>

      {/* Header compatto campo */}
      <header className="pro-panel-strong px-4 py-4 mb-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="section-label">Cantiere</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 leading-tight">
              {nomeCantiere}
            </h1>
            <p className="mt-1.5 text-base font-semibold text-slate-200 truncate">
              {cantiere.cliente || "Cliente non indicato"}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-100">
            {cantiere.stato || "Da iniziare"}
          </span>
        </div>

        {cantiere.indirizzo ? (
          <p className="text-slate-300 flex items-start gap-2 text-sm">
            <MapPin size={16} className="shrink-0 mt-0.5 text-yellow-200" />
            <span>{cantiere.indirizzo}</span>
          </p>
        ) : (
          <p className="text-slate-500 text-sm">Indirizzo non indicato</p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          {telefono ? (
            <a
              href={`tel:${telefono.replace(/\s+/g, "")}`}
              className="btn-primary min-h-[48px] px-3 flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Phone size={18} aria-hidden="true" />
              Chiama
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="btn-primary min-h-[48px] px-3 flex items-center justify-center gap-2 text-sm font-bold opacity-40 cursor-not-allowed"
              title="Numero non disponibile"
            >
              <Phone size={18} aria-hidden="true" />
              Chiama
            </button>
          )}
          {cantiere.indirizzo ? (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(cantiere.indirizzo)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary min-h-[48px] px-3 flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Navigation size={18} aria-hidden="true" />
              Naviga
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="btn-secondary min-h-[48px] px-3 opacity-40 cursor-not-allowed flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Navigation size={18} aria-hidden="true" />
              Naviga
            </button>
          )}
          <button
            type="button"
            onClick={() => setInsightAperto(true)}
            className="btn-secondary min-h-[48px] px-3 flex items-center justify-center gap-2 text-sm font-bold col-span-2"
          >
            <Lightbulb size={18} aria-hidden="true" />
            Idea
          </button>
        </div>

        {cantiere.preventivoId ? (
          <Link
            to={routePreventivo(cantiere.preventivoId)}
            className="btn-secondary w-full min-h-[48px] flex items-center justify-center gap-2 text-sm font-bold"
          >
            ➡️ Apri Preventivo
            {cantiere.preventivoNumero
              ? ` ${cantiere.preventivoNumero}`
              : ""}
          </Link>
        ) : null}
      </header>

      <PreventivAISuggestions
        scope="cantiere"
        cantiere={cantiere}
        cantieri={[cantiere]}
        preventivi={preventivi}
        varianti={variantiCantiere}
      />

      {/* Assistente collassabile / secondario */}
      <details className="mb-5 group">
        <summary className="list-none cursor-pointer min-h-[44px] flex items-center text-sm font-semibold text-slate-400 hover:text-slate-200">
          <span className="group-open:hidden">Mostra suggerimenti Assistente</span>
          <span className="hidden group-open:inline">Nascondi Assistente</span>
        </summary>
        <div className="mt-3">
          <CantiereAssistantPanel
            cantiere={cantiere}
            loadAssistant={loadAssistant}
            onAction={gestisciAssistantAction}
          />
        </div>
      </details>

      <CantiereOperativo
        cantiere={cantiere}
        avanzamento={avanzamentoChecklist}
        nuovaChecklist={nuovaChecklist}
        nuovoMateriale={nuovoMateriale}
        refs={{
          sezioneChecklist,
          sezioneMateriali,
          sezioneFoto,
          sezioneNote,
          inputFoto,
        }}
        onAggiornaCampo={onAggiornaCampo}
        onImpostaChecklist={onImpostaChecklist}
        onAggiungiChecklist={onAggiungiChecklist}
        onAggiornaChecklist={onAggiornaChecklist}
        onEliminaChecklist={onEliminaChecklist}
        onAggiornaCampoMateriale={onAggiornaCampoMateriale}
        onAggiungiMateriale={onAggiungiMateriale}
        onEliminaMateriale={onEliminaMateriale}
        onToggleMaterialeAcquistato={toggleMaterialeAcquistato}
        onAggiungiFoto={onAggiungiFoto}
        onEliminaFoto={onEliminaFoto}
        onApriFoto={onApriFoto}
      />

      <CantiereDiarioSection
        cantiere={cantiere}
        onAddManualNote={onAggiungiNotaDiario}
        onOpenAttachment={(attachment) =>
          onApriFoto?.({
            id: attachment.id,
            nome: attachment.alt,
            src: attachment.src,
            miniatura: attachment.thumbnail,
          })
        }
      />

      {/* 5. VARIANTI */}
      <div className="mt-5 mb-5" id="sezione-varianti">
        <CantiereVarianti
          cantiere={cantiere}
          sezioneRef={sezioneVarianti}
          refreshKey={variantiTick}
          onCreaVariante={onCreaVariante || onAggiungiVariante}
          onSincronizzaVariantePreventivo={onSincronizzaVariantePreventivo}
          onApprovaVariante={onApprovaVariante}
          onEseguiVariante={onEseguiVariante}
          onAnnullaVariante={onAnnullaVariante || onEliminaVariante}
        />
      </div>

      {/* 6. PAGAMENTI */}
      <section
        id="sezione-pagamenti"
        ref={sezionePagamenti}
        className="pro-panel p-5 mb-5 scroll-mt-24"
        aria-labelledby="pagamenti-title"
      >
        <h2 id="pagamenti-title" className="text-xl font-black mb-4">
          Pagamenti
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
            <p className="text-sm text-slate-400">Acconto</p>
            <p className="text-2xl font-black mt-1 tabular-nums">
              {formatEuro(
                normalizzaNumero(
                  cantiere.incassato ??
                    cantiere.extra?.incassato ??
                    cantiere.acconto ??
                    cantiere.extra?.acconto ??
                    0
                )
              )}
            </p>
          </div>
          <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4">
            <p className="text-sm text-slate-400">Saldo</p>
            <p className="text-2xl font-black mt-1 tabular-nums">
              {formatEuro(economico.totaleAggiornato)}
            </p>
            {economico.deltaVarianti !== 0 ? (
              <p className="text-xs text-slate-500 mt-1">
                Varianti {economico.deltaVarianti >= 0 ? "+" : ""}
                {formatEuro(economico.deltaVarianti)}
              </p>
            ) : null}
          </div>
          <div className="rounded-[14px] border border-yellow-400/20 bg-yellow-400/10 p-4">
            <p className="text-sm text-yellow-100/80">Da incassare</p>
            <p className="text-2xl font-black mt-1 tabular-nums text-yellow-100">
              {formatEuro(
                Math.max(
                  normalizzaNumero(economico.totaleAggiornato) -
                    normalizzaNumero(
                      cantiere.incassato ??
                        cantiere.extra?.incassato ??
                        cantiere.acconto ??
                        cantiere.extra?.acconto ??
                        0
                    ),
                  0
                )
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 7. DOCUMENTI */}
      <section
        id="sezione-documenti"
        ref={sezioneDocumenti}
        className="pro-panel p-5 mb-5 scroll-mt-24"
        aria-labelledby="documenti-title"
      >
        <h2 id="documenti-title" className="text-xl font-black mb-4">
          Documenti
        </h2>
        <div className="space-y-2">
          {cantiere.preventivoId ? (
            <Link
              to={routePreventivo(cantiere.preventivoId)}
              className="flex items-center justify-between gap-3 min-h-[52px] rounded-[14px] border border-white/10 bg-black/[0.14] px-4 py-3 font-bold text-white"
            >
              <span className="flex items-center gap-2">
                <ClipboardList size={18} className="text-yellow-300" />
                Preventivo {cantiere.preventivoNumero || ""}
              </span>
              <span className="text-slate-400 text-sm">Apri →</span>
            </Link>
          ) : (
            <p className="text-sm text-slate-400 py-2">
              Nessun preventivo collegato.
            </p>
          )}
          <p className="text-xs text-slate-500 px-1">
            PDF e firma cliente si gestiscono dal dettaglio preventivo.
          </p>
        </div>

        <div className="mt-4">
          <CantiereReportPanel cantiere={cantiere} />
        </div>

        {(cantiere.lavorazioniOrigine || []).length > 0 ? (
          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Lavorazioni da preventivo
            </p>
            <ul className="space-y-1.5">
              {(cantiere.lavorazioniOrigine || [])
                .slice(0, 8)
                .map((voce, index) => (
                  <li
                    key={`${voce.id || voce.nome}-${index}`}
                    className="flex justify-between gap-3 text-sm text-slate-300"
                  >
                    <span className="truncate">{voce.nome}</span>
                    <span className="shrink-0 text-slate-500">
                      {voce.quantita} {voce.unita || "cad"}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section
        id="sezione-modifica"
        ref={sezioneModifica}
        className="pro-panel p-4 mb-5 scroll-mt-24 opacity-90"
      >
        <p className="section-label mb-3">Impostazioni</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={cantiere.stato}
            onChange={(event) => onAggiornaCampo({ stato: event.target.value })}
            className="input-pro min-h-[48px]"
            aria-label="Stato cantiere"
          >
            {STATI_CANTIERE.map((stato) => (
              <option key={stato}>{stato}</option>
            ))}
          </select>
          {!confermaElimina ? (
            <button
              type="button"
              onClick={() => setConfermaElimina(true)}
              className="rounded-[14px] border border-red-400/25 bg-red-500/10 px-5 min-h-[48px] font-bold text-red-100 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Elimina
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfermaElimina(false);
                  onEliminaCantiere?.();
                }}
                className="flex-1 rounded-[14px] border border-red-400/40 bg-red-500/20 px-3 min-h-[48px] font-bold text-red-100"
              >
                Conferma
              </button>
              <button
                type="button"
                onClick={() => setConfermaElimina(false)}
                className="btn-secondary px-3 min-h-[48px] font-bold"
              >
                No
              </button>
            </div>
          )}
        </div>
      </section>

      {(mostraAzioniDaIniziare || mostraAzioniInCorso) && (
        <div className="fixed bottom-[88px] left-0 right-0 z-40 px-4 safe-bottom">
          <div className="max-w-[1120px] mx-auto pro-panel-strong p-3">
            {mostraAzioniDaIniziare ? (
              <button
                type="button"
                onClick={onIniziaLavoro}
                disabled={typeof onIniziaLavoro !== "function"}
                className="w-full btn-primary min-h-[56px] text-base font-black disabled:opacity-45"
              >
                Inizia lavoro
              </button>
            ) : (
              <button
                type="button"
                onClick={chiediConcludiCantiere}
                disabled={typeof onCompletaLavoro !== "function"}
                className="w-full btn-primary min-h-[56px] text-base font-black disabled:opacity-45"
              >
                ✅ Concludi Cantiere
              </button>
            )}
          </div>
        </div>
      )}

      {dialogoChiusura ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 safe-bottom"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chiusura-cantiere-title"
        >
          <div className="w-full max-w-md pro-panel-strong p-5 space-y-4 mb-4 sm:mb-0 ux-sheet">
            <h2
              id="chiusura-cantiere-title"
              className="text-xl font-black"
            >
              Prima di chiudere
            </h2>
            <ul className="space-y-2">
              {dialogoChiusura.mancanze.map((voce) => (
                <li
                  key={voce.id}
                  className="rounded-[12px] border border-amber-400/25 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-50"
                >
                  {voce.soloAvviso ? "⚠️ " : "• "}
                  {voce.testo}
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-400">
              Puoi comunque chiudere il cantiere.
            </p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={confermaChiusuraComunque}
                className="btn-primary min-h-[52px] font-black"
              >
                ✅ Concludi comunque
              </button>
              <button
                type="button"
                onClick={() => setDialogoChiusura(null)}
                className="btn-secondary min-h-[48px] font-bold"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <InsightRapidoSheet
        aperto={insightAperto}
        onChiudi={() => setInsightAperto(false)}
        contesto={{
          cantiereId: cantiere.id,
          cliente: cantiere.cliente,
          titolo: cantiere.nome,
        }}
        onSalva={(dati) => aggiungiInsight(dati)}
      />
    </div>
  );
}
