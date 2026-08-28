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
    sessionStorage.clear();
  });

  it("mostra segment bar con 4 tab principali", () => {
    renderOverview();

    expect(screen.getByRole("tablist", { name: /Sezioni cantiere/i })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(tab("Lavoro")).toBeInTheDocument();
    expect(tab("Giornate")).toBeInTheDocument();
    expect(tab("Pagamenti")).toBeInTheDocument();
    expect(tab("Diario")).toBeInTheDocument();
  });

  it("mostra riepilogo economico in header", () => {
    renderOverview();

    expect(screen.getByTestId("cantiere-header-economico")).toBeInTheDocument();
    expect(screen.getByTestId("header-economico-totale")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("cantiere-header-economico")).getByText(
        "Resta da incassare"
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("cantiere-header-stato")).toBeInTheDocument();
  });

  it("seleziona Lavoro di default", () => {
    renderOverview();

    expect(tab("Lavoro")).toHaveAttribute("aria-selected", "true");
    expect(tab("Pagamenti")).toHaveAttribute("aria-selected", "false");
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
      within(operativo).getByRole("heading", { name: /^Da fare$/i })
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
  });

  it("tab Documenti: diario, preventivo e report", () => {
    renderOverview();

    fireEvent.click(tab("Diario"));
    const documenti = screen.getByTestId("cantiere-panel-documenti");

    expect(tab("Diario")).toHaveAttribute("aria-selected", "true");
    expect(within(documenti).getByTestId("diario-timeline")).toBeVisible();
    expect(within(documenti).getByTestId("cantiere-link-preventivo")).toBeVisible();
    expect(within(documenti).getByTestId("cantiere-report-panel")).toBeVisible();
    expect(within(documenti).getByText("Punto luce")).toBeVisible();
    expect(
      within(documenti).getByText(/cosa è successo in questo cantiere/i)
    ).toBeInTheDocument();
  });

  it("tab Giornate: previsto e fatto", () => {
    renderOverview();

    fireEvent.click(tab("Giornate"));

    expect(tab("Giornate")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("cantiere-panel-giornate")).not.toHaveAttribute("hidden");
    expect(screen.getByTestId("cantiere-programmazione")).toBeInTheDocument();
    expect(screen.getByTestId("cantiere-registro-lavori")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /^Previsto$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: /^Fatto$/i }).length).toBeGreaterThan(0);
  });

  it("tab Economico: varianti e pagamenti", () => {
    renderOverview();

    fireEvent.click(tab("Pagamenti"));

    expect(tab("Pagamenti")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("cantiere-varianti")).toBeVisible();
    expect(screen.getByTestId("cantiere-pagamenti")).toBeVisible();
    expect(screen.getByTestId("cantiere-panel-operativo")).toHaveAttribute("hidden");
  });

  it("header: stato ed elimina cantiere", () => {
    renderOverview();

    expect(screen.getByRole("combobox", { name: "Stato cantiere" })).toBeVisible();
    expect(screen.getByTestId("cantiere-elimina")).toBeInTheDocument();
  });

  it("ConfirmDialog: Annulla non elimina, Elimina conferma", () => {
    const onEliminaCantiere = vi.fn();
    renderOverview({ onEliminaCantiere });

    fireEvent.click(screen.getByTestId("cantiere-elimina"));

    expect(screen.getByTestId("conferma-elimina-cantiere")).toBeInTheDocument();
    expect(
      screen.getByText("Vuoi spostare questo elemento nel Cestino?")
    ).toBeVisible();
    expect(screen.getByText(/spostato nel Cestino/i)).toBeVisible();

    fireEvent.click(screen.getByTestId("conferma-elimina-cantiere-cancel"));
    expect(onEliminaCantiere).not.toHaveBeenCalled();
    expect(screen.queryByTestId("conferma-elimina-cantiere")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cantiere-elimina"));
    fireEvent.click(screen.getByTestId("conferma-elimina-cantiere-confirm"));
    expect(onEliminaCantiere).toHaveBeenCalledTimes(1);
  });

  it("ConfirmDialog: copy per In corso punta al Cestino", () => {
    renderOverview({
      cantiere: { ...cantiereEsempio, stato: "In corso" },
    });

    fireEvent.click(screen.getByTestId("cantiere-elimina"));
    expect(screen.getByText(/spostato nel Cestino/i)).toBeVisible();
  });

  it("ConfirmDialog: copy per Completato punta al Cestino", () => {
    renderOverview({
      cantiere: { ...cantiereEsempio, stato: "Completato" },
    });

    fireEvent.click(screen.getByTestId("cantiere-elimina"));
    expect(screen.getByText(/spostato nel Cestino/i)).toBeVisible();
  });

  it("tab Documenti: diario timeline e quick note", () => {
    const onAggiungiNotaDiario = vi.fn();
    renderOverview({ onAggiungiNotaDiario });

    fireEvent.click(tab("Diario"));
    const documenti = screen.getByTestId("cantiere-panel-documenti");

    expect(within(documenti).getByTestId("diario-timeline")).toBeVisible();
    fireEvent.click(
      within(documenti).getByRole("button", { name: /Salva nota diario/i })
    );
    expect(onAggiungiNotaDiario).toHaveBeenCalledWith("Nota diario veloce");
  });

  it("assistente diario attiva tab Documenti", async () => {
    renderOverview();

    fireEvent.click(screen.getByText(/Mostra suggerimenti/i));
    fireEvent.click(screen.getByRole("button", { name: "Assistente diario" }));

    await waitFor(() => {
      expect(tab("Diario")).toHaveAttribute("aria-selected", "true");
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("hash #sezione-diario attiva tab Documenti", async () => {
    renderOverview();

    window.location.hash = "#sezione-diario";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(tab("Diario")).toHaveAttribute("aria-selected", "true");
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
      screen.getByRole("button", { name: /Lavoro finito/i })
    ).toBeInTheDocument();
  });

  it("assistente materiali attiva tab Operativo e scroll", async () => {
    renderOverview();

    fireEvent.click(screen.getByText(/Mostra suggerimenti/i));
    fireEvent.click(screen.getByRole("button", { name: "Assistente materiali" }));

    await waitFor(() => {
      expect(tab("Lavoro")).toHaveAttribute("aria-selected", "true");
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("assistente varianti attiva tab Economico", async () => {
    renderOverview();

    fireEvent.click(screen.getByText(/Mostra suggerimenti/i));
    fireEvent.click(screen.getByRole("button", { name: "Assistente varianti" }));

    await waitFor(() => {
      expect(tab("Pagamenti")).toHaveAttribute("aria-selected", "true");
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("hash #sezione-documenti attiva tab Documenti", async () => {
    renderOverview();

    window.location.hash = "#sezione-documenti";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(tab("Diario")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("hash #sezione-modifica scrolla allo stato in header", async () => {
    renderOverview();

    window.location.hash = "#sezione-modifica";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
      expect(screen.getByTestId("cantiere-header-stato")).toBeInTheDocument();
    });
  });

  it("non duplica id sezione-varianti nel DOM", () => {
    renderOverview();

    fireEvent.click(tab("Pagamenti"));

    expect(document.querySelectorAll("#sezione-varianti")).toHaveLength(1);
  });

  it("query ?sezione=sezione-pagamenti attiva tab Pagamenti", async () => {
    render(
      <MemoryRouter initialEntries={["/cantiere/1?sezione=sezione-pagamenti"]}>
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
          onAggiornaCampo={vi.fn()}
          nuovaChecklist=""
          nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(tab("Pagamenti")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("query ?sezione=sezione-programmazione attiva tab Giornate", async () => {
    render(
      <MemoryRouter
        initialEntries={["/cantiere/1?sezione=sezione-programmazione"]}
      >
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
          onAggiornaCampo={vi.fn()}
          nuovaChecklist=""
          nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(tab("Giornate")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("query ?sezione=sezione-registro-lavori attiva tab Giornate", async () => {
    render(
      <MemoryRouter
        initialEntries={["/cantiere/1?sezione=sezione-registro-lavori"]}
      >
        <CantiereOverview
          cantiere={cantiereEsempio}
          onIniziaLavoro={vi.fn()}
          onCompletaLavoro={vi.fn()}
          onAggiornaCampo={vi.fn()}
          nuovaChecklist=""
          nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(tab("Giornate")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("assistente collassato ma azioni raggiungibili", async () => {
    renderOverview();

    fireEvent.click(screen.getByText(/Mostra suggerimenti/i));
    expect(screen.getByTestId("cantiere-assistant")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Assistente foto" }));
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  it("UX-8.6 banner post-conversione con Apri Pagamenti", async () => {
    const { marcaPostConversioneCantiere } = await import(
      "../postConversioneUi"
    );
    marcaPostConversioneCantiere(1, { incassatoPreventivo: 80 });

    renderOverview();

    expect(
      screen.getByTestId("banner-post-conversione-pagamenti")
    ).toHaveTextContent(/registra i pagamenti nel cantiere/i);
    expect(
      screen.getByTestId("banner-post-conversione-incassato-pre")
    ).toHaveTextContent(/80/);

    fireEvent.click(
      screen.getByTestId("banner-post-conversione-apri-pagamenti")
    );

    expect(
      screen.queryByTestId("banner-post-conversione-pagamenti")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("cantiere-panel-economico")).not.toHaveAttribute(
      "hidden"
    );
  });
});
