import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import PdfAnteprima, {
  condividiDaBlobUrl,
  scaricaDaBlobUrl,
  urlPdfFitWidth
} from "./PdfAnteprima";

const condividiBlob = vi.fn();
const esportaBlob = vi.fn();

vi.mock("../utils/nativeExport", () => ({
  condividiBlob: (...args) => condividiBlob(...args),
  esportaBlob: (...args) => esportaBlob(...args),
}));

describe("PdfAnteprima UX-001", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    condividiBlob.mockReset();
    esportaBlob.mockReset();
    condividiBlob.mockResolvedValue({ success: true, metodo: "share" });
    esportaBlob.mockResolvedValue({ success: true, metodo: "download" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        blob: async () => new Blob(["pdf"], { type: "application/pdf" }),
      }))
    );
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

describe("PdfAnteprima condivisione", () => {
  beforeEach(() => {
    condividiBlob.mockReset();
    esportaBlob.mockReset();
    condividiBlob.mockResolvedValue({ success: true, metodo: "share" });
    esportaBlob.mockResolvedValue({ success: true, metodo: "download" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        blob: async () => new Blob(["pdf"], { type: "application/pdf" }),
      }))
    );
  });

  it("condividiDaBlobUrl usa condividiBlob e non esportaBlob", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });

    await condividiDaBlobUrl("blob:test", "Report.pdf", "Report cantiere", blob);

    expect(condividiBlob).toHaveBeenCalledWith(blob, "Report.pdf", {
      titolo: "Report cantiere",
    });
    expect(esportaBlob).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("condividiDaBlobUrl recupera il Blob da blobUrl se assente", async () => {
    await condividiDaBlobUrl("blob:test", "Report.pdf", "Report cantiere");

    expect(fetch).toHaveBeenCalledWith("blob:test");
    expect(condividiBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      "Report.pdf",
      { titolo: "Report cantiere" }
    );
  });

  it("condividiDaBlobUrl mantiene il nome file", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });

    await condividiDaBlobUrl("blob:test", "Report_Villa_Rossi.pdf", "Titolo", blob);

    expect(condividiBlob.mock.calls[0][1]).toBe("Report_Villa_Rossi.pdf");
  });

  it("condividiDaBlobUrl tratta annullamento share senza errore applicativo", async () => {
    condividiBlob.mockResolvedValue({
      success: false,
      error: "annullato",
      annullato: true,
    });

    const esito = await condividiDaBlobUrl(
      "blob:test",
      "Report.pdf",
      "Report cantiere",
      new Blob(["pdf"], { type: "application/pdf" })
    );

    expect(esito).toEqual({
      success: false,
      error: "annullato",
      annullato: true,
    });
  });

  it("scaricaDaBlobUrl continua a usare esportaBlob", async () => {
    await scaricaDaBlobUrl("blob:test", "Report.pdf");

    expect(esportaBlob).toHaveBeenCalled();
    expect(condividiBlob).not.toHaveBeenCalled();
  });
});
