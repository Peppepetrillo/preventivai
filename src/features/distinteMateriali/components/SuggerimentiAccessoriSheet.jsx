import { useId, useMemo, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";

/**
 * Sheet post-add: suggerimenti accessori da catalogo (opt-in).
 * Remount on open/parent → selezione iniziale senza setState-in-effect.
 */
export default function SuggerimentiAccessoriSheet({
  open,
  onClose,
  parentVoce,
  suggerimenti = [],
  onConferma,
}) {
  const titleId = useId();
  const remountKey = useMemo(() => {
    const parent = parentVoce?.id || parentVoce?.nome || "parent";
    const chiavi = (suggerimenti || []).map((s) => s.chiave).join("|");
    return `${parent}:${chiavi || "vuoto"}`;
  }, [parentVoce, suggerimenti]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Suggeriti"
      descrizione={
        parentVoce?.nome
          ? `Per «${parentVoce.nome}»`
          : "Accessori tipici da aggiungere"
      }
      zIndex={90}
    >
      {open ? (
        <SuggerimentiForm
          key={remountKey}
          titleId={titleId}
          parentVoce={parentVoce}
          suggerimenti={suggerimenti}
          onClose={onClose}
          onConferma={onConferma}
        />
      ) : null}
    </BottomSheet>
  );
}

function SuggerimentiForm({
  titleId,
  parentVoce,
  suggerimenti,
  onClose,
  onConferma,
}) {
  const [selezionati, setSelezionati] = useState(() =>
    Object.fromEntries((suggerimenti || []).map((s) => [s.chiave, true]))
  );
  const [confermando, setConfermando] = useState(false);
  const confermaInCorso = useRef(false);

  function toggle(chiave) {
    if (confermaInCorso.current) return;
    setSelezionati((prev) => ({ ...prev, [chiave]: !prev[chiave] }));
  }

  function conferma() {
    if (confermaInCorso.current) return;
    const scelti = (suggerimenti || []).filter((s) => selezionati[s.chiave]);
    if (scelti.length === 0) return;

    confermaInCorso.current = true;
    setConfermando(true);
    try {
      onConferma?.(scelti);
      onClose?.();
    } catch {
      confermaInCorso.current = false;
      setConfermando(false);
    }
  }

  const conteggio = (suggerimenti || []).filter((s) => selezionati[s.chiave])
    .length;

  return (
    <div className="space-y-4 pb-2" aria-labelledby={titleId}>
      {parentVoce?.nome ? (
        <div className="pro-panel px-4 py-3 flex items-start gap-2">
          <Link2
            size={16}
            className="text-yellow-200 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="ds-text-primary truncate">{parentVoce.nome}</p>
            <p className="ds-text-secondary text-xs mt-1">
              {parentVoce.quantita} {parentVoce.unita}
            </p>
          </div>
        </div>
      ) : null}

      <p className="ds-text-secondary text-sm px-1">
        Seleziona cosa aggiungere alla distinta.
      </p>

      <ul className="space-y-2" role="list" data-testid="suggerimenti-accessori-list">
        {(suggerimenti || []).map((item) => {
          const checked = Boolean(selezionati[item.chiave]);
          return (
            <li key={item.chiave}>
              <button
                type="button"
                onClick={() => toggle(item.chiave)}
                disabled={confermando}
                className={`w-full min-h-[56px] pro-panel px-3 py-3 text-left flex items-start gap-3 ${
                  checked ? "border border-yellow-300/35" : ""
                } disabled:opacity-60`}
                aria-pressed={checked}
                data-testid="suggerimento-accessorio-row"
              >
                <span
                  className={`mt-0.5 w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 ${
                    checked
                      ? "bg-yellow-300 text-black"
                      : "border border-white/20 bg-black/30"
                  }`}
                  aria-hidden="true"
                >
                  {checked ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="ds-text-primary block truncate">
                    {item.nome}
                  </span>
                  <span className="ds-text-secondary text-xs mt-1 block">
                    ×{item.quantita} {item.unita}
                    {item.nota ? ` · ${item.nota}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={conferma}
        disabled={conteggio === 0 || confermando}
        className="btn-primary w-full min-h-[52px] font-bold disabled:opacity-45"
        data-testid="suggerimenti-aggiungi"
      >
        {confermando
          ? "Aggiunta…"
          : conteggio === 0
            ? "Nessun accessorio selezionato"
            : conteggio === 1
              ? "Aggiungi selezionato"
              : `Aggiungi selezionati (${conteggio})`}
      </button>

      <button
        type="button"
        onClick={onClose}
        disabled={confermando}
        className="btn-secondary w-full min-h-[48px] disabled:opacity-45"
        data-testid="suggerimenti-salta"
      >
        Salta
      </button>
    </div>
  );
}
