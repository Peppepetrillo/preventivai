import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PagamentoSheet from "./PagamentoSheet";
import { TIPI_PAGAMENTO } from "../services/pagamentiCantiereService";

describe("PagamentoSheet UX-10", () => {
  it("Registra saldo mostra titolo e descrizione dedicati", () => {
    render(
      <PagamentoSheet
        open
        onClose={vi.fn()}
        onSalva={vi.fn()}
        rimanenza={600}
        importoIniziale={600}
        tipoIniziale={TIPI_PAGAMENTO.saldo}
      />
    );

    expect(screen.getByRole("heading", { name: /Registra saldo/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Importo e tipo Saldo già impostati/i)
    ).toBeInTheDocument();
  });

  it("conferma eliminazione visibile sopra lo sheet", () => {
    render(
      <PagamentoSheet
        open
        onClose={vi.fn()}
        onSalva={vi.fn()}
        pagamento={{
          id: "p1",
          importo: 400,
          data: "01/08/2026",
          tipo: "acconto",
          metodo: "contanti",
        }}
        onElimina={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("pagamento-elimina"));

    expect(screen.getByText("Eliminare questo pagamento?")).toBeVisible();
    expect(screen.getByTestId("conferma-elimina-pagamento-cancel")).toBeVisible();
    expect(screen.getByTestId("conferma-elimina-pagamento-confirm")).toBeVisible();
  });
});
