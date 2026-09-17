import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { ROUTES } from "../../../app/routes";
import { STORAGE_KEYS } from "../../../app/storageKeys";
import { STATI_PREVENTIVO } from "../../../domain/workflow";
import ListaPreventivi from "./ListaPreventivi";

describe("ListaPreventivi empty filter CTA", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        {
          id: "p1",
          numero: "PREV-1",
          cliente: "Rossi",
          stato: STATI_PREVENTIVO.BOZZA,
          lavorazioni: [],
        },
      ])
    );
  });

  it("mostra Azzera ricerca e filtri quando la ricerca non trova nulla", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.preventivi]}>
        <Routes>
          <Route path={ROUTES.preventivi} element={<ListaPreventivi />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzzz-inesistente" },
    });
    expect(screen.getByText(/Nessun preventivo trovato/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("preventivi-azzera-filtri"));
    expect(screen.getByTestId("preventivo-card-p1")).toBeInTheDocument();
  });
});
