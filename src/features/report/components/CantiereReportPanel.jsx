import { Download, Eye, FileText, Share2 } from "lucide-react";

import PdfAnteprima, {
  condividiDaBlobUrl,
  scaricaDaBlobUrl,
} from "../../../components/PdfAnteprima";
import { leggiDatiAzienda } from "../../../repositories/impostazioniRepository";
import { useCantiereReport } from "../hooks/useCantiereReport";

export default function CantiereReportPanel({ cantiere }) {
  const datiAzienda = leggiDatiAzienda();
  const {
    pronto,
    blobUrl,
    nomeFile,
    inElaborazione,
    anteprimaAperta,
    setAnteprimaAperta,
    genera,
  } = useCantiereReport(cantiere, datiAzienda);

  async function generaReport() {
    await genera({ salva: false, apriAnteprima: false });
  }

  return (
    <div className="rounded-[14px] border border-white/10 bg-black/[0.14] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[12px] bg-yellow-400/15 text-yellow-200 flex items-center justify-center shrink-0">
          <FileText size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black">Report finale</h3>
          <p className="text-sm text-slate-400 mt-1">
            Generato automaticamente dal diario del cantiere.
          </p>
        </div>
      </div>

      {!pronto ? (
        <button
          type="button"
          onClick={generaReport}
          disabled={inElaborazione}
          className="btn-primary w-full min-h-[48px] flex items-center justify-center gap-2 font-black"
        >
          <FileText size={18} />
          {inElaborazione ? "Generazione report…" : "Genera Report"}
        </button>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => genera({ apriAnteprima: true })}
            disabled={inElaborazione}
            className="btn-secondary min-h-[48px] flex items-center justify-center gap-2 font-black"
          >
            <Eye size={18} />
            Anteprima
          </button>
          <button
            type="button"
            onClick={() => genera({ salva: true })}
            disabled={inElaborazione}
            className="btn-secondary min-h-[48px] flex items-center justify-center gap-2 font-black"
          >
            <Download size={18} />
            Esporta PDF
          </button>
          <button
            type="button"
            onClick={() =>
              condividiDaBlobUrl(blobUrl, nomeFile, "Report cantiere")
            }
            disabled={inElaborazione}
            className="btn-secondary min-h-[48px] flex items-center justify-center gap-2 font-black"
          >
            <Share2 size={18} />
            Condividi
          </button>
        </div>
      )}

      <PdfAnteprima
        aperto={anteprimaAperta}
        blobUrl={blobUrl}
        titolo="Anteprima report cantiere"
        nomeFile={nomeFile}
        inElaborazione={inElaborazione}
        onChiudi={() => setAnteprimaAperta(false)}
        onRigenera={() => genera({ apriAnteprima: true })}
        onScarica={() => scaricaDaBlobUrl(blobUrl, nomeFile)}
        onCondividi={() => condividiDaBlobUrl(blobUrl, nomeFile, "Report cantiere")}
      />
    </div>
  );
}
