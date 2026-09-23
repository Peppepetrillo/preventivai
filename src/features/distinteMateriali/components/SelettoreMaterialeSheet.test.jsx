import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { CATALOGO_MATERIALI_SEED } from "../../../domain/catalogoMateriali/materialiCatalogoSeed";
import SelettoreMaterialeSheet from "./SelettoreMaterialeSheet";

describe("SelettoreMaterialeSheet — double submit", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.catalogoMateriali,
      JSON.stringify(CATALOGO_MATERIALI_SEED)
    );
  });

  it("ignora doppio tap su conferma (chiude una sola volta)", () => {
    const onConferma = vi.fn();
    const onClose = vi.fn();

    render(
      <SelettoreMaterialeSheet
        open
        onClose={onClose}
        onConferma={onConferma}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Cerca materiale/i), {
      target: { value: "Tubo corrugato" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Tubo corrugato/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /Ø16/i }));

    const conferma = screen.getByTestId("selettore-materiale-conferma");
    fireEvent.click(conferma);
    fireEvent.click(conferma);

    expect(onConferma).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConferma.mock.calls[0][0].nome).toMatch(/Tubo corrugato/i);
  });
});
