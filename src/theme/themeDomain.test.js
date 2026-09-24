import { describe, expect, it } from "vitest";

import {
  TEMA,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
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

  it("aggiorna meta theme-color con palette Visual System 2.1", () => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    applicaTemaDom("dark", document);
    expect(meta.getAttribute("content")).toBe(THEME_COLOR_DARK);
    applicaTemaDom("light", document);
    expect(meta.getAttribute("content")).toBe(THEME_COLOR_LIGHT);
    expect(THEME_COLOR_LIGHT).toBe("#d8e2ef");
    expect(THEME_COLOR_DARK).toBe("#050d18");
  });
});
