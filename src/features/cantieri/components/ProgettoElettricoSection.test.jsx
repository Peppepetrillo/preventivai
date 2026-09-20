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
  default: () => null,
}));

vi.mock("./CantiereFotoViewer", () => ({
  default: () => null,
}));

vi.mock("../services/progettoElettricoService", async () => {
  const actual = await vi.importActual("../services/progettoElettricoService");
  return {
    ...actual,
    risolviUrlProgettoElettrico: vi.fn(async () => ({
      ok: false,
      errore: "File non disponibile sul dispositivo.",
    })),
  };
});

describe("ProgettoElettricoSection UI", () => {
  it("mostra stato vuoto e CTA", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetto={null}
        onAggiungi={vi.fn()}
        onSostituisci={vi.fn()}
        onElimina={vi.fn()}
      />
    );
    expect(screen.getByTestId("progetto-elettrico-vuoto")).toBeInTheDocument();
    expect(
      screen.getByText(/Tieni qui lo schema del cantiere/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-aggiungi")).toBeInTheDocument();
  });

  it("mostra card con Apri progetto e menu •••", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetto={{
          id: "p1",
          tipo: "pdf",
          nome: "Schema quadro generale",
          blobId: "b1",
          cantiereId: "c1",
          size: 2.4 * 1024 * 1024,
        }}
        onAggiungi={vi.fn()}
        onSostituisci={vi.fn()}
        onElimina={vi.fn()}
      />
    );
    expect(screen.getByTestId("progetto-elettrico-card")).toBeInTheDocument();
    expect(screen.getByText("Schema quadro generale")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-apri")).toHaveTextContent(
      /Apri progetto/i
    );
    expect(screen.getByTestId("progetto-elettrico-menu")).toBeInTheDocument();
    expect(screen.queryByTestId("progetto-elettrico-sostituisci")).not.toBeInTheDocument();
  });

  it("sheet scelta include PDF, immagine e scatta foto", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetto={null}
        onAggiungi={vi.fn()}
        onSostituisci={vi.fn()}
        onElimina={vi.fn()}
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

  it("menu ••• espone Sostituisci ed Elimina", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetto={{
          id: "p1",
          tipo: "image",
          nome: "schema.jpg",
          blobId: "b1",
          cantiereId: "c1",
        }}
        onElimina={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("progetto-elettrico-menu"));
    expect(screen.getByTestId("progetto-elettrico-sostituisci")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-elimina")).toBeInTheDocument();
  });

  it("conferma eliminazione dal menu", async () => {
    const onElimina = vi.fn();
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetto={{
          id: "p1",
          tipo: "image",
          nome: "schema.jpg",
          blobId: "b1",
          cantiereId: "c1",
        }}
        onElimina={onElimina}
      />
    );
    fireEvent.click(screen.getByTestId("progetto-elettrico-menu"));
    fireEvent.click(screen.getByTestId("progetto-elettrico-elimina"));
    expect(
      screen.getByTestId("conferma-elimina-progetto-elettrico")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("conferma-elimina-progetto-elettrico-confirm"));
    await waitFor(() => expect(onElimina).toHaveBeenCalledTimes(1));
  });

  it("cambio cantiere resetta sheet aperti", () => {
    const { rerender } = render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetto={null}
        onAggiungi={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("progetto-elettrico-aggiungi"));
    expect(screen.getByTestId("progetto-elettrico-scegli-pdf")).toBeInTheDocument();

    rerender(
      <ProgettoElettricoSection
        cantiereId="c2"
        progetto={null}
        onAggiungi={vi.fn()}
      />
    );
    expect(screen.queryByTestId("progetto-elettrico-scegli-pdf")).not.toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-section")).toHaveAttribute(
      "data-cantiere-id",
      "c2"
    );
  });
});
