const SELETTORI_FOCUSABILI = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function trovaElementiFocusabili(contenitore) {
  if (!contenitore) return [];

  return [...contenitore.querySelectorAll(SELETTORI_FOCUSABILI)].filter(
    (elemento) =>
      !elemento.hasAttribute("disabled") &&
      elemento.getAttribute("aria-hidden") !== "true"
  );
}

export function gestisciFocusTrap(evento, contenitore) {
  if (evento.key !== "Tab" || !contenitore) return;

  const elementi = trovaElementiFocusabili(contenitore);
  if (elementi.length === 0) {
    evento.preventDefault();
    return;
  }

  const primo = elementi[0];
  const ultimo = elementi[elementi.length - 1];
  const attivo = document.activeElement;

  if (evento.shiftKey && attivo === primo) {
    evento.preventDefault();
    ultimo.focus();
    return;
  }

  if (!evento.shiftKey && attivo === ultimo) {
    evento.preventDefault();
    primo.focus();
  }
}
