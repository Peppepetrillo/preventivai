import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Stepper from "./Stepper";

describe("Stepper quantità smart", () => {
  it("mantiene +/- e apre input al tap sulla quantità", async () => {
    const user = userEvent.setup();
    const onImposta = vi.fn();

    render(
      <Stepper
        valore={3}
        nomeVoce="Punto luce"
        onAumenta={vi.fn()}
        onDiminuisci={vi.fn()}
        onImpostaValore={onImposta}
      />
    );

    expect(
      screen.getByRole("button", { name: /aumenta quantità/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /diminuisci quantità/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /tocca per modificare/i })
    );

    const input = screen.getByLabelText(/modifica quantità/i);
    expect(input).toHaveAttribute("inputmode", "numeric");

    await user.clear(input);
    await user.type(input, "60");
    await user.keyboard("{Enter}");

    expect(onImposta).toHaveBeenCalledWith(60);
  });
});
