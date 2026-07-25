import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PreventivoIntelligente from "./PreventivoIntelligente";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
  salvaDatoCloudImmediato: vi.fn(),
}));

vi.mock("../domain/preventivi", async () => {
  const actual = await vi.importActual("../domain/preventivi");
  return {
    ...actual,
    generaPreventivoEconomico: vi.fn(() => ({
      success: true,
      proposal: {
        id: "prop-test",
        riepilogo: {
          superficieMq: 110,
          livelloImpianto: "standard",
          puntiStimati: 110,
          quadroSuggerito: "Quadro 36 moduli",
        },
        lavorazioni: [
          {
            id: "lav-1",
            descrizione: "Quadro 36 moduli",
            quantita: 1,
            prezzoUnitario: 350,
            totale: 350,
            unita: "cad",
            origine: "BASE",
            regola: "",
            perche: "Superficie elevata",
            prezzoConfigurato: true,
          },
          {
            id: "lav-2",
            descrizione: "Videosorveglianza",
            quantita: 1,
            prezzoUnitario: null,
            totale: null,
            unita: "cad",
            origine: "BASE",
            regola: "",
            perche: "",
            prezzoConfigurato: false,
          },
        ],
        subtotale: 350,
        totaleIVA: 77,
        totale: 427,
        ivaPercentuale: 22,
        regoleApplicate: [{ id: "r1", nome: "Regola mq" }],
        brainInsights: { patterns: [], suggerimentiBrain: [] },
        conoscenzaProposta: {
          puntiStimati: 110,
          suggerimenti: [],
          regoleApplicate: [],
        },
      },
    })),
  };
});

describe("PreventivoIntelligente — proposta economica", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mostra riepilogo, tabella economico e badge prezzo mancante", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PreventivoIntelligente />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("heading", { name: /Knowledge Engine/i })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Genera proposta/i })
    );

    expect(
      screen.getByRole("heading", { name: /^Riepilogo$/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Quadro 36 moduli").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /Preventivo suggerito/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Prezzo non configurato/i)).toBeInTheDocument();
    expect(screen.getByText(/427,00/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Crea Preventivo/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Aggiorna proposta/i })
    ).toBeInTheDocument();

    const ragionamento = screen.getByRole("button", {
      name: /Come ha ragionato PreventivAI/i,
    });
    expect(ragionamento).toHaveAttribute("aria-expanded", "false");

    await user.click(ragionamento);
    expect(ragionamento).toHaveAttribute("aria-expanded", "true");
    const pannello = ragionamento.closest("section");
    expect(within(pannello).getByText(/Regola mq/i)).toBeInTheDocument();
  });
});
