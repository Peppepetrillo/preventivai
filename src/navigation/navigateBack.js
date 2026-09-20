/**
 * Navigazione indietro condivisa (Back button + edge swipe + Android back).
 * Stessa destinazione in tutti i punti di ingresso.
 */

import {
  canUseHistoryBack,
  destinazioneParentOHome,
  risolviParentPath,
} from "../app/navigationConfig";

/** Override esplicito da PageBackLink `to` (stesso target di Back e swipe). */
let backOverridePath = null;

/**
 * Guardia opzionale (es. wizard con bozza sporca).
 * Se restituisce false / { blocca: true }, non naviga.
 * @type {null|((ctx: {
 *   navigate: import('react-router-dom').NavigateFunction,
 *   pathname: string,
 *   opzioni: object,
 * }) => boolean|{blocca?: boolean})}
 */
let guardiaNavigazioneIndietro = null;

/**
 * @param {string|null} path
 */
export function setNavigazioneIndietroOverride(path) {
  backOverridePath = path ? String(path) : null;
}

/**
 * @returns {string|null}
 */
export function getNavigazioneIndietroOverride() {
  return backOverridePath;
}

/**
 * Registra una guardia per Back / edge swipe / Android back.
 * Una sola alla volta (ultima pagina montata vince). Passare null per rimuovere.
 * @param {typeof guardiaNavigazioneIndietro} fn
 */
export function setGuardiaNavigazioneIndietro(fn) {
  guardiaNavigazioneIndietro = typeof fn === "function" ? fn : null;
}

/**
 * @returns {typeof guardiaNavigazioneIndietro}
 */
export function getGuardiaNavigazioneIndietro() {
  return guardiaNavigazioneIndietro;
}

/**
 * Esegue il ritorno.
 * Preferisce override pagina → history in-app → parent della gerarchia.
 * Se una guardia blocca (bozza sporca), non naviga.
 *
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @param {string} pathname
 * @param {{ forceParent?: boolean }=} opzioni
 * @returns {{ metodo: 'override'|'history'|'parent'|'home'|'bloccato', destinazione: string|null }}
 */
export function eseguiNavigazioneIndietro(navigate, pathname, opzioni = {}) {
  if (guardiaNavigazioneIndietro) {
    const esitoGuardia = guardiaNavigazioneIndietro({
      navigate,
      pathname,
      opzioni,
    });
    const blocca =
      esitoGuardia === false ||
      (esitoGuardia && typeof esitoGuardia === "object" && esitoGuardia.blocca);
    if (blocca) {
      return { metodo: "bloccato", destinazione: null };
    }
  }

  const override = getNavigazioneIndietroOverride();
  if (override) {
    navigate(override);
    return { metodo: "override", destinazione: override };
  }

  const parent = risolviParentPath(pathname);
  const forzaParent = Boolean(opzioni.forceParent);

  if (!forzaParent && parent && canUseHistoryBack()) {
    navigate(-1);
    return { metodo: "history", destinazione: null };
  }

  const destinazione = parent || destinazioneParentOHome(pathname);
  navigate(destinazione);
  return {
    metodo: parent ? "parent" : "home",
    destinazione,
  };
}

/**
 * Prova a navigare verso un path (es. BottomNav).
 * Se una guardia blocca (wizard sporco), non naviga e apre il dialog.
 *
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @param {string} path
 * @returns {boolean} true se la navigazione è partita
 */
export function provaNavigazioneGuidata(navigate, path) {
  const destinazione = String(path || "").trim();
  if (!destinazione) return false;

  if (guardiaNavigazioneIndietro) {
    const esitoGuardia = guardiaNavigazioneIndietro({
      navigate,
      pathname: destinazione,
      opzioni: { destinazioneEsplicita: destinazione },
    });
    const blocca =
      esitoGuardia === false ||
      (esitoGuardia && typeof esitoGuardia === "object" && esitoGuardia.blocca);
    if (blocca) return false;
  }

  navigate(destinazione);
  return true;
}

/**
 * True se un elemento (o antenato) esclude l'edge swipe.
 * @param {EventTarget|null} target
 */
export function targetEscludeEdgeSwipe(target) {
  if (!target || typeof target.closest !== "function") return false;
  const el = /** @type {Element} */ (target);
  if (
    el.closest(
      'input, textarea, select, option, [contenteditable="true"], [data-no-edge-swipe], [role="slider"], [role="dialog"], [aria-modal="true"]'
    )
  ) {
    return true;
  }
  // Scroll orizzontale intenzionale
  let nodo = /** @type {Element|null} */ (el);
  while (nodo && nodo !== document.body) {
    if (nodo instanceof HTMLElement) {
      const overflowX = window.getComputedStyle(nodo).overflowX;
      if (
        (overflowX === "auto" || overflowX === "scroll") &&
        nodo.scrollWidth > nodo.clientWidth + 4
      ) {
        return true;
      }
    }
    nodo = nodo.parentElement;
  }
  return false;
}

/**
 * Sheet/modal aperto (BottomSheet usa role=dialog aria-modal).
 */
export function isOverlayNavigazioneAperto() {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector('[role="dialog"][aria-modal="true"]')
  );
}

/**
 * Chiude overlay se presente (Escape gestito da BottomSheet).
 * @returns {boolean} true se ha intercettato
 */
export function provaChiudereOverlayNavigazione() {
  if (!isOverlayNavigazioneAperto()) return false;
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      bubbles: true,
      cancelable: true,
    })
  );
  return true;
}
