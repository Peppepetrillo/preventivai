import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FirmaClienteSection from "./FirmaClienteSection";
import { resetFirme } from "../../../domain/firma";
import { STATI_PREVENTIVO } from "../../../domain/workflow/preventivoWorkflowTypes";

describe("FirmaClienteSection", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFirme();
  });

  it("mostra stato non firmato e blocca Bozza", () => {
    render(
      <FirmaClienteSection
        preventivo={{
          id: "p1",
          numero: "PREV-1",
          cliente: "Mario",
          stato: STATI_PREVENTIVO.BOZZA,
        }}
        onMessaggio={vi.fn()}
      />
    );

    expect(screen.getByText("Non firmato")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Firma ora/i })).toBeDisabled();
    expect(
      screen.getByText(/Inviato o Accettato/i)
    ).toBeInTheDocument();
  });

  it("abilita Firma ora per Inviato", async () => {
    const user = userEvent.setup();
    const onMessaggio = vi.fn();

    render(
      <FirmaClienteSection
        preventivo={{
          id: "p2",
          numero: "PREV-2",
          cliente: "Lucia",
          stato: STATI_PREVENTIVO.INVIATO,
          lavorazioni: [],
        }}
        onMessaggio={onMessaggio}
      />
    );

    const firmaOra = screen.getByRole("button", { name: /Firma ora/i });
    expect(firmaOra).not.toBeDisabled();
    await user.click(firmaOra);
    expect(screen.getByLabelText(/Area firma/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancella/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Conferma firma/i })
    ).toBeInTheDocument();
  });
});
