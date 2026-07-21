import { describe, expect, it } from "vitest";

import {
  gestisciFocusTrap,
  trovaElementiFocusabili,
} from "./bottomSheetUtils";

describe("bottomSheetUtils", () => {
  it("trova gli elementi focusabili nel pannello", () => {
    const contenitore = document.createElement("div");
    contenitore.innerHTML = `
      <button id="primo">Primo</button>
      <button id="secondo">Secondo</button>
    `;

    const elementi = trovaElementiFocusabili(contenitore);

    expect(elementi).toHaveLength(2);
  });

  it("cicla il focus con Tab sull'ultimo elemento", () => {
    const contenitore = document.createElement("div");
    contenitore.innerHTML = `
      <button id="primo">Primo</button>
      <button id="secondo">Secondo</button>
    `;
    document.body.appendChild(contenitore);

    const secondo = contenitore.querySelector("#secondo");
    secondo.focus();

    const evento = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });

    gestisciFocusTrap(evento, contenitore);

    expect(evento.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe("primo");

    contenitore.remove();
  });
});
