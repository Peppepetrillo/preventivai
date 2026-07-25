import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PreventivoIntelligente from "./PreventivoIntelligente";
import { resetConoscenze } from "../domain/brain/personalKnowledgeRepository";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
  salvaDatoCloudImmediato: vi.fn(),
}));

/**
 * Nessun mock di generaPreventivoEconomico:
 * verifica la pipeline reale KE → Proposal → UI.
 */
describe("PreventivoIntelligente — pipeline reale", () => {
  beforeEach(() => {
    localStorage.clear();
    resetConoscenze();
  });

  it("mostra PreventivoProposal economica, non output Knowledge Engine grezzo", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PreventivoIntelligente />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/Es\. 110/i), "160");
    await user.click(screen.getByRole("button", { name: /Genera proposta/i }));

    expect(
      screen.getByRole("heading", { name: /^Riepilogo$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Preventivo suggerito/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Crea Preventivo/i })
    ).toBeInTheDocument();

    // Debug KE non in vista principale
    expect(
      screen.queryByRole("heading", { name: /Knowledge Engine/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Proposta preventivo/i })
    ).not.toBeInTheDocument();

    // Totale finale presente (anche 0,00 € se listino non matcha)
    expect(screen.getByText(/Totale finale/i)).toBeInTheDocument();

    // Tabella economica: almeno una lavorazione (quadro / suggerimenti)
    expect(screen.getAllByText(/Quadro/i).length).toBeGreaterThan(0);
  });
});
