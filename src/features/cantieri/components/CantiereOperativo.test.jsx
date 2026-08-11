import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CantiereOperativo from "./CantiereOperativo";

describe("CantiereOperativo UX Sprint 4", () => {
  const cantiere = {
    id: "c1",
    note: "Portare scala",
    checklist: [
      { id: "a", testo: "Tubi", completata: false },
      { id: "b", testo: "Quadro", completata: true },
    ],
    materiali: [
      { id: "m1", nome: "Cavo", quantita: 10, unita: "m", acquistato: false },
    ],
    foto: [],
  };

  it("separa da fare e completate con feedback toggle", () => {
    const onAggiornaChecklist = vi.fn();
    render(
      <CantiereOperativo
        cantiere={cantiere}
        avanzamento={50}
        nuovaChecklist=""
        nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={onAggiornaChecklist}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onAggiornaCampo={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    expect(screen.getByText(/Completate/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tubi")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Quadro")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Segna come fatta/i }));
    expect(onAggiornaChecklist).toHaveBeenCalledWith("a", { completata: true });
  });

  it("segna materiale comprato e offre Annulla", async () => {
    const onToggle = vi.fn();
    render(
      <CantiereOperativo
        cantiere={cantiere}
        avanzamento={0}
        nuovaChecklist=""
        nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={onToggle}
        onAggiornaCampo={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Segna comprato/i }));
    expect(onToggle).toHaveBeenCalledWith("m1");
    expect(screen.getByText(/Cavo comprato/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Annulla$/i }));
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("autosalva note senza pulsante Salva", async () => {
    vi.useFakeTimers();
    const onAggiornaCampo = vi.fn();
    render(
      <CantiereOperativo
        cantiere={cantiere}
        avanzamento={0}
        nuovaChecklist=""
        nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onAggiornaCampo={onAggiornaCampo}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /Salva/i })).not.toBeInTheDocument();
    const area = screen.getByDisplayValue("Portare scala");
    fireEvent.change(area, { target: { value: "Portare scala e LED" } });
    vi.advanceTimersByTime(400);
    expect(onAggiornaCampo).toHaveBeenCalledWith({
      note: "Portare scala e LED",
    });
    vi.useRealTimers();
  });

  it("offre aggiunta da catalogo o materiale libero", () => {
    const onPayload = vi.fn();
    render(
      <CantiereOperativo
        cantiere={cantiere}
        avanzamento={0}
        nuovaChecklist=""
        nuovoMateriale={{ nome: "", quantita: "", unita: "cad" }}
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onAggiungiMaterialeDaPayload={onPayload}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onAggiornaCampo={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("cantiere-aggiungi-materiale"));
    expect(screen.getByTestId("cantiere-materiale-catalogo")).toBeInTheDocument();
    expect(screen.getByTestId("cantiere-materiale-libero")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cantiere-materiale-libero"));
    expect(
      screen.getByRole("heading", { name: /Materiale libero/i })
    ).toBeInTheDocument();
  });
});
