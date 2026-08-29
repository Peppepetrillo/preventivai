import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import PreventivoManuale from "./PreventivoManuale";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

const CLIENTE = { id: "77", nome: "Rossi Costruzioni", telefono: "0222", indirizzo: "Via Torino 5" };

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/preventivo-manuale${search}`]}>
      <Routes>
        <Route path="/preventivo-manuale" element={<PreventivoManuale />} />
        <Route path="/preventivo/:id" element={<div data-testid="dettaglio-preventivo">Preventivo salvato</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PreventivoManuale", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify([CLIENTE]));
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify([]));
  });

  it("mostra il form di creazione preventivo manuale", () => {
    renderPage();
    expect(screen.getByText(/Preventivo Manuale/i)).toBeInTheDocument();
    expect(screen.getByText(/Lavorazioni/i)).toBeInTheDocument();
  });

  it("precompila il cliente da clienteId", () => {
    renderPage("?clienteId=77");
    expect(screen.getByText("Rossi Costruzioni")).toBeInTheDocument();
  });

  it("permette di aggiungere una riga lavorazione", () => {
    renderPage();
    const righeIniziali = screen.getAllByPlaceholderText(/Descrizione lavorazione/i).length;
    fireEvent.click(screen.getAllByText(/Aggiungi/i)[0]);
    expect(screen.getAllByPlaceholderText(/Descrizione lavorazione/i).length).toBe(righeIniziali + 1);
  });

  it("mostra errore se si salva senza cliente", () => {
    renderPage();
    fireEvent.click(screen.getByText(/Crea preventivo/i));
    expect(screen.getByText(/Inserisci il nome del cliente/i)).toBeInTheDocument();
  });

  it("salva e naviga al preventivo se dati validi", () => {
    renderPage("?clienteId=77");

    fireEvent.change(screen.getByPlaceholderText(/Descrizione lavorazione/i), {
      target: { value: "Installazione presa" },
    });

    fireEvent.click(screen.getByText(/Crea preventivo/i));

    expect(screen.getByTestId("dettaglio-preventivo")).toBeInTheDocument();

    const preventivi = JSON.parse(localStorage.getItem(STORAGE_KEYS.preventivi) || "[]");
    expect(preventivi.length).toBe(1);
    expect(preventivi[0].cliente).toBe("Rossi Costruzioni");
    expect(String(preventivi[0].clienteId)).toBe("77");
  });

  it("salva senza clienteId se il nome non corrisponde al cliente in rubrica", () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("Nome cliente"), {
      target: { value: "Mario Verdi" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Descrizione lavorazione/i), {
      target: { value: "Installazione presa" },
    });

    fireEvent.click(screen.getByText(/Crea preventivo/i));

    const preventivi = JSON.parse(localStorage.getItem(STORAGE_KEYS.preventivi) || "[]");
    expect(preventivi[0].cliente).toBe("Mario Verdi");
    expect(preventivi[0].clienteId).toBeUndefined();
  });
});
