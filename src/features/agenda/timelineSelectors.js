import { minutiOrario } from "./agendaSelectors";

/**
 * Unifica lavori e attività in una timeline ordinata per ora.
 * @param {object[]} lavori
 * @param {object[]} attivita
 */
export function unificaTimelineGiorno(lavori = [], attivita = []) {
  const items = [
    ...lavori.map((lavoro) => ({
      id: `lavoro-${lavoro.id}`,
      kind: "lavoro",
      ora: lavoro.orario || lavoro.scheduledTime || "",
      titolo: lavoro.cliente || lavoro.titolo,
      sottotitolo: lavoro.tipoLavoroLabel || "Lavoro",
      stato: lavoro.stato,
      statoLabel: lavoro.statoLabel,
      statoGlifo: lavoro.statoGlifo || "○",
      statoBadgeClass: lavoro.statoBadgeClass,
      payload: lavoro,
    })),
    ...attivita.map((item) => ({
      id: `attivita-${item.id}`,
      kind: "attivita",
      ora: item.ora || "",
      titolo: item.titolo,
      sottotitolo: item.categoriaLabel || item.categoria || "Attività",
      stato: item.stato === "completata" ? "completato" : "pianificato",
      statoLabel: item.stato === "completata" ? "Completata" : "Da fare",
      statoGlifo: item.stato === "completata" ? "●" : "○",
      statoBadgeClass:
        item.stato === "completata"
          ? "ds-badge ds-badge-completato"
          : "ds-badge ds-badge-da-iniziare",
      payload: item,
    })),
  ];

  return items.sort((a, b) => minutiOrario(a.ora) - minutiOrario(b.ora));
}
