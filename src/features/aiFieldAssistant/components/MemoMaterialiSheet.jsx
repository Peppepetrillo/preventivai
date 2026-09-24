/**
 * Memo vocale materiali — trascrizione + estrazione + match catalogo + conferma.
 * Nessun salvataggio senza conferma. Nessun prezzo inventato.
 */

import { useCallback, useId, useRef, useState } from "react";
import { Mic, MicOff, Check, Pencil, Package } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import { useRiconoscimentoVocale } from "../../../hooks/useRiconoscimentoVocale";
import {
  elaboraMaterialiDaTesto,
  payloadMaterialiDaConferma,
} from "../fieldAssistantService";

const FASE = Object.freeze({
  IDLE: "idle",
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "error",
});

export default function MemoMaterialiSheet({
  open,
  onClose,
  onConferma,
}) {
  const [testo, setTesto] = useState("");
  const [fase, setFase] = useState(FASE.IDLE);
  const [preview, setPreview] = useState(null);
  const [righe, setRighe] = useState([]);
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
    setRighe([]);
    setErrore("");
    resetErrore?.();
  }

  function chiudi() {
    if (inAscolto) ferma();
    reset();
    onClose?.();
  }

  async function elabora() {
    if (busyRef.current) return;
    if (!testo.trim()) {
      setErrore("Detta o scrivi i materiali da aggiungere.");
      setFase(FASE.ERROR);
      return;
    }
    if (inAscolto) ferma();
    busyRef.current = true;
    setFase(FASE.PROCESSING);
    setErrore("");
    try {
      const risultato = await elaboraMaterialiDaTesto(testo, {
        usaProvider: true,
      });
      if (!risultato.ok) {
        setErrore(risultato.messaggio || "Non riesco a elaborare il contenuto.");
        setFase(FASE.ERROR);
        return;
      }
      const tutte = [
        ...(risultato.materiali || []),
        ...(risultato.materialiAmbigui || []),
      ];
      setPreview(risultato);
      setRighe(
        tutte.map((m) => ({
          ...m,
          escluso: false,
          matchScelto:
            m.match?.stato === "match" ? m.match.candidato : null,
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
    const daSalvare = righe.filter((r) => !r.escluso);
    if (!daSalvare.length) {
      setErrore("Nessun materiale da aggiungere.");
      return;
    }
    busyRef.current = true;
    try {
      const payload = payloadMaterialiDaConferma(daSalvare);
      onConferma?.(payload, {
        trascrizione: preview?.trascrizione || testo,
        preview,
      });
      chiudi();
    } finally {
      busyRef.current = false;
    }
  }

  const attive = righe.filter((r) => !r.escluso);
  const nDaVerificare = attive.filter(
    (r) =>
      !r.matchScelto ||
      r.match?.stato === "ambigui" ||
      r.ambiguo ||
      r.match?.stato === "non_trovato"
  ).length;

  return (
    <BottomSheet
      open={open}
      onClose={chiudi}
      title="Memo materiali"
    >
      <div className="space-y-4 px-1 pb-2">
        {fase !== FASE.READY ? (
          <>
            <p className="ds-text-secondary">
              Parla normalmente. Poi controlli trascrizione e materiali prima di
              aggiungere al lavoro.
            </p>
            <label className="sr-only" htmlFor={testoId}>
              Memo materiali
            </label>
            <textarea
              id={testoId}
              data-testid="memo-materiali-testo"
              className="ds-input w-full min-h-[120px] p-3"
              placeholder="Es. 50 metri di cavo FG16 3×2,5, due scatole 503, 10 magnetotermici C16…"
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
                  data-testid="memo-materiali-mic"
                  onClick={() => (inAscolto ? ferma() : avvia())}
                >
                  {inAscolto ? <MicOff size={18} /> : <Mic size={18} />}
                  {inAscolto ? "Stop" : "Memo"}
                </button>
              ) : null}
              <button
                type="button"
                className="btn-primary flex-[2] min-h-[48px] inline-flex items-center justify-center gap-2"
                data-testid="memo-materiali-elabora"
                disabled={fase === FASE.PROCESSING}
                onClick={elabora}
              >
                <Package size={18} aria-hidden="true" />
                {fase === FASE.PROCESSING
                  ? "Sto riconoscendo…"
                  : "Riconosci materiali"}
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
            <div>
              <p className="section-label">Trascrizione</p>
              <p
                className="ds-text-secondary mt-1 whitespace-pre-wrap"
                data-testid="memo-materiali-trascrizione"
              >
                {preview?.trascrizione || testo}
              </p>
            </div>
            <div data-testid="memo-materiali-riepilogo">
              <p className="ds-card-title">
                Ho capito — {attive.length} element
                {attive.length === 1 ? "o" : "i"}
              </p>
              <p className="ds-text-secondary mt-1">
                {preview?.confidenceEtichetta || "Controlla prima di aggiungere."}
              </p>
              {nDaVerificare > 0 ? (
                <p className="text-sm text-[var(--warning)] mt-2 font-medium">
                  ⚠️ {nDaVerificare} elemento
                  {nDaVerificare === 1 ? "" : "i"} da verificare
                </p>
              ) : null}
            </div>
            {preview?.avvisoAi ? (
              <p className="text-xs text-[var(--warning)]">{preview.avvisoAi}</p>
            ) : null}
            <p className="section-label">Materiali riconosciuti</p>
            <ul className="space-y-2" data-testid="memo-materiali-preview">
              {righe.map((r, idx) => {
                const stato = r.matchScelto
                  ? "ok"
                  : r.match?.stato === "ambigui"
                    ? "ambigui"
                    : r.ambiguo
                      ? "ambiguo"
                      : "manca";
                return (
                  <li
                    key={`${r.descrizione}-${idx}`}
                    className={`pro-panel p-3 space-y-2 ${r.escluso ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="ds-text-primary font-semibold">
                          {r.quantita} {r.unita} —{" "}
                          {r.descrizioneNormalizzata || r.descrizione}
                        </p>
                        {stato === "ok" ? (
                          <p className="text-xs text-[var(--success)] mt-1">
                            Catalogo: {r.matchScelto.nome}
                          </p>
                        ) : stato === "ambigui" ? (
                          <p className="text-xs text-[var(--warning)] mt-1">
                            Possibili corrispondenze
                          </p>
                        ) : stato === "ambiguo" ? (
                          <p className="text-xs text-[var(--warning)] mt-1">
                            {r.note || "Mi manca un'informazione"}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Materiale non trovato nel catalogo
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--text-secondary)] min-h-[48px] px-2"
                        onClick={() =>
                          setRighe((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, escluso: !x.escluso } : x
                            )
                          )
                        }
                      >
                        {r.escluso ? "Ripristina" : "Escludi"}
                      </button>
                    </div>
                    {stato === "ambigui" ? (
                      <div className="flex flex-col gap-1.5">
                        {(r.match?.candidati || []).slice(0, 3).map((c) => (
                          <button
                            key={c.varianteId || c.nome}
                            type="button"
                            className="btn-secondary min-h-[48px] text-left text-sm px-3"
                            onClick={() =>
                              setRighe((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, matchScelto: c } : x
                                )
                              )
                            }
                          >
                            Abbina: {c.nome}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="text-xs font-semibold text-[var(--text-secondary)] min-h-[48px]"
                          onClick={() =>
                            setRighe((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      matchScelto: {
                                        nome: x.descrizione,
                                        unita: x.unita,
                                      },
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          Lascia senza abbinamento
                        </button>
                      </div>
                    ) : stato === "manca" || stato === "ambiguo" ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--primary)] min-h-[48px]"
                        onClick={() =>
                          setRighe((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    matchScelto: {
                                      nome: x.descrizione,
                                      unita: x.unita,
                                    },
                                  }
                                : x
                            )
                          )
                        }
                      >
                        Lascia senza abbinamento
                      </button>
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
                data-testid="memo-materiali-conferma"
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
