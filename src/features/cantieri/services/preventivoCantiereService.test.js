import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_EVENTS } from "../../../app/events";
import { CLOUD_SYNC_STORAGE_KEYS, STORAGE_KEYS } from "../../../app/storageKeys";
import { STATI_PREVENTIVO } from "../../../domain/workflow";
import {
  leggiCantieri,
  leggiCantieriTutti,
} from "../../../repositories/cantieriRepository";
import { leggiPreventivi } from "../../../repositories/preventiviRepository";
import {
  convertiPreventivoInCantiere,
  creaCantierePerPreventivo,
  creaCantierePerPreventivoId,
  trovaCantiereCollegato,
} from "./preventivoCantiereService";

vi.mock("../../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn((chiave, valore) => {
    const coda = JSON.parse(
      localStorage.getItem(CLOUD_SYNC_STORAGE_KEYS.queue) || "[]"
    );
    const senza = coda.filter((entry) => entry?.[0] !== chiave);
    senza.push([chiave, valore]);
    localStorage.setItem(
      CLOUD_SYNC_STORAGE_KEYS.queue,
      JSON.stringify(senza)
    );
  }),
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
    expect(cantieri[0].checklist[0].testo).toBe(
      "Eseguire Installazione punto luce"
    );
    expect(preventivi[0]).toMatchObject({
      stato: "Convertito",
      cantiereId: cantieri[0].id,
    });
    expect(preventivi[0].convertitoAt).toBeTruthy();
    expect(preventivi[0].dataAccettazione).toBeTruthy();
    expect(cantieri[0].preventivoImporto).toBe(90);
  });

  it("non crea duplicati quando il preventivo è già collegato a un cantiere", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoBase]));

    const primoRisultato = convertiPreventivoInCantiere(preventivoBase);
    const secondoRisultato = convertiPreventivoInCantiere({
      ...preventivoBase,
      stato: "Convertito",
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

  it("creaCantierePerPreventivoId rifiuta preventivo non accettato", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivoBase]));
    const esito = creaCantierePerPreventivoId(101);
    expect(esito.success).toBe(false);
    expect(esito.error).toBe("solo_accettato_convertibile");
    expect(leggiCantieri()).toHaveLength(0);
  });

  it("creaCantierePerPreventivoId rifiuta preventivo inesistente", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));
    const esito = creaCantierePerPreventivoId(999);
    expect(esito.success).toBe(false);
    expect(esito.error).toBe("preventivo_non_trovato");
  });

  it("dopo conversione la relazione sopravvive a «reload» (rilettura storage)", () => {
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([{ ...preventivoBase, stato: STATI_PREVENTIVO.ACCETTATO }])
    );
    const creato = creaCantierePerPreventivoId(101);
    expect(creato.success).toBe(true);

    const preventivoDopo = leggiPreventivi().find((p) => String(p.id) === "101");
    const cantiereDopo = leggiCantieriTutti().find(
      (c) => String(c.id) === String(creato.cantiere.id)
    );
    expect(preventivoDopo.cantiereId).toBe(cantiereDopo.id);
    expect(cantiereDopo.preventivoId).toBe(101);
    expect(cantiereDopo.lavorazioniOrigine).toHaveLength(1);
    expect(cantiereDopo.clienteId).toBe(55);
  });

  it("conversione accoda cantieri/preventivi alla coda sync persistente e notifica evento", () => {
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([{ ...preventivoBase, stato: STATI_PREVENTIVO.ACCETTATO }])
    );
    localStorage.setItem(CLOUD_SYNC_STORAGE_KEYS.queue, JSON.stringify([]));

    const spy = vi.fn();
    window.addEventListener(APP_EVENTS.cantieriAggiornati, spy);

    const esito = creaCantierePerPreventivoId(101);
    expect(esito.success).toBe(true);
    expect(spy).toHaveBeenCalled();

    const coda = JSON.parse(
      localStorage.getItem(CLOUD_SYNC_STORAGE_KEYS.queue) || "[]"
    );
    const chiavi = coda.map((entry) => entry[0]);
    expect(chiavi).toContain(STORAGE_KEYS.cantieri);
    expect(chiavi).toContain(STORAGE_KEYS.preventivi);

    window.removeEventListener(APP_EVENTS.cantieriAggiornati, spy);
  });
});
