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
});
