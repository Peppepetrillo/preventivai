import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import PreventivoSuccesso from "./PreventivoSuccesso";

const PREVENTIVO = {
  id: 99,
  numero: "PREV-99",
  cliente: "Rossi Mario",
};

const CONDIZIONI = {
  sconto: 0,
  iva: 22,
};

const LAVORAZIONI = [{ id: "1", nome: "Punto luce", prezzo: 40, quantita: 1 }];

describe("PreventivoSuccesso UX-5.3", () => {
  it("mette Apri dettaglio come CTA primaria", () => {
    render(
      <MemoryRouter>
        <PreventivoSuccesso
          preventivo={PREVENTIVO}
          condizioni={CONDIZIONI}
          lavorazioni={LAVORAZIONI}
          pdfGenerato
        />
      </MemoryRouter>
    );

    const dettaglio = screen.getByTestId("successo-apri-dettaglio");
    expect(dettaglio).toHaveAttribute("href", "/preventivo/99");
    expect(dettaglio.className).toMatch(/btn-primary/);
    expect(screen.getByTestId("successo-condividi")).toBeInTheDocument();
  });

  it("mostra Genera PDF se il download è fallito", () => {
    render(
      <MemoryRouter>
        <PreventivoSuccesso
          preventivo={PREVENTIVO}
          condizioni={CONDIZIONI}
          lavorazioni={LAVORAZIONI}
          pdfGenerato={false}
          avvisoPdf="Preventivo salvato come bozza. PDF non generato."
          onRiprovaPdf={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("successo-riprova-pdf")).toBeInTheDocument();
    expect(screen.getByText(/PDF non generato/i)).toBeInTheDocument();
  });
});
