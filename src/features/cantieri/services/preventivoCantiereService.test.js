import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../../../app/storageKeys";
import {
  convertiPreventivoInCantiere,
  creaCantierePerPreventivo,
  trovaCantiereCollegato,
} from "./preventivoCantiereService";

vi.mock("../../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

const preventivoBase = {
  id: 101,
  numero: "PREV-101",
  cliente: "Mario Rossi",
  stato: "Bozza",
  indirizzo: "Via Roma 1, Milano",
  note: "Intervento urgente in soggiorno",
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
    localStorage.setItem(
      STORAGE_KEYS.clienti,
      JSON.stringify([
        {
          id: 55,
          nome: "Mario Rossi",
          telefono: "3331112222",
        },
      ])
    );
  });

  it("convertiPreventivoInCantiere crea cantiere, accetta il preventivo e collega i record", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoBase]));

    const risultato = convertiPreventivoInCantiere(preventivoBase);

    const cantieri = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri));
    const preventivi = JSON.parse(localStorage.getItem(STORAGE_KEYS.preventivi));

    expect(risultato.creato).toBe(true);
    expect(cantieri).toHaveLength(1);
    expect(cantieri[0]).toMatchObject({
      cliente: "Mario Rossi",
      indirizzo: "Via Roma 1, Milano",
      note: "Intervento urgente in soggiorno",
      preventivoId: 101,
      preventivoNumero: "PREV-101",
      clienteId: 55,
      stato: "Da iniziare",
      origine: "preventivo",
    });
    expect(cantieri[0].dataCreazione).toBeTruthy();
    expect(cantieri[0].dataAccettazione).toBeTruthy();
    expect(cantieri[0].lavorazioniOrigine).toHaveLength(1);
    expect(cantieri[0].varianti).toEqual([]);
    expect(cantieri[0].preventivoOriginaleTotale).toBe(90);
    expect(cantieri[0].checklist[0].testo).toBe("Eseguire Installazione punto luce");
    expect(preventivi[0]).toMatchObject({
      stato: "Accettato",
      cantiereId: cantieri[0].id,
    });
    expect(preventivi[0].dataAccettazione).toBeTruthy();
  });

  it("non crea duplicati quando il preventivo è già collegato a un cantiere", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoBase]));

    const primoRisultato = convertiPreventivoInCantiere(preventivoBase);
    const secondoRisultato = convertiPreventivoInCantiere({
      ...preventivoBase,
      stato: "Accettato",
      cantiereId: primoRisultato.cantiere.id,
      dataAccettazione: "21/07/2026",
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
      preventivoId: preventivoBase.id,
      stato: "Da iniziare",
      checklist: [],
      materiali: [],
      foto: [],
    };

    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoBase]));
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([cantiereLegacy]));

    const risultato = convertiPreventivoInCantiere(preventivoBase);
    const cantieri = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri));
    const preventivi = JSON.parse(localStorage.getItem(STORAGE_KEYS.preventivi));

    expect(risultato.creato).toBe(false);
    expect(risultato.cantiere.id).toBe(cantiereLegacy.id);
    expect(cantieri).toHaveLength(1);
    expect(preventivi[0].cantiereId).toBe(cantiereLegacy.id);
  });

  it("mantiene compatibilità con creaCantierePerPreventivo", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoBase]));

    const risultato = creaCantierePerPreventivo(preventivoBase);

    expect(risultato.creato).toBe(true);
    expect(trovaCantiereCollegato(risultato.preventivo)).not.toBeNull();
  });
});
