import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GiornataProgrammataSheet from "./GiornataProgrammataSheet";

describe("GiornataProgrammataSheet — conferma eliminazione", () => {
  it("mostra titolo e pulsanti subito visibili dopo Elimina giornata", () => {
    render(
      <GiornataProgrammataSheet
        open
        onClose={vi.fn()}
        onSalva={vi.fn()}
        onElimina={vi.fn()}
        giornata={{
          id: "g1",
          data: "29/07/2026",
          operai: 2,
          orePreviste: 8,
          attivita: "Tracce",
          stato: "programmata",
        }}
      />
    );

    fireEvent.click(screen.getByTestId("giornata-elimina"));

    expect(
      screen.getByText("Eliminare questa giornata?")
    ).toBeVisible();
    expect(screen.getByTestId("conferma-elimina-giornata-cancel")).toBeVisible();
    expect(screen.getByTestId("conferma-elimina-giornata-confirm")).toBeVisible();
  });

  it("non chiude lo sheet se il salvataggio fallisce", () => {
    const onClose = vi.fn();
    const onSalva = vi.fn(() => ({
      success: false,
      error: { code: "validazione", message: "Data non valida" },
    }));

    render(
      <GiornataProgrammataSheet
        open
        onClose={onClose}
        onSalva={onSalva}
        onElimina={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("giornata-salva"));

    expect(onSalva).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("giornata-programmata-sheet")).toBeInTheDocument();
  });
});
