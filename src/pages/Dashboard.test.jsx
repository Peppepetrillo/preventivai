import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import { STORAGE_KEYS } from "../app/storageKeys";
import Dashboard from "./Dashboard";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

vi.mock("../services/assistantService", () => ({
  getDashboardAssistant: vi.fn(() => ({ cards: [] })),
}));

vi.mock("../features/intelligence", () => ({
  PreventivAISuggestions: () => null,
}));

function oggiLocale() {
  return new Date().toLocaleDateString("it-IT");
}

describe("Dashboard Home Oggi UX-8.2", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.datiAzienda,
      JSON.stringify({ nomeOperatore: "Giuseppe Petrillo" })
    );
  });

  it("mostra header con saluto, data e frase lavori", () => {
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          stato: "In corso",
          cliente: "Rossi",
          orario: "09:30",
          dataIntervento: oggiLocale(),
          aggiornatoIl: "28/07/2026",
        },
      ])
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-oggi")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Giuseppe/i })).toBeInTheDocument();
    expect(screen.getByTestId("home-frase")).toHaveTextContent(/lavoro/i);
    expect(screen.getByRole("heading", { name: /^Oggi$/i })).toBeInTheDocument();
    expect(screen.getByTestId("home-lavoro-c1")).toHaveAttribute("href", "/cantiere/c1");
    expect(screen.getByTestId("home-apri-agenda")).toHaveAttribute("href", ROUTES.agenda);
  });

  it("empty state con 0 lavori oggi", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-oggi-vuoto")).toBeInTheDocument();
    expect(screen.getByText("Giornata libera")).toBeInTheDocument();
    expect(
      screen.getByText("Non hai lavori programmati per oggi.")
    ).toBeInTheDocument();
    expect(screen.getByTestId("home-apri-agenda-vuoto")).toHaveAttribute(
      "href",
      ROUTES.agenda
    );
    expect(screen.getByTestId("home-frase")).toHaveTextContent(
      "Oggi non hai lavori programmati"
    );
  });

  it("sezione Da fare con preventivo, incasso e materiali", () => {
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 7);
    const dataFutura = futuro.toLocaleDateString("it-IT");

    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          stato: "In corso",
          cliente: "Rossi",
          scheduledDate: dataFutura,
          preventivoOriginaleTotale: 1000,
          pagamenti: [{ id: "p1", importo: 550, data: "01/08/2026" }],
          aggiornatoIl: "01/08/2026",
        },
      ])
    );
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([{ id: "pr1", stato: "Bozza", cliente: "Bianchi" }])
    );
    localStorage.setItem(
      STORAGE_KEYS.listaSpesa,
      JSON.stringify([{ id: "a1", nome: "Cavo", acquistato: false }])
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const daFare = screen.getByTestId("home-sezione-da-fare");
    expect(within(daFare).getByRole("heading", { name: /Da fare/i })).toBeInTheDocument();
    expect(screen.getByTestId("home-da-fare-incasso")).toHaveAttribute(
      "href",
      "/cantiere/c1?sezione=sezione-pagamenti"
    );
    expect(screen.getByText("Resta da incassare")).toBeInTheDocument();
    expect(screen.getByTestId("home-da-fare-preventivo")).toHaveAttribute(
      "href",
      "/preventivo/pr1"
    );
    expect(screen.getByTestId("home-da-fare-acquisti")).toHaveAttribute(
      "href",
      ROUTES.acquisti
    );
  });

  it("CTA Nuovo preventivo e continua da dove hai lasciato", () => {
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          stato: "In corso",
          cliente: "Rossi",
          aggiornatoIl: "28/07/2026",
        },
      ])
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-nuovo-preventivo")).toHaveAttribute(
      "href",
      ROUTES.preventiviNuovo
    );
    expect(screen.getByTestId("home-sezione-continua")).toBeInTheDocument();
    expect(screen.getByTestId("home-continua-link")).toHaveAttribute(
      "href",
      "/cantiere/c1"
    );
  });

  it("nasconde continua quando non ci sono dati", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.queryByTestId("home-sezione-continua")).not.toBeInTheDocument();
  });

  it("mostra più lavori in ordine", () => {
    const data = oggiLocale();
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c-tardi",
          stato: "In corso",
          cliente: "Tardi",
          orario: "14:00",
          dataIntervento: data,
        },
        {
          id: "c-mattina",
          stato: "In corso",
          cliente: "Mattina",
          orario: "08:00",
          dataIntervento: data,
        },
      ])
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const cards = screen.getAllByTestId(/^home-lavoro-/);
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAttribute("href", "/cantiere/c-mattina");
    expect(cards[1]).toHaveAttribute("href", "/cantiere/c-tardi");
  });

  it("promemoria compare in Da fare", () => {
    localStorage.setItem(
      STORAGE_KEYS.attivita,
      JSON.stringify([
        {
          id: "att1",
          titolo: "Chiama fornitore",
          data: oggiLocale(),
          ora: "23:30",
          reminder: true,
        },
      ])
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-da-fare-promemoria")).toHaveAttribute(
      "href",
      ROUTES.agenda
    );
  });

  it("riepilogo numerico resta sotto fold", () => {
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([{ id: "c1", stato: "In corso", cliente: "Rossi" }])
    );
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([{ id: "p1", stato: "Bozza", cliente: "Bianchi" }])
    );

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-riepilogo")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Azioni rapide/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /La tua giornata/i })).not.toBeInTheDocument();
  });
});
