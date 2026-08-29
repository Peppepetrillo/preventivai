import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import { STORAGE_KEYS } from "../app/storageKeys";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

describe("DettaglioCliente UX-12", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.clienti,
      JSON.stringify([
        { id: 1, nome: "Mario Rossi", telefono: "111" },
        { id: 2, nome: "Mario Rossi", telefono: "222" },
      ])
    );
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        {
          id: "p1",
          numero: "PREV-001",
          cliente: "Mario Rossi",
          clienteId: 1,
          totale: 100,
          data: "01/01/2026",
          stato: "Convertito",
          cantiereId: "c99",
          tipoLavoro: "impianto",
        },
        {
          id: "p2",
          numero: "PREV-002",
          cliente: "Mario Rossi",
          clienteId: 2,
          totale: 200,
          data: "02/01/2026",
          stato: "Bozza",
        },
        {
          id: "p3",
          numero: "PREV-003",
          cliente: "Mario Rossi",
          totale: 50,
          data: "03/01/2026",
          stato: "Bozza",
        },
      ])
    );
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([]));
  });

  it("mostra solo preventivi del cliente per ID (omonimi isolati)", async () => {
    const { default: DettaglioCliente } = await import("./DettaglioCliente");

    render(
      <MemoryRouter initialEntries={["/cliente/2"]}>
        <Routes>
          <Route path="/cliente/:id" element={<DettaglioCliente />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("PREV-002")).toBeInTheDocument();
    expect(screen.getByText("PREV-003")).toBeInTheDocument();
    expect(screen.queryByText("PREV-001")).not.toBeInTheDocument();
  });

  it("mostra CTA Apri cantiere per preventivo convertito", async () => {
    const { default: DettaglioCliente } = await import("./DettaglioCliente");

    render(
      <MemoryRouter initialEntries={["/cliente/1"]}>
        <Routes>
          <Route path="/cliente/:id" element={<DettaglioCliente />} />
          <Route path="/cantiere/:id" element={<div>Cantiere</div>} />
        </Routes>
      </MemoryRouter>
    );

    const link = screen.getByTestId("cliente-apri-cantiere-p1");
    expect(link).toHaveAttribute("href", "/cantiere/c99");
  });

  it("punterà al wizard con clienteId", async () => {
    const { default: DettaglioCliente } = await import("./DettaglioCliente");

    render(
      <MemoryRouter initialEntries={["/cliente/1"]}>
        <Routes>
          <Route path="/cliente/:id" element={<DettaglioCliente />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("entry-nuovo-preventivo-cliente")).toHaveAttribute(
      "href",
      `${ROUTES.preventiviNuovo}?clienteId=1`
    );
  });
});
