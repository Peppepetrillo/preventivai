export function selezionaZeroAlFocus(evento) {
  const input = evento.currentTarget;
  const valore = String(input.value ?? "").trim();

  if (valore !== "" && Number(valore) === 0) {
    input.select();
  }
}
