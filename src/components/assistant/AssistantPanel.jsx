import { memo, useCallback, useMemo, useState } from "react";
import { Brain } from "lucide-react";

import { getDashboardAssistant } from "../../services/assistantService";
import AssistantCard from "./AssistantCard";

const MAX_SUGGERIMENTI = 5;

/**
 * @param {object} props
 * @param {() => import("../../services/assistantService").AssistantPayload=} props.loadAssistant
 * @param {(card: object, action: string) => void=} props.onAction
 */
function AssistantPanel({ loadAssistant = getDashboardAssistant, onAction }) {
  const [ignorate, setIgnorate] = useState(() => new Set());

  const payload = useMemo(() => {
    try {
      return loadAssistant() || { cards: [], summary: null };
    } catch {
      return { cards: [], summary: null };
    }
  }, [loadAssistant]);

  const cardsVisibili = useMemo(() => {
    const elenco = Array.isArray(payload.cards) ? payload.cards : [];
    return elenco
      .filter((card) => card && !ignorate.has(card.id))
      .slice(0, MAX_SUGGERIMENTI);
  }, [payload.cards, ignorate]);

  const gestisciAzione = useCallback(
    (card, action) => {
      if (action === "dismiss" && card?.id) {
        setIgnorate((precedenti) => {
          const prossimo = new Set(precedenti);
          prossimo.add(card.id);
          return prossimo;
        });
      }
      onAction?.(card, action);
    },
    [onAction]
  );

  if (cardsVisibili.length === 0) {
    return (
      <div className="pro-panel p-6 text-center">
        <div
          className="mx-auto w-14 h-14 rounded-[16px] bg-yellow-400/10 text-yellow-200 flex items-center justify-center mb-4"
          aria-hidden="true"
        >
          <Brain size={28} />
        </div>
        <p className="text-lg font-black">Nessun suggerimento disponibile.</p>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          L&apos;assistente sta imparando dalle tue esperienze.
        </p>
        <p className="text-xs text-slate-500 mt-3">
          Continua ad usare PreventivAI e l&apos;assistente inizierà ad imparare.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3" role="list" aria-label="Suggerimenti assistente">
      {cardsVisibili.map((card) => (
        <div key={card.id} role="listitem">
          <AssistantCard card={card} onAction={gestisciAzione} />
        </div>
      ))}
    </div>
  );
}

export default memo(AssistantPanel);
export { MAX_SUGGERIMENTI };
