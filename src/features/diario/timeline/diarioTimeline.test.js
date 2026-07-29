import { describe, expect, it } from "vitest";

import { DIARIO_EVENT_TYPES } from "../events/constants";
import { createDiarioEvent } from "../events/createDiarioEvent";
import {
  filterDiarioEvents,
  groupDiarioEventsByDay,
  searchDiarioEvents,
  sortDiarioEvents,
} from "./diarioTimeline";

function evento(type, title, description, timestamp) {
  return createDiarioEvent({ type, title, description, timestamp });
}

describe("diarioTimeline", () => {
  it("ordina gli eventi dal piu recente al meno recente", () => {
    const elenco = sortDiarioEvents([
      evento(DIARIO_EVENT_TYPES.NOTA, "A", "", 10),
      evento(DIARIO_EVENT_TYPES.FOTO, "B", "", 30),
      evento(DIARIO_EVENT_TYPES.MATERIALE, "C", "", 20),
    ]);

    expect(elenco.map((item) => item.title)).toEqual(["B", "C", "A"]);
  });

  it("raggruppa gli eventi per giorno", () => {
    const gruppi = groupDiarioEventsByDay(
      [
        evento(DIARIO_EVENT_TYPES.NOTA, "A", "", new Date(2026, 6, 29, 9).getTime()),
        evento(DIARIO_EVENT_TYPES.FOTO, "B", "", new Date(2026, 6, 29, 11).getTime()),
        evento(DIARIO_EVENT_TYPES.MATERIALE, "C", "", new Date(2026, 6, 28, 12).getTime()),
      ],
      new Date(2026, 6, 29, 12)
    );

    expect(gruppi).toHaveLength(2);
    expect(gruppi[0].label).toBe("Oggi");
    expect(gruppi[0].events).toHaveLength(2);
  });

  it("filtra per tipo e cerca per testo", () => {
    const elenco = [
      evento(DIARIO_EVENT_TYPES.NOTA, "Nota", "Cliente vuole LED", 10),
      evento(DIARIO_EVENT_TYPES.FOTO, "Foto aggiunta", "Quadro elettrico", 20),
      evento(DIARIO_EVENT_TYPES.NOTA_MANUALE, "Nota", "Portare scala", 30),
    ];

    const soloNote = filterDiarioEvents(elenco, DIARIO_EVENT_TYPES.NOTA);
    const ricerca = searchDiarioEvents(elenco, "quadro");

    expect(soloNote).toHaveLength(2);
    expect(ricerca).toHaveLength(1);
    expect(ricerca[0].type).toBe(DIARIO_EVENT_TYPES.FOTO);
  });
});
