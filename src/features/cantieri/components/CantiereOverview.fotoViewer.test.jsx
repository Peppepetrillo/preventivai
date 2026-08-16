import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/cantieriFotoService", () => ({
  risolviSrcFotoCantiere: vi.fn(),
}));

vi.mock("../../../services/assistantService", () => ({
  getCantiereAssistant: vi.fn(() => ({ cards: [] })),
}));

vi.mock("../../intelligence", () => ({
  PreventivAISuggestions: () => null,
}));

vi.mock("../../diario/components/CantiereDiarioSection", () => ({
  default: () => <div data-testid="diario-mock" />,
}));

vi.mock("../../report/components/CantiereReportPanel", () => ({
  default: () => null,
}));

vi.mock("./CantiereVarianti", () => ({
  default: () => null,
}));

vi.mock("./CantiereAssistantPanel", () => ({
  default: () => null,
}));

import { risolviSrcFotoCantiere } from "../services/cantieriFotoService";
import CantiereOverview from "./CantiereOverview";

const CANTIERE = {
  id: "c1",
  nome: "Villa",
  cliente: "Rossi",
  stato: "In corso",
  checklist: [],
  materiali: [],
  foto: [
    {
      id: "f1",
      nome: "quadro.jpg",
      src: "data:image/jpeg;base64,FULL",
      miniatura: "data:image/jpeg;base64,THUMB",
      daSincronizzare: true,
    },
  ],
  diario: [],
};

function renderOverview(cantiere = CANTIERE) {
  return render(
    <MemoryRouter>
      <CantiereOverview
        cantiere={cantiere}
        avanzamento={0}
        onAggiornaCampo={vi.fn()}
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
      />
    </MemoryRouter>
  );
}

describe("CantiereOverview foto viewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    risolviSrcFotoCantiere.mockResolvedValue("data:image/jpeg;base64,FULL");
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("tap thumbnail apre viewer in-app senza window.open", async () => {
    renderOverview();

    fireEvent.click(screen.getByAltText("quadro.jpg"));

    await waitFor(() => {
      expect(screen.getByTestId("cantiere-foto-viewer")).toBeInTheDocument();
    });

    expect(risolviSrcFotoCantiere).toHaveBeenCalledWith(
      expect.objectContaining({ id: "f1", daSincronizzare: true })
    );
    expect(screen.getByTestId("cantiere-foto-viewer-img")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,FULL"
    );
    expect(window.open).not.toHaveBeenCalled();
  });

  it("foto con storagePath usa URL firmato nel viewer", async () => {
    risolviSrcFotoCantiere.mockResolvedValue("https://signed.example/f.jpg");
    renderOverview({
      ...CANTIERE,
      foto: [
        {
          id: "f2",
          nome: "sync.jpg",
          src: "",
          miniatura: "data:image/jpeg;base64,THUMB",
          storagePath: "u/c/f2.jpg",
          daSincronizzare: false,
        },
      ],
    });

    fireEvent.click(screen.getByAltText("sync.jpg"));

    await waitFor(() => {
      expect(screen.getByTestId("cantiere-foto-viewer-img")).toHaveAttribute(
        "src",
        "https://signed.example/f.jpg"
      );
    });
    expect(window.open).not.toHaveBeenCalled();
  });

  it("chiudi viewer torna alla griglia", async () => {
    renderOverview();

    fireEvent.click(screen.getByAltText("quadro.jpg"));
    await waitFor(() => {
      expect(screen.getByTestId("cantiere-foto-viewer")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cantiere-foto-viewer-chiudi"));

    await waitFor(() => {
      expect(screen.queryByTestId("cantiere-foto-viewer")).not.toBeInTheDocument();
    });
    expect(screen.getByAltText("quadro.jpg")).toBeInTheDocument();
  });
});
