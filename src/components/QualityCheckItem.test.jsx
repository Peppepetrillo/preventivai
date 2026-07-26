import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import QualityCheckItem from "./QualityCheckItem";

describe("QualityCheckItem", () => {
  it("renderizza warning con messaggio", () => {
    render(
      <QualityCheckItem
        item={{
          id: "CHECK_INDUZIONE_001",
          type: "WARNING",
          title: "Verifica linea induzione",
          message: "Controlla che sia prevista una linea dedicata.",
          relatedItem: "LINEA_INDUZIONE",
        }}
      />
    );

    expect(screen.getByText(/Verifica linea induzione/i)).toBeInTheDocument();
    expect(
      screen.getByText(/linea dedicata/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveAttribute(
      "data-qc-type",
      "WARNING"
    );
  });

  it("mostra relatedItem predisposto al click senza navigare", async () => {
    const user = userEvent.setup();
    const onApri = vi.fn();

    render(
      <QualityCheckItem
        item={{
          id: "CHECK_CLIMA_001",
          type: "WARNING",
          title: "Verifica predisposizioni",
          message: "Controlla le predisposizioni.",
          relatedItem: "CLIMA",
        }}
        onApriLavorazione={onApri}
      />
    );

    const link = screen.getByRole("button", { name: /Apri lavorazione/i });
    expect(link).toHaveAttribute("data-related-item", "CLIMA");
    await user.click(link);
    expect(onApri).toHaveBeenCalledWith("CLIMA");
  });

  it("error e info", () => {
    const { rerender } = render(
      <QualityCheckItem
        item={{
          type: "ERROR",
          title: "Cliente non selezionato",
          message: "Il preventivo non può essere completato.",
        }}
      />
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-qc-type", "ERROR");

    rerender(
      <QualityCheckItem
        item={{
          type: "INFO",
          title: "Quadro elettrico",
          message: "Valuta un quadro di dimensioni superiori.",
          relatedItem: "QUADRO_ELETTRICO",
        }}
      />
    );
    expect(screen.getByRole("article")).toHaveAttribute("data-qc-type", "INFO");
    expect(screen.getByText(/Quadro elettrico/i)).toBeInTheDocument();
  });
});
