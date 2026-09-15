import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import OverlayPortal from "./OverlayPortal";
import { resetOverlayLockForTests } from "./overlayLock";

afterEach(() => {
  cleanup();
  resetOverlayLockForTests();
});

describe("OverlayPortal", () => {
  it("porta su document.body e attiva overlay lock", () => {
    render(
      <>
        <nav className="ds-bottom-nav" data-testid="nav" />
        <OverlayPortal open testId="overlay-test">
          <div className="ds-modal-panel">Contenuto</div>
        </OverlayPortal>
      </>
    );

    const overlay = screen.getByTestId("overlay-test");
    expect(overlay.parentElement).toBe(document.body);
    expect(document.body.dataset.overlayOpen).toBeTruthy();
    expect(screen.getByText("Contenuto")).toBeVisible();
  });

  it("chiuso non monta e non lascia lock", () => {
    render(
      <OverlayPortal open={false} testId="overlay-chiuso">
        <p>Hidden</p>
      </OverlayPortal>
    );
    expect(screen.queryByTestId("overlay-chiuso")).not.toBeInTheDocument();
    expect(document.body.dataset.overlayOpen).toBeUndefined();
  });
});
