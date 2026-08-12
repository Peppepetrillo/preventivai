import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import { STORAGE_KEYS } from "../app/storageKeys";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

describe("UX-5.1 entry unico preventivo", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Dashboard punta al wizard canonico", async () => {
    const { default: Dashboard } = await import("./Dashboard");
    localStorage.setItem(
      STORAGE_KEYS.datiAzienda,
      JSON.stringify({ nomeDitta: "Test" })
    );
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("entry-nuovo-preventivo")).toHaveAttribute(
      "href",
      ROUTES.preventivi
    );
  });

  it("DettaglioCliente punta al wizard con clienteId", async () => {
    const { default: DettaglioCliente } = await import("./DettaglioCliente");
    localStorage.setItem(
      STORAGE_KEYS.clienti,
      JSON.stringify([{ id: "99", nome: "Verdi", telefono: "333" }])
    );
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([]));

    render(
      <MemoryRouter initialEntries={["/cliente/99"]}>
        <Routes>
          <Route path="/cliente/:id" element={<DettaglioCliente />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("entry-nuovo-preventivo-cliente")).toHaveAttribute(
      "href",
      `${ROUTES.preventivi}?clienteId=99`
    );
  });
});
