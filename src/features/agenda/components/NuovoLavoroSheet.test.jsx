import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NuovoLavoroSheet from "./NuovoLavoroSheet";

describe("NuovoLavoroSheet", () => {
  it("salva un lavoro con tipo, data e ora", () => {
    const onSalva = vi.fn();
    render(
      <NuovoLavoroSheet
        aperto
        onChiudi={vi.fn()}
        onSalva={onSalva}
        dataDefault="29/07/2026"
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Quadro elettrico/i), {
      target: { value: "Sopralluogo Villa" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Rossi/i), {
      target: { value: "Verdi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Sopralluogo$/i }));
    fireEvent.click(screen.getByRole("button", { name: "09:00" }));
    fireEvent.click(screen.getByRole("button", { name: /Salva in agenda/i }));

    expect(onSalva).toHaveBeenCalledWith(
      expect.objectContaining({
        titolo: "Sopralluogo Villa",
        cliente: "Verdi",
        tipoLavoro: "sopralluogo",
        scheduledDate: "29/07/2026",
        scheduledTime: "09:00",
      })
    );
  });
});
