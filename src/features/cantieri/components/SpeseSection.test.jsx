import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SpeseSection from "./SpeseSection";
import { CATEGORIE_SPESA } from "../services/speseCantiereService";
import { aggiungiGiornataProgrammata } from "../services/programmazioneCantiereService";

describe("SpeseSection UX-Spese v1", () => {
  const cantiere = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 5000,
    incassato: 3000,
    pagamenti: [
      {
        id: "p1",
        data: "01/09/2026",
        importo: 3000,
        tipo: "acconto",
        metodo: "bonifico",
      },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 800,
        descrizione: "Materiali cantiere",
        categoria: CATEGORIE_SPESA.materiali,
        fornitore: "Bricoman",
        createdAt: "2026-09-02T10:00:00.000Z",
        updatedAt: "2026-09-02T10:00:00.000Z",
      },
      {
        id: "s2",
        data: "03/09/2026",
        importo: 50,
        descrizione: "Carburante",
        categoria: CATEGORIE_SPESA.carburante,
        createdAt: "2026-09-03T10:00:00.000Z",
        updatedAt: "2026-09-03T10:00:00.000Z",
      },
    ],
  };

  it("mostra totale spese e lista", () => {
    render(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
      />
    );

    expect(screen.getByTestId("spese-totale")).toHaveTextContent(/850/);
    expect(screen.getByTestId("spesa-riga-s1")).toBeInTheDocument();
    expect(screen.getByTestId("spesa-riga-s2")).toBeInTheDocument();
  });

  it("mostra riepilogo per categoria", () => {
    render(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
      />
    );

    const riepilogo = screen.getByTestId("spese-riepilogo-categorie");
    expect(riepilogo).toHaveTextContent("Materiali");
    expect(riepilogo).toHaveTextContent("800");
  });

  it("filtro ricerca per descrizione", async () => {
    const user = userEvent.setup();
    render(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
      />
    );

    await user.type(
      screen.getByPlaceholderText("Cerca descrizione o fornitore"),
      "carbur"
    );
    expect(screen.queryByTestId("spesa-riga-s1")).not.toBeInTheDocument();
    expect(screen.getByTestId("spesa-riga-s2")).toBeInTheDocument();
  });

  it("apre sheet aggiungi spesa", async () => {
    const user = userEvent.setup();
    render(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
      />
    );

    await user.click(screen.getByTestId("spesa-aggiungi"));
    expect(screen.getByTestId("spesa-sheet")).toBeInTheDocument();
  });

  it("registraSpesaTrigger apre SpesaSheet una sola volta", () => {
    const { rerender } = render(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraSpesaTrigger={0}
      />
    );
    expect(screen.queryByTestId("spesa-sheet")).not.toBeInTheDocument();

    rerender(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraSpesaTrigger={1}
      />
    );
    expect(screen.getByTestId("spesa-sheet")).toBeInTheDocument();

    rerender(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraSpesaTrigger={1}
      />
    );
    expect(screen.getAllByTestId("spesa-sheet")).toHaveLength(1);
  });

  it("mostra etichetta giornata se associata", () => {
    let c = aggiungiGiornataProgrammata(cantiere, {
      data: "05/09/2026",
      operai: 2,
      orePreviste: 8,
    });
    const giornataId = c.programmazione[0].id;
    c = {
      ...c,
      spese: [
        {
          ...c.spese[0],
          giornataId,
        },
        c.spese[1],
      ],
    };

    render(
      <SpeseSection
        cantiere={c}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
      />
    );

    expect(screen.getByTestId("spesa-giornata-label-s1")).toHaveTextContent(
      "05/09/2026"
    );
  });

  it("V16-A: trigger con prefill apre SpesaSheet con importo", () => {
    const { rerender } = render(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraSpesaTrigger={0}
      />
    );

    rerender(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraSpesaTrigger={1}
        registraSpesaPrefill={{ importo: 500 }}
        registraSpesaOrigine="assistente-economico"
      />
    );

    expect(screen.getByTestId("spesa-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("spesa-importo")).toHaveValue("500");
  });

  it("V16-A: apertura normale non precompila importo", async () => {
    const user = userEvent.setup();
    render(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={vi.fn()}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
      />
    );
    await user.click(screen.getByTestId("spesa-aggiungi"));
    expect(screen.getByTestId("spesa-importo")).toHaveValue("");
  });

  it("V16-B: salvataggio da assistente non scrolla alla lista spese", () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
    const onAggiungi = vi.fn();

    const { rerender } = render(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={onAggiungi}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraSpesaTrigger={0}
      />
    );
    rerender(
      <SpeseSection
        cantiere={cantiere}
        onAggiungi={onAggiungi}
        onAggiorna={vi.fn()}
        onElimina={vi.fn()}
        registraSpesaTrigger={1}
        registraSpesaPrefill={{ importo: 500 }}
        registraSpesaOrigine="assistente-economico"
      />
    );

    fireEvent.change(screen.getByTestId("spesa-descrizione"), {
      target: { value: "Test spesa" },
    });
    fireEvent.click(screen.getByTestId("spesa-salva"));

    expect(onAggiungi).toHaveBeenCalled();
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
