import { createElement, memo, useCallback } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Lightbulb,
  StickyNote,
  Wallet,
  Wrench,
} from "lucide-react";

const ICONE_TIPO = {
  checklist: Lightbulb,
  materiale: Wrench,
  durata: Clock,
  documentazione: Camera,
  nota: StickyNote,
  economico: Wallet,
  warning: AlertTriangle,
  successo: CheckCircle2,
};

const STILI_PRIORITA = {
  alta: {
    badge: "ds-badge ds-badge-rifiutato",
    etichetta: "Alta",
  },
  media: {
    badge: "ds-badge ds-badge-sospeso",
    etichetta: "Media",
  },
  bassa: {
    badge: "ds-badge ds-badge-neutral",
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
 * @returns {typeof Lightbulb}
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
  const IconComponent = iconaPerCard(card?.tipo, card?.priorita);
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
        <div className="ds-icon-tile" aria-hidden="true">
          {createElement(IconComponent, { size: 20, strokeWidth: 2 })}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={priorita.badge}>{priorita.etichetta}</span>
            {mostraConfidence ? (
              <span className="ds-text-muted font-semibold tabular-nums">
                {percentuale}% confidenza
              </span>
            ) : null}
          </div>

          <h3 className="ds-card-title">{card?.titolo || "Suggerimento"}</h3>
          <p className="ds-text-secondary mt-1 leading-relaxed">
            {card?.descrizione || ""}
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => gestisciAzione(azionePrimaria)}
              className="btn-primary px-4 py-3 min-h-[52px] text-sm font-semibold"
              aria-label={`${labelPrimaria}: ${card?.titolo || "suggerimento"}`}
            >
              {labelPrimaria}
            </button>

            <button
              type="button"
              onClick={() => gestisciAzione("dismiss")}
              className="btn-secondary px-4 py-3 min-h-[48px] text-sm font-semibold"
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
