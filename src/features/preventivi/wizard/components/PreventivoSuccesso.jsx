import { CircleCheck, FileDown, FileText, Plus, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

import { routePreventivo } from "../../../../app/routes";
import { formatEuro, calcolaTotali } from "../../../../utils/preventivi";
import { esportaBlob } from "../../../../utils/nativeExport";

export default function PreventivoSuccesso({
  preventivo,
  condizioni,
  lavorazioni,
  pdfGenerato = false,
  pdfBlob = null,
  pdfNomeFile = "",
  avvisoPdf = "",
  inElaborazione = false,
  onRiprovaPdf,
  onNuovoPreventivo,
}) {
  const numero = preventivo.numero || `PREV-${preventivo.id}`;
  const totali = calcolaTotali(
    lavorazioni,
    condizioni.sconto,
    condizioni.iva
  );

  async function condividi() {
    const testo = `Preventivo ${numero} per ${preventivo.cliente} — Totale ${formatEuro(totali.totale)}`;
    const titolo = `Preventivo ${numero}`;
    const nomeFile =
      pdfNomeFile || `${numero}-${preventivo.cliente || "cliente"}.pdf`.replace(/\s+/g, "_");

    if (pdfBlob) {
      const esito = await esportaBlob(pdfBlob, nomeFile, { titolo });
      if (esito.success || esito.error === "annullato") return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: titolo,
          text: testo,
        });
        return;
      } catch (errore) {
        if (errore?.name === "AbortError") return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(testo);
    }
  }

  return (
    <div
      className="px-4 py-8 space-y-6 text-center"
      data-testid="preventivo-successo"
    >
      <div className="w-20 h-20 mx-auto rounded-full bg-yellow-400/15 border border-yellow-300/30 flex items-center justify-center text-yellow-200">
        <CircleCheck size={40} aria-hidden="true" />
      </div>

      <div>
        <h2 className="ds-page-title">Preventivo creato</h2>
        <p className="text-yellow-200 font-semibold mt-2">{numero}</p>
        <p className="ds-text-secondary mt-2">
          {preventivo.cliente} · {formatEuro(totali.totale)}
        </p>
        {pdfGenerato ? (
          <p className="ds-text-secondary text-xs mt-3">
            PDF generato.
          </p>
        ) : null}
        {avvisoPdf ? (
          <p className="text-sm text-amber-200 mt-3" role="status">
            {avvisoPdf}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <Link
          to={routePreventivo(preventivo.id)}
          className="w-full btn-primary py-4 min-h-[44px] flex items-center justify-center gap-2"
          data-testid="successo-apri-dettaglio"
        >
          <FileText size={18} aria-hidden="true" />
          Apri dettaglio
        </Link>

        {!pdfGenerato && onRiprovaPdf ? (
          <button
            type="button"
            onClick={onRiprovaPdf}
            disabled={inElaborazione}
            className="w-full btn-secondary py-4 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-45"
            data-testid="successo-riprova-pdf"
          >
            <FileDown size={18} aria-hidden="true" />
            {inElaborazione ? "Genero PDF..." : "Genera PDF"}
          </button>
        ) : (
          <button
            type="button"
            onClick={condividi}
            className="w-full btn-secondary py-4 min-h-[44px] flex items-center justify-center gap-2"
            data-testid="successo-condividi"
          >
            <Share2 size={18} aria-hidden="true" />
            {pdfBlob ? "Condividi PDF" : "Condividi riepilogo"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onNuovoPreventivo}
        className="text-yellow-200 font-semibold text-sm flex items-center justify-center gap-1.5 mx-auto min-h-11"
        data-testid="successo-nuovo-preventivo"
      >
        <Plus size={16} aria-hidden="true" />
        Nuovo preventivo
      </button>
    </div>
  );
}
