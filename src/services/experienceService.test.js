import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../app/storageKeys";
import {
  creaEsperienzaDaCantiere,
  recuperaEsperienze,
  registraEsperienzaCompletamento,
  salvaEsperienza,
} from "./experienceService";

vi.mock("./cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

const cantiereCompletato = {
  id: 500,
  nome: "Cantiere PREV-101",
  cliente: "Mario Rossi",
  indirizzo: "Via Roma 1",
  stato: "Completato",
  preventivoId: 101,
  tipoLavoro: "impianto",
  origine: "preventivo",
  dataCreazione: "15/07/2026",
  creatoIl: "15/07/2026",
  aggiornatoIl: "21/07/2026",
  lavorazioniOrigine: [
    { id: "l-1", nome: "Punto luce", quantita: 2, prezzo: 45, unita: "cad" },
  ],
  checklist: [
    { id: "101-check-0", testo: "Eseguire Punto luce", completata: true },
    { id: String(Date.now()), testo: "Verifica finale impianto", completata: true },
  ],
  materiali: [
    { id: 1, nome: "Cavo 2.5mm", quantita: 50, unita: "m" },
  ],
  note: "Lavoro completato senza problemi.",
};

describe("experienceService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un record esperienza con tutti i campi richiesti", () => {
    const esperienza = creaEsperienzaDaCantiere(cantiereCompletato);

    expect(esperienza).toMatchObject({
      cantiereId: 500,
      preventivoId: 101,
      cliente: "Mario Rossi",
      tipoLavoro: "impianto",
      note: "Lavoro completato senza problemi.",
      dataCreazione: "15/07/2026",
      dataCompletamento: "21/07/2026",
    });
    expect(esperienza.checklistCompletata).toHaveLength(2);
    expect(esperienza.attivitaAggiunte).toEqual(["Verifica finale impianto"]);
    expect(esperienza.materiali).toEqual([
      { nome: "Cavo 2.5mm", quantita: 50, unita: "m" },
    ]);
    expect(esperienza.durataGiorni).toBe(6);
    expect(esperienza.id).toBeTruthy();
  });

  it("salva e recupera esperienze dal repository", async () => {
    const { salvaDatoCloud } = await import("./cloudSyncService");
    const esperienza = creaEsperienzaDaCantiere(cantiereCompletato);

    salvaEsperienza(esperienza);
    const elenco = recuperaEsperienze();

    expect(elenco).toHaveLength(1);
    expect(elenco[0].cantiereId).toBe(500);
    expect(salvaDatoCloud).toHaveBeenCalledWith(
      STORAGE_KEYS.esperienze,
      expect.arrayContaining([expect.objectContaining({ cantiereId: 500 })])
    );
  });

  it("registraEsperienzaCompletamento salva automaticamente", () => {
    const esperienza = registraEsperienzaCompletamento(cantiereCompletato);

    expect(esperienza).not.toBeNull();

    const salvate = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.esperienze)
    );
    expect(salvate).toHaveLength(1);
    expect(salvate[0].cantiereId).toBe(500);
  });

  it("restituisce null per cantiere nullo", () => {
    expect(creaEsperienzaDaCantiere(null)).toBeNull();
    expect(registraEsperienzaCompletamento(null)).toBeNull();
  });

  it("gestisce cantiere senza preventivoId", () => {
    const cantiereManuale = {
      ...cantiereCompletato,
      preventivoId: undefined,
      lavorazioniOrigine: undefined,
    };

    const esperienza = creaEsperienzaDaCantiere(cantiereManuale);

    expect(esperienza.preventivoId).toBeNull();
    expect(esperienza.attivitaAggiunte).toHaveLength(2);
  });
});
