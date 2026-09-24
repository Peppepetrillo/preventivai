import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Operai from "../../pages/Operai";
import { salvaOperai } from "../../repositories/operaiRepository";

vi.mock("../../components/BottomSheet", () => ({
  default: ({ open, children, title }) =>
    open ? <div data-testid="sheet">{title}{children}</div> : null,
}));

describe("Operai page", () => {
  beforeEach(() => {
    salvaOperai([]);
  });

  it("mostra empty e apre sheet aggiungi", () => {
    render(
      <MemoryRouter>
        <Operai />
      </MemoryRouter>
    );
    expect(screen.getByTestId("operai-vuoto")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("operai-aggiungi"));
    expect(screen.getByTestId("operaio-sheet")).toBeInTheDocument();
  });
});
