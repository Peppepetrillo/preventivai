import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import PreventivoAssistantPanel, {
  MAX_SUGGERIMENTI_PREVENTIVO,
} from "./PreventivoAssistantPanel";

vi.mock("../../../repositories/listinoRepository", () => ({
  leggiListino: () => [
    {
      id: "punto-luce",
      nome: "Punto luce",
      prezzo: 45,
      categoria: "Impianto",
      unita: "cad",
    },
    {
      id: "quadro",
      nome: "Quadro elettrico base",
      prezzo: 320,
      categoria: "Quadro",
      unita: "cad",
    },
  ],
}));

function creaCard(id, titolo, priorita = "alta", tipo = "checklist") {
  return {
    id,
    tipo,
    titolo,
    descrizione: `Descrizione ${titolo}`,
    confidence: priorita === "alta" ? 0.95 : 0.75,
    priorita,
    origine: "experience",
    action: tipo === "durata" ? "view" : "accept",
  };
}

describe("PreventivoAssistantPanel", () => {
  it("mostra stato vuoto quando non ci sono suggerimenti alti", () => {
    render(
      <PreventivoAssistantPanel
        tipoLavoro="impianto"
        lavorazioni={[]}
        loadAssistant={() => ({
          cards: [creaCard("1", "Media", "media")],
          summary: { totaleSuggerimenti: 1, alta: 0, media: 1, bassa: 0 },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    expect(
      screen.getByText(/L'assistente sta ancora imparando/i)
    ).toBeInTheDocument();
  });

  it("mostra al massimo 3 suggerimenti ad alta priorità", () => {
    const cards = [
      creaCard("1", "Uno"),
      creaCard("2", "Due"),
      creaCard("3", "Tre"),
      creaCard("4", "Quattro"),
    ];

    render(
      <PreventivoAssistantPanel
        lavorazioni={[]}
        loadAssistant={() => ({
          cards,
          summary: { totaleSuggerimenti: 4, alta: 4, media: 0, bassa: 0 },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(
      MAX_SUGGERIMENTI_PREVENTIVO
    );
    expect(screen.queryByText("Quattro")).not.toBeInTheDocument();
  });

  it("si aggiorna escludendo le lavorazioni già in carrello", () => {
    const loadAssistant = () => ({
      cards: [
        creaCard("1", "Punto luce"),
        creaCard("2", "Quadro elettrico base"),
      ],
      summary: { totaleSuggerimenti: 2, alta: 2, media: 0, bassa: 0 },
      generatedAt: new Date().toISOString(),
      versione: 1,
    });

    const { rerender } = render(
      <PreventivoAssistantPanel
        lavorazioni={[]}
        loadAssistant={loadAssistant}
      />
    );

    expect(screen.getByText("Punto luce")).toBeInTheDocument();

    rerender(
      <PreventivoAssistantPanel
        lavorazioni={[{ nome: "Punto luce" }]}
        loadAssistant={loadAssistant}
      />
    );

    expect(screen.queryByText("Punto luce")).not.toBeInTheDocument();
    expect(screen.getByText("Quadro elettrico base")).toBeInTheDocument();
    expect(screen.getByText(/Hai aggiunto "Punto luce"/i)).toBeInTheDocument();
  });

  it("invoca onAggiungiVoce su Aggiungi e nasconde su Ignora", async () => {
    const user = userEvent.setup();
    const onAggiungiVoce = vi.fn();
    const onAction = vi.fn();

    render(
      <PreventivoAssistantPanel
        lavorazioni={[]}
        onAggiungiVoce={onAggiungiVoce}
        onAction={onAction}
        loadAssistant={() => ({
          cards: [creaCard("1", "Punto luce")],
          summary: { totaleSuggerimenti: 1, alta: 1, media: 0, bassa: 0 },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /Aggiungi: Punto luce/i })
    );

    expect(onAggiungiVoce).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "Punto luce", prezzo: 45 })
    );
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
      "accept"
    );

    await user.click(
      screen.getByRole("button", { name: /Ignora: Punto luce/i })
    );

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
      "dismiss"
    );
    expect(screen.queryByText("Punto luce")).not.toBeInTheDocument();
  });
});
