import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import Dashboard from "./Dashboard";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

vi.mock("../services/assistantService", () => ({
  getDashboardAssistant: vi.fn(() => ({ cards: [] })),
}));

describe("Dashboard Home Oggi", () => {
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
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([{ id: "p1", stato: "Bozza", cliente: "Bianchi" }])
    );
    localStorage.setItem(
      STORAGE_KEYS.listaSpesa,
      JSON.stringify([{ id: "a1", nome: "Cavo", acquistato: false }])
    );
  });

  it("mostra saluto, riepilogo oggi, azioni e continua", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-oggi")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Giuseppe/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Oggi$/i })).toBeInTheDocument();
    expect(screen.getByTestId("home-riepilogo-cantieri-aperti")).toHaveTextContent(
      "1"
    );
    expect(
      screen.getByTestId("home-riepilogo-preventivi-inviare")
    ).toHaveTextContent("1");
    expect(screen.getByTestId("home-riepilogo-materiali")).toHaveTextContent("1");
    expect(
      screen.getByRole("heading", { name: /La tua giornata/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Azioni rapide/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Continua dove hai lasciato/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("entry-nuovo-preventivo")).toHaveAttribute(
      "href",
      "/preventivi"
    );
    expect(screen.getByTestId("entry-nuovo-cantiere")).toHaveAttribute(
      "href",
      "/cantieri?nuovo=1"
    );
    expect(screen.getByTestId("entry-clienti")).toHaveAttribute("href", "/clienti");
    expect(screen.getByTestId("entry-archivio")).toHaveAttribute(
      "href",
      "/archivio"
    );
    expect(screen.queryByRole("link", { name: /Nuovo Cliente/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("home-assistant")).not.toBeInTheDocument();
  });

  it("stato vuoto mostra messaggio operativo", () => {
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.listaSpesa, JSON.stringify([]));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-oggi-vuoto")).toBeInTheDocument();
  });
});
