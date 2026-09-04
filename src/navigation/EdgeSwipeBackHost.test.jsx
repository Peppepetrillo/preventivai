import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import { EDGE_SWIPE_CONFIG } from "../app/navigationConfig";
import EdgeSwipeBackHost from "./EdgeSwipeBackHost";
import { eseguiNavigazioneIndietro } from "./navigateBack";

vi.mock("./navigateBack", async () => {
  const actual = await vi.importActual("./navigateBack");
  return {
    ...actual,
    eseguiNavigazioneIndietro: vi.fn(),
  };
});

function fireTouch(type, target, { x, y }, extra = {}) {
  const touch = {
    clientX: x,
    clientY: y,
    identifier: 1,
    target,
  };
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    value: type === "touchend" || type === "touchcancel" ? [] : [touch],
  });
  Object.defineProperty(event, "changedTouches", { value: [touch] });
  Object.defineProperty(event, "target", { value: target });
  Object.assign(event, extra);
  target.dispatchEvent(event);
  return event;
}

function mount(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <EdgeSwipeBackHost />
      <Routes>
        <Route path="*" element={<div data-testid="page">ok</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("EdgeSwipeBackHost", () => {
  beforeEach(() => {
    vi.mocked(eseguiNavigazioneIndietro).mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("completa gesto dal bordo sinistro", () => {
    mount(ROUTES.economia);
    const el = document.body;
    fireTouch("touchstart", el, { x: 10, y: 120 });
    fireTouch("touchmove", el, { x: 40, y: 122 });
    fireTouch("touchend", el, {
      x: 10 + EDGE_SWIPE_CONFIG.minDistancePx + 5,
      y: 124,
    });
    expect(eseguiNavigazioneIndietro).toHaveBeenCalled();
  });

  it("ignora gesto non dal bordo", () => {
    mount(ROUTES.economia);
    const el = document.body;
    fireTouch("touchstart", el, { x: EDGE_SWIPE_CONFIG.edgeWidthPx + 20, y: 100 });
    fireTouch("touchend", el, { x: 200, y: 100 });
    expect(eseguiNavigazioneIndietro).not.toHaveBeenCalled();
  });

  it("ignora gesto troppo corto", () => {
    mount(ROUTES.economia);
    const el = document.body;
    fireTouch("touchstart", el, { x: 8, y: 100 });
    fireTouch("touchend", el, { x: 30, y: 100 });
    expect(eseguiNavigazioneIndietro).not.toHaveBeenCalled();
  });

  it("annulla con drift verticale (scroll)", () => {
    mount(ROUTES.economia);
    const el = document.body;
    fireTouch("touchstart", el, { x: 8, y: 100 });
    fireTouch("touchmove", el, {
      x: 20,
      y: 100 + EDGE_SWIPE_CONFIG.maxVerticalDriftPx + 20,
    });
    fireTouch("touchend", el, {
      x: 8 + EDGE_SWIPE_CONFIG.minDistancePx + 10,
      y: 100 + EDGE_SWIPE_CONFIG.maxVerticalDriftPx + 30,
    });
    expect(eseguiNavigazioneIndietro).not.toHaveBeenCalled();
  });

  it("non attiva su Agenda", () => {
    mount(ROUTES.agenda);
    const el = document.body;
    fireTouch("touchstart", el, { x: 8, y: 100 });
    fireTouch("touchend", el, {
      x: 8 + EDGE_SWIPE_CONFIG.minDistancePx + 10,
      y: 100,
    });
    expect(eseguiNavigazioneIndietro).not.toHaveBeenCalled();
  });

  it("non attiva su BottomNav root", () => {
    mount(ROUTES.altro);
    const el = document.body;
    fireTouch("touchstart", el, { x: 8, y: 100 });
    fireTouch("touchend", el, {
      x: 8 + EDGE_SWIPE_CONFIG.minDistancePx + 10,
      y: 100,
    });
    expect(eseguiNavigazioneIndietro).not.toHaveBeenCalled();
  });

  it("non attiva da input", () => {
    mount(ROUTES.economia);
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireTouch("touchstart", input, { x: 8, y: 100 });
    fireTouch("touchend", input, {
      x: 8 + EDGE_SWIPE_CONFIG.minDistancePx + 10,
      y: 100,
    });
    expect(eseguiNavigazioneIndietro).not.toHaveBeenCalled();
    input.remove();
  });

  it("non attiva da SwipeableRow (data-no-edge-swipe)", () => {
    mount(ROUTES.economia);
    const row = document.createElement("div");
    row.setAttribute("data-no-edge-swipe", "");
    const child = document.createElement("span");
    row.appendChild(child);
    document.body.appendChild(row);
    fireTouch("touchstart", child, { x: 8, y: 100 });
    fireTouch("touchend", child, {
      x: 8 + EDGE_SWIPE_CONFIG.minDistancePx + 10,
      y: 100,
    });
    expect(eseguiNavigazioneIndietro).not.toHaveBeenCalled();
    row.remove();
  });
});
