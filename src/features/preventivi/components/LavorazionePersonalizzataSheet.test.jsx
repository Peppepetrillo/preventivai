import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LavorazionePersonalizzataSheet from "./LavorazionePersonalizzataSheet";

describe("LavorazionePersonalizzataSheet", () => {
  it("ignora doppio tap su Aggiungi", () => {
    const onSalva = vi.fn();
    const onClose = vi.fn();

    render(
      <LavorazionePersonalizzataSheet
        open
        onClose={onClose}
        onSalva={onSalva}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Lavoro straordinario/i), {
      target: { value: "Extra cantiere" },
    });

    const btn = screen.getByTestId("lavorazione-personalizzata-salva");
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(onSalva).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSalva.mock.calls[0][0].nome).toBe("Extra cantiere");
  });
});
