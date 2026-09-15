import { useEffect } from "react";
import { createPortal } from "react-dom";

import { acquisisciOverlayLock } from "./overlayLock";

/**
 * Dialogo di conferma in-app (sostituisce window.confirm).
 *
 * - Portal su document.body (fuori stacking context di PageWrapper / framer-motion)
 * - z-index da token CSS --z-modal (sopra BottomNav)
 * - body[data-overlay-open] disattiva la BottomNav (fix / WebKit backdrop-filter)
 * - pannello centrato: pulsanti mai sotto la BottomNav
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
  useEffect(() => {
    if (!open) return undefined;
    return acquisisciOverlayLock();
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="ds-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
      data-testid={testId}
    >
      <button
        type="button"
        aria-label="Chiudi"
        className="ds-modal-backdrop"
        onClick={onCancel}
        tabIndex={-1}
        data-testid={`${testId}-backdrop`}
      />
      <div className="ds-modal-panel pro-panel-strong">
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
    </div>,
    document.body
  );
}
