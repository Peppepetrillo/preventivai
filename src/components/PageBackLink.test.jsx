import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ROUTES } from "../app/routes";
import PageBackLink from "../components/PageBackLink";

function Loc() {
  const location = useLocation();
  return <div data-testid="loc">{location.pathname}</div>;
}

function renderConRoute(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path={ROUTES.economia}
          element={
            <>
              <PageBackLink testId="economia-back" />
              <Loc />
            </>
          }
        />
        <Route
          path={ROUTES.altro}
          element={
            <>
              <h1>Altro</h1>
              <Loc />
            </>
          }
        />
        <Route
          path={ROUTES.impostazioni}
          element={
            <>
              <PageBackLink testId="impostazioni-back" />
              <Loc />
            </>
          }
        />
        <Route
          path={ROUTES.datiAzienda}
          element={
            <>
              <PageBackLink testId="dati-azienda-back" />
              <Loc />
            </>
          }
        />
        <Route path={ROUTES.preventivi} element={<Loc />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PageBackLink", () => {
  it("espone data-parent dalla gerarchia e torna al parent su deep link", () => {
    renderConRoute(ROUTES.economia);
    const back = screen.getByTestId("economia-back");
    expect(back).toHaveAttribute("data-parent", ROUTES.altro);
    expect(back).toHaveAttribute("aria-label", "Indietro");
    fireEvent.click(back);
    expect(screen.getByTestId("loc")).toHaveTextContent(ROUTES.altro);
  });

  it("usa history quando si arriva da parent (stesso comportamento swipe)", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.altro, ROUTES.economia]}>
        <Routes>
          <Route path={ROUTES.altro} element={<Loc />} />
          <Route
            path={ROUTES.economia}
            element={
              <>
                <PageBackLink testId="economia-back" />
                <Loc />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("loc")).toHaveTextContent(ROUTES.economia);
    fireEvent.click(screen.getByTestId("economia-back"));
    expect(screen.getByTestId("loc")).toHaveTextContent(ROUTES.altro);
  });

  it("Dati azienda → Impostazioni (non Altro)", () => {
    renderConRoute(ROUTES.datiAzienda);
    expect(screen.getByTestId("dati-azienda-back")).toHaveAttribute(
      "data-parent",
      ROUTES.impostazioni
    );
    fireEvent.click(screen.getByTestId("dati-azienda-back"));
    expect(screen.getByTestId("loc")).toHaveTextContent(ROUTES.impostazioni);
  });
});
