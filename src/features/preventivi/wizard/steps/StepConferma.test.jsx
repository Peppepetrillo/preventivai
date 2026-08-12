import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StepConferma from "./StepConferma";

const salvaEGeneraPdf = vi.fn();
const riprovaPdf = vi.fn();
const resetEsito = vi.fn();

vi.mock("../../hooks/useSalvaEGeneraPdf", () => ({
  useSalvaEGeneraPdf: () => ({
    inElaborazione: false,
    errore: "",
    avvisoPdf: "",
    preventivoSalvato: null,
    pdfGenerato: false,
    salvaEGeneraPdf,
    riprovaPdf,
    resetEsito,
  }),
}));

const STATO = {
  cliente: "Rossi Mario",
  tipoLavoro: "impianto",
  lavorazioni: [
    {
      id: "1",
      nome: "Punto luce",
      prezzo: 40,
      quantita: 2,
    },
  ],
  condizioni: {
    sconto: 0,
    iva: 22,
    validita: 30,
    pagamento: "Bonifico bancario",
    acconto: 0,
    note: "",
  },
};

describe("StepConferma UX-5.3", () => {
  beforeEach(() => {
    salvaEGeneraPdf.mockReset();
    riprovaPdf.mockReset();
    resetEsito.mockReset();
  });

  it("mostra hero riepilogo e CTA Salva preventivo", () => {
    render(
      <MemoryRouter>
        <StepConferma stato={STATO} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("riepilogo-hero")).toBeInTheDocument();
    expect(screen.getByText("Rossi Mario")).toBeInTheDocument();
    expect(screen.getByText("Bozza")).toBeInTheDocument();
    expect(screen.getByTestId("salva-preventivo")).toHaveTextContent(
      /Salva preventivo/i
    );
    expect(screen.getByText("Punto luce")).toBeInTheDocument();
  });

  it("invoca salvaEGeneraPdf al tap", async () => {
    salvaEGeneraPdf.mockResolvedValue({ id: 1 });

    render(
      <MemoryRouter>
        <StepConferma stato={STATO} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("salva-preventivo"));

    await waitFor(() => {
      expect(salvaEGeneraPdf).toHaveBeenCalledWith(STATO);
    });
  });

  it("chiama onModificaComposizione", () => {
    const onModifica = vi.fn();

    render(
      <MemoryRouter>
        <StepConferma stato={STATO} onModificaComposizione={onModifica} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("modifica-composizione"));
    expect(onModifica).toHaveBeenCalled();
  });
});
