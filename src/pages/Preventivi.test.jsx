import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES, routePreventivo } from "../app/routes";
import { STORAGE_KEYS } from "../app/storageKeys";
import Preventivi from "./Preventivi";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
  salvaDatoCloudImmediato: vi.fn(),
}));

describe("Preventivi UX-8.4", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        {
          id: "p1",
          cliente: "Mario Rossi",
          numero: "PREV-001",
          stato: "Inviato",
          totale: 3450,
          data: "25/08/2026",
        },
        {
          id: "p2",
          cliente: "Bianchi SRL",
          numero: "PREV-002",
          stato: "Convertito",
          totale: 7200,
          data: "20/08/2026",
        },
        {
          id: "p3",
          cliente: "Verdi",
          numero: "PREV-003",
          stato: "Bozza",
          totale: 500,
          data: "19/08/2026",
        },
      ])
    );
  });

  function renderLista(initialPath = ROUTES.preventivi) {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path={ROUTES.preventivi} element={<Preventivi />} />
          <Route
            path={ROUTES.preventiviNuovo}
            element={<div data-testid="wizard-nuovo">Wizard</div>}
          />
          <Route
            path={ROUTES.dettaglioPreventivo}
            element={<div>Dettaglio</div>}
          />
        </Routes>
      </MemoryRouter>
    );
  }

  it("mostra la lista preventivi con titolo Preventivi", () => {
    renderLista();
    expect(
      screen.getByRole("heading", { name: /^Preventivi$/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
  });

  it("mostra In cantiere al posto di Convertito", () => {
    renderLista();
    expect(screen.getByTestId("preventivo-card-p2")).toHaveTextContent(
      "In cantiere"
    );
    expect(screen.queryByText(/^Convertito$/)).not.toBeInTheDocument();
  });

  it("CTA Nuovo preventivo apre il wizard", async () => {
    const user = userEvent.setup();
    renderLista();

    await user.click(screen.getByTestId("preventivi-nuovo-cta"));
    expect(screen.getByTestId("wizard-nuovo")).toBeInTheDocument();
  });

  it("card tappabile verso dettaglio", () => {
    renderLista();
    const link = screen.getByTestId("preventivo-card-p1");
    expect(link).toHaveAttribute("href", routePreventivo("p1"));
  });

  it("filtra per stato Bozze", async () => {
    const user = userEvent.setup();
    renderLista();

    await user.click(screen.getByTestId("preventivi-filtro-bozze"));
    expect(screen.getByText("Verdi")).toBeInTheDocument();
    expect(screen.queryByText("Mario Rossi")).not.toBeInTheDocument();
  });

  it("cerca per numero preventivo", async () => {
    const user = userEvent.setup();
    renderLista();

    await user.type(
      screen.getByRole("searchbox", {
        name: /Cerca cliente o numero preventivo/i,
      }),
      "PREV-001"
    );
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.queryByText("Bianchi SRL")).not.toBeInTheDocument();
  });

  it("redirect clienteId verso wizard nuovo", () => {
    renderLista(`${ROUTES.preventivi}?clienteId=c99`);
    expect(screen.getByTestId("wizard-nuovo")).toBeInTheDocument();
  });

  it("empty state mostra CTA Nuovo preventivo", () => {
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));
    renderLista();
    expect(screen.getByText("Non hai ancora preventivi")).toBeInTheDocument();
    expect(screen.getByTestId("preventivi-empty-nuovo")).toHaveAttribute(
      "href",
      ROUTES.preventiviNuovo
    );
  });
});
