import BottomSheet from "../BottomSheet";

/**
 * UI condivisa per condivisione (WhatsApp, copia, PDF).
 * Non conosce domini né servizi: riceve preview, opzioni e azioni via props.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   descrizione?: string,
 *   sheetTestId?: string,
 *   preview?: string,
 *   previewTestId?: string,
 *   options?: import("react").ReactNode,
 *   actions?: Array<{
 *     id: string,
 *     label: string,
 *     icon?: import("react").ComponentType<{ size?: number, "aria-hidden"?: boolean }>,
 *     variant?: "primary" | "secondary",
 *     onPress: () => void | Promise<void>,
 *     disabled?: boolean,
 *     loadingLabel?: string,
 *     testId?: string,
 *   }>,
 *   error?: string,
 * }} props
 */
export default function ShareSheet({
  open,
  onClose,
  title = "Condividi",
  descrizione,
  sheetTestId,
  preview = "",
  previewTestId,
  options = null,
  actions = [],
  error = "",
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      descrizione={descrizione}
    >
      <div className="space-y-4 pb-2" data-testid={sheetTestId}>
        {options}

        {error ? (
          <p
            className="ds-text-secondary text-sm text-red-200/95 px-1"
            role="alert"
            data-testid="share-sheet-error"
          >
            {error}
          </p>
        ) : null}

        <pre
          className="pro-panel px-3.5 py-3 text-xs text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto"
          data-testid={previewTestId}
        >
          {preview}
        </pre>

        {actions.map((azione) => {
          const Icona = azione.icon;
          const primaria = azione.variant === "primary";
          const etichetta =
            azione.disabled && azione.loadingLabel
              ? azione.loadingLabel
              : azione.label;

          return (
            <button
              key={azione.id}
              type="button"
              onClick={azione.onPress}
              disabled={azione.disabled}
              className={`w-full font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                primaria
                  ? "btn-primary min-h-[52px]"
                  : "btn-secondary min-h-[48px]"
              }`}
              data-testid={azione.testId}
            >
              {Icona ? <Icona size={18} aria-hidden="true" /> : null}
              {etichetta}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
