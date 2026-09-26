import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import Manodopera from "../../pages/Manodopera";

describe("Manodopera page smoke", () => {
  it("monta pagina settimanale", () => {
    render(
      <MemoryRouter>
        <Manodopera />
      </MemoryRouter>
    );
    expect(screen.getByTestId("manodopera-page")).toBeInTheDocument();
    expect(screen.getByTestId("manodopera-settimana-nav")).toBeInTheDocument();
    expect(screen.getByTestId("manodopera-totali")).toBeInTheDocument();
  });
});
