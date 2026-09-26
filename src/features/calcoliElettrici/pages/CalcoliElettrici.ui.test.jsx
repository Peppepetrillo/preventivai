import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ROUTES } from "../../../app/routes";
import CalcoliElettrici from "../../../pages/CalcoliElettrici";
import CalcoloOhmPage from "./CalcoloOhmPage";
import CalcoloConsumoPage from "./CalcoloConsumoPage";

describe("Calcoli elettrici UI", () => {
  it("hub mostra i calcolatori", () => {
    render(
      <MemoryRouter>
        <CalcoliElettrici />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /Calcoli elettrici/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Strumenti rapidi per il lavoro/i)).toBeInTheDocument();
    expect(screen.getByTestId("calcoli-link-ohm")).toHaveAttribute(
      "href",
      ROUTES.calcoliOhm
    );
    expect(screen.getByTestId("calcoli-link-sezione")).toBeInTheDocument();
    expect(screen.getByTestId("calcoli-link-carico")).toBeInTheDocument();
  });

  it("Ohm calcola R = V / I", () => {
    render(
      <MemoryRouter>
        <CalcoloOhmPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Tensione/i), {
      target: { value: "230" },
    });
    fireEvent.change(screen.getByLabelText(/Corrente/i), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByTestId("calcolo-submit"));
    expect(screen.getByTestId("calcolo-risultato")).toHaveTextContent("46");
    expect(screen.getByTestId("calcolo-formula")).toHaveTextContent("R = V / I");
  });

  it("Ohm mostra errore se tutti pieni", () => {
    render(
      <MemoryRouter>
        <CalcoloOhmPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Tensione/i), {
      target: { value: "230" },
    });
    fireEvent.change(screen.getByLabelText(/Corrente/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/Resistenza/i), {
      target: { value: "46" },
    });
    fireEvent.click(screen.getByTestId("calcolo-submit"));
    expect(screen.getByTestId("calcolo-errore")).toBeInTheDocument();
  });

  it("Consumo 2 kW × 5 ore", () => {
    render(
      <MemoryRouter>
        <CalcoloConsumoPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/^Potenza$/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/^Tempo$/i), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByTestId("calcolo-submit"));
    expect(screen.getByTestId("calcolo-risultato")).toHaveTextContent("10");
    expect(screen.getByTestId("calcolo-risultato")).toHaveTextContent("kWh");
  });

  it("route nested resta sotto hub", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.calcoliOhm]}>
        <Routes>
          <Route path={ROUTES.calcoliOhm} element={<CalcoloOhmPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Legge di Ohm/i })).toBeInTheDocument();
  });
});
