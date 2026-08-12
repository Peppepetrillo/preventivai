import { Check, PenLine, Send, X } from "lucide-react";

import { AZIONI_PREVENTIVO } from "../../../domain/workflow";

/**
 * Azioni workflow secondarie (non hero).
 */
export default function PreventivoWorkflowAzioni({
  azioni = [],
  confermaRifiuto = false,
  mostraModifica = false,
  mostraInviaDiNuovo = false,
  onModifica,
  onInviaDiNuovo,
  onInvia,
  onAccetta,
  onRifiuta,
  onAnnullaRifiuto,
}) {
  const haQualcosa =
    azioni.length > 0 ||
    confermaRifiuto ||
    mostraModifica ||
    mostraInviaDiNuovo;

  if (!haQualcosa) return null;

  return (
    <div
      className="flex flex-wrap gap-2 mb-5"
      data-testid="preventivo-workflow-secondarie"
    >
      {mostraModifica ? (
        <button
          type="button"
          onClick={onModifica}
          className="btn-secondary px-4 py-3 text-sm font-semibold inline-flex items-center gap-2 min-h-[44px]"
          data-testid="workflow-modifica"
        >
          <PenLine size={16} aria-hidden="true" />
          Modifica
        </button>
      ) : null}
      {mostraInviaDiNuovo ? (
        <button
          type="button"
          onClick={onInviaDiNuovo}
          className="btn-secondary px-4 py-3 text-sm font-semibold inline-flex items-center gap-2 min-h-[44px]"
          data-testid="workflow-invia-di-nuovo"
        >
          <Send size={16} aria-hidden="true" />
          Invia di nuovo
        </button>
      ) : null}
      {azioni.includes(AZIONI_PREVENTIVO.INVIA) ? (
        <button
          type="button"
          onClick={onInvia}
          className="btn-secondary px-4 py-3 text-sm font-semibold inline-flex items-center gap-2 min-h-[44px]"
        >
          <Send size={16} aria-hidden="true" />
          Segna inviato
        </button>
      ) : null}
      {azioni.includes(AZIONI_PREVENTIVO.ACCETTA) ? (
        <button
          type="button"
          onClick={onAccetta}
          className="btn-secondary px-4 py-3 text-sm font-semibold inline-flex items-center gap-2 min-h-[44px]"
        >
          <Check size={16} aria-hidden="true" />
          Accetta
        </button>
      ) : null}
      {azioni.includes(AZIONI_PREVENTIVO.ANNULLA) ||
      azioni.includes(AZIONI_PREVENTIVO.RIFIUTA) ? (
        <>
          <button
            type="button"
            onClick={onRifiuta}
            className={`btn-secondary px-4 py-3 text-sm font-semibold inline-flex items-center gap-2 min-h-[44px] text-red-200 ${
              confermaRifiuto ? "border-red-400/50 bg-red-500/15" : ""
            }`}
          >
            <X size={16} aria-hidden="true" />
            {confermaRifiuto ? "Conferma rifiuto" : "Rifiuta"}
          </button>
          {confermaRifiuto ? (
            <button
              type="button"
              onClick={onAnnullaRifiuto}
              className="btn-secondary px-4 py-3 text-sm font-semibold min-h-[44px]"
            >
              Annulla
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
