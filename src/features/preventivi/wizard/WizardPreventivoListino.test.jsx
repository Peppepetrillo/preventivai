import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { ROUTES } from "../../../app/routes";
import { listinoBase } from "../../../data/listinoBase";
import { WizardProvider } from "./wizardContext";
import WizardPreventivo from "./WizardPreventivo";
import StepCliente from "./steps/StepCliente";
import { calcolaTotali } from "../../../utils/preventivi";
import { creaLavorazioneDaVoce } from "../preventiviDomain";

vi.mock("../../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    planForLavoro: vi.fn(),
    planForActivity: vi.fn(),
  },
}));

const CLIENTE = { id: "c1", nome: "Rossi Mario", telefono: "333", indirizzo: "Via Roma 1" };

function renderWizard(initialPath = ROUTES.preventivi) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <WizardProvider>
        <Routes>
          <Route path={ROUTES.preventivi} element={<WizardPreventivo />} />
        </Routes>
      </WizardProvider>
    </MemoryRouter>
  );
}

async function arrivaAComponi() {
  await waitFor(() => {
    expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: /Seleziona cliente Rossi Mario/i }));
  await waitFor(() => {
    expect(screen.getByRole("heading", { name: /Dal tuo listino/i })).toBeInTheDocument();
  });
}

describe("Wizard Listino → Preventivo", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.listino, JSON.stringify(listinoBase));
    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify([CLIENTE]));
  });

  it("parte dallo step Cliente", () => {
    renderWizard();

    expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();
    expect(screen.getByText(/Nuovo preventivo · 1\/3/i)).toBeInTheDocument();
  });

  it("mostra link Altre modalità nello step Cliente", () => {
    renderWizard();

    const link = screen.getByTestId("wizard-altre-modalita");
    expect(link).toHaveAttribute("href", ROUTES.nuovoPreventivo);
    expect(link).toHaveTextContent(/Altre modalità/i);
  });

  it("propaga clienteId nel link Altre modalità sullo step Cliente", () => {
    render(
      <MemoryRouter initialEntries={[`${ROUTES.preventivi}?clienteId=c1`]}>
        <Routes>
          <Route
            path={ROUTES.preventivi}
            element={<StepCliente onSelezionaCliente={vi.fn()} />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("wizard-altre-modalita")).toHaveAttribute(
      "href",
      `${ROUTES.nuovoPreventivo}?clienteId=c1`
    );
  });

  it("salta lo step Cliente con clienteId precompilato", async () => {
    renderWizard(`${ROUTES.preventivi}?clienteId=c1`);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Dal tuo listino/i })).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Cerca cliente/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Rossi Mario").length).toBeGreaterThanOrEqual(1);
  });

  it("mostra il selector tipo lavoro in Componi", async () => {
    renderWizard();
    await arrivaAComponi();

    expect(screen.getByTestId("tipo-lavoro-selector")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Impianto completo/i, pressed: true })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Intervento/i })).toBeInTheDocument();
  });

  it("mostra il listino nello step Componi", async () => {
    renderWizard();

    await arrivaAComponi();

    expect(screen.getByRole("heading", { name: /Dal tuo listino/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Cerca lavorazione/i)).toBeInTheDocument();
    expect(screen.getByText("Punto luce")).toBeInTheDocument();
  });

  it("filtra le lavorazioni con la ricerca", async () => {
    const user = userEvent.setup();
    renderWizard();
    await arrivaAComponi();

    await user.type(screen.getByPlaceholderText(/Cerca lavorazione/i), "presa");

    expect(
      screen.queryByRole("button", { name: /Aggiungi Punto luce/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Aggiungi Punto presa/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Prese/i })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("aggiunge una lavorazione dal listino con prezzo corretto", async () => {
    const user = userEvent.setup();
    renderWizard();
    await arrivaAComponi();

    const voceListino = listinoBase.find((voce) => voce.id === "punto-luce");
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(`Aggiungi ${voceListino.nome}`, "i"),
      })
    );

    expect(screen.getByLabelText(/Carrello preventivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Totale riga 40,00/i)).toBeInTheDocument();

    const lavorazione = creaLavorazioneDaVoce(voceListino);
    expect(lavorazione.prezzo).toBe(40);
    expect(lavorazione.quantita).toBe(1);
    expect(lavorazione.listinoId).toBe("punto-luce");
  });

  it("incrementa la quantità con tap ripetuto e carrello", async () => {
    const user = userEvent.setup();
    renderWizard();
    await arrivaAComponi();

    const voceListino = listinoBase.find((voce) => voce.id === "punto-luce");
    const pulsante = screen.getByRole("button", {
      name: new RegExp(`Aggiungi ${voceListino.nome}`, "i"),
    });

    await user.click(pulsante);
    await user.click(pulsante);

    expect(
      screen.getByRole("button", {
        name: /Aumenta quantità di Punto luce, attualmente 2/i,
      })
    ).toBeInTheDocument();

    const totali = calcolaTotali(
      [
        {
          nome: voceListino.nome,
          prezzo: voceListino.prezzo,
          quantita: 2,
        },
      ],
      0,
      22
    );
    expect(totali.subtotale).toBe(80);
  });

  it("prefill cliente da query clienteId", async () => {
    renderWizard(`${ROUTES.preventivi}?clienteId=c1`);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Dal tuo listino/i })).toBeInTheDocument();
    });

    expect(screen.getAllByText("Rossi Mario").length).toBeGreaterThanOrEqual(1);
  });

  it("creaLavorazioneDaVoce usa il prezzo del listino", () => {
    const voce = listinoBase.find((item) => item.id === "punto-presa");
    const lavorazione = creaLavorazioneDaVoce(voce);

    expect(lavorazione.prezzo).toBe(voce.prezzo);
    expect(lavorazione.listinoId).toBe("punto-presa");
  });
});

describe("creaLavorazioneDaVoce calcolo totale", () => {
  it("calcola il totale con prezzo listino e quantità", () => {
    const voce = listinoBase.find((item) => item.id === "punto-luce");
    const lavorazione = { ...creaLavorazioneDaVoce(voce), quantita: 3 };
    const totali = calcolaTotali([lavorazione], 0, 22);

    expect(totali.subtotale).toBe(120);
  });
});
