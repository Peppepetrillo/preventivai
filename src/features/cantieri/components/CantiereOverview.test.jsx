import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import CantiereOverview from "./CantiereOverview";

const cantiereEsempio = {
  id: 1,
  nome: "Cantiere PREV-101",
  cliente: "Mario Rossi",
  indirizzo: "Via Roma 1, Milano",
  stato: "Da iniziare",
  dataCreazione: "21/07/2026",
  lavorazioniOrigine: [
    {
      id: "l-1",
      nome: "Punto luce",
      quantita: 2,
      prezzo: 45,
      unita: "cad",
    },
  ],
};

describe("CantiereOverview", () => {
  it("mostra header, card operative e azioni per cantiere da iniziare", () => {
    render(
      <MemoryRouter>
        <CantiereOverview cantiere={cantiereEsempio} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Mario Rossi" })).toBeInTheDocument();
    expect(screen.getByText("Via Roma 1, Milano")).toBeInTheDocument();
    expect(screen.getByText("Creato il 21/07/2026")).toBeInTheDocument();
    expect(screen.getByText("1 lavorazione")).toBeInTheDocument();
    expect(screen.getByText(/Totale preventivo/i)).toBeInTheDocument();
    expect(screen.getByText("0 elementi")).toBeInTheDocument();
    expect(screen.getByText("0 fotografie")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Nessuna attività completata")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✏️ Modifica" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "▶️ Inizia lavoro" })).toBeInTheDocument();
  });

  it("mostra azione concludi lavoro quando il cantiere è in corso", () => {
    render(
      <MemoryRouter>
        <CantiereOverview
          cantiere={{
            ...cantiereEsempio,
            stato: "In corso",
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "✅ Concludi lavoro" })).toBeInTheDocument();
  });
});
