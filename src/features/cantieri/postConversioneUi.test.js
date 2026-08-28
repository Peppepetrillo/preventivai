import { afterEach, describe, expect, it } from "vitest";

import {
  chiudiPostConversioneCantiere,
  leggiPostConversioneCantiere,
  marcaPostConversioneCantiere,
} from "./postConversioneUi";

describe("postConversioneUi", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("marca e legge banner post-conversione", () => {
    marcaPostConversioneCantiere("c1", { incassatoPreventivo: 250 });
    expect(leggiPostConversioneCantiere("c1")).toEqual({
      incassatoPreventivo: 250,
    });
  });

  it("chiude il banner", () => {
    marcaPostConversioneCantiere("c1", { incassatoPreventivo: 10 });
    chiudiPostConversioneCantiere("c1");
    expect(leggiPostConversioneCantiere("c1")).toBeNull();
  });
});
