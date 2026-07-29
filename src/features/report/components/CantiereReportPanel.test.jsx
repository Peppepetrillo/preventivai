import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CantiereReportPanel from "./CantiereReportPanel";

vi.mock("../../../services/cantiereReportPdfService", () => ({
  generaPdfReportCantiere: vi.fn(async () => ({
    blobUrl: "blob:report-test",
    nomeFile: "Report_Villa_Rossi.pdf",
    pagine: 2,
  })),
}));

vi.mock("../../../components/PdfAnteprima", () => ({
  default: ({ aperto }) => (aperto ? <div data-testid="pdf-anteprima">Anteprima</div> : null),
  scaricaDaBlobUrl: vi.fn(),
  condividiDaBlobUrl: vi.fn(),
}));

const cantiere = {
  id: "c1",
  nome: "Villa Rossi",
  cliente: "Rossi",
  diario: [],
};

describe("CantiereReportPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra il pulsante Genera Report e poi le azioni rapide", async () => {
    render(<CantiereReportPanel cantiere={cantiere} />);

    expect(screen.getByRole("button", { name: /Genera Report/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Genera Report/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Anteprima/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Esporta PDF/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Condividi/i })).toBeInTheDocument();
  });
});
