import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import { routeCantiere } from "../../app/routes";
import Cantiere from "../../pages/Cantiere";
import Cantieri from "../../pages/Cantieri";

vi.mock("../../services/cloudSyncService", () => ({
  creaUrlFirmatoFotoCantiere: vi.fn(),
  eliminaFotoCantiereStorage: vi.fn(),
  salvaDatoCloud: vi.fn(),
}));

const cantiereSalvato = {
  id: "c-100",
  nome: "Quadro ufficio",
  cliente: "Bianchi SRL",
  stato: "Da iniziare",
  checklist: [],
  materiali: [],
  foto: [],
  lavorazioniOrigine: [],
  aggiornatoIl: "21/07/2026",
};

describe("Navigazione cantieri RC-1B", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([cantiereSalvato])
    );
  });

  it("la lista punta alla route canonica /cantiere/:id", () => {
    render(
      <MemoryRouter initialEntries={["/cantieri"]}>
        <Routes>
          <Route path="/cantieri" element={<Cantieri />} />
        </Routes>
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /Quadro ufficio/i });
    expect(link).toHaveAttribute("href", routeCantiere("c-100"));
  });

  it("il dettaglio legge l'id dall'URL e sopravvive al refresh simulato", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={[routeCantiere("c-100")]}>
        <Routes>
          <Route path="/cantiere/:id" element={<Cantiere />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Bianchi SRL" })
    ).toBeInTheDocument();

    unmount();

    render(
      <MemoryRouter initialEntries={[routeCantiere("c-100")]}>
        <Routes>
          <Route path="/cantiere/:id" element={<Cantiere />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Bianchi SRL" })
    ).toBeInTheDocument();
  });

  it("mostra non trovato se l'id URL non esiste (senza location.state)", () => {
    render(
      <MemoryRouter initialEntries={[routeCantiere("inesistente")]}>
        <Routes>
          <Route path="/cantiere/:id" element={<Cantiere />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Cantiere non trovato")).toBeInTheDocument();
  });
});
