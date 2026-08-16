import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CantiereFotoViewer from "./CantiereFotoViewer";

describe("CantiereFotoViewer", () => {
  it("non renderizza nulla se chiuso", () => {
    const { container } = render(
      <CantiereFotoViewer open={false} src="data:image/jpeg;base64,x" onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra l'immagine e chiude con il pulsante", () => {
    const onClose = vi.fn();
    render(
      <CantiereFotoViewer
        open
        src="data:image/jpeg;base64,ABC"
        titolo="Quadro"
        onClose={onClose}
      />
    );

    expect(screen.getByTestId("cantiere-foto-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("cantiere-foto-viewer-img")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,ABC"
    );
    expect(screen.getByTestId("cantiere-foto-viewer-img")).toHaveAttribute(
      "alt",
      "Quadro"
    );

    fireEvent.click(screen.getByTestId("cantiere-foto-viewer-chiudi"));
    expect(onClose).toHaveBeenCalled();
  });

  it("chiude con Escape", () => {
    const onClose = vi.fn();
    render(
      <CantiereFotoViewer
        open
        src="data:image/jpeg;base64,ABC"
        onClose={onClose}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("mostra stato di caricamento ed errore", () => {
    const { rerender } = render(
      <CantiereFotoViewer open loading onClose={vi.fn()} />
    );
    expect(screen.getByText(/Caricamento foto/i)).toBeInTheDocument();

    rerender(
      <CantiereFotoViewer
        open
        errore="Immagine non disponibile."
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/non disponibile/i);
  });
});
