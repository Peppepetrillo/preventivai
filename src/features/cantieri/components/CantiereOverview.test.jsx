import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CantiereOverview from "./CantiereOverview";

vi.mock("./CantiereAssistantPanel", () => ({
  default: ({ onAction }) => (
    <div data-testid="cantiere-assistant">
      <button
        type="button"
        onClick={() =>
          onAction?.({ tipo: "documentazione", id: "doc" }, "accept")
        }
      >
        Assistente foto
      </button>
      <button
        type="button"
        onClick={() => onAction?.({ tipo: "nota", id: "nota" }, "accept")}
      >
        Assistente nota
      </button>
      <button
        type="button"
        onClick={() => onAction?.({ tipo: "materiale", id: "mat" }, "view")}
      >
        Assistente materiali
      </button>
      <button
        type="button"
        onClick={() => onAction?.({ tipo: "variante", id: "var" }, "accept")}
      >
        Assistente varianti
      </button>
      <button
        type="button"
        onClick={() => onAction?.({ tipo: "diario", id: "diario" }, "accept")}
      >
        Assistente diario
      </button>
    </div>
  ),
}));

vi.mock("./CantiereVarianti", () => ({
  default: ({ sezioneRef }) => (
    <section id="sezione-varianti" ref={sezioneRef}>
      <div data-testid="cantiere-varianti">Varianti</div>
    </section>
  ),
}));

vi.mock("../../report/components/CantiereReportPanel", () => ({
  default: () => <div data-testid="cantiere-report-panel">Report</div>,
}));

vi.mock("../../diario/components/CantiereDiarioSection", () => ({
  default: ({ onAddManualNote }) => (
    <section id="sezione-diario">
      <h2>Diario</h2>
      <p data-testid="diario-timeline">Evento di esempio</p>
      <button
        type="button"
        onClick={() => onAddManualNote?.("Nota diario veloce")}
      >
        Salva nota diario
      </button>
    </section>
  ),
}));

vi.mock("../../intelligence", () => ({
  PreventivAISuggestions: () => null,
}));

const cantiereEsempio = {
  id: 1,
  nome: "Cantiere PREV-101",
  cliente: "Mario Rossi",
  indirizzo: "Via Roma 1, Milano",
  telefono: "3331112222",
  stato: "Da iniziare",
  dataCreazione: "21/07/2026",
  foto: [],
  materiali: [{ id: "m1", nome: "Tubo", quantita: 2, unita: "m" }],
  checklist: [{ id: "c1", testo: "Posare tubi", completata: false }],
  note: "Portare scala",
  lavorazioniOrigine: [
    {
      id: "l-1",
      nome: "Punto luce",
      quantita: 2,
      prezzo: 45,
      unita: "cad",
    },
  ],
  preventivoId: 101,
  preventivoNumero: "PREV-101",
  preventivoOriginaleTotale: 900,
};

function renderOverview(props = {}) {
  return render(
    <MemoryRouter>
      <CantiereOverview
        cantiere={cantiereEsempio}
        onIniziaLavoro={vi.fn()}
        onCompletaLavoro={vi.fn()}
        onAggiornaCampo={vi.fn()}
        nuovaChecklist=""
        nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        {...props}
      />
    </MemoryRouter>
  );
}

function tab(name) {
  return screen.getByRole("tab", { name });
}

describe("CantiereOverview UX-4.1 — Lavoro a tab", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    window.location.hash = "";
  });

  it("mostra segment bar con esattamente 4 tab", () => {
    renderOverview();

    expect(screen.getByRole("tablist", { name: /Sezioni cantiere/i })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(tab("Operativo")).toBeInTheDocument();
    expect(tab("Economico")).toBeInTheDocument();
    expect(tab("Documenti")).toBeInTheDocument();
    expect(tab("Impostazioni")).toBeInTheDocument();
  });

  it("seleziona Operativo di default", () => {
    renderOverview();

    expect(tab("Operativo")).toHaveAttribute("aria-selected", "true");
    expect(tab("Economico")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("cantiere-panel-operativo")).not.toHaveAttribute("hidden");
    expect(screen.getByTestId("cantiere-panel-economico")).toHaveAttribute("hidden");
  });

  it("mostra header campo con Chiama e Naviga senza Apri Preventivo", () => {
    renderOverview();

    expect(
      screen.getByRole("heading", { name: "Cantiere PREV-101" })
    ).toBeInTheDocument();
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chiama/i })).toHaveAttribute(
      "href",
      "tel:3331112222"
    );
    expect(screen.queryByRole("link", { name: /Apri Preventivo/i })).not.toBeInTheDocument();
  });

  it("tab Operativo: checklist, materiali, foto e note operative", () => {
    renderOverview();
    const operativo = screen.getByTestId("cantiere-panel-operativo");

    expect(
      within(operativo).getByRole("heading", { name: /Oggi devo fare/i })
    ).toBeVisible();
    expect(
      within(operativo).getByRole("heading", { name: /Da comprare/i })
    ).toBeVisible();
    expect(
      within(operativo).getByRole("heading", { name: /Da ricordare/i })
    ).toBeVisible();
    expect(within(operativo).getByRole("heading", { name: /^Foto$/i })).toBeVisible();
    expect(
      within(operativo).queryByRole("heading", { name: /^Diario$/i })
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Posare tubi")).toBeVisible();
    expect(screen.getByText("Tubo")).toBeVisible();
    expect(
      within(operativo).getByText(/note operative/i)
    ).toBeInTheDocument();
  });

  it("tab Documenti: diario, preventivo e report", () => {
    renderOverview();

    fireEvent.click(tab("Documenti"));
    const documenti = screen.getByTestId("cantiere-panel-documenti");

    expect(tab("Documenti")).toHaveAttribute("aria-selected", "true");
    expect(
      within(documenti).getByRole("heading", { name: /^Diario$/i })
    ).toBeVisible();
    expect(within(documenti).getByTestId("cantiere-link-preventivo")).toBeVisible();
    expect(within(documenti).getByTestId("cantiere-report-panel")).toBeVisible();
    expect(within(documenti).getByText("Punto luce")).toBeVisible();
    expect(
      within(documenti).getByText(/cronologia e documentazione/i)
    ).toBeInTheDocument();
  });

  it("tab Economico: varianti e pagamenti", () => {
    renderOverview();

    fireEvent.click(tab("Economico"));

    expect(tab("Economico")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("cantiere-varianti")).toBeVisible();
    expect(screen.getByRole("heading", { name: /Pagamenti/i })).toBeVisible();
    expect(screen.getByTestId("cantiere-panel-operativo")).toHaveAttribute("hidden");
  });

  it("tab Impostazioni: stato ed elimina", () => {
    renderOverview();

    fireEvent.click(tab("Impostazioni"));

    expect(tab("Impostazioni")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Stato cantiere")).toBeVisible();
    expect(screen.getByRole("button", { name: /Elimina/i })).toBeVisible();
  });

  it("tab Documenti: diario timeline e quick note", () => {
    const onAggiungiNotaDiario = vi.fn();
    renderOverview({ onAggiungiNotaDiario });

    fireEvent.click(tab("Documenti"));
    const documenti = screen.getByTestId("cantiere-panel-documenti");

    expect(within(documenti).getByTestId("diario-timeline")).toBeVisible();
    fireEvent.click(
      within(documenti).getByRole("button", { name: /Salva nota diario/i })
    );
    expect(onAggiungiNotaDiario).toHaveBeenCalledWith("Nota diario veloce");
  });

  it("assistente diario attiva tab Documenti", async () => {
    renderOverview();

    fireEvent.click(screen.getByText(/Mostra suggerimenti Assistente/i));
    fireEvent.click(screen.getByRole("button", { name: "Assistente diario" }));

    await waitFor(() => {
      expect(tab("Documenti")).toHaveAttribute("aria-selected", "true");
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("hash #sezione-diario attiva tab Documenti", async () => {
    renderOverview();

    window.location.hash = "#sezione-diario";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(tab("Documenti")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("mostra CTA Inizia / Concludi lavoro sopra la BottomNav", () => {
    const { rerender } = renderOverview();

    const cta = screen.getByTestId("cantiere-cta-fissa");
    expect(cta).toHaveClass("bottom-[88px]");
    expect(cta).toHaveClass("z-40");
    expect(
      screen.getByRole("button", { name: /Inizia lavoro/i })
    ).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CantiereOverview
          cantiere={{ ...cantiereEsempio, stato: "In corso" }}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /Concludi Cantiere/i })
    ).toBeInTheDocument();
  });

  it("assistente materiali attiva tab Operativo e scroll", async () => {
    renderOverview();

    fireEvent.click(screen.getByText(/Mostra suggerimenti Assistente/i));
    fireEvent.click(screen.getByRole("button", { name: "Assistente materiali" }));

    await waitFor(() => {
      expect(tab("Operativo")).toHaveAttribute("aria-selected", "true");
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("assistente varianti attiva tab Economico", async () => {
    renderOverview();

    fireEvent.click(screen.getByText(/Mostra suggerimenti Assistente/i));
    fireEvent.click(screen.getByRole("button", { name: "Assistente varianti" }));

    await waitFor(() => {
      expect(tab("Economico")).toHaveAttribute("aria-selected", "true");
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("hash #sezione-documenti attiva tab Documenti", async () => {
    renderOverview();

    window.location.hash = "#sezione-documenti";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(tab("Documenti")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("hash #sezione-modifica attiva tab Impostazioni", async () => {
    renderOverview();

    window.location.hash = "#sezione-modifica";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(tab("Impostazioni")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("non duplica id sezione-varianti nel DOM", () => {
    renderOverview();

    fireEvent.click(tab("Economico"));

    expect(document.querySelectorAll("#sezione-varianti")).toHaveLength(1);
  });

  it("assistente collassato ma azioni raggiungibili", async () => {
    renderOverview();

    fireEvent.click(screen.getByText(/Mostra suggerimenti Assistente/i));
    expect(screen.getByTestId("cantiere-assistant")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Assistente foto" }));
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});
