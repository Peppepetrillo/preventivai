import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { selezionaZeroAlFocus } from "./inputNumerici";

function creaEventoInput(value) {
  return {
    currentTarget: {
      value,
      select: vi.fn(),
    },
  };
}

describe("inputNumerici", () => {
  it("seleziona il contenuto quando il valore numerico è zero", () => {
    const evento = creaEventoInput("0");

    selezionaZeroAlFocus(evento);

    expect(evento.currentTarget.select).toHaveBeenCalledOnce();
  });

  it("seleziona anche zero con decimali", () => {
    const evento = creaEventoInput("0.00");

    selezionaZeroAlFocus(evento);

    expect(evento.currentTarget.select).toHaveBeenCalledOnce();
  });

  it("non seleziona valori diversi da zero", () => {
    const evento = creaEventoInput("12");

    selezionaZeroAlFocus(evento);

    expect(evento.currentTarget.select).not.toHaveBeenCalled();
  });

  it("non seleziona campi vuoti", () => {
    const evento = creaEventoInput("");

    selezionaZeroAlFocus(evento);

    expect(evento.currentTarget.select).not.toHaveBeenCalled();
  });
});
