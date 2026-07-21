import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AssistantCard from "./AssistantCard";

const cardBase = {
  id: "checklist-posa",
  tipo: "checklist",
  titolo: "Posa corrugati",
  descrizione: "Presente nel 96% dei lavori simili",
  confidence: 0.96,
  priorita: "alta",
  origine: "experience",
  action: "accept",
};

describe("AssistantCard", () => {
  it("renderizza titolo, descrizione e badge priorità", () => {
    render(<AssistantCard card={cardBase} onAction={vi.fn()} />);

    expect(screen.getByText("Posa corrugati")).toBeInTheDocument();
    expect(
      screen.getByText("Presente nel 96% dei lavori simili")
    ).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("96% confidenza")).toBeInTheDocument();
  });

  it("nasconde la confidence se ≤ 80%", () => {
    render(
      <AssistantCard
        card={{ ...cardBase, confidence: 0.75, priorita: "media" }}
        onAction={vi.fn()}
      />
    );

    expect(screen.queryByText(/confidenza/i)).not.toBeInTheDocument();
    expect(screen.getByText("Media")).toBeInTheDocument();
  });

  it("invoca onAction per azione primaria e ignora", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<AssistantCard card={cardBase} onAction={onAction} />);

    await user.click(
      screen.getByRole("button", { name: /Accetta attività: Posa corrugati/i })
    );
    await user.click(
      screen.getByRole("button", { name: /Ignora: Posa corrugati/i })
    );

    expect(onAction).toHaveBeenNthCalledWith(1, cardBase, "accept");
    expect(onAction).toHaveBeenNthCalledWith(2, cardBase, "dismiss");
  });

  it("mostra badge priorità bassa e azione visualizza per durata", () => {
    render(
      <AssistantCard
        card={{
          id: "durata-stima",
          tipo: "durata",
          titolo: "Durata stimata: 5 giorni",
          descrizione: "Stima basata sulla durata media",
          confidence: 0.4,
          priorita: "bassa",
          origine: "experience",
          action: "view",
        }}
        onAction={vi.fn()}
      />
    );

    expect(screen.getByText("Bassa")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Visualizza dettagli/i })
    ).toBeInTheDocument();
  });
});
