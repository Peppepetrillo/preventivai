import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { ROUTES } from "../app/routes";
import { CATALOGO_MATERIALI_SEED } from "../domain/catalogoMateriali/materialiCatalogoSeed";
import Cantiere from "./Cantiere";

vi.mock("../services/cloudSyncService", () => ({
  creaUrlFirmatoFotoCantiere: vi.fn(),
  eliminaFotoCantiereStorage: vi.fn(),
  salvaDatoCloud: vi.fn(),
}));

vi.mock("../features/cantieri/services/cantieriFotoService", () => ({
  apriFotoCantiere: vi.fn(),
  risolviSrcFotoCantiere: vi.fn(async (foto) => foto?.src || ""),
  eliminaStorageFotoCantiere: vi.fn(),
  eliminaStorageFotoCantieri: vi.fn(),
  fileFotoValido: vi.fn(() => true),
  preparaFotoCantiere: vi.fn(),
}));

const CANTIERE_BASE = {
  id: "c1",
  nome: "Impianto Rossi",
  cliente: "Rossi",
  indirizzo: "Via Roma 1",
  stato: "In corso",
  checklist: [],
  materiali: [],
  foto: [],
  diario: [],
};

function renderCantiere() {
  return render(
    <MemoryRouter initialEntries={["/cantiere/c1"]}>
      <Routes>
        <Route path={ROUTES.dettaglioCantiere} element={<Cantiere />} />
        <Route
          path={ROUTES.cantieri}
          element={<div data-testid="lista-cantieri">Lista cantieri</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

function ultimoDialog() {
  const dialogs = screen.getAllByRole("dialog");
  return dialogs[dialogs.length - 1];
}

describe("Cantiere UX-7.1 soft delete nel Cestino", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([CANTIERE_BASE]));
  });

  it("dopo conferma torna a /cantieri e marca deletedAt senza rimuovere il record", () => {
    renderCantiere();

    fireEvent.click(screen.getByTestId("cantiere-elimina"));
    fireEvent.click(screen.getByTestId("conferma-elimina-cantiere-confirm"));

    expect(screen.getByTestId("lista-cantieri")).toBeInTheDocument();
    const salvati = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.cantieri) || "[]"
    );
    expect(salvati).toHaveLength(1);
    expect(salvati[0].id).toBe("c1");
    expect(salvati[0].deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(salvati[0].nome).toBe("Impianto Rossi");
  });
});

describe("Cantiere UX-6.4 aggiunta rapida materiali dal catalogo", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([CANTIERE_BASE]));
    localStorage.setItem(
      STORAGE_KEYS.catalogoMateriali,
      JSON.stringify(CATALOGO_MATERIALI_SEED)
    );
  });

  it("il catalogo rimane aperto dopo aver aggiunto un materiale", () => {
    renderCantiere();

    fireEvent.click(screen.getByTestId("cantiere-aggiungi-materiale"));
    fireEvent.click(screen.getByTestId("cantiere-materiale-catalogo"));

    // Naviga: categoria → famiglia → variante → aggiungi
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Corrugati e tubazioni/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Tubo corrugato/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Ø25/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /^Aggiungi$/i }));

    // Il catalogo deve rimanere aperto (siamo tornati alla vista varianti)
    expect(ultimoDialog()).toBeInTheDocument();

    // Il feedback "aggiunto" è visibile nel dialog
    expect(within(ultimoDialog()).getByRole("status")).toBeInTheDocument();
  });

  it("permette aggiunta consecutiva di 3 materiali senza chiudere il catalogo", () => {
    renderCantiere();

    fireEvent.click(screen.getByTestId("cantiere-aggiungi-materiale"));
    fireEvent.click(screen.getByTestId("cantiere-materiale-catalogo"));

    // Prima aggiunta: Tubo corrugato Ø20
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Corrugati e tubazioni/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Tubo corrugato/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Ø20/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /^Aggiungi$/i }));

    // Il catalogo è ancora aperto, siamo nelle varianti di Tubo corrugato
    expect(ultimoDialog()).toBeInTheDocument();

    // Seconda aggiunta: Ø25
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Ø25/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /^Aggiungi$/i }));

    // Badge contatore: 2 aggiunti
    expect(within(ultimoDialog()).getByText(/2 aggiunti/i)).toBeInTheDocument();

    // Terza aggiunta: Ø32
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Ø32/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /^Aggiungi$/i }));

    expect(within(ultimoDialog()).getByText(/3 aggiunti/i)).toBeInTheDocument();

    // Verifica che i materiali siano stati salvati nel localStorage
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri) || "[]");
    expect(stored[0].materiali).toHaveLength(3);
  });

  it("il catalogo espone il bottone di chiusura overlay (onClose disponibile)", () => {
    renderCantiere();

    fireEvent.click(screen.getByTestId("cantiere-aggiungi-materiale"));
    fireEvent.click(screen.getByTestId("cantiere-materiale-catalogo"));

    // Il dialog catalogo è aperto
    expect(ultimoDialog()).toBeInTheDocument();

    // Il bottone overlay per chiusura esiste (garantisce retrocompatibilità UX)
    const chiudiButtons = screen.getAllByRole("button", { name: /Chiudi finestra/i });
    expect(chiudiButtons.length).toBeGreaterThanOrEqual(1);

    // La griglia categorie è visibile (catalogo correttamente aperto)
    expect(within(ultimoDialog()).getByRole("button", { name: /Corrugati e tubazioni/i })).toBeInTheDocument();
  });

  it("il pulsante Cambia categoria porta alle categorie senza chiudere", () => {
    renderCantiere();

    fireEvent.click(screen.getByTestId("cantiere-aggiungi-materiale"));
    fireEvent.click(screen.getByTestId("cantiere-materiale-catalogo"));

    // Naviga a una famiglia
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Corrugati e tubazioni/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Tubo corrugato/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Ø25/i }));
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /^Aggiungi$/i }));

    // Ora siamo nella vista varianti: il bottone Cambia categoria è visibile
    expect(within(ultimoDialog()).getByRole("button", { name: /Cambia categoria/i })).toBeInTheDocument();

    // Clic → torna alle categorie
    fireEvent.click(within(ultimoDialog()).getByRole("button", { name: /Cambia categoria/i }));

    // La griglia categorie è di nuovo visibile
    expect(within(ultimoDialog()).getByRole("button", { name: /Corrugati e tubazioni/i })).toBeInTheDocument();
  });
});
