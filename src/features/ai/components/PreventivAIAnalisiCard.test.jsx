import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { analizzaNuovoLavoroIntelligence } from "../aiInsightsService";
import PreventivAIAnalisiCard from "./PreventivAIAnalisiCard";

vi.mock("../aiInsightsService", () => ({
  analizzaNuovoLavoroIntelligence: vi.fn(),
}));

const esitoBase = {
  ok: true,
  usatoProvider: false,
  motivoFallback: null,
  contesto: {
    nuovoLavoro: { categoriaEtichetta: "Impianto elettrico" },
    livelloConfidenza: "insufficiente",
  },
  insight: {
    valutazione:
      "Non ho abbastanza lavori confrontabili per darti una stima affidabile.",
    motivazione: "Servono più dati.",
    datiDiConfronto: [
      { etichetta: "Dato", valore: "Ho trovato 0 lavori potenzialmente simili." },
    ],
    rischi: ["Senza storico, ogni stima resterebbe una ipotesi."],
    cosaControllare: ["Registra giornate e spese sui cantieri conclusi."],
    suggerimento: "Puoi comunque preparare il preventivo a mano.",
    livelloConfidenza: "insufficiente",
    livelloConfidenzaEtichetta: "Dati insufficienti",
    numeroLavoriSimili: 0,
    numeroConDatiUtili: 0,
    fonte: "deterministico",
  },
};

describe("PreventivAIAnalisiCard", () => {
  beforeEach(() => {
    vi.mocked(analizzaNuovoLavoroIntelligence).mockReset();
    vi.mocked(analizzaNuovoLavoroIntelligence).mockResolvedValue(esitoBase);
  });

  it("mostra CTA opzionale e apre risultato senza modificare dati", async () => {
    const lavorazioni = [{ nome: "Punto luce", categoria: "Impianti" }];
    render(
      <PreventivAIAnalisiCard
        tipoLavoro="standard"
        tipologiaImpianto="civile"
        lavorazioni={lavorazioni}
      />
    );

    expect(
      screen.getByTestId("preventivai-intelligence-card")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Analizza con PreventivAI/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("preventivai-intelligence-analizza"));

    await waitFor(() => {
      expect(
        screen.getByTestId("preventivai-intelligence-risultato")
      ).toBeInTheDocument();
    });

    expect(analizzaNuovoLavoroIntelligence).toHaveBeenCalledTimes(1);
    expect(
      screen.getByTestId("preventivai-intelligence-valutazione")
    ).toHaveTextContent(/non ho abbastanza/i);

    fireEvent.click(screen.getByTestId("preventivai-intelligence-torna"));
    // preventivo non toccato: stesse props lavorazioni
    expect(lavorazioni).toEqual([
      { nome: "Punto luce", categoria: "Impianti" },
    ]);
  });

  it("impedisce doppio tap durante loading", async () => {
    let resolveFn;
    vi.mocked(analizzaNuovoLavoroIntelligence).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        })
    );

    render(<PreventivAIAnalisiCard lavorazioni={[]} />);
    const btn = screen.getByTestId("preventivai-intelligence-analizza");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(analizzaNuovoLavoroIntelligence).toHaveBeenCalledTimes(1);
    resolveFn(esitoBase);
    await waitFor(() => {
      expect(
        screen.getByTestId("preventivai-intelligence-risultato")
      ).toBeInTheDocument();
    });
  });
});
