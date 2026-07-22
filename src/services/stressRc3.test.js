import { describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { filtraPreventiviPerCliente } from "../features/preventivi/archivioPreventiviUtils";
import { calcolaAvanzamentoChecklist } from "../features/cantieri/cantieriDomain";
import {
  payloadContieneDataUrl,
  sanitizzaCantieriPerAppRecords,
} from "./cloudMediaPayload";
import { creaBackupCompleto } from "../utils/backup";
import { limitaElencoVisibile } from "../utils/listPerformance";
import { leggiStorage, salvaStorage } from "../utils/storage";

function generaClienti(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `c-${i}`,
    nome: `Cliente ${i}`,
    telefono: `333${String(i).padStart(7, "0")}`,
  }));
}

function generaPreventivi(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p-${i}`,
    cliente: i % 10 === 0 ? "Target Stress" : `Cliente ${i}`,
    numero: `PREV-${i}`,
    stato: i % 2 === 0 ? "Inviato" : "Bozza",
    totale: 100 + i,
  }));
}

function generaCantieri(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `k-${i}`,
    nome: `Cantiere ${i}`,
    cliente: `Cliente ${i}`,
    stato: "In corso",
    checklist: [
      { id: `ch-${i}-1`, testo: "A", completata: true },
      { id: `ch-${i}-2`, testo: "B", completata: false },
    ],
    foto: [
      {
        id: `f-${i}`,
        src: "data:image/jpeg;base64,FULL",
        miniatura: "data:image/jpeg;base64,THUMB",
        daSincronizzare: true,
      },
    ],
  }));
}

describe("stress RC-3 dataset", () => {
  it("filtra 1000 preventivi in tempo accettabile senza perdere match", () => {
    const preventivi = generaPreventivi(1000);
    const t0 = performance.now();
    const filtrati = filtraPreventiviPerCliente(preventivi, "Target Stress");
    const elapsed = performance.now() - t0;

    expect(filtrati.length).toBe(100);
    expect(elapsed).toBeLessThan(100);
  });

  it("gestisce 500 clienti + 300 cantieri in storage e backup", () => {
    localStorage.clear();
    const clienti = generaClienti(500);
    const cantieri = generaCantieri(300);
    const preventivi = generaPreventivi(1000);

    salvaStorage(STORAGE_KEYS.clienti, clienti);
    salvaStorage(STORAGE_KEYS.cantieri, cantieri);
    salvaStorage(STORAGE_KEYS.preventivi, preventivi);
    salvaStorage(STORAGE_KEYS.esperienze, [{ id: "e1" }]);

    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toHaveLength(500);
    expect(leggiStorage(STORAGE_KEYS.cantieri, [])).toHaveLength(300);
    expect(leggiStorage(STORAGE_KEYS.preventivi, [])).toHaveLength(1000);

    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.clienti]).toHaveLength(500);
    expect(backup.dati[STORAGE_KEYS.esperienze]).toHaveLength(1);

    const sanitizzati = sanitizzaCantieriPerAppRecords(cantieri);
    expect(payloadContieneDataUrl(sanitizzati)).toBe(false);
    expect(cantieri[0].foto[0].src.startsWith("data:")).toBe(true);

    expect(calcolaAvanzamentoChecklist(cantieri[0].checklist)).toBe(50);
    expect(limitaElencoVisibile(clienti, 80)).toHaveLength(80);
  });

  it("non crea duplicati id su dataset sintetico", () => {
    const ids = new Set(generaPreventivi(1000).map((p) => p.id));
    expect(ids.size).toBe(1000);
  });
});
