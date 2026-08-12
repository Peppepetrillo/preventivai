import BottomSheet from "../BottomSheet";

/**
 * Menu selezione azione di creazione — solo UI.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   actions: Array<{
 *     id: string,
 *     label: string,
 *     subtitle?: string,
 *     icon?: import("react").ComponentType<{ size?: number, "aria-hidden"?: boolean }>,
 *     onPress: () => void,
 *     disabled?: boolean,
 *     testId?: string,
 *   }>,
 * }} props
 */
export default function GlobalCreateSheet({ open, onClose, actions = [] }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Nuovo">
      <ul
        className="divide-y divide-white/[0.06] pb-2"
        data-testid="global-create-sheet"
        aria-label="Azioni di creazione"
      >
        {actions.map((azione) => {
          const Icona = azione.icon;
          return (
            <li key={azione.id}>
              <button
                type="button"
                onClick={azione.onPress}
                disabled={azione.disabled}
                className="w-full flex items-center gap-3 min-h-[52px] py-3 px-1 text-left disabled:opacity-40"
                data-testid={azione.testId}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400/15 text-yellow-300">
                  {Icona ? <Icona size={20} aria-hidden="true" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="ds-text-primary block">{azione.label}</span>
                  {azione.subtitle ? (
                    <span className="ds-text-secondary text-sm block mt-0.5">
                      {azione.subtitle}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
