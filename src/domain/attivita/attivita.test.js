import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import {
  aggiungiAttivita,
  completaAttivitaPerId,
  creaAttivita,
  eliminaAttivitaPerId,
  leggiAttivita,
  selezionaAttivitaGiorno,
} from "./index";

describe("attivita domain", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un'attività con campi obbligatori", () => {
    const attivita = creaAttivita({
      titolo: "Chiama grossista",
      categoria: "telefonata",
      priorita: "alta",
      data: "29/07/2026",
      ora: "09:30",
    });

    expect(attivita.titolo).toBe("Chiama grossista");
    expect(attivita.categoria).toBe("telefonata");
    expect(attivita.stato).toBe("da-fare");
    expect(attivita.createdAt).toBeTruthy();
  });

  it("persiste e completa un'attività", () => {
    const creata = aggiungiAttivita({
      titolo: "Ordina magnetotermico",
      categoria: "acquisti",
      data: "29/07/2026",
      ora: "08:00",
    });

    expect(leggiAttivita()).toHaveLength(1);
    completaAttivitaPerId(creata.id);
    expect(leggiAttivita()[0].stato).toBe("completata");
    eliminaAttivitaPerId(creata.id);
    expect(leggiAttivita()).toHaveLength(0);
  });

  it("filtra attività del giorno ordinate per ora", () => {
    aggiungiAttivita({
      titolo: "Tardi",
      data: "29/07/2026",
      ora: "16:00",
    });
    aggiungiAttivita({
      titolo: "Presto",
      data: "29/07/2026",
      ora: "08:00",
    });
    aggiungiAttivita({
      titolo: "Altro giorno",
      data: "30/07/2026",
      ora: "09:00",
    });

    const giorno = selezionaAttivitaGiorno(
      leggiAttivita(),
      new Date(2026, 6, 29)
    );
    expect(giorno).toHaveLength(2);
    expect(giorno.map((a) => a.titolo)).toEqual(["Presto", "Tardi"]);
  });

  it("usa la chiave storage dedicata", () => {
    aggiungiAttivita({ titolo: "Test", data: "29/07/2026" });
    expect(localStorage.getItem(STORAGE_KEYS.attivita)).toBeTruthy();
  });
});
