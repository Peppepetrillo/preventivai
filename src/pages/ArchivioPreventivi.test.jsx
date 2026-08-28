import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ROUTES } from "../app/routes";
import ArchivioPreventivi from "./ArchivioPreventivi";

describe("ArchivioPreventivi redirect UX-8.4", () => {
  it("/archivio reindirizza a /preventivi", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.archivio]}>
        <Routes>
          <Route path={ROUTES.archivio} element={<ArchivioPreventivi />} />
          <Route path={ROUTES.preventivi} element={<div>Lista preventivi</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Lista preventivi")).toBeInTheDocument();
  });
});
