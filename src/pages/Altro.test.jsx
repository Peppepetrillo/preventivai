import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ROUTES } from "../app/routes";
import Altro from "./Altro";

describe("Altro UX-8.1", () => {
  it("mostra l'hub con le voci principali in ordine", () => {
    render(
      <MemoryRouter>
        <Altro />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Altro/i })).toBeInTheDocument();
    expect(screen.getByTestId("altro-link-agenda")).toHaveAttribute(
      "href",
      ROUTES.agenda
    );
    expect(screen.getByTestId("altro-link-clienti")).toHaveAttribute(
      "href",
      ROUTES.clienti
    );
    expect(screen.getByTestId("altro-link-economia")).toHaveAttribute(
      "href",
      ROUTES.economia
    );
    expect(screen.getByTestId("altro-link-storico")).toHaveAttribute(
      "href",
      ROUTES.storico
    );
    expect(screen.getByTestId("altro-link-acquisti")).toHaveAttribute(
      "href",
      ROUTES.acquisti
    );
    expect(screen.getByTestId("altro-link-listino")).toHaveAttribute(
      "href",
      ROUTES.listino
    );
    expect(screen.getByTestId("altro-link-catalogo")).toHaveAttribute(
      "href",
      ROUTES.catalogoMateriali
    );
    expect(screen.getByTestId("altro-link-distinte")).toHaveAttribute(
      "href",
      ROUTES.distinteMateriali
    );
    expect(screen.getByTestId("altro-link-impostazioni")).toHaveAttribute(
      "href",
      ROUTES.impostazioni
    );
    expect(screen.getByTestId("altro-link-cestino")).toHaveAttribute(
      "href",
      ROUTES.cestino
    );
    expect(screen.getByText("Elementi eliminati di recente")).toBeInTheDocument();
    expect(screen.getByText("I tuoi giorni")).toBeInTheDocument();
    expect(screen.getByText("Rubrica clienti")).toBeInTheDocument();
    expect(screen.getByText("Materiali da acquistare")).toBeInTheDocument();
  });
});
