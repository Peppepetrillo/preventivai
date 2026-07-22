import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { SERIE_CIVILE_DEFAULT_ID } from "./contestoPreventivoModel";
import {
  leggiSerieCivili,
  raccogliSerieCiviliInUso,
  salvaSerieCivili,
} from "./serieCiviliStorage";

describe("serieCiviliStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inizializza con BTicino Living Now", () => {
    const elenco = leggiSerieCivili();
    expect(elenco[0].id).toBe(SERIE_CIVILE_DEFAULT_ID);
    expect(elenco[0].nome).toBe("BTicino Living Now");
    expect(localStorage.getItem(STORAGE_KEYS.serieCivili)).toBeTruthy();
  });

  it("persiste catalogo locale", () => {
    salvaSerieCivili([
      { id: SERIE_CIVILE_DEFAULT_ID, nome: "BTicino Living Now", system: true },
      { id: "x", nome: "Vimar", system: false },
    ]);
    expect(leggiSerieCivili()).toHaveLength(2);
  });

  it("raccoglie id in uso da preventivi forward-compatible", () => {
    const ids = raccogliSerieCiviliInUso([
      { id: 1, contesto: { serieCivileId: "a" } },
      { id: 2, serieCivileId: "b" },
      { id: 3 },
    ]);
    expect(ids.sort()).toEqual(["a", "b"]);
  });
});
