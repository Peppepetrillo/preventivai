import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CantiereOverview from "./CantiereOverview";

vi.mock("./CantiereAssistantPanel", () => ({
  default: ({ onAction }) => (
    <div data-testid="cantiere-assistant">
      <button
        type="button"
        onClick={() => onAction?.({ tipo: "documentazione", id: "doc" }, "accept")}
      >
        Assistente foto
      </button>
      <button
        type="button"
        onClick={() => onAction?.({ tipo: "nota", id: "nota" }, "accept")}
      >
        Assistente nota
      </button>
      <button
        type="button"
        onClick={() => onAction?.({ tipo: "materiale", id: "mat" }, "view")}
      >
        Assistente materiali
      </button>
    </div>
  ),
}));

const cantiereEsempio = {
  id: 1,
  nome: "Cantiere PREV-101",
  cliente: "Mario Rossi",
  indirizzo: "Via Roma 1, Milano",
  stato: "Da iniziare",
  dataCreazione: "21/07/2026",
  foto: [],
  materiali: [],
  checklist: [],
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
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("mostra header, card operative e azioni per cantiere da iniziare", () => {
    render(
      <MemoryRouter>
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Mario Rossi" })
    ).toBeInTheDocument();
    expect(screen.getByText("Via Roma 1, Milano")).toBeInTheDocument();
    expect(screen.getByText("Creato il 21/07/2026")).toBeInTheDocument();
    expect(screen.getByText("1 lavorazione")).toBeInTheDocument();
    expect(screen.getByText(/Totale preventivo/i)).toBeInTheDocument();
    expect(screen.getByText("0 elementi")).toBeInTheDocument();
    expect(screen.getByText("0 fotografie")).toBeInTheDocument();
    expect(screen.getAllByText("0%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Nessuna attività completata")).toBeInTheDocument();
    expect(screen.getByTestId("cantiere-assistant")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "✏️ Modifica" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "▶️ Inizia lavoro" })
    ).toBeInTheDocument();
  });

  it("mostra azione concludi lavoro quando il cantiere è in corso", () => {
    render(
      <MemoryRouter>
        <CantiereOverview
          cantiere={{
            ...cantiereEsempio,
            stato: "In corso",
          }}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: "✅ Concludi lavoro" })
    ).toBeInTheDocument();
  });

  it("esegue le CTA overview e le azioni assistant verso sezioni reali", () => {
    const onIniziaLavoro = vi.fn();

    render(
      <MemoryRouter>
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={onIniziaLavoro}
          onCompletaLavoro={vi.fn()}
          onAggiornaCampo={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Visualizza" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Gestisci" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Apri" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Apri" })[1]);

    fireEvent.click(screen.getByRole("button", { name: "▶️ Inizia lavoro" }));
    expect(onIniziaLavoro).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Assistente foto" }));
    fireEvent.click(screen.getByRole("button", { name: "Assistente nota" }));
    fireEvent.click(screen.getByRole("button", { name: "Assistente materiali" }));

    expect(document.getElementById("sezione-materiali")).toBeTruthy();
    expect(document.getElementById("sezione-foto")).toBeTruthy();
    expect(document.getElementById("sezione-note")).toBeTruthy();
    expect(document.getElementById("sezione-checklist")).toBeTruthy();
  });
});
