import { describe, expect, it } from "vitest";

import {
  TEMA,
  applicaTemaDom,
  normalizzaPreferenzaTema,
  risolviTemaEffettivo,
} from "./themeDomain";

describe("themeDomain", () => {
  it("normalizza preferenza con default sistema", () => {
    expect(normalizzaPreferenzaTema("chiaro")).toBe(TEMA.chiaro);
    expect(normalizzaPreferenzaTema("SCURO")).toBe(TEMA.scuro);
    expect(normalizzaPreferenzaTema("sistema")).toBe(TEMA.sistema);
    expect(normalizzaPreferenzaTema("")).toBe(TEMA.sistema);
    expect(normalizzaPreferenzaTema(null)).toBe(TEMA.sistema);
  });

  it("risolve chiaro/scuro/sistema", () => {
    expect(risolviTemaEffettivo(TEMA.chiaro, { matches: true })).toBe("light");
    expect(risolviTemaEffettivo(TEMA.scuro, { matches: false })).toBe("dark");
    expect(risolviTemaEffettivo(TEMA.sistema, { matches: true })).toBe("dark");
    expect(risolviTemaEffettivo(TEMA.sistema, { matches: false })).toBe(
      "light"
    );
  });

  it("applica data-theme e color-scheme sul documentElement", () => {
    document.documentElement.removeAttribute("data-theme");
    applicaTemaDom("dark", document);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    applicaTemaDom("light", document);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
