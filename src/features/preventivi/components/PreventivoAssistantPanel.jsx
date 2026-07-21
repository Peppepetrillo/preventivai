import { memo, useCallback, useMemo, useState } from "react";
import { Brain } from "lucide-react";

import AssistantCard from "../../../components/assistant/AssistantCard";
import { getPreventivoAssistant } from "../../../services/assistantService";
import { leggiListino } from "../../../repositories/listinoRepository";
import {
  adattaCardAlContestoPreventivo,
  MAX_SUGGERIMENTI_PREVENTIVO,
  risolviVoceListinoDaNome,
  selezionaCardPreventivo,
} from "../utils/preventivoAssistantUtils";

/**
 * @param {object} props
 * @param {string=} props.tipoLavoro
 * @param {object[]=} props.lavorazioni
 * @param {(voce: object) => void=} props.onAggiungiVoce
 * @param {(opzioni?: object) => object=} props.loadAssistant
 * @param {(card: object, action: string) => void=} props.onAction
 */
function PreventivoAssistantPanel({
  tipoLavoro = "",
  lavorazioni = [],
  onAggiungiVoce,
  loadAssistant = getPreventivoAssistant,
  onAction,
}) {
  const [ignorate, setIgnorate] = useState(() => new Set());
  const [listino] = useState(() => leggiListino());

  const firmaLavorazioni = useMemo(
    () =>
      lavorazioni
        .map((item) => String(item?.nome || "").trim().toLowerCase())
        .filter(Boolean)
        .join("|"),
    [lavorazioni]
  );

  const cards = useMemo(() => {
    void firmaLavorazioni;

    let payload;
    try {
      payload = loadAssistant({ tipoLavoro }) || { cards: [] };
    } catch {
      payload = { cards: [] };
    }

    return selezionaCardPreventivo(payload, lavorazioni)
      .filter((card) => card && !ignorate.has(card.id))
      .map((card) => adattaCardAlContestoPreventivo(card, lavorazioni))
      .slice(0, MAX_SUGGERIMENTI_PREVENTIVO);
  }, [firmaLavorazioni, ignorate, lavorazioni, loadAssistant, tipoLavoro]);

  const gestisciAzione = useCallback(
    (card, action) => {
      if (action === "dismiss" && card?.id) {
        setIgnorate((precedenti) => {
          const prossimo = new Set(precedenti);
          prossimo.add(card.id);
          return prossimo;
        });
      }

      if (action === "accept" && card && card.tipo !== "durata") {
        const voce = risolviVoceListinoDaNome(card.titolo, listino);
        if (voce) {
          onAggiungiVoce?.(voce);
        } else {
          onAggiungiVoce?.({
            id: `suggerimento-${card.id}`,
            nome: card.titolo,
            categoria: "Suggeriti",
            prezzo: 0,
            unita: "cad",
          });
        }
      }

      onAction?.(card, action);
    },
    [listino, onAction, onAggiungiVoce]
  );

  if (cards.length === 0) {
    return (
      <section
        className="pro-panel p-4 text-center"
        aria-label="Assistente preventivo"
      >
        <div
          className="mx-auto w-12 h-12 rounded-[14px] bg-yellow-400/10 text-yellow-200 flex items-center justify-center mb-3"
          aria-hidden="true"
        >
          <Brain size={24} />
        </div>
        <p className="text-base font-black">
          L&apos;assistente sta ancora imparando.
        </p>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Completa alcuni preventivi per ottenere suggerimenti personalizzati.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-label="Assistente preventivo">
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg" aria-hidden="true">
          🧠
        </span>
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-300">
          Assistente
        </h2>
      </div>

      <div className="grid gap-3" role="list">
        {cards.map((card) => (
          <div key={card.id} role="listitem">
            <AssistantCard
              card={card}
              onAction={gestisciAzione}
              etichettaPrimaria={
                card.tipo === "durata" ? "Visualizza" : "Aggiungi"
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(PreventivoAssistantPanel);
export { MAX_SUGGERIMENTI_PREVENTIVO };
