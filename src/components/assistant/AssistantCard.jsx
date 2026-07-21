import { memo, useCallback } from "react";

const ICONE_TIPO = {
  checklist: "💡",
  materiale: "🧰",
  durata: "⏱️",
  documentazione: "📷",
  nota: "📝",
  economico: "💰",
  warning: "⚠️",
  successo: "✅",
};

const STILI_PRIORITA = {
  alta: {
    badge: "bg-red-500/15 text-red-200 border-red-400/25",
    etichetta: "Alta",
  },
  media: {
    badge: "bg-orange-500/15 text-orange-200 border-orange-400/25",
    etichetta: "Media",
  },
  bassa: {
    badge: "bg-slate-500/20 text-slate-300 border-white/10",
    etichetta: "Bassa",
  },
};

const ETICHETTE_AZIONE = {
  view: "Visualizza dettagli",
  accept: "Accetta",
  dismiss: "Ignora",
};

const SOGLIA_CONFIDENCE_VISIBILE = 0.8;

/**
 * @param {string} tipo
 * @param {string} priorita
 * @returns {string}
 */
function iconaPerCard(tipo, priorita) {
  if (priorita === "alta" && tipo !== "durata") {
    return ICONE_TIPO.warning;
  }
  return ICONE_TIPO[tipo] || ICONE_TIPO.checklist;
}

/**
 * @param {string} action
 * @param {string} tipo
 * @returns {string}
 */
function etichettaAzione(action, tipo) {
  if (action === "accept" && tipo === "checklist") {
    return "Accetta attività";
  }
  if (action === "accept" && tipo === "materiale") {
    return "Accetta materiale";
  }
  return ETICHETTE_AZIONE[action] || ETICHETTE_AZIONE.view;
}

function AssistantCard({ card, onAction, etichettaPrimaria }) {
  const priorita = STILI_PRIORITA[card?.priorita] || STILI_PRIORITA.bassa;
  const icona = iconaPerCard(card?.tipo, card?.priorita);
  const mostraConfidence =
    Number(card?.confidence) > SOGLIA_CONFIDENCE_VISIBILE;
  const percentuale = Math.round(Number(card?.confidence || 0) * 100);
  const azionePrimaria = card?.action === "dismiss" ? "view" : card?.action || "view";
  const labelPrimaria =
    etichettaPrimaria || etichettaAzione(azionePrimaria, card?.tipo);

  const gestisciAzione = useCallback(
    (azione) => {
      onAction?.(card, azione);
    },
    [card, onAction]
  );

  return (
    <article
      className="pro-panel p-4 w-full"
      tabIndex={0}
      aria-label={`${card?.titolo || "Suggerimento"}, priorità ${priorita.etichetta}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-[14px] bg-yellow-400/10 flex items-center justify-center text-xl shrink-0"
          aria-hidden="true"
        >
          {icona}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${priorita.badge}`}
            >
              {priorita.etichetta}
            </span>
            {mostraConfidence ? (
              <span className="text-xs font-bold text-emerald-300">
                {percentuale}% confidenza
              </span>
            ) : null}
          </div>

          <h3 className="text-lg font-black leading-snug">
            {card?.titolo || "Suggerimento"}
          </h3>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            {card?.descrizione || ""}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => gestisciAzione(azionePrimaria)}
              className="btn-primary px-4 py-3 min-h-[48px] text-sm font-black"
              aria-label={`${labelPrimaria}: ${card?.titolo || "suggerimento"}`}
            >
              {labelPrimaria}
            </button>

            <button
              type="button"
              onClick={() => gestisciAzione("dismiss")}
              className="btn-secondary px-4 py-3 min-h-[48px] text-sm font-black"
              aria-label={`Ignora: ${card?.titolo || "suggerimento"}`}
            >
              Ignora
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(AssistantCard);
