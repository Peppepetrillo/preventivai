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

describe("Listino — navigazione Impostazioni", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.listino, JSON.stringify(listinoBase));
  });

  it("mostra link Indietro verso Impostazioni e pagina listino", () => {
    render(
      <MemoryRouter>
        <Listino />
      </MemoryRouter>
    );

    const link = screen.getByTestId("listino-link-impostazioni");
    expect(link).toHaveAttribute("href", ROUTES.impostazioni);
    expect(link).toHaveClass("min-h-[44px]");
    expect(screen.getByRole("heading", { name: "Listino" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nuova lavorazione/i })).toBeInTheDocument();
  });
});
