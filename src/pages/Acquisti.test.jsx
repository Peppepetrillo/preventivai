import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "../app/routes";
import { STORAGE_KEYS } from "../app/storageKeys";
import {
  creaVoceListaSpesa,
  leggiListaSpesa,
  salvaListaSpesa,
} from "../domain/listaSpesa";
import Acquisti from "./Acquisti";

vi.mock("../features/acquisti/acquistiPdfService", async () => {
  const actual = await vi.importActual("../features/acquisti/acquistiPdfService");
  return {
    ...actual,
    generaPdfAcquisti: vi.fn(async () => ({
      nomeFile: "lista-acquisti-lavoro.pdf",
      blob: new Blob(["%PDF"]),
      blobUrl: "",
      pagine: 1,
      doc: {},
    })),
  };
});

function seedVoci(voci) {
  salvaListaSpesa(voci);
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.acquisti]}>
      <Routes>
        <Route path={ROUTES.acquisti} element={<Acquisti />} />
        <Route path={ROUTES.agenda} element={<div>Agenda page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function ultimoDialog() {
  const dialogs = screen.getAllByRole("dialog");
  return dialogs[dialogs.length - 1];
}

describe("Acquisti UI Step 8.2", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("apre la pagina con titolo e empty state", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /Acquisti/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("acquisti-empty")).toBeInTheDocument();
    expect(screen.getByText(/Non hai nulla da comprare/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Torna all'Agenda/i })
    ).toHaveAttribute("href", ROUTES.agenda);
  });

  it("mostra sintesi materiali e lavori", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 100,
        unita: "m",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Videosorveglianza",
        varianteId: "var-cat6",
      }),
      creaVoceListaSpesa({
        nome: "Tubo Ø25",
        quantita: 60,
        unita: "m",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Videosorveglianza",
      }),
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 50,
        unita: "m",
        lavoroId: "c2",
        cliente: "Bianchi",
        titoloLavoro: "Impianto",
        varianteId: "var-cat6",
      }),
    ]);
    renderPage();
    const sintesi = screen.getByTestId("acquisti-sintesi");
    expect(sintesi.textContent).toMatch(/3 materiali/);
    expect(sintesi.textContent).toMatch(/2 lavori/);
    expect(sintesi.textContent).toMatch(/210 m/);
  });

  it("vista per lavoro raggruppa più cantieri", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 100,
        unita: "m",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Videosorveglianza",
      }),
      creaVoceListaSpesa({
        nome: "Cavo 3×2,5",
        quantita: 80,
        unita: "m",
        lavoroId: "c2",
        cliente: "Bianchi",
        titoloLavoro: "Impianto",
      }),
    ]);
    renderPage();
    expect(screen.getByTestId("acquisti-vista-lavoro-list")).toBeInTheDocument();
    const gruppi = screen.getAllByTestId("acquisti-gruppo");
    expect(gruppi).toHaveLength(2);
    expect(screen.getByText(/Rossi — Videosorveglianza/)).toBeInTheDocument();
    expect(screen.getByText(/Bianchi — Impianto/)).toBeInTheDocument();
  });

  it("vista tutto aggrega e mostra provenance espandibile", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 100,
        unita: "m",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Videosorveglianza",
        varianteId: "var-cat6",
      }),
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 50,
        unita: "m",
        lavoroId: "c2",
        cliente: "Bianchi",
        titoloLavoro: "Impianto",
        varianteId: "var-cat6",
      }),
    ]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-vista-tutto"));
    expect(screen.getByTestId("acquisti-vista-tutto-list")).toBeInTheDocument();

    const agg = screen.getByTestId("acquisti-aggregato");
    expect(within(agg).getByText(/Cavo Cat\.6/)).toBeInTheDocument();
    expect(within(agg).getByText(/150 m/)).toBeInTheDocument();

    fireEvent.click(within(agg).getByTestId("acquisti-aggregato-expand"));
    const provenance = screen.getByTestId("acquisti-provenance");
    expect(within(provenance).getAllByTestId("acquisti-provenance-item")).toHaveLength(
      2
    );
    expect(within(provenance).getByText(/Rossi/)).toBeInTheDocument();
    expect(within(provenance).getByText(/Bianchi/)).toBeInTheDocument();
  });

  it("ricerca filtra per nome", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 10,
        unita: "m",
        lavoroId: "c1",
      }),
      creaVoceListaSpesa({
        nome: "Tubo Ø25",
        quantita: 5,
        unita: "m",
        lavoroId: "c1",
      }),
    ]);
    renderPage();
    fireEvent.change(screen.getByLabelText(/Cerca materiale/i), {
      target: { value: "tubo" },
    });
    expect(screen.getByText(/Tubo Ø25/)).toBeInTheDocument();
    expect(screen.queryByText(/Cavo Cat\.6/)).not.toBeInTheDocument();
  });

  it("filtro Da comprare / Tutti", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Da prendere",
        quantita: 1,
        unita: "pz",
        lavoroId: "c1",
        acquistato: false,
      }),
      creaVoceListaSpesa({
        nome: "Già preso",
        quantita: 2,
        unita: "pz",
        lavoroId: "c1",
        acquistato: true,
      }),
    ]);
    renderPage();
    expect(screen.getByText(/Da prendere/)).toBeInTheDocument();
    expect(screen.queryByText(/Già preso/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("acquisti-filtro-tutti"));
    expect(screen.getByText(/Da prendere/)).toBeInTheDocument();
    expect(screen.getByText(/Già preso/)).toBeInTheDocument();
  });

  it("toggle voce aggiorna listaSpesa senza toccare Distinta/Catalogo", () => {
    localStorage.setItem(STORAGE_KEYS.catalogoMateriali, JSON.stringify([{ id: "cat" }]));
    localStorage.setItem(STORAGE_KEYS.distinteMateriali, JSON.stringify([{ id: "dist" }]));
    const catalogoPrima = localStorage.getItem(STORAGE_KEYS.catalogoMateriali);
    const distintePrima = localStorage.getItem(STORAGE_KEYS.distinteMateriali);

    const voce = creaVoceListaSpesa({
      nome: "Cassetta",
      quantita: 6,
      unita: "pz",
      lavoroId: "c1",
      origine: "distinta",
    });
    seedVoci([voce]);
    renderPage();

    fireEvent.click(screen.getByTestId("acquisti-voce-toggle"));
    expect(leggiListaSpesa()[0].acquistato).toBe(true);
    expect(screen.queryByText(/Cassetta/)).not.toBeInTheDocument();

    expect(localStorage.getItem(STORAGE_KEYS.catalogoMateriali)).toBe(catalogoPrima);
    expect(localStorage.getItem(STORAGE_KEYS.distinteMateriali)).toBe(distintePrima);
  });

  it("toggle aggregato aggiorna le voci originali", () => {
    const a = creaVoceListaSpesa({
      nome: "Cavo Cat.6",
      quantita: 100,
      unita: "m",
      lavoroId: "c1",
      cliente: "Rossi",
      varianteId: "var-cat6",
    });
    const b = creaVoceListaSpesa({
      nome: "Cavo Cat.6",
      quantita: 50,
      unita: "m",
      lavoroId: "c2",
      cliente: "Bianchi",
      varianteId: "var-cat6",
    });
    seedVoci([a, b]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-vista-tutto"));
    fireEvent.click(screen.getByTestId("acquisti-aggregato-toggle"));

    const elenco = leggiListaSpesa();
    expect(elenco.every((v) => v.acquistato)).toBe(true);
    expect(elenco).toHaveLength(2);
    expect(screen.getByTestId("acquisti-empty")).toBeInTheDocument();
  });

  it("mostra badge origine e nota; legacy senza badge", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Da distinta",
        quantita: 1,
        unita: "pz",
        lavoroId: "c1",
        origine: "distinta",
        note: "quadro",
      }),
      creaVoceListaSpesa({
        nome: "Legacy",
        quantita: 1,
        unita: "cad",
        lavoroId: "c1",
      }),
    ]);
    renderPage();
    const badges = screen.getAllByTestId("acquisti-origine");
    expect(badges.map((el) => el.textContent)).toEqual(["Distinta"]);
    expect(screen.getByTestId("acquisti-nota")).toHaveTextContent("quadro");
    expect(screen.getByText(/Legacy/)).toBeInTheDocument();
  });

  it("non doppio conteggio: aggregato somma una sola volta", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 100,
        unita: "m",
        lavoroId: "c1",
        varianteId: "var-cat6",
      }),
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 50,
        unita: "m",
        lavoroId: "c2",
        varianteId: "var-cat6",
      }),
    ]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-vista-tutto"));
    const qty = screen.getAllByText(/150 m/);
    expect(qty.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("acquisti-aggregato")).toHaveLength(1);
  });

  it("unità diverse non vengono aggregate", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 100,
        unita: "m",
        lavoroId: "c1",
        varianteId: "var-cat6",
      }),
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 10,
        unita: "pz",
        lavoroId: "c2",
        varianteId: "var-cat6",
      }),
    ]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-vista-tutto"));
    expect(screen.getAllByTestId("acquisti-aggregato")).toHaveLength(2);
  });
});

describe("Acquisti UI Step 8.3 condivisione", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, "open").mockImplementation(() => null);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) },
    });
  });

  it("apre foglio Condividi con testo per lavoro senza prezzi", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 100,
        unita: "m",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Videosorveglianza",
        prezzoUnitario: 1,
      }),
      creaVoceListaSpesa({
        nome: "Tubo Ø25",
        quantita: 60,
        unita: "m",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Videosorveglianza",
      }),
    ]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-condividi"));
    const dialog = ultimoDialog();
    expect(within(dialog).getByTestId("acquisti-condividi-sheet")).toBeInTheDocument();
    const preview = within(dialog).getByTestId("acquisti-condividi-preview");
    expect(preview.textContent).toContain("Lista materiali");
    expect(preview.textContent).toContain("Rossi — Videosorveglianza");
    expect(preview.textContent).toContain("Cavo Cat.6 — 100 m");
    expect(preview.textContent).not.toMatch(/€/);
  });

  it("modalità per fornitore aggrega quantità", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 100,
        unita: "m",
        lavoroId: "c1",
        varianteId: "var-cat6",
      }),
      creaVoceListaSpesa({
        nome: "Cavo Cat.6",
        quantita: 50,
        unita: "m",
        lavoroId: "c2",
        varianteId: "var-cat6",
      }),
    ]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-condividi"));
    const dialog = ultimoDialog();
    fireEvent.click(
      within(dialog).getByTestId("acquisti-condividi-modalita-per-fornitore")
    );
    expect(
      within(dialog).getByTestId("acquisti-condividi-preview").textContent
    ).toContain("Cavo Cat.6 — 150 m");
  });

  it("opzione prezzi e WhatsApp", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Cavo",
        quantita: 10,
        unita: "m",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Lavoro",
        prezzoUnitario: 2,
      }),
    ]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-condividi"));
    const dialog = ultimoDialog();
    fireEvent.click(within(dialog).getByTestId("acquisti-condividi-prezzi"));
    expect(
      within(dialog).getByTestId("acquisti-condividi-preview").textContent
    ).toContain("Totale indicativo:");
    fireEvent.click(within(dialog).getByTestId("acquisti-condividi-whatsapp"));
    expect(window.open).toHaveBeenCalled();
  });

  it("copia testo e PDF", async () => {
    const { generaPdfAcquisti } = await import(
      "../features/acquisti/acquistiPdfService"
    );
    seedVoci([
      creaVoceListaSpesa({
        nome: "Tubo",
        quantita: 5,
        unita: "m",
        lavoroId: "c1",
        cliente: "A",
        titoloLavoro: "B",
      }),
    ]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-condividi"));
    fireEvent.click(screen.getByTestId("acquisti-condividi-copia"));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("acquisti-condividi"));
    fireEvent.click(screen.getByTestId("acquisti-condividi-pdf"));
    expect(generaPdfAcquisti).toHaveBeenCalled();
  });

  it("mostra anche acquistati in condivisione", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Da comprare",
        quantita: 1,
        unita: "pz",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Lavoro",
      }),
      creaVoceListaSpesa({
        nome: "Già preso",
        quantita: 2,
        unita: "pz",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Lavoro",
        acquistato: true,
      }),
    ]);
    renderPage();
    fireEvent.click(screen.getByTestId("acquisti-condividi"));
    const dialog = ultimoDialog();
    const preview = within(dialog).getByTestId("acquisti-condividi-preview");
    expect(preview.textContent).toContain("Da comprare");
    expect(preview.textContent).not.toContain("Già preso");

    fireEvent.click(within(dialog).getByTestId("acquisti-condividi-acquistati"));
    expect(
      within(dialog).getByTestId("acquisti-condividi-preview").textContent
    ).toContain("Già preso");
  });

  it("UX-6.1d: accessorio suggerito mostra per: padre; manuale no", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Presa civile — Bipasso",
        quantita: 12,
        unita: "pz",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Impianto",
        distintaVoceId: "voce-padre",
        origine: "distinta",
      }),
      creaVoceListaSpesa({
        nome: "Cassetta — 503",
        quantita: 12,
        unita: "pz",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Impianto",
        distintaVoceId: "voce-acc",
        parentVoceId: "voce-padre",
        origineAccessorio: "suggerito",
        origine: "distinta",
      }),
      creaVoceListaSpesa({
        nome: "Nastro isolante",
        quantita: 1,
        unita: "pz",
        lavoroId: "c1",
        cliente: "Rossi",
        titoloLavoro: "Impianto",
        origine: "manuale",
      }),
    ]);
    renderPage();

    expect(screen.getByTestId("acquisti-accessorio-padre")).toHaveTextContent(
      /per: Presa civile — Bipasso/i
    );
    expect(screen.getByText("Cassetta — 503")).toBeInTheDocument();
    expect(screen.getByText("Nastro isolante")).toBeInTheDocument();
    expect(screen.getAllByTestId("acquisti-accessorio-padre")).toHaveLength(1);

    fireEvent.click(screen.getByTestId("acquisti-condividi"));
    const preview = within(ultimoDialog()).getByTestId(
      "acquisti-condividi-preview"
    ).textContent;
    expect(preview).toContain("Presa civile — Bipasso");
    expect(preview).toContain("Cassetta — 503");
    expect(preview).not.toMatch(/per:/i);
    expect(preview).not.toMatch(/Accessorio/i);
  });

  it("UX-6.1d: lista legacy senza parentVoceId non mostra etichetta", () => {
    seedVoci([
      creaVoceListaSpesa({
        nome: "Tubo legacy",
        quantita: 5,
        unita: "m",
        lavoroId: "c1",
        cliente: "A",
        titoloLavoro: "B",
      }),
    ]);
    renderPage();
    expect(screen.getByText("Tubo legacy")).toBeInTheDocument();
    expect(screen.queryByTestId("acquisti-accessorio-padre")).not.toBeInTheDocument();
  });
});
