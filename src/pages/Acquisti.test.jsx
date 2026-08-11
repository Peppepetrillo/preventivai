import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { ROUTES } from "../app/routes";
import { STORAGE_KEYS } from "../app/storageKeys";
import {
  creaVoceListaSpesa,
  leggiListaSpesa,
  salvaListaSpesa,
} from "../domain/listaSpesa";
import Acquisti from "./Acquisti";

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
