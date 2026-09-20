import { useEffect, useId, useRef, useState } from "react";
import {
  FileImage,
  FileText,
  Plus,
  Replace,
  Trash2,
} from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import ConfirmDialog from "../../../components/ConfirmDialog";
import PdfAnteprima from "../../../components/PdfAnteprima";
import CantiereFotoViewer from "./CantiereFotoViewer";
import {
  risolviUrlProgettoElettrico,
  TIPI_PROGETTO,
} from "../services/progettoElettricoService";

/**
 * Sezione Progetto elettrico — un documento per cantiere (v1).
 */
export default function ProgettoElettricoSection({
  cantiereId: _cantiereId,
  progetto,
  busy = false,
  messaggio = "",
  onAggiungi,
  onSostituisci,
  onElimina,
}) {
  void _cantiereId;
  const [sheetAperto, setSheetAperto] = useState(false);
  const [modoFile, setModoFile] = useState("aggiungi");
  const [confermaElimina, setConfermaElimina] = useState(false);
  const [viewerImg, setViewerImg] = useState(null);
  const [viewerPdf, setViewerPdf] = useState(null);
  const [erroreApertura, setErroreApertura] = useState("");
  const inputPdf = useRef(null);
  const inputImg = useRef(null);
  const titleId = useId();
  const revokeRef = useRef(null);

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

  function apriScelta(modo) {
    if (busy) return;
    setModoFile(modo);
    setSheetAperto(true);
    setErroreApertura("");
  }

  function scegliPdf() {
    setSheetAperto(false);
    requestAnimationFrame(() => inputPdf.current?.click());
  }

  function scegliImg() {
    setSheetAperto(false);
    requestAnimationFrame(() => inputImg.current?.click());
  }

  async function onFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const handler = modoFile === "sostituisci" ? onSostituisci : onAggiungi;
    await handler?.(file);
  }

  async function apriProgetto() {
    if (busy || !progetto) return;
    setErroreApertura("");
    pulisciViewer();
    const esito = await risolviUrlProgettoElettrico(progetto);
    if (!esito.ok) {
      setErroreApertura(esito.errore || "Impossibile aprire il progetto.");
      return;
    }
    revokeRef.current = esito.revoke;
    if (progetto.tipo === TIPI_PROGETTO.pdf) {
      setViewerPdf({ url: esito.url, nome: progetto.nome });
    } else {
      setViewerImg({ src: esito.url, titolo: progetto.nome });
    }
  }

  const haProgetto = Boolean(progetto?.blobId);

  return (
    <section
      id="sezione-progetto-elettrico"
      className="pro-panel p-5 mb-5 scroll-mt-24"
      aria-labelledby={titleId}
      data-testid="progetto-elettrico-section"
    >
      <h2 id={titleId} className="ds-card-title">
        Progetto elettrico
      </h2>

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

      {!haProgetto ? (
        <div className="ds-empty mt-4 text-center" data-testid="progetto-elettrico-vuoto">
          <p className="ds-text-primary font-medium">
            Il progetto elettrico di questo lavoro
          </p>
          <p className="ds-text-secondary mt-2 text-sm">
            Allega lo schema o il progetto da tenere sempre a portata di mano.
          </p>
          <button
            type="button"
            className="btn-primary mt-4 inline-flex min-h-[52px] items-center justify-center gap-2 px-5 font-semibold disabled:opacity-50"
            data-testid="progetto-elettrico-aggiungi"
            disabled={busy}
            onClick={() => apriScelta("aggiungi")}
          >
            <Plus size={20} aria-hidden="true" />
            Aggiungi progetto
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3" data-testid="progetto-elettrico-card">
          <div className="flex items-start gap-3 rounded-[16px] border border-white/10 bg-black/20 p-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
              {progetto.tipo === TIPI_PROGETTO.pdf ? (
                <FileText size={22} aria-hidden="true" />
              ) : (
                <FileImage size={22} aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="ds-text-primary font-medium truncate">{progetto.nome}</p>
              <p className="ds-text-secondary text-sm mt-1">
                {progetto.tipo === TIPI_PROGETTO.pdf ? "PDF" : "Immagine"}
                {progetto.size
                  ? ` · ${Math.max(1, Math.round(progetto.size / 1024))} KB`
                  : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              className="btn-primary w-full min-h-[52px] font-semibold disabled:opacity-50"
              data-testid="progetto-elettrico-apri"
              disabled={busy}
              onClick={apriProgetto}
            >
              Apri
            </button>
            <button
              type="button"
              className="btn-secondary w-full min-h-[48px] inline-flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
              data-testid="progetto-elettrico-sostituisci"
              disabled={busy}
              onClick={() => apriScelta("sostituisci")}
            >
              <Replace size={18} aria-hidden="true" />
              Sostituisci
            </button>
            <button
              type="button"
              className="btn-danger w-full min-h-[48px] inline-flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
              data-testid="progetto-elettrico-elimina"
              disabled={busy}
              onClick={() => setConfermaElimina(true)}
            >
              <Trash2 size={18} aria-hidden="true" />
              Elimina
            </button>
          </div>
        </div>
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
      {erroreApertura ? (
        <p className="mt-3 text-sm text-rose-200" role="alert">
          {erroreApertura}
        </p>
      ) : null}

      <BottomSheet
        open={sheetAperto}
        onClose={() => setSheetAperto(false)}
        title="Aggiungi progetto"
      >
        <div className="flex flex-col gap-3 p-1">
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-4 min-h-[64px] text-left"
            data-testid="progetto-elettrico-scegli-pdf"
            onClick={scegliPdf}
          >
            <FileText className="text-yellow-300 shrink-0" size={22} aria-hidden="true" />
            <span>
              <span className="ds-card-title block">Aggiungi PDF</span>
              <span className="ds-text-secondary text-sm">Schema o progetto</span>
            </span>
          </button>
          <button
            type="button"
            className="pro-panel p-4 flex items-center gap-4 min-h-[64px] text-left"
            data-testid="progetto-elettrico-scegli-immagine"
            onClick={scegliImg}
          >
            <FileImage className="text-yellow-300 shrink-0" size={22} aria-hidden="true" />
            <span>
              <span className="ds-card-title block">Aggiungi immagine</span>
              <span className="ds-text-secondary text-sm">Foto dello schema</span>
            </span>
          </button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={confermaElimina}
        title="Eliminare il progetto elettrico?"
        description="Il file verrà rimosso da questo cantiere."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={() => {
          setConfermaElimina(false);
          pulisciViewer();
          onElimina?.();
        }}
        onCancel={() => setConfermaElimina(false)}
        testId="conferma-elimina-progetto-elettrico"
      />

      <CantiereFotoViewer
        open={Boolean(viewerImg)}
        src={viewerImg?.src || ""}
        titolo={viewerImg?.titolo || "Progetto elettrico"}
        onClose={pulisciViewer}
      />

      <PdfAnteprima
        aperto={Boolean(viewerPdf)}
        blobUrl={viewerPdf?.url || ""}
        titolo="Progetto elettrico"
        nomeFile={viewerPdf?.nome || "progetto.pdf"}
        onChiudi={pulisciViewer}
      />
    </section>
  );
}
