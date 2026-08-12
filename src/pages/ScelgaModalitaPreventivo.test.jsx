import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import ScelgaModalitaPreventivo from "./ScelgaModalitaPreventivo";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

const CLIENTE = { id: "42", nome: "Bianchi SRL", telefono: "333444", indirizzo: "Via Milano 10" };

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/nuovo-preventivo${search}`]}>
      <Routes>
        <Route path="/preventivi" element={<div>Wizard listino</div>} />
        <Route path="/nuovo-preventivo" element={<ScelgaModalitaPreventivo />} />
        <Route path="/preventivo-intelligente" element={<div>Intelligente</div>} />
        <Route path="/preventivo-manuale" element={<div>Manuale</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ScelgaModalitaPreventivo", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify([CLIENTE]));
  });

  it("mostra le due opzioni di scelta", () => {
    renderPage();
    expect(screen.getByText(/Preventivo Intelligente/i)).toBeInTheDocument();
    expect(screen.getByText(/Preventivo Manuale/i)).toBeInTheDocument();
  });

  it("offre il percorso principale dal listino", () => {
    renderPage();
    expect(screen.getByTestId("scelta-modalita-listino")).toHaveAttribute(
      "href",
      "/preventivi"
    );
  });

  it("mantiene Preventivo Intelligente raggiungibile", () => {
    renderPage();
    fireEvent.click(screen.getAllByText(/Preventivo Intelligente/i)[0]);
    expect(screen.getByText("Intelligente")).toBeInTheDocument();
  });

  it("mantiene Preventivo Manuale raggiungibile", () => {
    renderPage();
    fireEvent.click(screen.getAllByText(/Preventivo Manuale/i)[0]);
    expect(screen.getByText("Manuale")).toBeInTheDocument();
  });

  it("precompila il nome cliente se clienteId presente", () => {
    renderPage("?clienteId=42");
    expect(screen.getAllByText("Bianchi SRL").length).toBeGreaterThanOrEqual(1);
  });

  it("salva la preferenza ultima scelta su localStorage", () => {
    renderPage();
    fireEvent.click(screen.getAllByText(/Preventivo Manuale/i)[0]);
    expect(localStorage.getItem("preventivai_modalita_preventivo")).toBe("manuale");
  });

  it("mostra 'Ultima scelta' per la modalità già usata", () => {
    localStorage.setItem("preventivai_modalita_preventivo", "intelligente");
    renderPage();
    expect(screen.getByText(/Ultima scelta/i)).toBeInTheDocument();
  });
});
