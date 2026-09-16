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

  it("non chiude se onSalva restituisce success:false", () => {
    const onClose = vi.fn();
    const onSalva = vi.fn(() => ({
      success: false,
      error: "cantiere_obbligatorio",
    }));
    render(
      <GiornataLavorativaSheet
        open
        onClose={onClose}
        onSalva={onSalva}
        cantieriOpzioni={[{ id: "c1", nome: "Villa" }]}
        dataDefault="29/07/2026"
      />
    );

    fireEvent.change(screen.getByTestId("registro-cantiere"), {
      target: { value: "c1" },
    });
    fireEvent.click(screen.getByTestId("registro-salva"));

    expect(onSalva).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("registro-errore")).toHaveTextContent(/cantiere/i);
  });
});
