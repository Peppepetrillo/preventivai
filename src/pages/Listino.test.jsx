import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { ROUTES } from "../app/routes";
import { listinoBase } from "../data/listinoBase";
import Listino from "./Listino";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

describe("Listino — navigazione Back", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.listino, JSON.stringify(listinoBase));
  });

  it("mostra Indietro verso Altro e pagina listino", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.listino]}>
        <Listino />
      </MemoryRouter>
    );

    const back = screen.getByTestId("listino-link-impostazioni");
    expect(back).toHaveAttribute("data-parent", ROUTES.altro);
    expect(back).toHaveClass("min-h-[44px]");
    expect(screen.getByRole("heading", { name: "Listino" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nuova lavorazione/i })).toBeInTheDocument();
  });

  it("empty state mostra CTA Nuova lavorazione", async () => {
    localStorage.setItem(STORAGE_KEYS.listino, JSON.stringify([]));

    render(
      <MemoryRouter initialEntries={[ROUTES.listino]}>
        <Listino />
      </MemoryRouter>
    );

    expect(screen.getByText("Catalogo vuoto")).toBeInTheDocument();
    const cta = screen.getByTestId("listino-empty-cta");
    expect(cta).toBeInTheDocument();

    cta.click();
    expect(
      await screen.findByRole("heading", { name: /Nuova lavorazione/i })
    ).toBeInTheDocument();
  });
});
