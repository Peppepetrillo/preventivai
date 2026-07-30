import { fireEvent, render, screen } from "@testing-library/react";
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

  it("apre il date picker nativo al tap su Scegli la data", () => {
    const onChange = vi.fn();
    render(
      <DatePickerField value="29/07/2026" onChange={onChange} oggi={oggi} />
    );

    const input = screen.getByLabelText(/Seleziona una data dal calendario/i);
    const showPicker = vi.fn();
    input.showPicker = showPicker;

    fireEvent.click(screen.getByRole("button", { name: /Scegli la data/i }));
    expect(showPicker).toHaveBeenCalledTimes(1);
  });

  it("fallback a click() se showPicker non è disponibile", () => {
    const onChange = vi.fn();
    render(
      <DatePickerField value="29/07/2026" onChange={onChange} oggi={oggi} />
    );

    const input = screen.getByLabelText(/Seleziona una data dal calendario/i);
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: /Scegli la data/i }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("propaga la data scelta dal calendario in formato IT", () => {
    const onChange = vi.fn();
    render(
      <DatePickerField value="29/07/2026" onChange={onChange} oggi={oggi} />
    );

    const input = screen.getByLabelText(/Seleziona una data dal calendario/i);
    fireEvent.change(input, { target: { value: "2026-08-05" } });
    expect(onChange).toHaveBeenCalledWith("5/8/2026");
  });

  it("converte formati data IT ↔ ISO", () => {
    expect(dataItToIso("29/07/2026")).toBe("2026-07-29");
    expect(isoToDataIt("2026-07-29")).toBe("29/7/2026");
  });
});
