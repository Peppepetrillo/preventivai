import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("non renderizza se chiuso", () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Elimina?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("conferma e annulla", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Eliminare la voce?"
        description="L'azione non si può annullare."
        confirmLabel="Elimina"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/non si può annullare/i)).toBeVisible();
    expect(screen.getByTestId("confirm-dialog-cancel")).toBeVisible();
    expect(screen.getByTestId("confirm-dialog-confirm")).toBeVisible();

    const overlay = screen.getByTestId("confirm-dialog");
    expect(overlay.className).toMatch(/z-\[80\]/);
    expect(overlay.className).toMatch(/items-center/);

    fireEvent.click(screen.getByTestId("confirm-dialog-cancel"));
    expect(onCancel).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });
});
