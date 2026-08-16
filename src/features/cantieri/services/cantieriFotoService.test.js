import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../utils/immagini", () => ({
  comprimiImmagine: vi.fn(async () => "data:image/jpeg;base64,compressa"),
  generaMiniatura: vi.fn(async () => "data:image/jpeg;base64,miniatura"),
}));

vi.mock("../../../services/cloudSyncService", () => ({
  creaUrlFirmatoFotoCantiere: vi.fn(async () => "https://foto-firmata.test/foto.jpg"),
  eliminaFotoCantiereStorage: vi.fn(),
}));

import {
  creaUrlFirmatoFotoCantiere,
  eliminaFotoCantiereStorage,
} from "../../../services/cloudSyncService";
import { comprimiImmagine, generaMiniatura } from "../../../utils/immagini";
import {
  apriFotoCantiere,
  eliminaStorageFotoCantiere,
  eliminaStorageFotoCantieri,
  fileFotoValido,
  preparaFotoCantiere,
  risolviSrcFotoCantiere,
} from "./cantieriFotoService";

describe("cantieriFotoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("valida solo file immagine", () => {
    expect(fileFotoValido({ type: "image/jpeg" })).toBe(true);
    expect(fileFotoValido({ type: "application/pdf" })).toBe(false);
    expect(fileFotoValido(null)).toBe(false);
  });

  it("prepara una foto compressa con miniatura e flag di sincronizzazione", async () => {
    const file = { name: "cantiere.jpg", type: "image/jpeg" };

    const foto = await preparaFotoCantiere(file);

    expect(comprimiImmagine).toHaveBeenCalledWith(file, 1200, 0.7);
    expect(generaMiniatura).toHaveBeenCalledWith(file);
    expect(foto).toMatchObject({
      nome: "cantiere.jpg",
      src: "data:image/jpeg;base64,compressa",
      miniatura: "data:image/jpeg;base64,miniatura",
      daSincronizzare: true,
    });
  });

  it("elimina dallo storage una foto o una lista di foto", () => {
    eliminaStorageFotoCantiere({ storagePath: "foto/1.jpg" });
    eliminaStorageFotoCantieri([
      { storagePath: "foto/2.jpg" },
      { storagePath: "foto/3.jpg" },
    ]);

    expect(eliminaFotoCantiereStorage).toHaveBeenCalledWith("foto/1.jpg");
    expect(eliminaFotoCantiereStorage).toHaveBeenCalledWith([
      "foto/2.jpg",
      "foto/3.jpg",
    ]);
  });

  it("risolve URL firmato quando la foto ha uno storagePath", async () => {
    const src = await risolviSrcFotoCantiere({
      src: "data:image/jpeg;base64,locale",
      storagePath: "foto/1.jpg",
    });

    expect(creaUrlFirmatoFotoCantiere).toHaveBeenCalledWith("foto/1.jpg");
    expect(src).toBe("https://foto-firmata.test/foto.jpg");
    expect(window.open).not.toHaveBeenCalled();
  });

  it("risolve data URL locale per foto offline/pending", async () => {
    const src = await risolviSrcFotoCantiere({
      src: "data:image/jpeg;base64,full",
      miniatura: "data:image/jpeg;base64,thumb",
      daSincronizzare: true,
    });

    expect(creaUrlFirmatoFotoCantiere).not.toHaveBeenCalled();
    expect(src).toBe("data:image/jpeg;base64,full");
    expect(window.open).not.toHaveBeenCalled();
  });

  it("usa miniatura se src locale assente", async () => {
    const src = await risolviSrcFotoCantiere({
      src: "",
      miniatura: "data:image/jpeg;base64,thumb",
    });

    expect(src).toBe("data:image/jpeg;base64,thumb");
  });

  it("apriFotoCantiere non apre finestre e restituisce lo src", async () => {
    const src = await apriFotoCantiere({
      src: "data:image/jpeg;base64,x",
    });

    expect(src).toBe("data:image/jpeg;base64,x");
    expect(window.open).not.toHaveBeenCalled();
  });
});
