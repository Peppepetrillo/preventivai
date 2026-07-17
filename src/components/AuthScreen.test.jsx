import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AuthScreen from "./AuthScreen";

describe("AuthScreen", () => {
  it("invia credenziali in modalità accesso", async () => {
    const user = userEvent.setup();
    const onAccedi = vi.fn().mockResolvedValue(undefined);
    const onRegistrati = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthScreen
        errore=""
        onAccedi={onAccedi}
        onRegistrati={onRegistrati}
      />
    );

    await user.type(screen.getByLabelText(/email/i), "utente@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /accedi/i }));

    expect(onAccedi).toHaveBeenCalledWith("utente@example.com", "password123");
    expect(onRegistrati).not.toHaveBeenCalled();
  });

  it("passa alla registrazione e chiama il callback corretto", async () => {
    const user = userEvent.setup();
    const onAccedi = vi.fn().mockResolvedValue(undefined);
    const onRegistrati = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthScreen
        errore=""
        onAccedi={onAccedi}
        onRegistrati={onRegistrati}
      />
    );

    await user.click(screen.getByRole("button", { name: /non hai un account/i }));
    await user.type(screen.getByLabelText(/email/i), "nuovo@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^registrati$/i }));

    expect(onRegistrati).toHaveBeenCalledWith("nuovo@example.com", "password123");
    expect(onAccedi).not.toHaveBeenCalled();
  });
});
