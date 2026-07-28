import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CantiereOverview from "./CantiereOverview";

vi.mock("./CantiereAssistantPanel", () => ({
  default: ({ onAction }) => (
    <div data-testid="cantiere-assistant">
      <button
        type="button"
        onClick={() =>
          onAction?.({ tipo: "documentazione", id: "doc" }, "accept")
        }
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

vi.mock("./CantiereVarianti", () => ({
  default: () => <div data-testid="cantiere-varianti" />,
}));

const cantiereEsempio = {
  id: 1,
  nome: "Cantiere PREV-101",
  cliente: "Mario Rossi",
  indirizzo: "Via Roma 1, Milano",
  telefono: "3331112222",
  stato: "Da iniziare",
  dataCreazione: "21/07/2026",
  foto: [],
  materiali: [{ id: "m1", nome: "Tubo", quantita: 2, unita: "m" }],
  checklist: [{ id: "c1", testo: "Posare tubi", completata: false }],
  note: "Portare scala",
  lavorazioniOrigine: [
    {
      id: "l-1",
      nome: "Punto luce",
      quantita: 2,
      prezzo: 45,
      unita: "cad",
    },
  ],
  preventivoId: 101,
  preventivoNumero: "PREV-101",
  preventivoOriginaleTotale: 900,
};

describe("CantiereOverview 2.0", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("mostra header campo con Chiama e Naviga", () => {
    render(
      <MemoryRouter>
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
          onAggiornaCampo={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Cantiere PREV-101" })
    ).toBeInTheDocument();
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByText("Via Roma 1, Milano")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chiama/i })).toHaveAttribute(
      "href",
      "tel:3331112222"
    );
    expect(screen.getByRole("link", { name: /Naviga/i })).toHaveAttribute(
      "href",
      expect.stringContaining("maps.google.com")
    );
  });

  it("mette in primo piano Oggi / Da comprare / Da ricordare", () => {
    render(
      <MemoryRouter>
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
          onAggiornaCampo={vi.fn()}
          nuovaChecklist=""
          nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /Oggi devo fare/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Da comprare/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Da ricordare/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Foto$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Pagamenti/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Documenti/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("cantiere-varianti")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Posare tubi")).toBeInTheDocument();
    expect(screen.getByText("Tubo")).toBeInTheDocument();
  });

  it("mostra azione inizia / concludi lavoro", () => {
    const { rerender } = render(
      <MemoryRouter>
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /Inizia lavoro/i })
    ).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CantiereOverview
          cantiere={{ ...cantiereEsempio, stato: "In corso" }}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /Concludi Cantiere/i })
    ).toBeInTheDocument();
  });

  it("assistente collassato ma azioni raggiungibili", () => {
    render(
      <MemoryRouter>
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
          onAggiornaCampo={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByText(/Mostra suggerimenti Assistente/i)
    );
    expect(screen.getByTestId("cantiere-assistant")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Assistente foto" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
