import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConfirmDialog from "./ConfirmDialog";
import { resetOverlayLockForTests } from "./overlayLock";

afterEach(() => {
  cleanup();
  resetOverlayLockForTests();
});

describe("ConfirmDialog", () => {
  it("non renderizza se chiuso", () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Elimina?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(document.body.dataset.overlayOpen).toBeUndefined();
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
    expect(overlay.className).toMatch(/ds-modal-overlay/);
    expect(overlay.parentElement).toBe(document.body);
    expect(document.body.dataset.overlayOpen).toBeTruthy();

    fireEvent.click(screen.getByTestId("confirm-dialog-cancel"));
    expect(onCancel).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("overlay è sopra BottomNav (portal + lock overlay)", () => {
    render(
      <>
        <nav className="ds-bottom-nav" data-testid="fake-bottom-nav" />
        <ConfirmDialog
          open
          title="Elimina distinta?"
          confirmLabel="Elimina"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          testId="distinte-confirm"
        />
      </>
    );

    const dialog = screen.getByTestId("distinte-confirm");
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.className).toMatch(/ds-modal-overlay/);
    expect(document.body.dataset.overlayOpen).toBeTruthy();
    expect(screen.getByTestId("distinte-confirm-confirm")).toBeVisible();
    expect(screen.getByTestId("distinte-confirm-cancel")).toBeVisible();
  });

  it("rilascia overlay lock alla chiusura", () => {
    const { rerender } = render(
      <ConfirmDialog
        open
        title="Elimina?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(document.body.dataset.overlayOpen).toBeTruthy();

    rerender(
      <ConfirmDialog
        open={false}
        title="Elimina?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(document.body.dataset.overlayOpen).toBeUndefined();
  });
});
