import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import Impostazioni from "./Impostazioni";

vi.mock("../contexts/cloudAuthContext", () => ({
  useCloudAuth: () => ({
    configurato: false,
    utente: null,
    sincronizzazione: "offline",
    errore: "",
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("Impostazioni UX-1", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("link Archivio preventivi", () => {
    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );
    const link = screen.getByTestId("impostazioni-link-archivio");
    expect(link).toHaveAttribute("href", ROUTES.archivio);
    expect(screen.getByText(/Archivio preventivi/i)).toBeInTheDocument();
  });

  it("link Listino prezzi con touch target coerente", () => {
    render(
      <MemoryRouter>
        <Impostazioni />
      </MemoryRouter>
    );
    const link = screen.getByTestId("impostazioni-link-listino");
    expect(link).toHaveAttribute("href", ROUTES.listino);
    expect(link).toHaveClass("min-h-[64px]");
    expect(screen.getByText("Listino prezzi")).toBeInTheDocument();
    expect(
      screen.getByText("Gestione lavorazioni e prezzi")
    ).toBeInTheDocument();
  });
});
