import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { ROUTES } from "../../../app/routes";
import { listinoBase } from "../../../data/listinoBase";
import { resetOverlayLockForTests } from "../../../components/overlayLock";
import {
  eseguiNavigazioneIndietro,
  setNavigazioneIndietroHandler,
} from "../../../navigation/navigateBack";
import { WizardProvider } from "./wizardContext";
import WizardPreventivo, { wizardBozzaHaDati } from "./WizardPreventivo";

const CLIENTE = {
  id: "c1",
  nome: "Rossi Mario",
  telefono: "333",
  indirizzo: "Via Roma 1",
};

function renderWizard(entry = ROUTES.preventiviNuovo) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <WizardProvider>
        <Routes>
          <Route path={ROUTES.preventiviNuovo} element={<WizardPreventivo />} />
          <Route
            path={ROUTES.preventivi}
            element={<div data-testid="lista-preventivi">Lista</div>}
          />
        </Routes>
      </WizardProvider>
    </MemoryRouter>
  );
}

describe("wizardBozzaHaDati", () => {
  it("vuota → false", () => {
    expect(wizardBozzaHaDati({})).toBe(false);
    expect(wizardBozzaHaDati({ cliente: "", lavorazioni: [] })).toBe(false);
  });

  it("con cliente o lavorazioni → true", () => {
    expect(wizardBozzaHaDati({ cliente: "Rossi" })).toBe(true);
    expect(
      wizardBozzaHaDati({ lavorazioni: [{ id: "1", nome: "Punto luce" }] })
    ).toBe(true);
  });
});

describe("WizardPreventivo — protezione bozza", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.listino, JSON.stringify(listinoBase));
    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify([CLIENTE]));
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));
    setNavigazioneIndietroHandler(null);
  });

  afterEach(() => {
    setNavigazioneIndietroHandler(null);
    resetOverlayLockForTests();
  });

  it("bozza vuota: Indietro esce senza dialog", async () => {
    renderWizard();
    await waitFor(() => {
      expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Torna al passo precedente/i })
    );

    await waitFor(() => {
      expect(screen.getByTestId("lista-preventivi")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("wizard-conferma-uscita")).not.toBeInTheDocument();
  });

  it("bozza con dati: Indietro apre ConfirmDialog Continua/Esci", async () => {
    renderWizard();
    await waitFor(() => {
      expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Seleziona cliente Rossi Mario/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Dal tuo listino/i })
      ).toBeInTheDocument();
    });

    // Torna a step cliente (step back), poi di nuovo Indietro = uscita
    fireEvent.click(
      screen.getByRole("button", { name: /Torna al passo precedente/i })
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Torna al passo precedente/i })
    );

    await waitFor(() => {
      expect(screen.getByTestId("wizard-conferma-uscita")).toBeInTheDocument();
    });
    expect(screen.getByText(/Vuoi uscire\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/La bozza non salvata andrà persa/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("wizard-conferma-uscita-cancel"));
    await waitFor(() => {
      expect(
        screen.queryByTestId("wizard-conferma-uscita")
      ).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Torna al passo precedente/i })
    );
    await waitFor(() => {
      expect(screen.getByTestId("wizard-conferma-uscita")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("wizard-conferma-uscita-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("lista-preventivi")).toBeInTheDocument();
    });
  });

  it("edge/hardware back usa lo stesso handler del wizard", async () => {
    renderWizard();
    await waitFor(() => {
      expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Seleziona cliente Rossi Mario/i })
    );
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Dal tuo listino/i })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Torna al passo precedente/i })
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();
    });

    const navigate = () => {};
    eseguiNavigazioneIndietro(navigate, ROUTES.preventiviNuovo);

    await waitFor(() => {
      expect(screen.getByTestId("wizard-conferma-uscita")).toBeInTheDocument();
    });
  });
});
