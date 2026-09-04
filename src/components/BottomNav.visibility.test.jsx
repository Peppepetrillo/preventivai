import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { ROUTES } from "../app/routes";
import { CATALOGO_MATERIALI_SEED } from "../domain/catalogoMateriali/materialiCatalogoSeed";
import { creaDistintaMateriali } from "../domain/distinteMateriali/distintaMaterialiService";
import { WizardProvider } from "../features/preventivi/wizard/wizardContext";
import DistintaMaterialiEditor from "../pages/DistintaMaterialiEditor";
import DistinteMateriali from "../pages/DistinteMateriali";
import BottomNav from "./BottomNav";
import { GlobalCreateProvider } from "./globalCreate/GlobalCreateContext";

function renderShell(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <WizardProvider>
        <GlobalCreateProvider>
          <Routes>
            <Route path={ROUTES.distinteMateriali} element={<DistinteMateriali />} />
            <Route
              path={ROUTES.nuovaDistintaMateriali}
              element={<DistintaMaterialiEditor />}
            />
            <Route
              path={ROUTES.distintaMateriali}
              element={<DistintaMaterialiEditor />}
            />
            <Route path={ROUTES.acquisti} element={<div>Acquisti page</div>} />
            <Route
              path={ROUTES.catalogoMateriali}
              element={<div>Catalogo page</div>}
            />
          </Routes>
          <BottomNav />
        </GlobalCreateProvider>
      </WizardProvider>
    </MemoryRouter>
  );
}

function nav() {
  return screen.queryByRole("navigation", { name: /Navigazione principale/i });
}

describe("BottomNav UX-4.3 — editor distinta full screen", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.catalogoMateriali,
      JSON.stringify(CATALOGO_MATERIALI_SEED)
    );
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("mostra BottomNav sulla lista distinte", () => {
    renderShell(ROUTES.distinteMateriali);
    expect(nav()).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav-oggi")).toBeInTheDocument();
  });

  it("nasconde BottomNav su /distinte-materiali/nuova", () => {
    renderShell(ROUTES.nuovaDistintaMateriali);
    expect(nav()).not.toBeInTheDocument();
    expect(screen.getByTestId("distinta-salva")).toBeInTheDocument();
  });

  it("nasconde BottomNav su /distinte-materiali/:id", () => {
    const distinta = creaDistintaMateriali({ titolo: "BOM test" });
    renderShell(`/distinte-materiali/${distinta.id}`);
    expect(nav()).not.toBeInTheDocument();
    expect(screen.getByTestId("distinta-salva")).toBeInTheDocument();
  });

  it("barra Salva ha touch target >=44px e continua a funzionare", () => {
    renderShell(ROUTES.nuovaDistintaMateriali);
    const salva = screen.getByTestId("distinta-salva");
    expect(salva).toHaveClass("min-h-[52px]");
    fireEvent.change(screen.getByTestId("distinta-titolo"), {
      target: { value: "Distinta UX" },
    });
    fireEvent.click(salva);
    expect(screen.getByText(/Distinta creata|Salvata/i)).toBeInTheDocument();
  });

  it("navigazione editor → lista ripristina BottomNav", () => {
    renderShell(ROUTES.nuovaDistintaMateriali);
    expect(nav()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Indietro/i }));

    expect(nav()).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Distinte materiali/i })
    ).toBeInTheDocument();
  });

  it("non nasconde BottomNav su Acquisti e Catalogo", () => {
    const { unmount } = renderShell(ROUTES.acquisti);
    expect(nav()).toBeInTheDocument();
    unmount();

    renderShell(ROUTES.catalogoMateriali);
    expect(nav()).toBeInTheDocument();
  });
});
