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

  it("sanitizza progettoElettrico lasciando solo metadata (no binari)", () => {
    const cantieri = [
      {
        id: "c1",
        progettoElettrico: {
          id: "pe1",
          tipo: "pdf",
          nome: "schema.pdf",
          mimeType: "application/pdf",
          size: 12,
          blobId: "b1",
          cantiereId: "c1",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          src: "data:application/pdf;base64,AAA",
          contenuto: "NOPE",
        },
      },
    ];
    const sanitizzati = sanitizzaCantieriPerAppRecords(cantieri);
    expect(sanitizzati[0].progettoElettrico.src).toBeUndefined();
    expect(sanitizzati[0].progettoElettrico.contenuto).toBeUndefined();
    expect(sanitizzati[0].progettoElettrico.blobId).toBe("b1");
    expect(sanitizzati[0].progettoElettrico.nome).toBe("schema.pdf");
  });

  it("sanitizza progettiElettrici[] metadata-only (no Base64)", () => {
    const cantieri = [
      {
        id: "c1",
        progettiElettrici: [
          {
            id: "pe1",
            tipo: "pdf",
            nome: "unifilare.pdf",
            mimeType: "application/pdf",
            size: 12,
            blobId: "b1",
            cantiereId: "c1",
            src: "data:application/pdf;base64,AAA",
            contenuto: "NOPE",
          },
          {
            id: "pe2",
            tipo: "image",
            nome: "planimetria",
            mimeType: "image/jpeg",
            size: 8,
            blobId: "b2",
            cantiereId: "c1",
            dataUrl: "data:image/jpeg;base64,BBB",
          },
        ],
      },
    ];
    const sanitizzati = sanitizzaCantieriPerAppRecords(cantieri);
    expect(sanitizzati[0].progettiElettrici).toHaveLength(2);
    expect(sanitizzati[0].progettiElettrici[0].src).toBeUndefined();
    expect(sanitizzati[0].progettiElettrici[0].contenuto).toBeUndefined();
    expect(sanitizzati[0].progettiElettrici[1].dataUrl).toBeUndefined();
    expect(sanitizzati[0].progettiElettrici[1].blobId).toBe("b2");
  });

});
