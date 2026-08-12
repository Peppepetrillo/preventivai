import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CondivisioneSection from "./CondivisioneSection";
import { resetCondivisioni } from "../../../domain/condivisione";
import { resetFirme } from "../../../domain/firma";

describe("CondivisioneSection", () => {
  beforeEach(() => {
    localStorage.clear();
    resetCondivisioni();
    resetFirme();
  });

  it("mostra pulsanti e storico vuoto", () => {
    render(
      <CondivisioneSection
        preventivo={{
          id: "p1",
          numero: "PREV-1",
          cliente: "Mario",
        }}
        preparaDocumento={vi.fn()}
        onMessaggio={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: /Condivisione/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Invia Email/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Invia WhatsApp/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Condividi$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Scarica PDF/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Anteprima PDF/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Storico condivisioni/i)).toBeInTheDocument();
    expect(screen.getByText(/Nessuna condivisione ancora/i)).toBeInTheDocument();
  });

  it("chiama preparaDocumento e aggiorna storico su download", async () => {
    const user = userEvent.setup();
    const blob = new Blob(["%PDF"], { type: "application/pdf" });
    const preparaDocumento = vi.fn(async () => ({ blob, nomeFile: "PREV-1.pdf" }));
    const onMessaggio = vi.fn();

    const { rerender } = render(
      <CondivisioneSection
        preventivo={{ id: "p1", numero: "PREV-1", cliente: "Mario" }}
        preparaDocumento={preparaDocumento}
        onMessaggio={onMessaggio}
      />
    );

    // Mock download side-effect via real service — scaricaBlob needs document
    // Service uses document.createElement — jsdom has it.
    await user.click(screen.getByRole("button", { name: /Scarica PDF/i }));

    expect(preparaDocumento).toHaveBeenCalled();
    expect(onMessaggio).toHaveBeenCalled();

    rerender(
      <CondivisioneSection
        preventivo={{ id: "p1", numero: "PREV-1", cliente: "Mario" }}
        preparaDocumento={preparaDocumento}
        onMessaggio={onMessaggio}
      />
    );

    expect(screen.queryByText(/Nessuna condivisione ancora/i)).not.toBeInTheDocument();
    expect(screen.getByText("Completato")).toBeInTheDocument();
    expect(screen.getByText("Locale")).toBeInTheDocument();
    expect(screen.getAllByText("Download").length).toBeGreaterThan(0);
  });
});
