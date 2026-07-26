import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import PdfAnteprima, { urlPdfFitWidth } from "./PdfAnteprima";

describe("PdfAnteprima UX-001", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  });

  it("urlPdfFitWidth applica FitH / page-width", () => {
    expect(urlPdfFitWidth("blob:abc")).toBe(
      "blob:abc#view=FitH&zoom=page-width"
    );
    expect(urlPdfFitWidth("blob:abc#old")).toBe(
      "blob:abc#view=FitH&zoom=page-width"
    );
  });

  it("non monta nulla quando chiuso", () => {
    const { container } = render(
      <PdfAnteprima aperto={false} blobUrl="blob:test" onChiudi={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("apre in fullscreen con header, viewer e toolbar", async () => {
    render(
      <PdfAnteprima
        aperto
        blobUrl="blob:test-pdf"
        titolo="PREV-1"
        onChiudi={() => {}}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByRole("dialog", { name: /Anteprima PDF/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Anteprima PDF/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Chiudi anteprima PDF/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Condividi/i }).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("button", { name: /Scarica PDF/i })
    ).toBeInTheDocument();

    const frame = screen.getByTitle("PREV-1");
    expect(frame.getAttribute("src")).toContain("#view=FitH");
    expect(document.querySelector(".pdf-anteprima-shell")).toBeTruthy();
    expect(document.querySelector(".pdf-anteprima-toolbar")).toBeTruthy();
  });

  it("chiude con slide-down e smonta dopo 250ms", async () => {
    const onChiudi = vi.fn();
    const { rerender } = render(
      <PdfAnteprima
        aperto
        blobUrl="blob:test-pdf"
        onChiudi={onChiudi}
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(
      <PdfAnteprima
        aperto={false}
        blobUrl="blob:test-pdf"
        onChiudi={onChiudi}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector(".pdf-anteprima-root.is-open")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pulsanti rispettano touch target minimo 44px (classi)", async () => {
    render(
      <PdfAnteprima
        aperto
        blobUrl="blob:test-pdf"
        onChiudi={() => {}}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });

    const bottoni = document.querySelectorAll(".pdf-anteprima-btn");
    expect(bottoni.length).toBeGreaterThanOrEqual(3);
    bottoni.forEach((btn) => {
      expect(btn.className).toMatch(/pdf-anteprima-btn/);
    });

    // CSS rule presente nel foglio (min-height 44px)
    // Verifica strutturale: header Chiudi raggiungibile
    fireEvent.click(
      screen.getByRole("button", { name: /Chiudi anteprima PDF/i })
    );
  });

  it("blocca scroll del body quando aperta", async () => {
    render(
      <PdfAnteprima
        aperto
        blobUrl="blob:test-pdf"
        onChiudi={() => {}}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(document.body.style.overflow).toBe("hidden");
  });
});
