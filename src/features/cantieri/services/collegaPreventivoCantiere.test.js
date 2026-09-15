import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { creaCantiere } from "../cantieriDomain";
import { collegaPreventivoACantiereEsistente } from "./collegaPreventivoCantiereService";
import { convertiPreventivoInCantiere } from "./preventivoCantiereService";
import { leggiCantieriTutti } from "../../../repositories/cantieriRepository";
import { leggiPreventiviTutti } from "../../../repositories/preventiviRepository";

vi.mock("../../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

describe("collegaPreventivoACantiereEsistente", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("collega preventivo a lavoro esistente senza creare secondo cantiere", () => {
    const cantiere = creaCantiere({
      nome: "Rossi",
      cliente: "Rossi",
      tipoIntervento: "Riparazione",
      descrizioneIntervento: "Quadro",
    });
    cantiere.pagamenti = [
      { id: "p1", data: "01/09/2026", importo: 100, tipo: "acconto" },
    ];
    cantiere.spese = [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 40,
        descrizione: "Materiale",
        categoria: "materiali",
      },
    ];
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([cantiere]));

    const preventivo = {
      id: 501,
      numero: "PREV-501",
      cliente: "Rossi",
      stato: "Bozza",
      totale: 1200,
      lavorazioni: [{ id: "l1", nome: "Punto luce", quantita: 1, prezzo: 100 }],
    };
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([preventivo]));

    const esito = collegaPreventivoACantiereEsistente(cantiere.id, preventivo.id);
    expect(esito.success).toBe(true);
    expect(esito.creato).toBe(false);

    const cantieri = leggiCantieriTutti();
    expect(cantieri).toHaveLength(1);
    expect(cantieri[0].preventivoId).toBe(501);
    expect(cantieri[0].preventivoNumero).toBe("PREV-501");
    expect(cantieri[0].pagamenti).toHaveLength(1);
    expect(cantieri[0].spese).toHaveLength(1);

    const preventivi = leggiPreventiviTutti();
    expect(preventivi[0].cantiereId).toBe(cantiere.id);
  });

  it("non crea secondo cantiere se si usa flusso Preventivo → Cantiere già collegato", () => {
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        {
          id: 101,
          numero: "PREV-101",
          cliente: "Mario",
          stato: "Accettato",
          lavorazioni: [{ id: "l1", nome: "A", quantita: 1, prezzo: 50 }],
        },
      ])
    );
    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify([]));

    const primo = convertiPreventivoInCantiere({
      id: 101,
      numero: "PREV-101",
      cliente: "Mario",
      stato: "Accettato",
      lavorazioni: [{ id: "l1", nome: "A", quantita: 1, prezzo: 50 }],
    });
    expect(primo.creato).toBe(true);

    const secondo = convertiPreventivoInCantiere(primo.preventivo);
    expect(secondo.creato).toBe(false);
    expect(leggiCantieriTutti()).toHaveLength(1);
  });
});
