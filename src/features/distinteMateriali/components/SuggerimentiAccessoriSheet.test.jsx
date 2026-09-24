import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SuggerimentiAccessoriSheet from "./SuggerimentiAccessoriSheet";

const SUGGERIMENTI = [
  { chiave: "a1", nome: "Scatola", quantita: 1, unita: "pz" },
  { chiave: "a2", nome: "Tappo", quantita: 2, unita: "pz" },
];

describe("SuggerimentiAccessoriSheet", () => {
  it("remount su nuova parent voce resetta la selezione", () => {
    const { rerender } = render(
      <SuggerimentiAccessoriSheet
        open
        onClose={vi.fn()}
        onConferma={vi.fn()}
        parentVoce={{ id: "p1", nome: "Cavo", quantita: 10, unita: "m" }}
        suggerimenti={SUGGERIMENTI}
      />
    );

    const rows = screen.getAllByTestId("suggerimento-accessorio-row");
    fireEvent.click(rows[0]);
    expect(rows[0]).toHaveAttribute("aria-pressed", "false");

    rerender(
      <SuggerimentiAccessoriSheet
        open
        onClose={vi.fn()}
        onConferma={vi.fn()}
        parentVoce={{ id: "p2", nome: "Tubo", quantita: 5, unita: "m" }}
        suggerimenti={SUGGERIMENTI}
      />
    );

    const rowsDopo = screen.getAllByTestId("suggerimento-accessorio-row");
    expect(rowsDopo[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Per «Tubo»/)).toBeInTheDocument();
  });

  it("ignora doppio tap su Aggiungi selezionati", () => {
    const onConferma = vi.fn();
    const onClose = vi.fn();

    render(
      <SuggerimentiAccessoriSheet
        open
        onClose={onClose}
        onConferma={onConferma}
        parentVoce={{ id: "p1", nome: "Cavo", quantita: 10, unita: "m" }}
        suggerimenti={SUGGERIMENTI}
      />
    );

    const btn = screen.getByTestId("suggerimenti-aggiungi");
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(onConferma).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
