import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TipologiaImpiantoSelector from "./TipologiaImpiantoSelector";

describe("TipologiaImpiantoSelector", () => {
  it("mostra etichette senza emoji", () => {
    render(
      <TipologiaImpiantoSelector selezione="elettrico" onSeleziona={vi.fn()} />
    );
    const chip = screen.getByTestId("tipologia-elettrico");
    expect(chip.textContent).toMatch(/Elettrico/i);
    expect(chip.textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u);
  });
});
