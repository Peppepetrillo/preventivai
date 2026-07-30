import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DateCalendarSheet, {
  costruisciGrigliaCalendario,
  stessoGiorno,
} from "./DateCalendarSheet";

describe("DateCalendarSheet", () => {
  const oggi = new Date(2026, 6, 29);

  it("costruisce una griglia di settimane complete", () => {
    const celle = costruisciGrigliaCalendario(2026, 6);
    expect(celle.length % 7).toBe(0);
    expect(celle.filter((c) => c.meseCorrente)).toHaveLength(31);
  });

  it("confronta due date ignorando l'orario", () => {
    const a = new Date(2026, 6, 29, 10, 0);
    const b = new Date(2026, 6, 29, 18, 30);
    expect(stessoGiorno(a, b)).toBe(true);
    expect(stessoGiorno(a, new Date(2026, 6, 30))).toBe(false);
  });

  it("seleziona un giorno e chiude il foglio", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <DateCalendarSheet
        open
        value="29/07/2026"
        onSelect={onSelect}
        onClose={onClose}
        oggi={oggi}
      />
    );

    fireEvent.click(
      screen.getByRole("gridcell", { name: "domenica 12 luglio 2026" })
    );

    expect(onSelect).toHaveBeenCalledWith("12/07/2026");
    expect(onClose).toHaveBeenCalled();
  });

  it("naviga tra i mesi", () => {
    render(
      <DateCalendarSheet
        open
        value="29/07/2026"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        oggi={oggi}
      />
    );

    expect(screen.getByText(/luglio 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mese successivo/i }));
    expect(screen.getByText(/agosto 2026/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mese precedente/i }));
    expect(screen.getByText(/luglio 2026/i)).toBeInTheDocument();
  });
});
