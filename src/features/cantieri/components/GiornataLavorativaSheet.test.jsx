import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GiornataLavorativaSheet from "./GiornataLavorativaSheet";

describe("GiornataLavorativaSheet — conferma eliminazione", () => {
  it("mostra titolo e pulsanti subito visibili dopo Elimina consuntivo", () => {
    render(
      <GiornataLavorativaSheet
        open
        onClose={vi.fn()}
        onSalva={vi.fn()}
        onElimina={vi.fn()}
        cantiereIdFisso="c1"
        giornata={{
          id: "r1",
          cantiereId: "c1",
          data: "29/07/2026",
          operai: ["Marco"],
          oreLavorate: 8,
          attivita: "Tracce",
        }}
      />
    );

    fireEvent.click(screen.getByTestId("registro-elimina"));

    expect(screen.getByText("Eliminare questo consuntivo?")).toBeVisible();
    expect(screen.getByTestId("conferma-elimina-registro-cancel")).toBeVisible();
    expect(screen.getByTestId("conferma-elimina-registro-confirm")).toBeVisible();
  });

  it("con prefill mostra descrizione rapida", () => {
    render(
      <GiornataLavorativaSheet
        open
        onClose={vi.fn()}
        onSalva={vi.fn()}
        cantiereIdFisso="c1"
        valoriIniziali={{
          cantiereId: "c1",
          data: "29/07/2026",
          operaiTesto: "Io",
          oreLavorate: "4",
          attivita: "Tracce",
        }}
      />
    );

    expect(
      screen.getByText(/Controlla ore e attività dal previsto/i)
    ).toBeInTheDocument();
  });
});
