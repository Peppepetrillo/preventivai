import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import Economia from "./Economia";

vi.mock("../repositories/cantieriRepository", () => ({
  leggiCantieri: vi.fn(),
}));

import { leggiCantieri } from "../repositories/cantieriRepository";

function dataItalianaNelMeseCorrente(giorno = 10) {
  const ora = new Date();
  const g = String(Math.min(giorno, 28)).padStart(2, "0");
  const m = String(ora.getMonth() + 1).padStart(2, "0");
  return `${g}/${m}/${ora.getFullYear()}`;
}

describe("Economia v0 pagina", () => {
  beforeEach(() => {
    const dataEntrata = dataItalianaNelMeseCorrente(12);
    const dataUscita = dataItalianaNelMeseCorrente(8);
    vi.mocked(leggiCantieri).mockReturnValue([
      {
        id: "c-rossi",
        nome: "Impianto appartamento Rossi",
        cliente: "Rossi",
        totaleLavoro: 5000,
        origine: "diretto",
        pagamenti: [
          { id: "p1", data: dataEntrata, importo: 1500, tipo: "acconto" },
        ],
        spese: [
          {
            id: "s1",
            data: dataUscita,
            importo: 420,
            descrizione: "Materiale",
            categoria: "materiali",
          },
        ],
      },
    ]);
  });

  it("mostra back verso Altro e metriche", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.economia]}>
        <Economia />
      </MemoryRouter>
    );

    expect(screen.getByTestId("economia-back")).toHaveAttribute(
      "data-parent",
      ROUTES.altro
    );
    expect(screen.getByRole("heading", { name: /Economia/i })).toBeInTheDocument();
    expect(screen.getByTestId("economia-entrate")).toBeInTheDocument();
    expect(screen.getByTestId("economia-uscite")).toBeInTheDocument();
    expect(screen.getByTestId("economia-link-storico")).toHaveAttribute(
      "href",
      ROUTES.storico
    );
  });

  it("tap movimento punta al cantiere corretto (sezione economico)", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.economia]}>
        <Economia />
      </MemoryRouter>
    );

    const entrata = screen.getByTestId("economia-movimento-entrata-c-rossi-p1");
    expect(entrata).toHaveAttribute("data-cantiere-id", "c-rossi");
    expect(entrata.getAttribute("href")).toContain("/cantiere/c-rossi");
    expect(entrata.getAttribute("href")).toContain("sezione-pagamenti");

    const uscita = screen.getByTestId("economia-movimento-uscita-c-rossi-s1");
    expect(uscita).toHaveAttribute("data-cantiere-id", "c-rossi");
    expect(uscita.getAttribute("href")).toContain("sezione-spese");
  });
});
