import { afterEach, describe, expect, it, vi } from "vitest";

import {
  eseguiNavigazioneIndietro,
  isOverlayNavigazioneAperto,
  setNavigazioneIndietroOverride,
  targetEscludeEdgeSwipe,
} from "./navigateBack";

describe("navigateBack — eseguiNavigazioneIndietro", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setNavigazioneIndietroOverride(null);
  });

  it("override PageBackLink to ha priorità su history e parent", () => {
    vi.stubGlobal("history", { state: { idx: 5 } });
    setNavigazioneIndietroOverride("/cliente/1");
    const navigate = vi.fn();
    const esito = eseguiNavigazioneIndietro(navigate, "/nuovo-preventivo");
    expect(navigate).toHaveBeenCalledWith("/cliente/1");
    expect(esito.metodo).toBe("override");
  });

  it("usa history quando idx > 0", () => {
    vi.stubGlobal("history", { state: { idx: 3 } });
    const navigate = vi.fn();
    const esito = eseguiNavigazioneIndietro(navigate, "/economia");
    expect(navigate).toHaveBeenCalledWith(-1);
    expect(esito).toEqual({ metodo: "history", destinazione: null });
  });

  it("fallback parent quando history non disponibile (deep link)", () => {
    vi.stubGlobal("history", { state: { idx: 0 } });
    const navigate = vi.fn();
    const esito = eseguiNavigazioneIndietro(navigate, "/economia");
    expect(navigate).toHaveBeenCalledWith("/altro");
    expect(esito).toEqual({ metodo: "parent", destinazione: "/altro" });
  });

  it("forceParent ignora history", () => {
    vi.stubGlobal("history", { state: { idx: 5 } });
    const navigate = vi.fn();
    const esito = eseguiNavigazioneIndietro(navigate, "/dati-azienda", {
      forceParent: true,
    });
    expect(navigate).toHaveBeenCalledWith("/impostazioni");
    expect(esito.metodo).toBe("parent");
  });

  it("route senza parent → home", () => {
    vi.stubGlobal("history", { state: { idx: 0 } });
    const navigate = vi.fn();
    const esito = eseguiNavigazioneIndietro(navigate, "/sconosciuta");
    expect(navigate).toHaveBeenCalledWith("/");
    expect(esito.metodo).toBe("home");
  });
});

describe("navigateBack — esclusioni edge swipe", () => {
  it("esclude input / textarea / slider / dialog", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    expect(targetEscludeEdgeSwipe(input)).toBe(true);

    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    expect(targetEscludeEdgeSwipe(ta)).toBe(true);

    const slider = document.createElement("div");
    slider.setAttribute("role", "slider");
    document.body.appendChild(slider);
    expect(targetEscludeEdgeSwipe(slider)).toBe(true);

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    const dentro = document.createElement("span");
    dialog.appendChild(dentro);
    document.body.appendChild(dialog);
    expect(targetEscludeEdgeSwipe(dentro)).toBe(true);

    input.remove();
    ta.remove();
    slider.remove();
    dialog.remove();
  });

  it("esclude data-no-edge-swipe (Agenda / SwipeableRow)", () => {
    const wrap = document.createElement("div");
    wrap.setAttribute("data-no-edge-swipe", "");
    const child = document.createElement("span");
    wrap.appendChild(child);
    document.body.appendChild(wrap);
    expect(targetEscludeEdgeSwipe(child)).toBe(true);
    wrap.remove();
  });

  it("non esclude target neutro", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(targetEscludeEdgeSwipe(div)).toBe(false);
    div.remove();
  });

  it("rileva overlay dialog aperto", () => {
    expect(isOverlayNavigazioneAperto()).toBe(false);
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    document.body.appendChild(dialog);
    expect(isOverlayNavigazioneAperto()).toBe(true);
    dialog.remove();
  });
});
