import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../../app/storageKeys";
import {
  creaCantierePerPreventivo,
  trovaCantiereCollegato,
} from "./preventivoCantiereService";

vi.mock("../../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

const preventivoAccettato = {
  id: 101,
  numero: "PREV-101",
  cliente: "Mario Rossi",
  stato: "Accettato",
  lavorazioni: [
    {
      id: "l-1",
      nome: "Installazione punto luce",
      categoria: "Impianto",
      quantita: 2,
      prezzo: 45,
      unita: "cad",
    },
  ],
};

describe("preventivoCantiereService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un cantiere da un preventivo accettato e collega entrambi i record", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoAccettato]));

    const risultato = creaCantierePerPreventivo(preventivoAccettato);

    const cantieri = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri));
    const preventivi = JSON.parse(localStorage.getItem(STORAGE_KEYS.preventivi));

    expect(risultato.creato).toBe(true);
    expect(cantieri).toHaveLength(1);
    expect(cantieri[0]).toMatchObject({
      cliente: "Mario Rossi",
      preventivoId: 101,
      preventivoNumero: "PREV-101",
      stato: "Da iniziare",
    });
    expect(cantieri[0].lavorazioniOrigine).toHaveLength(1);
    expect(cantieri[0].checklist[0].testo).toBe("Eseguire Installazione punto luce");
    expect(preventivi[0].cantiereId).toBe(cantieri[0].id);
  });

  it("non crea duplicati quando il preventivo è già collegato a un cantiere", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoAccettato]));

    const primoRisultato = creaCantierePerPreventivo(preventivoAccettato);
    const secondoRisultato = creaCantierePerPreventivo({
      ...preventivoAccettato,
      cantiereId: primoRisultato.cantiere.id,
    });

    const cantieri = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri));

    expect(secondoRisultato.creato).toBe(false);
    expect(secondoRisultato.cantiere.id).toBe(primoRisultato.cantiere.id);
    expect(cantieri).toHaveLength(1);
  });

  it("riconosce cantieri legacy collegati solo tramite preventivoId", () => {
    const cantiereLegacy = {
      id: 900,
      cliente: "Mario Rossi",
      preventivoId: preventivoAccettato.id,
      stato: "Da iniziare",
      checklist: [],
      materiali: [],
      foto: [],
    };

    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoAccettato]));
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([cantiereLegacy]));

    const risultato = creaCantierePerPreventivo(preventivoAccettato);
    const cantieri = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri));
    const preventivi = JSON.parse(localStorage.getItem(STORAGE_KEYS.preventivi));

    expect(risultato.creato).toBe(false);
    expect(risultato.cantiere.id).toBe(cantiereLegacy.id);
    expect(cantieri).toHaveLength(1);
    expect(preventivi[0].cantiereId).toBe(cantiereLegacy.id);
  });

  it("blocca la creazione se il preventivo non è accettato", () => {
    const preventivoBozza = {
      ...preventivoAccettato,
      stato: "Bozza",
    };

    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoBozza]));

    expect(() => creaCantierePerPreventivo(preventivoBozza)).toThrow(
      "Il preventivo deve essere accettato"
    );
    expect(trovaCantiereCollegato(preventivoBozza)).toBeNull();
  });
});
