/**
 * Dialogo di conferma in-app (sostituisce window.confirm).
 * Pattern allineato a DistinteMateriali / DS PreventivAI.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  danger = true,
  onConfirm,
  onCancel,
  testId = "confirm-dialog",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center safe-bottom"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
      data-testid={testId}
    >
      <div className="pro-panel-strong w-full max-w-md p-5">
        <p id={`${testId}-title`} className="ds-card-title">
          {title}
        </p>
        {description ? (
          <p className="ds-text-secondary mt-2">{description}</p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary min-h-[48px] flex-1 font-bold"
            data-testid={`${testId}-cancel`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${danger ? "btn-danger" : "btn-primary"} min-h-[48px] flex-1 font-bold`}
            data-testid={`${testId}-confirm`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
