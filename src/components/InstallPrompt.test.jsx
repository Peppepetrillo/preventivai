import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import InstallPrompt from "./InstallPrompt";

function configuraBrowser({
  standalone = false,
  userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
} = {}) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: standalone && query === "(display-mode: standalone)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });

  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });

  Object.defineProperty(window.navigator, "standalone", {
    configurable: true,
    value: standalone,
  });
}

describe("InstallPrompt", () => {
  beforeEach(() => {
    localStorage.clear();
    configuraBrowser();
  });

  it("mostra la guida se l'app non è installata", () => {
    render(<InstallPrompt />);

    expect(screen.getByRole("heading", { name: /installa preventivai/i }))
      .toBeInTheDocument();
    expect(screen.getByText(/safari -> condividi -> aggiungi a home/i)).toBeInTheDocument();
  });

  it("non mostra nulla se l'app è già in standalone", () => {
    configuraBrowser({ standalone: true });

    render(<InstallPrompt />);

    expect(screen.queryByText(/installa preventivai/i)).not.toBeInTheDocument();
  });

  it("salva il rimando di 7 giorni quando l'utente sceglie più tardi", async () => {
    const user = userEvent.setup();

    render(<InstallPrompt />);
    await user.click(screen.getByRole("button", { name: /più tardi/i }));

    expect(screen.queryByText(/installa preventivai/i)).not.toBeInTheDocument();
    expect(Number(localStorage.getItem("preventivai-install-prompt-snoozed-until")))
      .toBeGreaterThan(Date.now());
  });

  it("rispetta la scelta di non mostrare più il prompt", async () => {
    const user = userEvent.setup();

    render(<InstallPrompt />);
    await user.click(screen.getByLabelText(/non mostrarmelo più/i));
    await user.click(screen.getByRole("button", { name: /più tardi/i }));

    expect(localStorage.getItem("preventivai-install-prompt-hidden")).toBe("true");
  });

  it("usa il prompt nativo quando beforeinstallprompt è disponibile", async () => {
    const user = userEvent.setup();
    const prompt = vi.fn();

    render(<InstallPrompt />);

    const evento = new Event("beforeinstallprompt");
    evento.prompt = prompt;
    evento.userChoice = Promise.resolve({ outcome: "accepted" });

    window.dispatchEvent(evento);
    await user.click(screen.getByRole("button", { name: /^installa$/i }));

    await waitFor(() => {
      expect(prompt).toHaveBeenCalled();
      expect(localStorage.getItem("preventivai-install-prompt-hidden")).toBe("true");
    });
  });
});
