import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { STATI_PREVENTIVO } from "../domain/workflow";
import Incassi from "./Incassi";

function seedPreventivi(lista) {
  localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify(lista));
}

describe("Incassi UX-8.6", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("esclude preventivi In cantiere dalla lista operativa", () => {
    seedPreventivi([
      {
        id: "p1",
        numero: "PREV-1",
        cliente: "Aperto",
        stato: STATI_PREVENTIVO.ACCETTATO,
        totale: 1000,
        incassato: 0,
        acconto: 0,
      },
      {
        id: "p2",
        numero: "PREV-2",
        cliente: "In cantiere",
        stato: STATI_PREVENTIVO.CONVERTITO,
        cantiereId: "c1",
        totale: 2000,
        incassato: 100,
        acconto: 0,
      },
      {
        id: "p3",
        numero: "PREV-3",
        cliente: "Finito",
        stato: STATI_PREVENTIVO.LAVORO_COMPLETATO,
        cantiereId: "c2",
        totale: 500,
        incassato: 500,
        acconto: 0,
      },
    ]);

    render(
      <MemoryRouter>
        <Incassi />
      </MemoryRouter>
    );

    expect(screen.getByTestId("incassi-card-p1")).toBeInTheDocument();
    expect(screen.queryByTestId("incassi-card-p2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("incassi-card-p3")).not.toBeInTheDocument();
    expect(screen.getByText("Aperto")).toBeInTheDocument();
    expect(screen.queryByText("In cantiere")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Registra pagamento/i })
    ).toBeInTheDocument();
  });
});
