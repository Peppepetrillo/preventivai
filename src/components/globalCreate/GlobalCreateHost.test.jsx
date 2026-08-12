import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../../app/routes";
import BottomNav from "../BottomNav";
import { WizardProvider } from "../../features/preventivi/wizard/wizardContext";
import { GlobalCreateProvider } from "./GlobalCreateContext";
import GlobalCreateHost from "./GlobalCreateHost";

vi.mock("../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: {
    planForLavoro: vi.fn(),
    planForActivity: vi.fn(),
  },
}));

function ClientiProbe() {
  const [params] = useSearchParams();
  return <div>Clienti page nuovo={params.get("nuovo")}</div>;
}

function ultimoDialog() {
  const dialogs = screen.getAllByRole("dialog");
  return dialogs[dialogs.length - 1];
}

function renderShell(initialPath = ROUTES.dashboard) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <WizardProvider>
        <GlobalCreateProvider>
          <Routes>
            <Route path={ROUTES.dashboard} element={<div>Dashboard</div>} />
            <Route path={ROUTES.clienti} element={<ClientiProbe />} />
          <Route path={ROUTES.preventivi} element={<div>Wizard preventivo</div>} />
          <Route
            path={ROUTES.nuovoPreventivo}
            element={<div>Scelta modalità</div>}
          />
            <Route
              path={ROUTES.nuovaDistintaMateriali}
              element={<div>Nuova distinta</div>}
            />
          </Routes>
          <BottomNav />
          <GlobalCreateHost />
        </GlobalCreateProvider>
      </WizardProvider>
    </MemoryRouter>
  );
}

describe("GlobalCreate UX-3", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("FAB globale apre il menu Nuovo", async () => {
    const user = userEvent.setup();
    renderShell();

    expect(screen.getByTestId("global-create-fab")).toBeInTheDocument();
    await user.click(screen.getByTestId("global-create-fab"));

    const dialog = ultimoDialog();
    expect(within(dialog).getByTestId("global-create-sheet")).toBeInTheDocument();
    expect(within(dialog).getByText("Lavoro")).toBeInTheDocument();
    expect(within(dialog).getByText("Preventivo")).toBeInTheDocument();
    expect(within(dialog).getByText("Cliente")).toBeInTheDocument();
    expect(within(dialog).getByText("Attività")).toBeInTheDocument();
    expect(within(dialog).getByText("Distinta materiali")).toBeInTheDocument();
    expect(within(dialog).queryByText("Nota veloce")).not.toBeInTheDocument();
  });

  it("naviga al wizard preventivo con listino", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId("global-create-fab"));
    await user.click(screen.getByTestId("global-create-preventivo"));

    expect(screen.getByText("Wizard preventivo")).toBeInTheDocument();
  });

  it("naviga a nuovo cliente con query nuovo=1", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId("global-create-fab"));
    await user.click(screen.getByTestId("global-create-cliente"));

    expect(screen.getByText("Clienti page nuovo=1")).toBeInTheDocument();
  });

  it("naviga a nuova distinta materiali", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId("global-create-fab"));
    await user.click(screen.getByTestId("global-create-distinta"));

    expect(screen.getByText("Nuova distinta")).toBeInTheDocument();
  });

  it("apre NuovoLavoroSheet senza duplicare form", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId("global-create-fab"));
    await user.click(screen.getByTestId("global-create-lavoro"));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Nuovo lavoro/i })
      ).toBeInTheDocument();
    });
    expect(screen.getAllByRole("heading", { name: /Nuovo lavoro/i })).toHaveLength(1);
  });

  it("apre AttivitaFormSheet", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId("global-create-fab"));
    await user.click(screen.getByTestId("global-create-attivita"));

    expect(
      within(ultimoDialog()).getByRole("heading", { name: /Nuova attività/i })
    ).toBeInTheDocument();
  });

  it("BottomNav mostra Oggi, Lavori, Clienti, Altro", () => {
    renderShell();

    expect(screen.getByTestId("bottom-nav-oggi")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-lavori")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-clienti")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-altro")).toBeInTheDocument();
  });

  it("FAB ha touch target >=44px", () => {
    renderShell();
    const fab = screen.getByTestId("global-create-fab");
    expect(fab.className).toMatch(/min-h-\[44px\]/);
    expect(fab.className).toMatch(/min-w-\[44px\]/);
  });

  it("chiude il menu con Escape", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId("global-create-fab"));
    expect(screen.getByTestId("global-create-sheet")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTestId("global-create-sheet")).not.toBeInTheDocument();
    });
  });
});
