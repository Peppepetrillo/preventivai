import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProgettoElettricoSection from "./ProgettoElettricoSection";

vi.mock("../../../components/BottomSheet", () => ({
  default: ({ open, children, title }) =>
    open ? (
      <div data-testid="progetto-elettrico-sheet-mock" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

vi.mock("../../../components/PdfAnteprima", () => ({
  default: ({ aperto, abilitaZoom }) =>
    aperto ? (
      <div data-testid="pdf-anteprima-mock" data-zoom={String(!!abilitaZoom)} />
    ) : null,
}));

vi.mock("./CantiereFotoViewer", () => ({
  default: ({ open, abilitaZoom }) =>
    open ? (
      <div data-testid="foto-viewer-mock" data-zoom={String(!!abilitaZoom)} />
    ) : null,
}));

vi.mock("../services/progettoElettricoService", async () => {
  const actual = await vi.importActual("../services/progettoElettricoService");
  return {
    ...actual,
    risolviUrlProgettoElettrico: vi.fn(async (progetto) => ({
      ok: true,
      url: `blob:mock-${progetto.id}`,
      revoke: vi.fn(),
    })),
  };
});

const progettoA = {
  id: "p1",
  tipo: "pdf",
  nome: "Schema unifilare",
  blobId: "b1",
  cantiereId: "c1",
  size: 2.4 * 1024 * 1024,
};

const progettoB = {
  id: "p2",
  tipo: "image",
  nome: "Planimetria piano terra",
  blobId: "b2",
  cantiereId: "c1",
  size: 3.1 * 1024 * 1024,
};

describe("ProgettoElettricoSection UI", () => {
  it("mostra stato vuoto e CTA", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[]}
        onAggiungi={vi.fn()}
        onSostituisci={vi.fn()}
        onElimina={vi.fn()}
      />
    );
    expect(screen.getByTestId("progetto-elettrico-vuoto")).toBeInTheDocument();
    expect(
      screen.getByText(/Gli schemi e i progetti di questo lavoro/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-aggiungi")).toBeInTheDocument();
    expect(screen.getByText("Progetti elettrici")).toBeInTheDocument();
  });

  it("mostra un progetto con Apri e menu", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[progettoA]}
        onAggiungi={vi.fn()}
        onSostituisci={vi.fn()}
        onElimina={vi.fn()}
      />
    );
    expect(screen.getByTestId("progetto-elettrico-lista")).toBeInTheDocument();
    expect(screen.getAllByTestId("progetto-elettrico-card")).toHaveLength(1);
    expect(screen.getByText("Schema unifilare")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-apri")).toHaveTextContent(
      /Apri progetto/i
    );
    expect(screen.getByTestId("progetto-elettrico-menu")).toBeInTheDocument();
  });

  it("mostra due e tre progetti", () => {
    const { rerender } = render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[progettoA, progettoB]}
        onAggiungi={vi.fn()}
      />
    );
    expect(screen.getAllByTestId("progetto-elettrico-card")).toHaveLength(2);
    rerender(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[
          progettoA,
          progettoB,
          { ...progettoA, id: "p3", nome: "Quadro", blobId: "b3" },
        ]}
        onAggiungi={vi.fn()}
      />
    );
    expect(screen.getAllByTestId("progetto-elettrico-card")).toHaveLength(3);
  });

  it("sheet scelta include PDF, immagine e scatta foto", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[]}
        onAggiungi={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("progetto-elettrico-aggiungi"));
    expect(screen.getByTestId("progetto-elettrico-scegli-pdf")).toBeInTheDocument();
    expect(
      screen.getByTestId("progetto-elettrico-scegli-immagine")
    ).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-scatta-foto")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-input-camera")).toHaveAttribute(
      "capture",
      "environment"
    );
  });

  it("menu ••• espone Rinomina, Sostituisci ed Elimina", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[progettoB]}
        onElimina={vi.fn()}
        onRinomina={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("progetto-elettrico-menu"));
    expect(screen.getByTestId("progetto-elettrico-rinomina")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-sostituisci")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-elimina")).toBeInTheDocument();
  });

  it("apre il progetto corretto", async () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[progettoA, progettoB]}
        onAggiungi={vi.fn()}
      />
    );
    const bottoni = screen.getAllByTestId("progetto-elettrico-apri");
    fireEvent.click(bottoni[1]);
    await waitFor(() => {
      expect(screen.getByTestId("foto-viewer-mock")).toHaveAttribute(
        "data-zoom",
        "true"
      );
    });
  });

  it("conferma eliminazione passa l'id del progetto", async () => {
    const onElimina = vi.fn();
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[progettoA, progettoB]}
        onElimina={onElimina}
      />
    );
    const menus = screen.getAllByTestId("progetto-elettrico-menu");
    fireEvent.click(menus[1]);
    fireEvent.click(screen.getByTestId("progetto-elettrico-elimina"));
    expect(
      screen.getByTestId("conferma-elimina-progetto-elettrico")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("conferma-elimina-progetto-elettrico-confirm"));
    await waitFor(() => expect(onElimina).toHaveBeenCalledWith("p2"));
  });

  it("cambio cantiere resetta sheet aperti", () => {
    const { rerender } = render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetti={[]}
        onAggiungi={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("progetto-elettrico-aggiungi"));
    expect(screen.getByTestId("progetto-elettrico-scegli-pdf")).toBeInTheDocument();

    rerender(
      <ProgettoElettricoSection
        cantiereId="c2"
        progetti={[]}
        onAggiungi={vi.fn()}
      />
    );
    expect(screen.queryByTestId("progetto-elettrico-scegli-pdf")).not.toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-section")).toHaveAttribute(
      "data-cantiere-id",
      "c2"
    );
  });

  it("legge progetti da cantiere legacy via elenca", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        cantiere={{
          id: "c1",
          progettoElettrico: progettoA,
        }}
        onAggiungi={vi.fn()}
      />
    );
    expect(screen.getByText("Schema unifilare")).toBeInTheDocument();
  });
});
