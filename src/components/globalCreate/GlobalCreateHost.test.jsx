import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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
    resyncNotificheLavoro: vi.fn(),
    resyncNotificheAttivita: vi.fn(),
  },
}));

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
            <Route path={ROUTES.cantieri} element={<div>Cantieri page</div>} />
            <Route path={ROUTES.preventiviNuovo} element={<div>Wizard preventivo</div>} />
            <Route path={ROUTES.preventivi} element={<div>Lista preventivi</div>} />
            <Route
              path={ROUTES.nuovoPreventivo}
              element={<div>Scelta modalità</div>}
            />
            <Route
              path={ROUTES.nuovaDistintaMateriali}
              element={<div>Nuova distinta</div>}
            />
            <Route
              path={ROUTES.dettaglioCantiere}
              element={<div>Cantiere pagamenti</div>}
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
    expect(within(dialog).getByText("Preventivo")).toBeInTheDocument();
    expect(within(dialog).getByText("Cantiere")).toBeInTheDocument();
    expect(within(dialog).getByText("Pagamento cantiere")).toBeInTheDocument();
    expect(within(dialog).getByText("Promemoria")).toBeInTheDocument();
    expect(within(dialog).getByText("Lista materiali")).toBeInTheDocument();
    expect(within(dialog).queryByText("Nota veloce")).not.toBeInTheDocument();
  });

  it("naviga al wizard preventivo con listino", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId("global-create-fab"));
    await user.click(screen.getByTestId("global-create-preventivo"));

    expect(screen.getByText("Wizard preventivo")).toBeInTheDocument();
  });

  it("naviga ai cantieri quando non c'è un solo cantiere attivo", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId("global-create-fab"));
    await user.click(screen.getByTestId("global-create-pagamento"));

    expect(screen.getByText("Cantieri page")).toBeInTheDocument();
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
        screen.getByRole("heading", { name: /Nuovo cantiere/i })
      ).toBeInTheDocument();
    });
    expect(screen.getAllByRole("heading", { name: /Nuovo cantiere/i })).toHaveLength(1);
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

  it("BottomNav mostra Oggi, Preventivi, Cantieri, Altro", () => {
    renderShell();

    expect(screen.getByTestId("bottom-nav-oggi")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-preventivi")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-cantieri")).toBeInTheDocument();
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
