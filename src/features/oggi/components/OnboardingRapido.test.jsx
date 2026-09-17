import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import OnboardingRapido, {
  ONBOARDING_RAPIDO_KEY,
  marcaOnboarding,
} from "./OnboardingRapido";

describe("OnboardingRapido", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mostra guida e permette Salta per ora", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OnboardingRapido forzato />
      </MemoryRouter>
    );

    expect(screen.getByTestId("onboarding-rapido")).toBeInTheDocument();
    expect(screen.getByText(/Crea un cliente/i)).toBeInTheDocument();

    await user.click(screen.getByTestId("onboarding-salta"));
    expect(screen.queryByTestId("onboarding-rapido")).not.toBeInTheDocument();
    expect(localStorage.getItem(ONBOARDING_RAPIDO_KEY)).toBe("skipped");
  });

  it("non si mostra se già completato", () => {
    marcaOnboarding("done");
    render(
      <MemoryRouter>
        <OnboardingRapido />
      </MemoryRouter>
    );
    expect(screen.queryByTestId("onboarding-rapido")).not.toBeInTheDocument();
  });
});
