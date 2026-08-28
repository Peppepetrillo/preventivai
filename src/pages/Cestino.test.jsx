import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ROUTES } from "../app/routes";
import {
  TIPI_CESTINO,
  spostaNelCestino,
} from "../domain/cestino";
import { salvaClienti } from "../repositories/clientiRepository";
import { salvaCantieri } from "../repositories/cantieriRepository";
import { salvaPreventivi } from "../repositories/preventiviRepository";
import Cestino from "./Cestino";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
  salvaDatoCloudImmediato: vi.fn(),
  eliminaFotoCantiereStorage: vi.fn(),
}));

vi.mock("../features/cantieri/services/cantieriFotoService", () => ({
  eliminaStorageFotoCantieri: vi.fn(),
}));

describe("Cestino UI UX-7.1", () => {
  beforeEach(() => {
    localStorage.clear();
    salvaClienti([{ id: "cl1", nome: "Cliente Uno" }]);
    salvaCantieri([
      { id: "ca1", nome: "Cantiere Uno", cliente: "Cliente Uno", stato: "Da iniziare" },
    ]);
    salvaPreventivi([
      { id: "pr1", numero: "2026-001", cliente: "Cliente Uno", stato: "Bozza" },
    ]);
    spostaNelCestino(TIPI_CESTINO.cliente, "cl1");
    spostaNelCestino(TIPI_CESTINO.cantiere, "ca1");
    spostaNelCestino(TIPI_CESTINO.preventivo, "pr1");
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={[ROUTES.cestino]}>
        <Routes>
          <Route path={ROUTES.cestino} element={<Cestino />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("mostra tutti e filtra per tipo", () => {
    renderPage();
    expect(screen.getByTestId("pagina-cestino")).toBeInTheDocument();
    expect(screen.getByTestId("cestino-item-cliente-cl1")).toBeInTheDocument();
    expect(screen.getByTestId("cestino-item-cantiere-ca1")).toBeInTheDocument();
    expect(screen.getByTestId("cestino-item-preventivo-pr1")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cestino-filtro-clienti"));
    expect(screen.getByTestId("cestino-item-cliente-cl1")).toBeInTheDocument();
    expect(screen.queryByTestId("cestino-item-cantiere-ca1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cestino-filtro-cantieri"));
    expect(screen.getByTestId("cestino-item-cantiere-ca1")).toBeInTheDocument();
    expect(screen.queryByTestId("cestino-item-cliente-cl1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cestino-filtro-preventivi"));
    expect(screen.getByTestId("cestino-item-preventivo-pr1")).toBeInTheDocument();
  });

  it("ripristina e elimina definitivamente con conferma", () => {
    renderPage();

    fireEvent.click(screen.getByTestId("cestino-ripristina-cliente-cl1"));
    expect(screen.queryByTestId("cestino-item-cliente-cl1")).not.toBeInTheDocument();
    expect(screen.getByText(/Elemento ripristinato/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cestino-elimina-cantiere-ca1"));
    const dialog = screen.getByTestId("conferma-elimina-definitiva-cestino");
    expect(within(dialog).getByText(/Eliminare definitivamente/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("conferma-elimina-definitiva-cestino-confirm"));
    expect(screen.queryByTestId("cestino-item-cantiere-ca1")).not.toBeInTheDocument();
  });
});
