/**
 * Lock globale overlay: nasconde/disattiva BottomNav mentre un modal/sheet è aperto.
 * Contatore per overlay annidati (sheet + dialog).
 */

let overlayLockCount = 0;

/**
 * @returns {() => void} release
 */
export function acquisisciOverlayLock() {
  if (typeof document === "undefined") {
    return () => {};
  }

  overlayLockCount += 1;
  document.body.dataset.overlayOpen = String(overlayLockCount);

  return () => {
    overlayLockCount = Math.max(0, overlayLockCount - 1);
    if (overlayLockCount === 0) {
      delete document.body.dataset.overlayOpen;
    } else {
      document.body.dataset.overlayOpen = String(overlayLockCount);
    }
  };
}

/** Solo test — reset contatore. */
export function resetOverlayLockForTests() {
  overlayLockCount = 0;
  if (typeof document !== "undefined") {
    delete document.body.dataset.overlayOpen;
  }
}
