import { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  FileImage,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Replace,
  Trash2,
} from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import PdfAnteprima from "../../../components/PdfAnteprima";
import CantiereFotoViewer from "./CantiereFotoViewer";
import {
  elencaProgettiElettrici,
  formatDimensioniProgetto,
  risolviUrlProgettoElettrico,
  suggerisciNomeProgetto,
  TIPI_PROGETTO,
  validaFileProgetto,
} from "../services/progettoElettricoService";

/**
 * Sezione Progetti elettrici — 0→N documenti per cantiere.
 * Camera via input capture=environment (stesso pattern foto cantiere).
 */
export default function ProgettoElettricoSection({
  cantiereId,
  progetti,
  cantiere,
  busy = false,
  messaggio = "",
  onAggiungi,
  onSostituisci,
  onElimina,
  onRinomina,
}) {
  const lista = Array.isArray(progetti)
    ? progetti
    : elencaProgettiElettrici(cantiere);

  const [sheetScelta, setSheetScelta] = useState(false);
  const [sheetMenu, setSheetMenu] = useState(false);
  const [sheetNome, setSheetNome] = useState(false);
  const [sheetRinomina, setSheetRinomina] = useState(false);
  const [modoFile, setModoFile] = useState("aggiungi");
  const [progettoAttivo, setProgettoAttivo] = useState(null);
  const [fileInAttesa, setFileInAttesa] = useState(null);
  const [tipoInAttesa, setTipoInAttesa] = useState(null);
  const [nomeBozza, setNomeBozza] = useState("");
  const [nomeRinomina, setNomeRinomina] = useState("");
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [viewerImg, setViewerImg] = useState(null);
  const [viewerPdf, setViewerPdf] = useState(null);
  const [erroreLocale, setErroreLocale] = useState("");
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  const inputPdf = useRef(null);
  const inputImg = useRef(null);
  const inputCamera = useRef(null);
  const titleId = useId();
  const revokeRef = useRef(null);
  const cantiereIdRef = useRef(cantiereId);

  useEffect(() => {
    cantiereIdRef.current = cantiereId;
  }, [cantiereId]);

  // Cambio cantiere: chiudi overlay e annulla bozze (niente leak A→B).
  useEffect(() => {
    setSheetScelta(false);
    setSheetMenu(false);
    setSheetNome(false);
    setSheetRinomina(false);
    setProgettoAttivo(null);
    setFileInAttesa(null);
    setTipoInAttesa(null);
    setNomeBozza("");
    setNomeRinomina("");
    setConfermaElimina(false);
    setErroreLocale("");
    setSalvataggioInCorso(false);
    if (revokeRef.current) {
      revokeRef.current();
      revokeRef.current = null;
    }
    setViewerImg(null);
    setViewerPdf(null);
  }, [cantiereId]);

  useEffect(() => {
    return () => {
      if (revokeRef.current) {
        revokeRef.current();
        revokeRef.current = null;
      }
    };
  }, []);

  function pulisciViewer() {
    if (revokeRef.current) {
      revokeRef.current();
      revokeRef.current = null;
    }
    setViewerImg(null);
    setViewerPdf(null);
  }

  function apriScelta(modo, progetto = null) {
    if (busy || salvataggioInCorso) return;
    setModoFile(modo);
    setProgettoAttivo(progetto);
    setErroreLocale("");
    setSheetMenu(false);
    setSheetScelta(true);
  }

  function scegliPdf() {
    setSheetScelta(false);
    requestAnimationFrame(() => inputPdf.current?.click());
  }

  function scegliImg() {
    setSheetScelta(false);
    requestAnimationFrame(() => inputImg.current?.click());
  }

  function scattaFoto() {
    setSheetScelta(false);
    requestAnimationFrame(() => inputCamera.current?.click());
  }

  function onFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validazione = validaFileProgetto(file);
    if (!validazione.ok) {
      setErroreLocale(validazione.errore);
      return;
    }

    setErroreLocale("");
    setFileInAttesa(file);
    setTipoInAttesa(validazione.tipo);
    setNomeBozza(suggerisciNomeProgetto(file, validazione.tipo));
    setSheetNome(true);
  }

  async function confermaNome() {
    if (!fileInAttesa || salvataggioInCorso || busy) return;
    const idAlClick = cantiereIdRef.current;
    setSalvataggioInCorso(true);
    setErroreLocale("");
    try {
      const opzioni = { nome: nomeBozza };
      let esito;
      if (modoFile === "sostituisci") {
        if (!progettoAttivo?.id) {
          setErroreLocale("Progetto non trovato.");
          return;
        }
        esito = await onSostituisci?.(fileInAttesa, {
          ...opzioni,
          progettoId: progettoAttivo.id,
        });
      } else {
        esito = await onAggiungi?.(fileInAttesa, opzioni);
      }
      if (String(cantiereIdRef.current) !== String(idAlClick)) {
        return;
      }
      if (esito && esito.ok === false) {
        setErroreLocale(esito.errore || "Operazione non riuscita.");
        return;
      }
      setSheetNome(false);
      setFileInAttesa(null);
      setTipoInAttesa(null);
      setNomeBozza("");
      setProgettoAttivo(null);
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  function annullaNome() {
    if (salvataggioInCorso) return;
    setSheetNome(false);
    setFileInAttesa(null);
    setTipoInAttesa(null);
    setNomeBozza("");
    if (modoFile !== "sostituisci") {
      setProgettoAttivo(null);
    }
  }

  async function apriProgetto(progetto) {
    if (busy || salvataggioInCorso || !progetto) return;
    setErroreLocale("");
    pulisciViewer();
    const esito = await risolviUrlProgettoElettrico(progetto);
    if (!esito.ok) {
      setErroreLocale(esito.errore || "Impossibile aprire il progetto.");
      return;
    }
    revokeRef.current = esito.revoke;
    if (progetto.tipo === TIPI_PROGETTO.pdf) {
      setViewerPdf({ url: esito.url, nome: progetto.nome });
    } else {
      setViewerImg({ src: esito.url, titolo: progetto.nome });
    }
  }

  function apriMenu(progetto) {
    if (busy || salvataggioInCorso) return;
    setErroreLocale("");
    setProgettoAttivo(progetto);
    setSheetMenu(true);
  }

  function apriRinomina() {
    if (!progettoAttivo) return;
    setSheetMenu(false);
    setNomeRinomina(progettoAttivo.nome || "");
    setSheetRinomina(true);
  }

  async function confermaRinomina() {
    if (!progettoAttivo?.id || salvataggioInCorso || busy) return;
    const idAlClick = cantiereIdRef.current;
    setSalvataggioInCorso(true);
    setErroreLocale("");
    try {
      const esito = await onRinomina?.(progettoAttivo.id, nomeRinomina);
      if (String(cantiereIdRef.current) !== String(idAlClick)) return;
      if (esito && esito.ok === false) {
        setErroreLocale(esito.errore || "Operazione non riuscita.");
        return;
      }
      setSheetRinomina(false);
      setProgettoAttivo(null);
      setNomeRinomina("");
    } finally {
      setSalvataggioInCorso(false);
    }
  }

  const haProgetti = lista.length > 0;
  const bloccato = busy || salvataggioInCorso;
  const titoloSheetScelta =
    modoFile === "sostituisci" ? "Sostituisci progetto" : "Aggiungi progetto";

  return (
    <section
      id="sezione-progetto-elettrico"
      className="pro-panel p-5 mb-5 scroll-mt-24"
      aria-labelledby={titleId}
      data-testid="progetto-elettrico-section"
      data-cantiere-id={String(cantiereId ?? "")}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="ds-card-title">
          Progetti elettrici
        </h2>
        {haProgetti ? (
          <button
            type="button"
            className="btn-secondary min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 shrink-0 text-sm font-semibold disabled:opacity-50"
            data-testid="progetto-elettrico-aggiungi"
            disabled={bloccato}
            onClick={() => apriScelta("aggiungi")}
          >
            <Plus size={18} aria-hidden="true" />
            Aggiungi progetto
          </button>
        ) : null}
      </div>

      <input
        ref={inputPdf}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        data-testid="progetto-elettrico-input-pdf"
        onChange={onFileChange}
      />
      <input
        ref={inputImg}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        className="hidden"
        data-testid="progetto-elettrico-input-immagine"
        onChange={onFileChange}
      />
      <input
        ref={inputCamera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="progetto-elettrico-input-camera"
        onChange={onFileChange}
      />

      {!haProgetti ? (
        <div
          className="ds-empty mt-4 text-center"
          data-testid="progetto-elettrico-vuoto"
        >
          <p className="ds-text-secondary text-sm leading-relaxed">
            Gli schemi e i progetti di questo lavoro, sempre a portata di mano.
          </p>
          <button
            type="button"
            className="btn-primary mt-4 inline-flex min-h-[52px] items-center justify-center gap-2 px-5 font-semibold disabled:opacity-50"
            data-testid="progetto-elettrico-aggiungi"
            disabled={bloccato}
            onClick={() => apriScelta("aggiungi")}
          >
            <Plus size={20} aria-hidden="true" />
            Aggiungi progetto
          </button>
        </div>
      ) : (
        <ul
          className="mt-4 space-y-3 list-none p-0 m-0"
          data-testid="progetto-elettrico-lista"
        >
          {lista.map((progetto) => {
            const metaTipo =
              progetto.tipo === TIPI_PROGETTO.pdf ? "PDF" : "Immagine";
            const metaSize = formatDimensioniProgetto(progetto.size);
            return (
              <li
                key={progetto.id}
                className="rounded-[16px] border border-white/10 bg-black/20 p-4"
                data-testid="progetto-elettrico-card"
                data-progetto-id={String(progetto.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
                    {progetto.tipo === TIPI_PROGETTO.pdf ? (
                      <FileText size={22} aria-hidden="true" />
                    ) : (
                      <FileImage size={22} aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="ds-text-primary font-medium truncate">
                      {progetto.nome}
                    </p>
                    <p className="ds-text-secondary text-sm mt-1">
                      {metaTipo}
                      {metaSize ? ` · ${metaSize}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center shrink-0 disabled:opacity-50"
                    aria-label={`Altre azioni ${progetto.nome}`}
                    data-testid="progetto-elettrico-menu"
                    disabled={bloccato}
                    onClick={() => apriMenu(progetto)}
                  >
                    <MoreHorizontal size={22} aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-primary w-full min-h-[48px] mt-3 font-semibold disabled:opacity-50"
                  data-testid="progetto-elettrico-apri"
                  disabled={bloccato}
                  onClick={() => apriProgetto(progetto)}
                >
                  Apri progetto
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {messaggio ? (
        <p
          className="mt-3 text-sm text-rose-200"
          role="status"
          data-testid="progetto-elettrico-messaggio"
        >
          {messaggio}
        </p>
      ) : null}
      {erroreLocale ? (
        <p
          className="mt-3 text-sm text-rose-200"
          role="alert"
          data-testid="progetto-elettrico-errore"
        >
          {erroreLocale}
        </p>
      ) : null}

      <BottomSheet
        open={sheetScelta}
        onClose={() => setSheetScelta(false)}
        title={titoloSheetScelta}
      >
        <div className="flex flex-col gap-3 p-1">
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-4 min-h-[64px] text-left"
            data-testid="progetto-elettrico-scegli-pdf"
            onClick={scegliPdf}
          >
            <FileText
              className="text-yellow-300 shrink-0"
              size={22}
              aria-hidden="true"
            />
            <span>
              <span className="ds-card-title block">Scegli PDF</span>
              <span className="ds-text-secondary text-sm">
                Schema, progetto o documento tecnico
              </span>
            </span>
          </button>
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-4 min-h-[64px] text-left"
            data-testid="progetto-elettrico-scegli-immagine"
            onClick={scegliImg}
          >
            <FileImage
              className="text-yellow-300 shrink-0"
              size={22}
              aria-hidden="true"
            />
            <span>
              <span className="ds-card-title block">Scegli immagine</span>
              <span className="ds-text-secondary text-sm">
                Foto o immagine dello schema
              </span>
            </span>
          </button>
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-4 min-h-[64px] text-left"
            data-testid="progetto-elettrico-scatta-foto"
            onClick={scattaFoto}
          >
            <Camera
              className="text-yellow-300 shrink-0"
              size={22}
              aria-hidden="true"
            />
            <span>
              <span className="ds-card-title block">Scatta foto</span>
              <span className="ds-text-secondary text-sm">
                Fotografa direttamente lo schema in cantiere
              </span>
            </span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheetMenu}
        onClose={() => {
          setSheetMenu(false);
          setProgettoAttivo(null);
        }}
        title={progettoAttivo?.nome || "Progetto elettrico"}
      >
        <div className="flex flex-col gap-3 p-1">
          {typeof onRinomina === "function" ? (
            <button
              type="button"
              className="pro-panel p-4 flex items-center gap-4 min-h-[56px] text-left"
              data-testid="progetto-elettrico-rinomina"
              onClick={apriRinomina}
            >
              <Pencil
                className="text-yellow-300 shrink-0"
                size={20}
                aria-hidden="true"
              />
              <span className="ds-card-title">Rinomina</span>
            </button>
          ) : null}
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-4 min-h-[56px] text-left"
            data-testid="progetto-elettrico-sostituisci"
            onClick={() => {
              const target = progettoAttivo;
              setSheetMenu(false);
              apriScelta("sostituisci", target);
            }}
          >
            <Replace
              className="text-yellow-300 shrink-0"
              size={20}
              aria-hidden="true"
            />
            <span className="ds-card-title">Sostituisci</span>
          </button>
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-4 min-h-[56px] text-left text-rose-200"
            data-testid="progetto-elettrico-elimina"
            onClick={() => {
              setSheetMenu(false);
              setConfermaElimina(true);
            }}
          >
            <Trash2 className="shrink-0" size={20} aria-hidden="true" />
            <span className="ds-card-title">Elimina</span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheetNome}
        onClose={annullaNome}
        title="Nome documento"
        descrizione="Opzionale — puoi lasciare il nome suggerito."
      >
        <div className="space-y-4 p-1">
          <label className="block" htmlFor="progetto-elettrico-nome">
            <span className="ds-text-secondary text-sm font-medium">
              Nome
            </span>
            <input
              id="progetto-elettrico-nome"
              type="text"
              className="input-pro mt-2 min-h-[52px] text-base"
              value={nomeBozza}
              maxLength={80}
              placeholder={
                tipoInAttesa === TIPI_PROGETTO.pdf
                  ? "Es. Schema unifilare"
                  : "Es. Schema quadro generale"
              }
              data-testid="progetto-elettrico-input-nome"
              onChange={(e) => setNomeBozza(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary w-full min-h-[52px] font-semibold disabled:opacity-50"
            data-testid="progetto-elettrico-salva"
            disabled={bloccato || !fileInAttesa}
            onClick={confermaNome}
          >
            {salvataggioInCorso ? "Salvataggio…" : "Salva"}
          </button>
          <button
            type="button"
            className="btn-secondary w-full min-h-[48px] font-semibold disabled:opacity-50"
            disabled={salvataggioInCorso}
            onClick={annullaNome}
          >
            Annulla
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheetRinomina}
        onClose={() => {
          if (salvataggioInCorso) return;
          setSheetRinomina(false);
          setNomeRinomina("");
          setProgettoAttivo(null);
        }}
        title="Rinomina progetto"
      >
        <div className="space-y-4 p-1">
          <label className="block" htmlFor="progetto-elettrico-rinomina-nome">
            <span className="ds-text-secondary text-sm font-medium">
              Nome
            </span>
            <input
              id="progetto-elettrico-rinomina-nome"
              type="text"
              className="input-pro mt-2 min-h-[52px] text-base"
              value={nomeRinomina}
              maxLength={80}
              data-testid="progetto-elettrico-input-rinomina"
              onChange={(e) => setNomeRinomina(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary w-full min-h-[52px] font-semibold disabled:opacity-50"
            data-testid="progetto-elettrico-salva-rinomina"
            disabled={bloccato || !nomeRinomina.trim()}
            onClick={confermaRinomina}
          >
            {salvataggioInCorso ? "Salvataggio…" : "Salva"}
          </button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confermaElimina}
        title="Eliminare questo progetto?"
        description="Il file verrà rimosso da questo cantiere. Gli altri progetti restano intatti."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => {
          const id = progettoAttivo?.id;
          setConfermaElimina(false);
          pulisciViewer();
          if (id != null) onElimina?.(id);
          setProgettoAttivo(null);
        }}
        onCancel={() => {
          setConfermaElimina(false);
          setProgettoAttivo(null);
        }}
        testId="conferma-elimina-progetto-elettrico"
      />

      <CantiereFotoViewer
        open={Boolean(viewerImg)}
        src={viewerImg?.src || ""}
        titolo={viewerImg?.titolo || "Progetto elettrico"}
        onClose={pulisciViewer}
        abilitaZoom
      />

      <PdfAnteprima
        aperto={Boolean(viewerPdf)}
        blobUrl={viewerPdf?.url || ""}
        titolo="Progetto elettrico"
        nomeFile={viewerPdf?.nome || "progetto.pdf"}
        onChiudi={pulisciViewer}
        abilitaZoom
      />
    </section>
  );
}
