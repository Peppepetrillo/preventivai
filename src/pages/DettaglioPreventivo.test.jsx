import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { routePreventivo } from "../app/routes";
import { STATI_PREVENTIVO } from "../domain/workflow";
import DettaglioPreventivo from "./DettaglioPreventivo";

vi.mock("../services/preventiviPdfService", () => ({
  generaPdfPreventivo: vi.fn().mockResolvedValue({
    blob: new Blob(["pdf"]),
    blobUrl: "blob:mock",
    nomeFile: "PREV-001.pdf",
  }),
}));

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

function creaPreventivo(overrides = {}) {
  return {
    id: "p1",
    numero: "PREV-001",
    cliente: "Mario Rossi",
    stato: STATI_PREVENTIVO.BOZZA,
    lavorazioni: [
      { nome: "Impianto elettrico", quantita: 1, prezzo: 100, unita: "cad" },
    ],
    sconto: 0,
    iva: 22,
    validita: 30,
    pagamento: "Bonifico bancario",
    acconto: 0,
    note: "Nota cliente",
    incassato: 0,
    ...overrides,
  };
}

function renderDettaglio(id = "p1") {
  return render(
    <MemoryRouter initialEntries={[routePreventivo(id)]}>
      <Routes>
        <Route path="/preventivo/:id" element={<DettaglioPreventivo />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("DettaglioPreventivo UX-2.1", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.datiAzienda,
      JSON.stringify({ ragioneSociale: "Test SRL" })
    );
  });

  it("header mostra cliente, totale e badge Bozza", () => {
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([creaPreventivo()])
    );

    renderDettaglio();

    expect(screen.getByTestId("preventivo-dettaglio-header")).toBeInTheDocument();
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-stato-badge")).toHaveTextContent("Bozza");
    expect(screen.getByTestId("preventivo-totale-header")).toHaveTextContent("122,00");
    expect(screen.getByText("Impianto elettrico")).toBeInTheDocument();
  });

  it("Bozza: hero Modifica preventivo e una sola CTA primaria", () => {
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([creaPreventivo()])
    );

    renderDettaglio();

    const hero = screen.getByTestId("preventivo-hero-cta");
    expect(hero).toHaveTextContent("Modifica preventivo");
    expect(hero).toHaveClass("btn-primary");
    expect(screen.getAllByTestId("preventivo-hero-cta")).toHaveLength(1);
  });

  it("Inviato: hero Invia di nuovo", () => {
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        creaPreventivo({ id: "p2", stato: STATI_PREVENTIVO.INVIATO }),
      ])
    );

    renderDettaglio("p2");

    expect(screen.getByTestId("preventivo-hero-cta")).toHaveTextContent(
      "Invia di nuovo"
    );
    expect(screen.getByTestId("preventivo-stato-badge")).toHaveTextContent(
      "Inviato"
    );
  });

  it("Accettato: hero Inizia cantiere senza duplicati primari", () => {
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        creaPreventivo({ id: "p3", stato: STATI_PREVENTIVO.ACCETTATO }),
      ])
    );

    renderDettaglio("p3");

    const hero = screen.getByTestId("preventivo-hero-cta");
    expect(hero).toHaveTextContent("Inizia cantiere");
    const iniziaPrimary = screen
      .getAllByRole("button", { name: /Inizia cantiere/i })
      .filter((btn) => btn.className.includes("btn-primary"));
    expect(iniziaPrimary).toHaveLength(1);
    expect(iniziaPrimary[0]).toBe(hero);
  });

  it("Convertito: hero Apri cantiere", () => {
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        creaPreventivo({
          id: "p4",
          stato: STATI_PREVENTIVO.CONVERTITO,
          cantiereId: "c1",
        }),
      ])
    );
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          nome: "Cantiere Mario",
          cliente: "Mario Rossi",
          stato: "Da iniziare",
          preventivoId: "p4",
        },
      ])
    );

    renderDettaglio("p4");

    expect(screen.getByTestId("preventivo-hero-cta")).toHaveTextContent(
      "Apri cantiere"
    );
    expect(screen.getByTestId("preventivo-stato-badge")).toHaveTextContent(
      "In cantiere"
    );
  });

  it("workflow Accetta da Inviato senza regressioni", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        creaPreventivo({ id: "p5", stato: STATI_PREVENTIVO.INVIATO }),
      ])
    );

    renderDettaglio("p5");

    await user.click(screen.getByRole("button", { name: /^Accetta$/i }));

    expect(screen.getByTestId("preventivo-stato-badge")).toHaveTextContent(
      "Accettato"
    );
  });

  it("sezioni Distinta, PDF, pagamenti e totale", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([creaPreventivo({ incassato: 50, totale: 122 })])
    );

    renderDettaglio();

    expect(screen.getByTestId("preventivo-sezione-lavorazioni")).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-sezione-materiali")).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-sezione-economico")).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-sezione-documenti")).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-sezione-note")).toBeInTheDocument();

    await user.click(screen.getByTestId("preventivo-sezione-materiali").querySelector("summary"));
    expect(screen.getByTestId("preventivo-distinta-section")).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-collega-distinta")).toBeInTheDocument();

    await user.click(screen.getByTestId("preventivo-sezione-documenti").querySelector("summary"));
    expect(screen.getByTestId("preventivo-anteprima-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-genera-pdf")).toBeInTheDocument();

    await user.click(screen.getByTestId("preventivo-sezione-economico").querySelector("summary"));
    const economico = screen.getByTestId("preventivo-sezione-economico");
    expect(within(economico).getByTestId("preventivo-totale-economico")).toHaveTextContent(
      "122,00"
    );
    expect(within(economico).getByTestId("preventivo-incassato")).toHaveTextContent(
      /50,00/
    );
    expect(
      within(economico).getByRole("button", { name: /Nuovo incasso/i })
    ).toBeInTheDocument();
  });
});
