import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import Storico from "./Storico";

vi.mock("../repositories/cantieriRepository", () => ({
  leggiCantieri: vi.fn(),
}));

import { leggiCantieri } from "../repositories/cantieriRepository";

describe("Storico lavori pagina 17C", () => {
  beforeEach(() => {
    vi.mocked(leggiCantieri).mockReturnValue([
      {
        id: "c-rossi",
        nome: "Impianto appartamento Rossi",
        cliente: "Rossi",
        stato: "Completato",
        totaleLavoro: 5000,
        origine: "diretto",
        pagamenti: [
          { id: "p1", data: "10/09/2026", importo: 1500, tipo: "acconto" },
        ],
        spese: [
          {
            id: "s1",
            data: "08/09/2026",
            importo: 420,
            descrizione: "Materiale",
            categoria: "materiali",
          },
        ],
        registroGiornate: [
          {
            id: "r1",
            data: "05/09/2026",
            oreLavorate: 8,
            operai: ["Giuseppe"],
            attivita: "Cavidotti",
          },
        ],
      },
      {
        id: "c-verdi",
        nome: "Quadro Verdi",
        cliente: "Verdi",
        stato: "Completato",
        totaleLavoro: 2000,
        origine: "diretto",
        pagamenti: [
          { id: "p2", data: "12/09/2026", importo: 800, tipo: "acconto" },
        ],
        spese: [
          {
            id: "s2",
            data: "11/09/2026",
            importo: 100,
            descrizione: "Varie",
            categoria: "altro",
          },
        ],
        registroGiornate: [
          {
            id: "r2",
            data: "10/09/2026",
            oreLavorate: 4,
            operai: ["Giuseppe"],
            attivita: "Quadro",
          },
          {
            id: "r3",
            data: "11/09/2026",
            oreLavorate: 4,
            operai: ["Giuseppe"],
            attivita: "Collaudo",
          },
        ],
      },
      {
        id: "c-aperto",
        nome: "Lavoro aperto",
        cliente: "Bianchi",
        stato: "In corso",
        totaleLavoro: 1000,
        origine: "diretto",
        pagamenti: [],
        spese: [],
        registroGiornate: [],
      },
    ]);
  });

  it("mostra back, riepilogo e conteggio completati", () => {
    render(
      <MemoryRouter>
        <Storico />
      </MemoryRouter>
    );

    expect(screen.getByTestId("storico-back")).toHaveAttribute(
      "href",
      ROUTES.altro
    );
    expect(screen.getByRole("heading", { name: /^Storico$/i })).toBeInTheDocument();
    expect(screen.getByTestId("storico-conteggio")).toHaveTextContent(
      "2 lavori completati"
    );
    expect(screen.getByTestId("storico-kpi-lavori")).toHaveTextContent("2");
    expect(screen.getByTestId("storico-kpi-giornate")).toHaveTextContent("3");
    expect(screen.getByTestId("storico-riepilogo")).toBeInTheDocument();
  });

  it("mostra insight fattuali quando i dati bastano", () => {
    render(
      <MemoryRouter>
        <Storico />
      </MemoryRouter>
    );
    expect(screen.getByTestId("storico-insight")).toBeInTheDocument();
    expect(screen.getByTestId("storico-insight-max-giornate")).toBeInTheDocument();
  });

  it("tap lavoro apre tab economico del cantiere", () => {
    render(
      <MemoryRouter>
        <Storico />
      </MemoryRouter>
    );

    const card = screen.getByTestId("storico-lavoro-c-rossi");
    expect(card).toHaveAttribute("data-cantiere-id", "c-rossi");
    expect(card.getAttribute("href")).toContain("/cantiere/c-rossi");
    expect(card.getAttribute("href")).toContain("sezione-pagamenti");
  });

  it("filtro tutti include lavori non conclusi", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Storico />
      </MemoryRouter>
    );

    await user.click(screen.getByTestId("storico-filtro-tutti"));
    expect(screen.getByTestId("storico-kpi-lavori")).toHaveTextContent("3");
    expect(screen.getByTestId("storico-lavoro-c-aperto")).toBeInTheDocument();
  });

  it("ordinamento saldo alto mette prima il saldo maggiore", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Storico />
      </MemoryRouter>
    );

    await user.click(screen.getByTestId("storico-ordina-saldo_alto"));
    const lista = screen.getByTestId("storico-lista");
    const cards = lista.querySelectorAll("[data-cantiere-id]");
    expect(cards[0]).toHaveAttribute("data-cantiere-id", "c-rossi");
  });

  it("storico vuoto senza insight", () => {
    vi.mocked(leggiCantieri).mockReturnValue([]);
    render(
      <MemoryRouter>
        <Storico />
      </MemoryRouter>
    );
    expect(screen.getByTestId("storico-vuoto")).toBeInTheDocument();
    expect(screen.queryByTestId("storico-insight")).not.toBeInTheDocument();
  });
});
