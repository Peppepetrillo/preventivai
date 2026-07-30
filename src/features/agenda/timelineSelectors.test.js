import { describe, expect, it } from "vitest";

import { unificaTimelineGiorno } from "./timelineSelectors";

describe("timelineSelectors", () => {
  it("unisce lavori e attività ordinati per ora", () => {
    const items = unificaTimelineGiorno(
      [
        {
          id: "c1",
          orario: "15:00",
          cliente: "Rossi",
          titolo: "Intervento",
          tipoLavoroLabel: "Intervento",
          stato: "pianificato",
          statoLabel: "Pianificato",
          statoGlifo: "○",
        },
      ],
      [
        {
          id: "a1",
          ora: "08:00",
          titolo: "Telefonata",
          categoriaLabel: "Telefonata",
          stato: "da-fare",
        },
        {
          id: "a2",
          ora: "11:00",
          titolo: "Acquisti",
          categoria: "acquisti",
          stato: "da-fare",
        },
      ]
    );

    expect(items.map((i) => i.titolo)).toEqual([
      "Telefonata",
      "Acquisti",
      "Rossi",
    ]);
    expect(items[0].kind).toBe("attivita");
    expect(items[2].kind).toBe("lavoro");
  });
});
