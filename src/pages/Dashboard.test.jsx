import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import Dashboard from "./Dashboard";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

describe("Dashboard Home 2.0", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.datiAzienda,
      JSON.stringify({ nomeDitta: "Giuseppe Impianti" })
    );
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          stato: "In corso",
          cliente: "Rossi",
          indirizzo: "Via Roma 1",
          orario: "09:30",
          dataIntervento: new Date().toLocaleDateString("it-IT"),
          materiali: [{ id: "m1", nome: "Cavo", acquistato: false }],
          aggiornatoIl: "28/07/2026",
        },
      ])
    );
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));
  });

  it("mostra saluto, oggi, attenzione, azioni e continua", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Giuseppe/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /La tua giornata/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Attenzione/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Azioni rapide/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Continua dove hai lasciato/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Suggerimenti PreventivAI/i)).toBeInTheDocument();
    expect(screen.getAllByText("Rossi").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Da comprare oggi/i)).toBeInTheDocument();
    expect(screen.getByTestId("home-link-acquisti")).toHaveAttribute(
      "href",
      "/acquisti"
    );
    expect(screen.getByTestId("home-acquisti-badge")).toHaveTextContent("1");
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Nuovo Preventivo/i })
    ).toHaveAttribute("href", "/preventivi");
    expect(
      screen.getByRole("link", { name: /Nuovo Cantiere/i })
    ).toHaveAttribute("href", "/cantieri?nuovo=1");
    expect(
      screen.getByRole("link", { name: /Nuovo Cliente/i })
    ).toHaveAttribute("href", "/clienti?nuovo=1");
    expect(screen.queryByText(/Apprendimento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pattern individuati/i)).not.toBeInTheDocument();
  });
});
