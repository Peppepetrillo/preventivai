import { useCallback, useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ListPlus,
  Mic,
  MicOff,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import { ROUTES } from "../../../app/routes";
import { selezionaVociAttive } from "../../listino/listinoCatalogDomain";
import { leggiClienti } from "../../../repositories/clientiRepository";
import { leggiListino } from "../../../repositories/listinoRepository";
import { useRiconoscimentoVocale } from "../../../hooks/useRiconoscimentoVocale";
import { generaBozzaPreventivoAI } from "../assistentePreventivi";
import { CONDIZIONI_DEFAULT } from "../wizard/wizardConfig";
import { formatEuro, normalizzaNumero } from "../../../utils/preventivi";
import { registraUsoLavorazione, chiaveUsoDaLavorazione } from "../utils/lavorazioniUsage";

/** Stati UI Preventivo vocale. */
const FASE = Object.freeze({
  IDLE: "idle",
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "error",
});

export default function PreventivoExpress({
  open,
  onClose,
  onApplica,
  clienteCorrente,
}) {
  const [testo, setTesto] = useState("");
  const [fase, setFase] = useState(FASE.IDLE);
  const [bozza, setBozza] = useState(null);
  const [ignorate, setIgnorate] = useState(() => new Set());
  const [errore, setErrore] = useState("");
  const testoId = useId();

  const aggiornaTestoDaVoce = useCallback((nuovoTesto) => {
    setTesto(nuovoTesto);
    setErrore("");
    setFase(FASE.IDLE);
    setBozza(null);
  }, []);

  const {
    supportato: voceSupportata,
    inAscolto,
    erroreVoce,
    richiedeRete,
    avvia,
    ferma,
    resetErrore,
  } = useRiconoscimentoVocale({
    onTesto: aggiornaTestoDaVoce,
  });

  function resetStato() {
    setTesto("");
    setFase(FASE.IDLE);
    setBozza(null);
    setIgnorate(new Set());
    setErrore("");
    resetErrore?.();
  }

  function chiudi() {
    if (inAscolto) ferma();
    resetStato();
    onClose();
  }

  function tornaAModifica() {
    setFase(FASE.IDLE);
    setBozza(null);
    setIgnorate(new Set());
    setErrore("");
  }

  async function analizza() {
    if (!testo.trim()) {
      setErrore("Scrivi o detta una richiesta prima di continuare.");
      setFase(FASE.ERROR);
      return;
    }

    if (inAscolto) ferma();
    setFase(FASE.PROCESSING);
    setErrore("");
    setBozza(null);
    setIgnorate(new Set());

    try {
      const risultato = await generaBozzaPreventivoAI({
        testo,
        clienti: leggiClienti(),
        listino: selezionaVociAttive(leggiListino()),
      });
      setBozza(risultato);
      setFase(FASE.READY);
    } catch {
      setErrore("Analisi non disponibile. Riprova o compila a mano.");
      setFase(FASE.ERROR);
    }
  }

  function ignoraVoceNonTrovata(chiave) {
    setIgnorate((prev) => {
      const next = new Set(prev);
      next.add(chiave);
      return next;
    });
  }

  function confermaBozza() {
    if (!bozza) return;

    bozza.lavorazioni?.forEach((lavorazione) => {
      registraUsoLavorazione(
        chiaveUsoDaLavorazione(lavorazione),
        lavorazione.quantita || 1
      );
    });

    onApplica({
      lavorazioni: bozza.lavorazioni || [],
      condizioni: {
        sconto: normalizzaNumero(bozza.sconto),
        iva: normalizzaNumero(bozza.iva, CONDIZIONI_DEFAULT.iva),
        validita: normalizzaNumero(bozza.validita, CONDIZIONI_DEFAULT.validita),
        pagamento: bozza.pagamento || CONDIZIONI_DEFAULT.pagamento,
        acconto: normalizzaNumero(bozza.acconto),
        note: bozza.note || testo.trim(),
      },
      cliente: bozza.cliente || clienteCorrente,
      avvisi: bozza.avvisi || [],
      riepilogo: bozza.riepilogo,
      nonTrovate: (bozza.nonTrovate || []).filter(
        (v) => !ignorate.has(v.chiave)
      ),
    });

    resetStato();
    onClose();
  }

  const nonTrovateVisibili = (bozza?.nonTrovate || []).filter(
    (v) => !ignorate.has(v.chiave)
  );
  const inElaborazione = fase === FASE.PROCESSING;
  const inAnteprima = fase === FASE.READY && bozza;

  const etichettaStatoVoce = inAscolto
    ? "Ascolto in corso…"
    : erroreVoce
      ? erroreVoce
      : voceSupportata
        ? "Tocca il microfono e parla"
        : "Dettatura non supportata: scrivi la richiesta.";

  return (
    <BottomSheet
      open={open}
      onClose={chiudi}
      title="Preventivo vocale"
      descrizione="Parla o scrivi. I prezzi arrivano solo dal tuo listino. Confermi prima di applicare."
      altezza="auto"
    >
      <div className="space-y-4" data-testid="preventivo-vocale-sheet">
        {!inAnteprima ? (
          <>
            <div className="flex flex-col items-center gap-3 py-2">
              <button
                type="button"
                onClick={inAscolto ? ferma : avvia}
                disabled={!voceSupportata || inElaborazione}
                className={`w-20 h-20 min-w-[80px] min-h-[80px] rounded-full flex items-center justify-center transition-colors duration-200 ${
                  inAscolto
                    ? "bg-red-500/25 text-red-100 ring-2 ring-red-400/50"
                    : "bg-yellow-400 text-slate-950 disabled:opacity-40"
                }`}
                aria-label={inAscolto ? "Ferma dettatura" : "Avvia dettatura"}
                aria-pressed={inAscolto}
                data-testid="preventivo-vocale-mic"
              >
                {inAscolto ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
              <p
                className={`text-sm text-center max-w-[280px] ${
                  erroreVoce ? "text-amber-200" : "text-slate-400"
                }`}
                role="status"
                data-testid="preventivo-vocale-stato"
              >
                {etichettaStatoVoce}
              </p>
              {richiedeRete && voceSupportata ? (
                <p className="text-xs text-slate-500 text-center">
                  La dettatura richiede connessione. Offline: digita la richiesta.
                </p>
              ) : null}
            </div>

            <label htmlFor={testoId} className="block">
              <span className="text-sm text-slate-400">Richiesta</span>
              <textarea
                id={testoId}
                value={testo}
                onChange={(event) => {
                  setTesto(event.target.value);
                  setErrore("");
                  if (fase === FASE.ERROR) setFase(FASE.IDLE);
                }}
                rows={4}
                placeholder="Es: 80 punti luce, 60 prese, quadro nuovo, 30 metri canalina, videocitofono."
                className="mt-2 input-pro resize-none"
                disabled={inElaborazione}
                data-testid="preventivo-vocale-testo"
              />
            </label>

            {errore ? (
              <p className="text-sm text-red-300" role="alert">
                {errore}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={chiudi}
                className="btn-secondary flex-1 min-h-[48px]"
                disabled={inElaborazione}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={analizza}
                disabled={inElaborazione}
                className="flex-[1.4] btn-primary min-h-[48px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="preventivo-vocale-analizza"
              >
                <Sparkles size={18} aria-hidden="true" />
                {inElaborazione ? "Analizzo…" : "Analizza"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="pro-panel p-3 space-y-2 border-yellow-300/25"
              data-testid="preventivo-vocale-anteprima"
              role="status"
            >
              <p className="text-sm font-semibold text-yellow-100">
                Bozza dal tuo listino
              </p>
              <p className="text-xs text-slate-400">
                {(bozza.riepilogo?.vociTrovate ?? 0)} lavorazioni · totale{" "}
                {formatEuro(bozza.riepilogo?.totale ?? 0)}
                {bozza.cliente ? ` · ${bozza.cliente}` : ""}
              </p>
              {bozza.avvisi?.length ? (
                <ul className="text-xs text-amber-200/90 list-disc pl-4 space-y-0.5">
                  {bozza.avvisi.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {(bozza.lavorazioni || []).length > 0 ? (
              <ul className="space-y-2" data-testid="preventivo-vocale-match">
                {bozza.lavorazioni.map((lav) => (
                  <li
                    key={lav.id}
                    className="flex items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-black/20 px-3 py-3 min-h-[52px]"
                  >
                    <div className="min-w-0">
                      <p className="ds-text-primary truncate">{lav.nome}</p>
                      <p className="ds-text-secondary text-xs mt-0.5">
                        {lav.quantita} {lav.unita || "cad"} ·{" "}
                        {formatEuro(lav.prezzo)}
                        {lav.prezzoDalListino ? " (listino)" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                Nessuna voce riconosciuta nel listino.
              </p>
            )}

            {nonTrovateVisibili.length > 0 ? (
              <div className="space-y-2" data-testid="preventivo-vocale-non-trovate">
                <p className="text-sm font-semibold text-amber-100">
                  Non trovate nel listino
                </p>
                {nonTrovateVisibili.map((voce) => (
                  <div
                    key={voce.chiave}
                    className="rounded-[16px] border border-amber-400/25 bg-amber-400/8 p-3 space-y-2"
                  >
                    <p className="text-sm text-amber-50">{voce.messaggio}</p>
                    <p className="text-xs text-slate-400">
                      Quantità richiesta: {voce.quantita}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={ROUTES.listino}
                        className="btn-secondary min-h-[44px] px-3 text-sm inline-flex items-center gap-1.5"
                        onClick={chiudi}
                      >
                        <ListPlus size={16} aria-hidden="true" />
                        Aggiungi al listino
                      </Link>
                      <button
                        type="button"
                        className="btn-secondary min-h-[44px] px-3 text-sm inline-flex items-center gap-1.5"
                        onClick={tornaAModifica}
                      >
                        <Pencil size={16} aria-hidden="true" />
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="btn-secondary min-h-[44px] px-3 text-sm inline-flex items-center gap-1.5"
                        onClick={() => ignoraVoceNonTrovata(voce.chiave)}
                        data-testid={`ignora-non-trovata-${voce.chiave}`}
                      >
                        <X size={16} aria-hidden="true" />
                        Ignora
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={tornaAModifica}
                className="btn-secondary flex-1 min-h-[48px] inline-flex items-center justify-center gap-1.5"
                data-testid="preventivo-vocale-modifica"
              >
                <Pencil size={16} aria-hidden="true" />
                Modifica testo
              </button>
              <button
                type="button"
                onClick={confermaBozza}
                className="flex-[1.4] btn-primary min-h-[48px] font-semibold inline-flex items-center justify-center gap-1.5"
                data-testid="preventivo-vocale-conferma"
              >
                <Check size={18} aria-hidden="true" />
                Conferma bozza
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
