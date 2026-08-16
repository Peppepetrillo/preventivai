import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const registerSW = vi.fn();
const isNativePlatform = vi.fn(() => false);

vi.mock("virtual:pwa-register", () => ({
  registerSW: (...args) => registerSW(...args),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

import PwaUpdatePrompt from "./PwaUpdatePrompt";

describe("PwaUpdatePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(false);
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {},
    });
  });

  it("non mostra nulla finché non c'è un aggiornamento", () => {
    registerSW.mockImplementation(() => vi.fn());
    render(<PwaUpdatePrompt />);
    expect(screen.queryByTestId("pwa-update-prompt")).not.toBeInTheDocument();
  });

  it("mostra il banner e applica aggiornamento solo su conferma", async () => {
    const updateSW = vi.fn();
    registerSW.mockImplementation((opzioni) => {
      queueMicrotask(() => opzioni.onNeedRefresh?.());
      return updateSW;
    });

    render(<PwaUpdatePrompt />);

    await waitFor(() => {
      expect(screen.getByTestId("pwa-update-prompt")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pwa-update-confirm"));
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it("non registra SW su piattaforma native", () => {
    isNativePlatform.mockReturnValue(true);
    render(<PwaUpdatePrompt />);
    expect(registerSW).not.toHaveBeenCalled();
  });
});
