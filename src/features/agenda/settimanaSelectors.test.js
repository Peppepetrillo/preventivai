import { describe, expect, it } from "vitest";

import {
  giorniDellaSettimana,
  inizioSettimana,
  risolviGiornoDaVista,
  selezionaInterventiSettimana,
} from "./settimanaSelectors";

describe("settimanaSelectors", () => {
  it("calcola il lunedì della settimana", () => {
    const mercoledi = new Date(2026, 6, 29); // mercoledì
    const lunedi = inizioSettimana(mercoledi);
    expect(lunedi.getDay()).toBe(1);
    expect(lunedi.getDate()).toBe(27);
  });

  it("restituisce 7 giorni", () => {
    expect(giorniDellaSettimana(new Date(2026, 6, 29))).toHaveLength(7);
  });

  it("risolve oggi e domani dalla vista", () => {
    const oggi = new Date(2026, 6, 29);
    expect(risolviGiornoDaVista("oggi", oggi).getDate()).toBe(29);
    expect(risolviGiornoDaVista("domani", oggi).getDate()).toBe(30);
  });

  it("seleziona interventi per settimana", () => {
    const settimana = selezionaInterventiSettimana(
      [
        {
          id: "c1",
          nome: "Villa",
          cliente: "Rossi",
          stato: "Da iniziare",
          dataIntervento: "29/07/2026",
          orario: "09:00",
        },
      ],
      new Date(2026, 6, 29),
      new Date(2026, 6, 29)
    );

    expect(settimana).toHaveLength(7);
    const giornoConLavoro = settimana.find((g) => g.lavori.length > 0);
    expect(giornoConLavoro?.lavori[0].id).toBe("c1");
  });
});
