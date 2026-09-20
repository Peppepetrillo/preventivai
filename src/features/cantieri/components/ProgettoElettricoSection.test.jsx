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
      screen.getByText(/Il progetto elettrico di questo lavoro/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-aggiungi")).toBeInTheDocument();
  });

  it("mostra card con azioni se progetto presente", () => {
    render(
      <ProgettoElettricoSection
        cantiereId="c1"
        progetto={{
          id: "p1",
          tipo: "pdf",
          nome: "Schema_unifilare.pdf",
          blobId: "b1",
          cantiereId: "c1",
          size: 2048,
        }}
        onAggiungi={vi.fn()}
        onSostituisci={vi.fn()}
        onElimina={vi.fn()}
      />
    );
    expect(screen.getByTestId("progetto-elettrico-card")).toBeInTheDocument();
    expect(screen.getByText("Schema_unifilare.pdf")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-apri")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-sostituisci")).toBeInTheDocument();
    expect(screen.getByTestId("progetto-elettrico-elimina")).toBeInTheDocument();
  });

  it("apre sheet scelta PDF/immagine", async () => {
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
  });

  it("conferma eliminazione", async () => {
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
    fireEvent.click(screen.getByTestId("progetto-elettrico-elimina"));
    expect(
      screen.getByTestId("conferma-elimina-progetto-elettrico")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("conferma-elimina-progetto-elettrico-confirm"));
    await waitFor(() => expect(onElimina).toHaveBeenCalledTimes(1));
  });
});
