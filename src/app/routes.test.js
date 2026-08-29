import { describe, expect, it } from "vitest";

import {
  CANTIERE_SEZIONI,
  giornataIdDaLocation,
  routeCantiereGiornataEvidenziata,
  routeCantiereGiornate,
  routeCantiereGiornateFatto,
  routeCantierePagamenti,
  sezioneDaLocation,
  statoNavigazioneCantiere,
} from "./routes";

describe("routes UX-9.0 — navigazione cantiere", () => {
  it("routeCantierePagamenti usa query sezione", () => {
    expect(routeCantierePagamenti("c1")).toBe(
      "/cantiere/c1?sezione=sezione-pagamenti"
    );
  });

  it("routeCantiereGiornate usa query previsto", () => {
    expect(routeCantiereGiornate("c1")).toBe(
      "/cantiere/c1?sezione=sezione-programmazione"
    );
  });

  it("routeCantiereGiornateFatto usa query consuntivo", () => {
    expect(routeCantiereGiornateFatto("c1")).toBe(
      "/cantiere/c1?sezione=sezione-registro-lavori"
    );
  });

  it("sezioneDaLocation legge state router", () => {
    expect(
      sezioneDaLocation({
        pathname: "/cantiere/1",
        search: "",
        state: { cantiereSezione: CANTIERE_SEZIONI.PAGAMENTI },
      })
    ).toBe("sezione-pagamenti");
  });

  it("sezioneDaLocation legge query ?sezione=", () => {
    expect(
      sezioneDaLocation({
        pathname: "/cantiere/1",
        search: "?sezione=sezione-programmazione",
        state: null,
      })
    ).toBe("sezione-programmazione");
  });

  it("statoNavigazioneCantiere normalizza id sezione", () => {
    expect(statoNavigazioneCantiere("#sezione-pagamenti")).toEqual({
      cantiereSezione: "sezione-pagamenti",
    });
  });

  it("sezioneDaLocation legge hash legacy #sezione-*", () => {
    const originale = window.location.hash;
    window.location.hash = "#sezione-pagamenti";
    try {
      expect(
        sezioneDaLocation({
          pathname: "/cantiere/1",
          search: "",
          state: null,
        })
      ).toBe("sezione-pagamenti");
    } finally {
      window.location.hash = originale;
    }
  });

  it("routeCantiereGiornataEvidenziata include sezione e giornataId", () => {
    expect(routeCantiereGiornataEvidenziata("c1", "g42")).toBe(
      "/cantiere/c1?sezione=sezione-programmazione&giornataId=g42"
    );
  });

  it("routeCantiereGiornataEvidenziata senza giornataId → tab programmazione", () => {
    expect(routeCantiereGiornataEvidenziata("c1", "")).toBe(
      routeCantiereGiornate("c1")
    );
  });

  it("giornataIdDaLocation legge query router", () => {
    expect(
      giornataIdDaLocation({
        search: "?sezione=sezione-programmazione&giornataId=g7",
      })
    ).toBe("g7");
    expect(giornataIdDaLocation({ search: "" })).toBe("");
  });

  it("giornataIdDaLocation legge query da hash HashRouter", () => {
    const originale = window.location.hash;
    window.location.hash =
      "#/cantiere/c1?sezione=sezione-programmazione&giornataId=g42";
    try {
      expect(giornataIdDaLocation(null)).toBe("g42");
    } finally {
      window.location.hash = originale;
    }
  });
});
