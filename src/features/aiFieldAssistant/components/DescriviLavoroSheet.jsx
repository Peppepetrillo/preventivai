/**
 * Sheet: descrivi il lavoro (testo/voce) → preview lavorazioni → conferma.
 * Nessun salvataggio senza conferma utente.
 */

import { useCallback, useId, useRef, useState } from "react";
import { Mic, MicOff, Sparkles, Check, Pencil } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import { useRiconoscimentoVocale } from "../../../hooks/useRiconoscimentoVocale";
import { selezionaVociAttive } from "../../listino/listinoCatalogDomain";
import { leggiListino } from "../../../repositories/listinoRepository";
import {
  elaboraLavorazioniDaTesto,
  payloadLavorazioniDaConferma,
} from "../fieldAssistantService";

const FASE = Object.freeze({
  IDLE: "idle",
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "error",
});

export default function DescriviLavoroSheet({
  open,
  onClose,
  onConferma,
}) {
  const [testo, setTesto] = useState("");
  const [fase, setFase] = useState(FASE.IDLE);
  const [preview, setPreview] = useState(null);
  const [voci, setVoci] = useState([]);
  const [errore, setErrore] = useState("");
  const testoId = useId();
  const busyRef = useRef(false);

  const onTestoVoce = useCallback((t) => {
    setTesto(t);
    setErrore("");
    setFase(FASE.IDLE);
    setPreview(null);
  }, []);

  const {
    supportato: voceSupportata,
    inAscolto,
    erroreVoce,
    richiedeRete,
    avvia,
    ferma,
    resetErrore,
  } = useRiconoscimentoVocale({ onTesto: onTestoVoce });

  function reset() {
    busyRef.current = false;
    setTesto("");
    setFase(FASE.IDLE);
    setPreview(null);
    setVoci([]);
    setErrore("");
    resetErrore?.();
  }

  function chiudi() {
    if (inAscolto) ferma();
    reset();
    onClose?.();
  }

  async function genera() {
    if (busyRef.current) return;
    if (!testo.trim()) {
      setErrore("Scrivi o detta cosa devi realizzare.");
      setFase(FASE.ERROR);
      return;
    }
    if (inAscolto) ferma();
    busyRef.current = true;
    setFase(FASE.PROCESSING);
    setErrore("");
    try {
      const listino = selezionaVociAttive(leggiListino());
      const risultato = await elaboraLavorazioniDaTesto(testo, {
        listino,
        usaProvider: true,
      });
      if (!risultato.ok) {
        setErrore(risultato.messaggio || "Non riesco a elaborare il contenuto.");
        setFase(FASE.ERROR);
        return;
      }
      setPreview(risultato);
      setVoci(
        (risultato.voci || []).map((v) => ({
          ...v,
          escluso: false,
          matchScelto:
            v.match?.stato === "match" ? v.match.candidato : null,
        }))
      );
      setFase(FASE.READY);
    } catch {
      setErrore("Non riesco a elaborare il contenuto.");
      setFase(FASE.ERROR);
    } finally {
      busyRef.current = false;
    }
  }

  function conferma() {
    if (busyRef.current) return;
    const payload = payloadLavorazioniDaConferma(voci);
    if (!payload.length) {
      setErrore("Seleziona almeno una lavorazione con listino abbinato.");
      return;
    }
    busyRef.current = true;
    try {
      onConferma?.(payload, { testoOriginale: testo, preview });
      chiudi();
    } finally {
      busyRef.current = false;
    }
  }

  const vociAttive = voci.filter((v) => !v.escluso);
  const nAmbigue = vociAttive.filter(
    (v) => !v.matchScelto && v.match?.stato === "ambigui"
  ).length;
  const nMancanti = vociAttive.filter(
    (v) => !v.matchScelto && v.match?.stato !== "ambigui"
  ).length;

  return (
    <BottomSheet
      open={open}
      onClose={chiudi}
      title="Assistente PreventivAI"
    >
      <div className="space-y-4 px-1 pb-2">
        {fase !== FASE.READY ? (
          <>
            <p className="ds-text-secondary">
              Scrivi o detta cosa devi realizzare. Controlli prima di aggiungere.
            </p>
            <label className="sr-only" htmlFor={testoId}>
              Descrizione lavoro
            </label>
            <textarea
              id={testoId}
              data-testid="descrivi-lavoro-testo"
              className="ds-input w-full min-h-[120px] p-3"
              placeholder="Es. Rifacimento impianto 90 mq, quadro 24 moduli, 70 prese e punti luce…"
              value={testo}
              onChange={(e) => {
                setTesto(e.target.value);
                setErrore("");
              }}
            />
            <div className="flex gap-2">
              {voceSupportata ? (
                <button
                  type="button"
                  className="btn-secondary flex-1 min-h-[48px] inline-flex items-center justify-center gap-2"
                  data-testid="descrivi-lavoro-mic"
                  onClick={() => (inAscolto ? ferma() : avvia())}
                >
                  {inAscolto ? <MicOff size={18} /> : <Mic size={18} />}
                  {inAscolto ? "Stop" : "Parla"}
                </button>
              ) : null}
              <button
                type="button"
                className="btn-primary flex-[2] min-h-[48px] inline-flex items-center justify-center gap-2"
                data-testid="descrivi-lavoro-genera"
                disabled={fase === FASE.PROCESSING}
                onClick={genera}
              >
                <Sparkles size={18} aria-hidden="true" />
                {fase === FASE.PROCESSING
                  ? "Sto riconoscendo…"
                  : "Genera lavorazioni"}
              </button>
            </div>
            {richiedeRete ? (
              <p className="ds-text-muted text-xs">
                Il microfono richiede rete. Puoi scrivere a mano.
              </p>
            ) : null}
            {erroreVoce || errore ? (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {errore || erroreVoce}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div data-testid="descrivi-lavoro-riepilogo">
              <p className="ds-card-title">
                Ho capito — {vociAttive.length} element
                {vociAttive.length === 1 ? "o" : "i"}
              </p>
              <p className="ds-text-secondary mt-1">
                {preview?.confidenceEtichetta || "Controlla prima di aggiungere."}
              </p>
              {nAmbigue + nMancanti > 0 ? (
                <p className="text-sm text-[var(--warning)] mt-2 font-medium">
                  {nAmbigue + nMancanti} elemento
                  {nAmbigue + nMancanti === 1 ? "" : "i"} da verificare
                </p>
              ) : null}
            </div>
            {preview?.avvisoAi ? (
              <p className="text-xs text-[var(--warning)]">
                {preview.avvisoAi}
              </p>
            ) : null}
            <p className="section-label">Lavorazioni riconosciute</p>
            <ul className="space-y-2" data-testid="descrivi-lavoro-preview">
              {voci.map((v, idx) => {
                const stato = v.matchScelto
                  ? "ok"
                  : v.match?.stato === "ambigui"
                    ? "ambigui"
                    : "manca";
                return (
                  <li
                    key={`${v.descrizione}-${idx}`}
                    className={`pro-panel p-3 space-y-2 ${v.escluso ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="ds-text-primary font-semibold">
                          {v.quantita} ×{" "}
                          {v.descrizioneNormalizzata || v.descrizione}
                        </p>
                        {stato === "ok" ? (
                          <p className="text-xs text-[var(--success)] mt-1">
                            Listino: {v.matchScelto.nome} ·{" "}
                            {v.matchScelto.prezzo} €
                          </p>
                        ) : stato === "ambigui" ? (
                          <p className="text-xs text-[var(--warning)] mt-1">
                            Possibili corrispondenze
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Non trovato nel listino
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--text-secondary)] min-h-[48px] px-2"
                        onClick={() =>
                          setVoci((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, escluso: !x.escluso } : x
                            )
                          )
                        }
                      >
                        {v.escluso ? "Ripristina" : "Escludi"}
                      </button>
                    </div>
                    {stato === "ambigui" ? (
                      <div className="flex flex-col gap-1.5">
                        {(v.match?.candidati || []).slice(0, 3).map((c) => (
                          <button
                            key={c.id || c.listinoId}
                            type="button"
                            className="btn-secondary min-h-[48px] text-left text-sm px-3"
                            onClick={() =>
                              setVoci((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, matchScelto: c } : x
                                )
                              )
                            }
                          >
                            {c.nome} · {c.prezzo} €
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary flex-1 min-h-[48px] inline-flex items-center justify-center gap-2"
                onClick={() => {
                  setFase(FASE.IDLE);
                  setPreview(null);
                }}
              >
                <Pencil size={16} />
                Modifica
              </button>
              <button
                type="button"
                className="btn-primary flex-[2] min-h-[48px] inline-flex items-center justify-center gap-2"
                data-testid="descrivi-lavoro-conferma"
                onClick={conferma}
              >
                <Check size={18} />
                Conferma e aggiungi
              </button>
            </div>
            {errore ? (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {errore}
              </p>
            ) : null}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
