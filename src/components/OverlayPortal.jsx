import { useEffect } from "react";
import { createPortal } from "react-dom";

import { acquisisciOverlayLock } from "./overlayLock";

/**
 * Portal overlay condiviso: document.body + overlayLock (BottomNav nascosta).
 * Usare per dialog/fullscreen che non sono ConfirmDialog/BottomSheet.
 *
 * @param {{
 *   open: boolean,
 *   children: import("react").ReactNode,
 *   className?: string,
 *   testId?: string,
 *   onBackdropClick?: () => void,
 *   role?: string,
 *   "aria-modal"?: boolean,
 *   "aria-labelledby"?: string,
 *   "aria-label"?: string,
 * }} props
 */
export default function OverlayPortal({
  open,
  children,
  className = "ds-modal-overlay",
  testId,
  onBackdropClick,
  role = "dialog",
  "aria-modal": ariaModal = true,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    return acquisisciOverlayLock();
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={className}
      role={role}
      aria-modal={ariaModal}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {typeof onBackdropClick === "function" ? (
        <button
          type="button"
          aria-label="Chiudi"
          className="ds-modal-backdrop"
          onClick={onBackdropClick}
          tabIndex={-1}
        />
      ) : null}
      {children}
    </div>,
    document.body
  );
}
