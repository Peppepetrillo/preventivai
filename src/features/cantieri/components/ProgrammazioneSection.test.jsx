import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ProgrammazioneSection from "./ProgrammazioneSection";

describe("ProgrammazioneSection UX-9.2/9.3", () => {
  it("mostra badge Consuntivo da registrare su giornata fatta senza consuntivo", () => {
    render(
      <ProgrammazioneSection
        cantiere={{
          id: "c1",
          programmazione: [
            {
              id: "g1",
              data: "29/07/2026",
              operai: 1,
              orePreviste: 4,
              attivita: "Tracce",
              stato: "completata",
            },
          ],
          registroGiornate: [],
        }}
      />
    );

    expect(
      screen.getByTestId("programmazione-consuntivo-mancante-g1")
    ).toHaveTextContent("Consuntivo da registrare");
  });

  it("CTA Registra consuntivo apre sheet precompilato", async () => {
    const user = userEvent.setup();
    const onRegistraConsuntivo = vi.fn();

    render(
      <ProgrammazioneSection
        cantiere={{
          id: "c1",
          programmazione: [
            {
              id: "g1",
              data: "29/07/2026",
              operai: 1,
              orePreviste: 4,
              attivita: "Tracce",
              stato: "completata",
            },
          ],
          registroGiornate: [],
        }}
        onRegistraConsuntivo={onRegistraConsuntivo}
      />
    );

    await user.click(screen.getByTestId("programmazione-registra-consuntivo-g1"));

    expect(screen.getByTestId("giornata-lavorativa-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("registro-operai")).toHaveValue("Io");
    expect(screen.getByTestId("registro-attivita")).toHaveValue("Tracce");
    expect(screen.getByTestId("registro-ore")).toHaveValue("4");
  });
});
