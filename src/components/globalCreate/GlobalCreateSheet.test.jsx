import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import GlobalCreateSheet from "./GlobalCreateSheet";

function ultimoDialog() {
  const dialogs = screen.getAllByRole("dialog");
  return dialogs[dialogs.length - 1];
}

describe("GlobalCreateSheet UX-3", () => {
  it("apre con titolo Nuovo e chiude con Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <GlobalCreateSheet
        open
        onClose={onClose}
        actions={[
          {
            id: "lavoro",
            label: "Lavoro",
            onPress: vi.fn(),
            testId: "global-create-lavoro",
          },
        ]}
      />
    );

    expect(within(ultimoDialog()).getByRole("heading", { name: /^Nuovo$/i })).toBeInTheDocument();
    expect(screen.getByTestId("global-create-sheet")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("non renderizza quando chiuso", () => {
    render(
      <GlobalCreateSheet
        open={false}
        onClose={vi.fn()}
        actions={[]}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("invoca onPress delle azioni", async () => {
    const user = userEvent.setup();
    const onLavoro = vi.fn();
    const onPreventivo = vi.fn();

    render(
      <GlobalCreateSheet
        open
        onClose={vi.fn()}
        actions={[
          {
            id: "lavoro",
            label: "Lavoro",
            subtitle: "Cantiere o intervento",
            onPress: onLavoro,
            testId: "global-create-lavoro",
          },
          {
            id: "preventivo",
            label: "Preventivo",
            onPress: onPreventivo,
            testId: "global-create-preventivo",
          },
        ]}
      />
    );

    await user.click(screen.getByTestId("global-create-lavoro"));
    await user.click(screen.getByTestId("global-create-preventivo"));

    expect(onLavoro).toHaveBeenCalledTimes(1);
    expect(onPreventivo).toHaveBeenCalledTimes(1);
  });

  it("touch target >=44px sulle righe", () => {
    render(
      <GlobalCreateSheet
        open
        onClose={vi.fn()}
        actions={[
          {
            id: "cliente",
            label: "Cliente",
            onPress: vi.fn(),
            testId: "global-create-cliente",
          },
        ]}
      />
    );

    expect(screen.getByTestId("global-create-cliente").className).toMatch(
      /min-h-\[52px\]/
    );
  });

  it("disabilita azione quando disabled", () => {
    render(
      <GlobalCreateSheet
        open
        onClose={vi.fn()}
        actions={[
          {
            id: "nota",
            label: "Nota veloce",
            onPress: vi.fn(),
            disabled: true,
            testId: "global-create-nota",
          },
        ]}
      />
    );

    expect(screen.getByTestId("global-create-nota")).toBeDisabled();
  });
});
