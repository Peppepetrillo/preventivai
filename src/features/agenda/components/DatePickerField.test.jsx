import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DatePickerField, {
  dataItToIso,
  isoToDataIt,
} from "./DatePickerField";

describe("DatePickerField", () => {
  const oggi = new Date(2026, 6, 29);

  it("seleziona oggi e domani senza aprire il calendario", () => {
    const onChange = vi.fn();
    render(
      <DatePickerField value="29/07/2026" onChange={onChange} oggi={oggi} />
    );

    fireEvent.click(screen.getByRole("button", { name: /^Domani$/i }));
    expect(onChange).toHaveBeenCalledWith("30/07/2026");
  });

  it("apre il calendario custom al tap su Scegli la data", () => {
    const onChange = vi.fn();
    render(
      <DatePickerField value="29/07/2026" onChange={onChange} oggi={oggi} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Scegli la data/i }));
    expect(
      screen.getByRole("dialog", { name: /Scegli la data/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: /Calendario/i })).toBeInTheDocument();
  });

  it("propaga la data scelta dal calendario in formato IT", () => {
    const onChange = vi.fn();
    render(
      <DatePickerField value="29/07/2026" onChange={onChange} oggi={oggi} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Scegli la data/i }));

    const calendario = screen.getByRole("grid", { name: /Calendario/i });
    fireEvent.click(
      within(calendario).getByRole("gridcell", {
        name: "domenica 5 luglio 2026",
      })
    );

    expect(onChange).toHaveBeenCalledWith("05/07/2026");
  });

  it("converte formati data IT ↔ ISO", () => {
    expect(dataItToIso("29/07/2026")).toBe("2026-07-29");
    expect(isoToDataIt("2026-07-29")).toBe("29/7/2026");
  });
});
