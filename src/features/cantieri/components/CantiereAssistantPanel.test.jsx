import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CantiereAssistantPanel, {
  MAX_SUGGERIMENTI_CANTIERE,
} from "./CantiereAssistantPanel";

function creaCard(id, titolo, tipo = "documentazione", priorita = "media") {
  return {
    id,
    tipo,
    titolo,
    descrizione: `Descrizione ${titolo}`,
    confidence: priorita === "alta" ? 0.95 : 0.8,
    priorita,
    origine: "experience",
    action: tipo === "documentazione" ? "accept" : "view",
  };
}

const cantiereBase = {
  id: 10,
  stato: "Da iniziare",
  foto: [],
  note: "",
  materiali: [],
  checklist: [],
  lavorazioniOrigine: [{ nome: "Punto luce" }],
};

describe("CantiereAssistantPanel", () => {
  it("mostra stato vuoto quando non ci sono suggerimenti", () => {
    render(
      <CantiereAssistantPanel
        cantiere={cantiereBase}
        loadAssistant={() => ({
          cards: [],
          summary: { totaleSuggerimenti: 0, alta: 0, media: 0, bassa: 0 },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    expect(screen.getByText("Il cantiere è in linea.")).toBeInTheDocument();
    expect(
      screen.getByText(/Non risultano promemoria in questo momento/i)
    ).toBeInTheDocument();
  });

  it("mostra al massimo 4 card", () => {
    const cards = Array.from({ length: 6 }, (_, i) =>
      creaCard(`c-${i}`, `Promemoria ${i + 1}`)
    );

    render(
      <CantiereAssistantPanel
        cantiere={cantiereBase}
        loadAssistant={() => ({
          cards,
          summary: { totaleSuggerimenti: 6, alta: 0, media: 6, bassa: 0 },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(
      MAX_SUGGERIMENTI_CANTIERE
    );
    expect(screen.queryByText("Promemoria 5")).not.toBeInTheDocument();
  });

  it("propaga i callback e nasconde le card ignorate", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <CantiereAssistantPanel
        cantiere={cantiereBase}
        onAction={onAction}
        loadAssistant={() => ({
          cards: [creaCard("doc-1", "Documentazione fotografica")],
          summary: { totaleSuggerimenti: 1, alta: 0, media: 1, bassa: 0 },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: /Aggiungi foto: Documentazione fotografica/i,
      })
    );
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "doc-1" }),
      "accept"
    );

    await user.click(
      screen.getByRole("button", {
        name: /Ignora: Documentazione fotografica/i,
      })
    );
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "doc-1" }),
      "dismiss"
    );
    expect(
      screen.queryByText("Documentazione fotografica")
    ).not.toBeInTheDocument();
  });

  it("si aggiorna quando cambiano i dati del cantiere", () => {
    const loadAssistant = vi.fn((opzioni) => ({
      cards: opzioni.cantiere?.foto?.length
        ? []
        : [creaCard("doc-1", "Documentazione fotografica")],
      summary: { totaleSuggerimenti: 1, alta: 0, media: 1, bassa: 0 },
      generatedAt: new Date().toISOString(),
      versione: 1,
    }));

    const { rerender } = render(
      <CantiereAssistantPanel
        cantiere={cantiereBase}
        loadAssistant={loadAssistant}
      />
    );

    expect(screen.getByText("Documentazione fotografica")).toBeInTheDocument();

    rerender(
      <CantiereAssistantPanel
        cantiere={{
          ...cantiereBase,
          foto: [{ id: 1, nome: "quadro.jpg" }],
          note: "Differenziale SN-123",
          materiali: [{ id: 1, nome: "Cavo", quantita: 1, unita: "m" }],
        }}
        loadAssistant={loadAssistant}
      />
    );

    expect(loadAssistant).toHaveBeenCalled();
    expect(
      screen.queryByText("Documentazione fotografica")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Il cantiere è in linea.")).toBeInTheDocument();
  });
});
