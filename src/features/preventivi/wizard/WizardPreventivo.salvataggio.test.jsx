import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { ROUTES } from "../../../app/routes";
import { listinoBase } from "../../../data/listinoBase";
import { WizardProvider } from "./wizardContext";
import WizardPreventivo from "./WizardPreventivo";

vi.mock("../../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    planForLavoro: vi.fn(),
    planForActivity: vi.fn(),
  },
}));

const generaPdfPreventivo = vi.fn(() => Promise.resolve({}));

vi.mock("../../../services/preventiviPdfService", () => ({
  generaPdfPreventivo: (...args) => generaPdfPreventivo(...args),
}));

const CLIENTE = {
  id: "c1",
  nome: "Rossi Mario",
  telefono: "333",
  indirizzo: "Via Roma 1",
};

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.preventiviNuovo]}>
      <WizardProvider>
        <Routes>
          <Route path={ROUTES.preventiviNuovo} element={<WizardPreventivo />} />
        </Routes>
      </WizardProvider>
    </MemoryRouter>
  );
}

async function arrivaAConferma() {
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

  const voce = listinoBase.find((item) => item.id === "punto-luce");
  fireEvent.click(
    screen.getByRole("button", {
      name: new RegExp(`Aggiungi ${voce.nome}`, "i"),
    })
  );

  fireEvent.click(screen.getByRole("button", { name: /Continua/i }));

  await waitFor(() => {
    expect(screen.getByTestId("step-conferma")).toBeInTheDocument();
  });
}

describe("WizardPreventivo salvataggio iOS/UX-5.3", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.listino, JSON.stringify(listinoBase));
    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify([CLIENTE]));
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));
    generaPdfPreventivo.mockReset();
    generaPdfPreventivo.mockResolvedValue({});
  });

  it("dopo Salva mostra Preventivo creato con PDF ok", async () => {
    renderWizard();
    await arrivaAConferma();

    fireEvent.click(screen.getByTestId("salva-preventivo"));

    await waitFor(() => {
      expect(screen.getByTestId("preventivo-successo")).toBeInTheDocument();
    });

    expect(screen.getByText(/Preventivo creato/i)).toBeInTheDocument();
    expect(screen.queryByTestId("salva-preventivo")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(generaPdfPreventivo).toHaveBeenCalled();
    });

    const archivio = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.preventivi) || "[]"
    );
    expect(archivio).toHaveLength(1);
  });

  it("dopo Salva mostra successo anche se PDF reject", async () => {
    generaPdfPreventivo.mockRejectedValue(new Error("pdf fail"));
    renderWizard();
    await arrivaAConferma();

    fireEvent.click(screen.getByTestId("salva-preventivo"));

    await waitFor(() => {
      expect(screen.getByTestId("preventivo-successo")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/PDF non generato/i)).toBeInTheDocument();
    });

    const archivio = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.preventivi) || "[]"
    );
    expect(archivio).toHaveLength(1);
    expect(screen.getByTestId("successo-riprova-pdf")).toBeInTheDocument();
  });

  it("dopo Salva mostra successo con PDF ancora pending", async () => {
    let resolvePdf;
    generaPdfPreventivo.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePdf = resolve;
        })
    );

    renderWizard();
    await arrivaAConferma();

    fireEvent.click(screen.getByTestId("salva-preventivo"));

    await waitFor(() => {
      expect(screen.getByTestId("preventivo-successo")).toBeInTheDocument();
    });

    expect(screen.getByText(/Preventivo creato/i)).toBeInTheDocument();

    const archivio = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.preventivi) || "[]"
    );
    expect(archivio).toHaveLength(1);

    await act(async () => {
      resolvePdf({});
    });
  });

  it("secondo Salva non crea un secondo preventivo", async () => {
    renderWizard();
    await arrivaAConferma();

    fireEvent.click(screen.getByTestId("salva-preventivo"));

    await waitFor(() => {
      expect(screen.getByTestId("preventivo-successo")).toBeInTheDocument();
    });

    const primo = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.preventivi) || "[]"
    );
    expect(primo).toHaveLength(1);
    const primoId = primo[0].id;

    // Lo stato successo resta; un nuovo tap Salva non è disponibile.
    expect(screen.queryByTestId("salva-preventivo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("successo-nuovo-preventivo"));

    await waitFor(() => {
      expect(screen.getByLabelText(/Cerca cliente/i)).toBeInTheDocument();
    });

    const dopo = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.preventivi) || "[]"
    );
    expect(dopo).toHaveLength(1);
    expect(dopo[0].id).toBe(primoId);
  });

  it("retry PDF non crea un nuovo preventivo", async () => {
    generaPdfPreventivo
      .mockRejectedValueOnce(new Error("pdf fail"))
      .mockResolvedValueOnce({});

    renderWizard();
    await arrivaAConferma();

    fireEvent.click(screen.getByTestId("salva-preventivo"));

    await waitFor(() => {
      expect(screen.getByTestId("successo-riprova-pdf")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("successo-riprova-pdf"));

    await waitFor(() => {
      expect(generaPdfPreventivo).toHaveBeenCalledTimes(2);
    });

    const archivio = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.preventivi) || "[]"
    );
    expect(archivio).toHaveLength(1);
  });
});
