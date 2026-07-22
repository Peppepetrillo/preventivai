import { describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import {
  creaPathFotoCantiereImmutabile,
  payloadContieneDataUrl,
  preparaPayloadCloud,
  sanitizzaCantieriPerAppRecords,
} from "./cloudMediaPayload";

describe("cloudMediaPayload", () => {
  it("crea path foto immutabili distinti", () => {
    const a = creaPathFotoCantiereImmutabile({
      utenteId: "u1",
      cantiereId: "c1",
      fotoId: "f1",
      estensione: "jpeg",
    });
    const b = creaPathFotoCantiereImmutabile({
      utenteId: "u1",
      cantiereId: "c1",
      fotoId: "f1",
      estensione: "jpeg",
    });

    expect(a).toMatch(/^u1\/c1\/f1-/);
    expect(a).not.toBe(b);
  });

  it("rimuove data: URL dal payload cantieri per app_records", () => {
    const cantieri = [
      {
        id: "c1",
        foto: [
          {
            id: "f1",
            src: "data:image/jpeg;base64,AAA",
            miniatura: "data:image/jpeg;base64,THUMB",
            daSincronizzare: true,
          },
          {
            id: "f2",
            src: "",
            storagePath: "u1/c1/f2.jpeg",
            miniatura: "data:image/jpeg;base64,OK",
          },
        ],
      },
    ];

    const sanitizzati = sanitizzaCantieriPerAppRecords(cantieri);
    expect(payloadContieneDataUrl(sanitizzati)).toBe(false);
    expect(sanitizzati[0].foto[0].src).toBe("");
    expect(sanitizzati[0].foto[0].daSincronizzare).toBe(true);
    expect(sanitizzati[0].foto[0].miniatura).toBe("data:image/jpeg;base64,THUMB");
    expect(sanitizzati[0].foto[1].storagePath).toBe("u1/c1/f2.jpeg");

    // La copia locale originale non viene mutata
    expect(cantieri[0].foto[0].src).toBe("data:image/jpeg;base64,AAA");

    expect(
      payloadContieneDataUrl(
        preparaPayloadCloud(STORAGE_KEYS.cantieri, cantieri)
      )
    ).toBe(false);
  });
});
