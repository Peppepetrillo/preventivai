import {
  useState,
} from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import NumericInput from "./NumericInput";

function NumericInputControllato({ onChange = vi.fn(), ...props }) {
  const [value, setValue] = useState(props.value);

  function gestisciChange(prossimoValore) {
    setValue(prossimoValore);
    onChange(prossimoValore);
  }

  return (
    <NumericInput
      {...props}
      value={value}
      onChange={gestisciChange}
    />
  );
}

describe("NumericInput", () => {
  it("usa type text e mantiene inputMode numerico mobile", () => {
    render(
      <NumericInput
        aria-label="Quantità"
        value={0}
        onChange={vi.fn()}
        inputMode="numeric"
      />
    );

    const input = screen.getByLabelText(/quantità/i);

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("svuota il campo al focus quando il valore è zero", async () => {
    const user = userEvent.setup();

    render(
      <NumericInputControllato
        aria-label="Prezzo"
        value={0}
      />
    );

    const input = screen.getByLabelText(/prezzo/i);
    await user.click(input);

    expect(input).toHaveValue("");
  });

  it("mantiene una stringa durante la digitazione e converte al blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <NumericInputControllato
        aria-label="Acconto"
        value={0}
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/acconto/i);
    await user.click(input);
    await user.type(input, "12,5");

    expect(input).toHaveValue("12,5");
    expect(onChange).toHaveBeenLastCalledWith("12,5");

    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith(12.5);
    expect(input).toHaveValue("12.5");
  });

  it("converte un campo vuoto in zero al blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <NumericInputControllato
        aria-label="Sconto"
        value={0}
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/sconto/i);
    await user.click(input);
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(input).toHaveValue("0");
  });
});
