import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import PreventivoExpress from "./PreventivoExpress";

vi.mock("../../../hooks/useRiconoscimentoVocale", () => ({
  useRiconoscimentoVocale: () => ({
    supportato: false,
    inAscolto: false,
    erroreVoce: "",
    richiedeRete: true,
    avvia: vi.fn(),
    ferma: vi.fn(),
    resetErrore: vi.fn(),
  }),
}));

describe("PreventivoExpress — Preventivo vocale", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.clienti,
      JSON.stringify([{ id: "c1", nome: "Rossi" }])
    );
    localStorage.setItem(
      STORAGE_KEYS.listino,
      JSON.stringify([
        {
          id: "punto-luce",
          nome: "Punto luce",
          categoria: "Impianto",
          prezzo: 45,
          unita: "cad",
          attiva: true,
        },
        {
          id: "punto-presa",
          nome: "Punto presa",
          categoria: "Impianto",
          prezzo: 55,
          unita: "cad",
          attiva: true,
        },
      ])
    );
  });

  it("analizza, mostra anteprima listino e applica solo dopo conferma", async () => {
    const user = userEvent.setup();
    const onApplica = vi.fn();
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <PreventivoExpress open onClose={onClose} onApplica={onApplica} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("preventivo-vocale-sheet")).toBeInTheDocument();
    expect(screen.getByText(/prezzi arrivano solo dal tuo listino/i)).toBeInTheDocument();

    await user.type(
      screen.getByTestId("preventivo-vocale-testo"),
      "80 punti luce e 60 prese e 12 bobine magiche"
    );
    await user.click(screen.getByTestId("preventivo-vocale-analizza"));

    await waitFor(() => {
      expect(screen.getByTestId("preventivo-vocale-anteprima")).toBeInTheDocument();
    });

    expect(onApplica).not.toHaveBeenCalled();
    expect(screen.getByTestId("preventivo-vocale-match")).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-vocale-non-trovate")).toBeInTheDocument();
    expect(screen.getByText(/Non trovo/i)).toBeInTheDocument();

    await user.click(screen.getByTestId("preventivo-vocale-conferma"));

    expect(onApplica).toHaveBeenCalledTimes(1);
    const payload = onApplica.mock.calls[0][0];
    expect(payload.lavorazioni.length).toBeGreaterThan(0);
    for (const lav of payload.lavorazioni) {
      expect(lav.prezzoDalListino).toBe(true);
    }
    expect(onClose).toHaveBeenCalled();
  });

  it("modifica testo torna all'input senza applicare", async () => {
    const user = userEvent.setup();
    const onApplica = vi.fn();

    render(
      <MemoryRouter>
        <PreventivoExpress open onClose={vi.fn()} onApplica={onApplica} />
      </MemoryRouter>
    );

    await user.type(
      screen.getByTestId("preventivo-vocale-testo"),
      "4 punti luce"
    );
    await user.click(screen.getByTestId("preventivo-vocale-analizza"));

    await waitFor(() => {
      expect(screen.getByTestId("preventivo-vocale-anteprima")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("preventivo-vocale-modifica"));

    expect(screen.getByTestId("preventivo-vocale-analizza")).toBeInTheDocument();
    expect(onApplica).not.toHaveBeenCalled();
  });
});
