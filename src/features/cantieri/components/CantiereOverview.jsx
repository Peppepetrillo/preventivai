import { useCallback, useMemo, useRef } from "react";
import {
  Camera,
  ClipboardList,
  MapPin,
  Package,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ROUTES, routePreventivo } from "../../../app/routes";
import { getCantiereAssistant } from "../../../services/assistantService";
import { formatEuro, normalizzaNumero } from "../../../utils/preventivi";
import { calcolaAvanzamentoChecklist } from "../cantieriDomain";
import CantiereAssistantPanel from "./CantiereAssistantPanel";
import CantiereOperativo from "./CantiereOperativo";

function OverviewCard({
  icon: Icon,
  titolo,
  valore,
  descrizione,
  azione,
  onAzione,
  disabled = false,
}) {
  const haAzione = typeof onAzione === "function" && azione;

  return (
    <section className="pro-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-[14px] bg-yellow-400/10 text-yellow-200 flex items-center justify-center shrink-0">
              <Icon size={20} />
            </div>
            <h3 className="text-lg font-black">{titolo}</h3>
          </div>

          <p className="text-3xl font-black tracking-tight">{valore}</p>
          {descrizione ? (
            <p className="text-sm text-slate-400 mt-2">{descrizione}</p>
          ) : null}
        </div>

        {haAzione ? (
          <button
            type="button"
            onClick={onAzione}
            disabled={disabled}
            className="btn-secondary px-4 py-3 shrink-0 min-h-[48px] disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {azione}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function calcolaTotaleLavorazioni(lavorazioni = []) {
  return lavorazioni.reduce(
    (acc, item) =>
      acc + normalizzaNumero(item.prezzo) * normalizzaNumero(item.quantita),
    0
  );
}

function scorriA(elemento) {
  if (!elemento) return;
  elemento.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Dettaglio ufficiale del cantiere (overview + sezioni operative).
 * Tutte le CTA e i suggerimenti Assistant devono avere un'azione reale.
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
  onEliminaCantiere,
  onIniziaLavoro,
  onCompletaLavoro,
}) {
  const navigate = useNavigate();
  const sezioneModifica = useRef(null);
  const sezioneChecklist = useRef(null);
  const sezioneMateriali = useRef(null);
  const sezioneFoto = useRef(null);
  const sezioneNote = useRef(null);
  const inputFoto = useRef(null);

  const lavorazioni = cantiere.lavorazioniOrigine || [];
  const numeroLavorazioni = lavorazioni.length;
  const totalePreventivo = calcolaTotaleLavorazioni(lavorazioni);
  const dataCreazione = cantiere.dataCreazione || cantiere.creatoIl || "—";
  const mostraAzioniDaIniziare = cantiere.stato === "Da iniziare";
  const mostraAzioniInCorso = cantiere.stato === "In corso";
  const numeroFoto = Array.isArray(cantiere.foto) ? cantiere.foto.length : 0;
  const numeroMateriali = Array.isArray(cantiere.materiali)
    ? cantiere.materiali.length
    : 0;
  const avanzamentoChecklist =
    typeof avanzamentoProp === "number"
      ? avanzamentoProp
      : calcolaAvanzamentoChecklist(cantiere.checklist || []);

  const apriSezioneFoto = useCallback(() => {
    scorriA(sezioneFoto.current);
  }, []);

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

  const apriSezioneLavorazioni = useCallback(() => {
    scorriA(document.getElementById("sezione-lavorazioni"));
  }, []);

  const apriSezioneModifica = useCallback(() => {
    scorriA(sezioneModifica.current);
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
        case "economico":
          if (cantiere.preventivoId) {
            navigate(routePreventivo(cantiere.preventivoId));
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
          apriSezioneLavorazioni();
          break;
      }
    },
    [
      apriSezioneChecklist,
      apriSezioneLavorazioni,
      apriSezioneMateriali,
      apriSezioneNote,
      cantiere.preventivoId,
      navigate,
      triggerAggiungiFoto,
    ]
  );

  // "Segna saldo" richiede un preventivo collegato: altrimenti la card non viene mostrata.
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

  return (
    <div className="pb-36">
      <Link
        to={ROUTES.cantieri}
        className="text-slate-400 inline-flex items-center gap-2 mb-5"
      >
        ← Cantieri
      </Link>

      <header className="pro-panel-strong p-6 mb-6 space-y-4">
        <div>
          <p className="section-label">Cantiere</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
            {cantiere.cliente || "Cliente non indicato"}
          </h1>
        </div>

        {cantiere.indirizzo ? (
          <p className="text-slate-300 flex items-start gap-2 text-base">
            <MapPin size={18} className="shrink-0 mt-0.5 text-yellow-200" />
            <span>{cantiere.indirizzo}</span>
          </p>
        ) : (
          <p className="text-slate-500 text-sm">Indirizzo non indicato</p>
        )}

        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-100">
            {cantiere.stato || "Da iniziare"}
          </span>
          <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
            Creato il {dataCreazione}
          </span>
        </div>

        {cantiere.nome ? (
          <p className="text-sm text-slate-400">{cantiere.nome}</p>
        ) : null}
      </header>

      <div className="mb-6">
        <CantiereAssistantPanel
          cantiere={cantiere}
          loadAssistant={loadAssistant}
          onAction={gestisciAssistantAction}
        />
      </div>

      <div className="space-y-4 mb-6">
        <OverviewCard
          icon={Wrench}
          titolo="Lavorazioni"
          valore={`${numeroLavorazioni} ${numeroLavorazioni === 1 ? "lavorazione" : "lavorazioni"}`}
          descrizione={`Totale preventivo ${formatEuro(totalePreventivo)}`}
          azione="Visualizza"
          onAzione={apriSezioneLavorazioni}
        />

        <OverviewCard
          icon={Package}
          titolo="Materiali"
          valore={`${numeroMateriali} ${numeroMateriali === 1 ? "elemento" : "elementi"}`}
          azione="Gestisci"
          onAzione={apriSezioneMateriali}
        />

        <OverviewCard
          icon={Camera}
          titolo="Foto"
          valore={`${numeroFoto} ${numeroFoto === 1 ? "fotografia" : "fotografie"}`}
          azione="Apri"
          onAzione={apriSezioneFoto}
        />

        <OverviewCard
          icon={ClipboardList}
          titolo="Checklist"
          valore={`${avanzamentoChecklist}%`}
          descrizione={
            avanzamentoChecklist === 0
              ? "Nessuna attività completata"
              : `Avanzamento checklist ${avanzamentoChecklist}%`
          }
          azione="Apri"
          onAzione={apriSezioneChecklist}
        />
      </div>

      <CantiereOperativo
        cantiere={cantiere}
        avanzamento={avanzamentoChecklist}
        nuovaChecklist={nuovaChecklist}
        nuovoMateriale={nuovoMateriale}
        refs={{
          sezioneModifica,
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
        onAggiungiFoto={onAggiungiFoto}
        onEliminaFoto={onEliminaFoto}
        onApriFoto={onApriFoto}
        onEliminaCantiere={onEliminaCantiere}
      />

      {(mostraAzioniDaIniziare || mostraAzioniInCorso) && (
        <div className="fixed bottom-[88px] left-0 right-0 z-40 px-4 safe-bottom">
          <div className="max-w-[1120px] mx-auto pro-panel-strong p-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={apriSezioneModifica}
              className="btn-secondary min-h-[56px] text-base font-black flex items-center justify-center gap-2"
            >
              ✏️ Modifica
            </button>

            {mostraAzioniDaIniziare ? (
              <button
                type="button"
                onClick={onIniziaLavoro}
                disabled={typeof onIniziaLavoro !== "function"}
                className="btn-primary min-h-[56px] text-base font-black flex items-center justify-center gap-2 disabled:opacity-45"
              >
                ▶️ Inizia lavoro
              </button>
            ) : (
              <button
                type="button"
                onClick={onCompletaLavoro}
                disabled={typeof onCompletaLavoro !== "function"}
                className="btn-primary min-h-[56px] text-base font-black flex items-center justify-center gap-2 disabled:opacity-45"
              >
                ✅ Concludi lavoro
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
