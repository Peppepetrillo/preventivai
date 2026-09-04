import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import PagamentiSection from "./PagamentiSection";

const cantiereBase = {
  id: "c1",
  preventivoOriginaleTotale: 1000,
  pagamenti: [
    {
      id: "p1",
      importo: 400,
      data: "01/08/2026",
      tipo: "acconto",
      metodo: "contanti",
    },
  ],
};

describe("PagamentiSection UX-9.0", () => {
  it("Registra saldo precompila la rimanenza", async () => {
    const user = userEvent.setup();
    render(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
      />
    );

    await user.click(screen.getByTestId("pagamento-registra-saldo"));

    expect(screen.getByTestId("pagamento-importo")).toHaveValue("600");
    expect(screen.getByRole("button", { name: "Saldo" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("nasconde Registra saldo se rimanenza <= 0", () => {
    render(
      <PagamentiSection
        cantiere={{
          ...cantiereBase,
          pagamenti: [
            {
              id: "p1",
              importo: 1000,
              data: "01/08/2026",
              tipo: "saldo",
              metodo: "bonifico",
            },
          ],
        }}
        onAggiungi={vi.fn()}
      />
    );

    expect(screen.queryByTestId("pagamento-registra-saldo")).not.toBeInTheDocument();
  });

  it("empty con rimanenza non duplica CTA sotto Registra saldo", () => {
    render(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={vi.fn()}
      />
    );

    expect(screen.getByTestId("pagamento-registra-saldo")).toBeInTheDocument();
    expect(screen.queryByTestId("pagamento-empty-primo")).not.toBeInTheDocument();
  });

  it("registraIncassoTrigger apre PagamentoSheet una sola volta", () => {
    const { rerender } = render(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraIncassoTrigger={0}
      />
    );
    expect(screen.queryByTestId("pagamento-sheet")).not.toBeInTheDocument();

    rerender(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraIncassoTrigger={1}
      />
    );
    expect(screen.getByTestId("pagamento-sheet")).toBeInTheDocument();

    rerender(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraIncassoTrigger={1}
      />
    );
    expect(screen.getAllByTestId("pagamento-sheet")).toHaveLength(1);
  });

  it("V16-A: trigger con importo iniziale apre PagamentoSheet precompilato", () => {
    const { rerender } = render(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraIncassoTrigger={0}
      />
    );

    rerender(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraIncassoTrigger={1}
        registraIncassoImportoIniziale={500}
        registraIncassoOrigine="assistente-economico"
      />
    );

    expect(screen.getByTestId("pagamento-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("pagamento-importo")).toHaveValue("500");
  });

  it("V16-A: apertura normale non usa prefill assistente", async () => {
    const user = userEvent.setup();
    render(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
      />
    );
    await user.click(screen.getByTestId("pagamento-aggiungi"));
    expect(screen.getByTestId("pagamento-importo")).toHaveValue("");
  });

  it("V16-B: salvataggio da assistente non scrolla alla lista pagamenti", () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
    const onAggiungi = vi.fn();

    const { rerender } = render(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={onAggiungi}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraIncassoTrigger={0}
      />
    );
    rerender(
      <PagamentiSection
        cantiere={cantiereBase}
        onAggiungi={onAggiungi}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraIncassoTrigger={1}
        registraIncassoImportoIniziale={500}
        registraIncassoOrigine="assistente-economico"
      />
    );

    fireEvent.click(screen.getByTestId("pagamento-salva"));
    expect(onAggiungi).toHaveBeenCalled();
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
