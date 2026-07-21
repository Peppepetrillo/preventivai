import { memo, useCallback, useMemo, useState } from "react";
import { HardHat } from "lucide-react";

import AssistantCard from "../../../components/assistant/AssistantCard";
import { getCantiereAssistant } from "../../../services/assistantService";
import {
  etichettaAzioneCantiere,
  firmaCantierePerAssistant,
  MAX_SUGGERIMENTI_CANTIERE,
  selezionaCardCantiere,
} from "../utils/cantiereAssistantUtils";

/**
 * @param {object} props
 * @param {object=} props.cantiere
 * @param {(opzioni?: object) => object=} props.loadAssistant
 * @param {(card: object, action: string) => void=} props.onAction
 */
function CantiereAssistantPanel({
  cantiere,
  loadAssistant = getCantiereAssistant,
  onAction,
}) {
  const [ignorate, setIgnorate] = useState(() => new Set());

  const firma = useMemo(
    () => firmaCantierePerAssistant(cantiere),
    [cantiere]
  );

  const cards = useMemo(() => {
    void firma;

    let payload;
    try {
      payload =
        loadAssistant({
          cantiere,
          tipoLavoro: cantiere?.tipoLavoro || cantiere?.origine || "",
        }) || { cards: [] };
    } catch {
      payload = { cards: [] };
    }

    return selezionaCardCantiere(payload).filter(
      (card) => card && !ignorate.has(card.id)
    );
  }, [cantiere, firma, ignorate, loadAssistant]);

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

  if (cards.length === 0) {
    return (
      <section
        className="pro-panel p-5 text-center"
        aria-label="Assistente cantiere"
      >
        <div
          className="mx-auto w-12 h-12 rounded-[14px] bg-emerald-400/10 text-emerald-200 flex items-center justify-center mb-3"
          aria-hidden="true"
        >
          <HardHat size={24} />
        </div>
        <p className="text-base font-black">Il cantiere è in linea.</p>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Non risultano promemoria in questo momento.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-label="Assistente cantiere">
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg" aria-hidden="true">
          🧠
        </span>
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-300">
          Assistente cantiere
        </h2>
      </div>

      <div className="grid gap-3" role="list">
        {cards.map((card) => (
          <div key={card.id} role="listitem">
            <AssistantCard
              card={card}
              onAction={gestisciAzione}
              etichettaPrimaria={etichettaAzioneCantiere(card)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(CantiereAssistantPanel);
export { MAX_SUGGERIMENTI_CANTIERE };
