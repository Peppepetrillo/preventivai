import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AssistantPanel, { MAX_SUGGERIMENTI } from "./AssistantPanel";

function creaCard(index, priorita = "alta") {
  return {
    id: `card-${index}`,
    tipo: "checklist",
    titolo: `Suggerimento ${index}`,
    descrizione: `Descrizione ${index}`,
    confidence: priorita === "alta" ? 0.95 : 0.75,
    priorita,
    origine: "experience",
    action: "accept",
  };
}

describe("AssistantPanel", () => {
  it("mostra stato vuoto elegante senza suggerimenti", () => {
    render(
      <AssistantPanel
        loadAssistant={() => ({
          cards: [],
          summary: { totaleSuggerimenti: 0, alta: 0, media: 0, bassa: 0 },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    expect(
      screen.getByText("Nessun suggerimento disponibile.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/L'assistente sta imparando dalle tue esperienze/i)
    ).toBeInTheDocument();
  });

  it("mostra al massimo 5 card", () => {
    const cards = Array.from({ length: 8 }, (_, i) => creaCard(i + 1));

    render(
      <AssistantPanel
        loadAssistant={() => ({
          cards,
          summary: {
            totaleSuggerimenti: 8,
            alta: 8,
            media: 0,
            bassa: 0,
          },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(MAX_SUGGERIMENTI);
    expect(screen.getByText("Suggerimento 1")).toBeInTheDocument();
    expect(screen.getByText("Suggerimento 5")).toBeInTheDocument();
    expect(screen.queryByText("Suggerimento 6")).not.toBeInTheDocument();
  });

  it("preserva l'ordine ricevuto (già prioritizzato dal service)", () => {
    render(
      <AssistantPanel
        loadAssistant={() => ({
          cards: [
            creaCard(1, "alta"),
            creaCard(2, "media"),
            creaCard(3, "bassa"),
          ],
          summary: {
            totaleSuggerimenti: 3,
            alta: 1,
            media: 1,
            bassa: 1,
          },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    const titoli = screen.getAllByRole("heading", { level: 3 }).map(
      (node) => node.textContent
    );
    expect(titoli).toEqual([
      "Suggerimento 1",
      "Suggerimento 2",
      "Suggerimento 3",
    ]);
  });

  it("propaga i callback e nasconde le card ignorate", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <AssistantPanel
        onAction={onAction}
        loadAssistant={() => ({
          cards: [creaCard(1), creaCard(2)],
          summary: {
            totaleSuggerimenti: 2,
            alta: 2,
            media: 0,
            bassa: 0,
          },
          generatedAt: new Date().toISOString(),
          versione: 1,
        })}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /Ignora: Suggerimento 1/i })
    );

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "card-1" }),
      "dismiss"
    );
    expect(screen.queryByText("Suggerimento 1")).not.toBeInTheDocument();
    expect(screen.getByText("Suggerimento 2")).toBeInTheDocument();
  });
});
