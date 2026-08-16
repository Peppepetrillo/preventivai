import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StepConferma from "./StepConferma";

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

const PREVENTIVO = {
  id: 42,
  numero: "PREV-42",
  cliente: "Rossi Mario",
  lavorazioni: STATO.lavorazioni,
  stato: "Bozza",
};

describe("StepConferma UX-5.3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra hero riepilogo e CTA Salva preventivo", () => {
    render(
      <MemoryRouter>
        <StepConferma stato={STATO} onSalva={vi.fn()} />
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

  it("invoca onSalva al tap", async () => {
    const onSalva = vi.fn().mockResolvedValue(PREVENTIVO);

    render(
      <MemoryRouter>
        <StepConferma stato={STATO} onSalva={onSalva} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("salva-preventivo"));

    await waitFor(() => {
      expect(onSalva).toHaveBeenCalled();
    });
  });

  it("mostra PreventivoSuccesso quando preventivoSalvato è valorizzato", () => {
    render(
      <MemoryRouter>
        <StepConferma
          stato={STATO}
          preventivoSalvato={PREVENTIVO}
          pdfGenerato={false}
          avvisoPdf="Preventivo salvato come bozza. PDF non generato."
          onRiprovaPdf={vi.fn()}
          onNuovoPreventivo={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("preventivo-successo")).toBeInTheDocument();
    expect(screen.getByText(/Preventivo creato/i)).toBeInTheDocument();
    expect(screen.getByText("PREV-42")).toBeInTheDocument();
    expect(screen.queryByTestId("salva-preventivo")).not.toBeInTheDocument();
  });

  it("chiama onModificaComposizione", () => {
    const onModifica = vi.fn();

    render(
      <MemoryRouter>
        <StepConferma
          stato={STATO}
          onSalva={vi.fn()}
          onModificaComposizione={onModifica}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("modifica-composizione"));
    expect(onModifica).toHaveBeenCalled();
  });
});
