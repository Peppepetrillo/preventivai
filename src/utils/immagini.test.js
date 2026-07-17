import { describe, expect, it, vi } from "vitest";
import { comprimiImmagine, generaMiniatura } from "./immagini";

function preparaCanvasImmagine(risultato = "data:image/jpeg;base64,compressed") {
  const drawImage = vi.fn();
  const toDataURL = vi.fn(() => risultato);
  const createElementOriginale = document.createElement.bind(document);
  const createElement = vi.spyOn(document, "createElement");

  createElement.mockImplementation((tagName, options) => {
    if (tagName === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({ drawImage })),
        toDataURL,
      };
    }

    return createElementOriginale(tagName, options);
  });

  const OriginalImage = globalThis.Image;

  class MockImage {
    width = 2400;
    height = 1200;
    onload = null;
    onerror = null;

    set src(_value) {
      this.onload?.();
    }
  }

  globalThis.Image = MockImage;

  return {
    drawImage,
    toDataURL,
    ripristina() {
      createElement.mockRestore();
      globalThis.Image = OriginalImage;
    },
  };
}

describe("immagini", () => {
  it("restituisce una data URL compressa quando canvas e Image sono disponibili", async () => {
    const mock = preparaCanvasImmagine();

    await expect(comprimiImmagine("data:image/png;base64,input", 1200, 0.7))
      .resolves.toBe("data:image/jpeg;base64,compressed");

    expect(mock.drawImage).toHaveBeenCalled();
    expect(mock.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.7);

    mock.ripristina();
  });

  it("genera miniature usando la compressione a 200px", async () => {
    const mock = preparaCanvasImmagine("data:image/jpeg;base64,thumb-small");

    const risultato = await generaMiniatura("data:image/jpeg;base64,thumb");

    expect(risultato).toBe("data:image/jpeg;base64,thumb-small");
    expect(mock.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.6);

    mock.ripristina();
  });

  it("rifiuta formati non supportati", async () => {
    await expect(comprimiImmagine({})).rejects.toThrow("Formato immagine non supportato");
  });
});
