/**
 * Precompila il form consuntivo da una riga programmazione[] (tab Giornate).
 * Solo UI — nessuna modifica ai dati.
 */
export function prefillConsuntivoDaGiornataProgrammata(cantiere = {}, giornata = {}) {
  const cantiereId = String(cantiere?.id || "").trim();
  const data = String(giornata?.data || "").trim();
  if (!cantiereId || !data) return null;

  const orePreviste = Number(giornata?.orePreviste) || 0;

  return {
    cantiereId,
    data,
    operaiTesto: "Io",
    oreLavorate: orePreviste > 0 ? String(orePreviste) : "8",
    attivita: String(giornata?.attivita || "").trim(),
    note: "",
  };
}

/**
 * Precompila il form consuntivo da una giornata prevista in Agenda (UX-9.0).
 * Solo UI — nessun merge programmazione[] / registroGiornate[].
 * @param {object} lavoro — item agenda kind lavoro-giornata
 */
export function prefillConsuntivoDaPrevisto(lavoro = {}) {
  if (lavoro?.kind !== "lavoro-giornata") return null;

  const cantiereId = String(
    lavoro.cantiereId ||
      (String(lavoro.id || "").includes(":")
        ? String(lavoro.id).slice(0, String(lavoro.id).indexOf(":"))
        : lavoro.id || "")
  ).trim();

  const data = String(
    lavoro.scheduledDate || lavoro.dataIntervento || ""
  ).trim();

  const orePreviste = Number(lavoro.orePreviste) || 0;

  return {
    cantiereId,
    data,
    operaiTesto: "Io",
    oreLavorate: orePreviste > 0 ? String(orePreviste) : "8",
    attivita: String(lavoro.attivitaGiornata || "").trim(),
    note: "",
  };
}
