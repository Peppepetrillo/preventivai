import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { ROUTES } from "../app/routes";
import Cantieri from "./Cantieri";
import Clienti from "./Clienti";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

describe("UX-1.3 deep link creazione", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          nome: "Esistente",
          cliente: "Rossi",
          stato: "In corso",
        },
      ])
    );
    localStorage.setItem(
      STORAGE_KEYS.clienti,
      JSON.stringify([{ id: "1", nome: "Mario", telefono: "", email: "" }])
    );
  });

  it("apre il form nuovo cantiere con ?nuovo=1", () => {
    render(
      <MemoryRouter initialEntries={[`${ROUTES.cantieri}?nuovo=1`]}>
        <Routes>
          <Route path={ROUTES.cantieri} element={<Cantieri />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Nuovo cantiere/i)).toBeInTheDocument();
  });

  it("apre il form nuovo cliente con ?nuovo=1", () => {
    render(
      <MemoryRouter initialEntries={[`${ROUTES.clienti}?nuovo=1`]}>
        <Routes>
          <Route path={ROUTES.clienti} element={<Clienti />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Nuovo cliente/i)).toBeInTheDocument();
  });
});
