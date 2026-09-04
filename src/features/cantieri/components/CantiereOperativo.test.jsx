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

describe("CantiereOperativo UX-Spese v2", () => {
  const cantiereAcquistato = {
    id: "c1",
    materiali: [
      {
        id: "m1",
        nome: "Cavo 3x2,5",
        quantita: 3,
        unita: "m",
        acquistato: true,
        prezzoUnitario: 25,
      },
      {
        id: "m2",
        nome: "Interruttore",
        quantita: 2,
        unita: "cad",
        acquistato: false,
      },
    ],
    checklist: [],
    foto: [],
  };

  const spesaCollegata = {
    id: "sp1",
    data: "02/09/2026",
    importo: 68,
    descrizione: "Cavo 3x2,5",
    categoria: "materiali",
    materialeId: "m1",
  };

  it("materiale acquistato mostra Registra spesa", () => {
    const onRegistra = vi.fn();
    render(
      <CantiereOperativo
        cantiere={cantiereAcquistato}
        avanzamento={0}
        nuovaChecklist=""
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onRegistraSpesaDaMateriale={onRegistra}
        onAggiornaCampo={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    const btn = screen.getByTestId("cantiere-materiale-registra-spesa-m1");
    expect(btn).toHaveTextContent(/Registra spesa/i);
    fireEvent.click(btn);
    expect(onRegistra).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1" })
    );
  });

  it("materiale non acquistato non mostra Registra spesa", () => {
    render(
      <CantiereOperativo
        cantiere={cantiereAcquistato}
        avanzamento={0}
        nuovaChecklist=""
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onRegistraSpesaDaMateriale={vi.fn()}
        onAggiornaCampo={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    expect(
      screen.queryByTestId("cantiere-materiale-registra-spesa-m2")
    ).not.toBeInTheDocument();
  });

  it("spesa già collegata mostra importo totale e modifica", () => {
    const onModifica = vi.fn();
    render(
      <CantiereOperativo
        cantiere={{
          ...cantiereAcquistato,
          spese: [spesaCollegata],
        }}
        avanzamento={0}
        nuovaChecklist=""
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onRegistraSpesaDaMateriale={vi.fn()}
        onModificaSpesaMateriale={onModifica}
        onAggiornaCampo={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    const btn = screen.getByTestId("cantiere-materiale-spesa-registrata-m1");
    expect(btn).toHaveTextContent(/Spesa registrata/i);
    expect(btn).toHaveTextContent(/68/);
    fireEvent.click(btn);
    expect(onModifica).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1" }),
      expect.objectContaining({ id: "sp1", importo: 68 })
    );
    expect(
      screen.getByTestId("cantiere-materiale-altra-spesa-m1")
    ).toBeInTheDocument();
  });
});

describe("CantiereOperativo UX-Costi Materiali v3", () => {
  const cantiereCosti = {
    id: "c1",
    materiali: [
      {
        id: "m1",
        nome: "Piastrelle",
        quantita: 10,
        unita: "mq",
        prezzoUnitario: 75,
        acquistato: true,
      },
      {
        id: "m2",
        nome: "Colla",
        quantita: 2,
        unita: "sacchi",
        acquistato: false,
      },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 50,
        descrizione: "Piastrelle acconto",
        categoria: "materiali",
        materialeId: "m1",
      },
      {
        id: "s2",
        data: "03/09/2026",
        importo: 20,
        descrizione: "Piastrelle saldo",
        categoria: "materiali",
        materialeId: "m1",
      },
    ],
    checklist: [],
    foto: [],
  };

  it("materiale non acquistato mostra previsto senza costo reale", () => {
    render(
      <CantiereOperativo
        cantiere={cantiereCosti}
        avanzamento={0}
        nuovaChecklist=""
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
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

    const costi = screen.getByTestId("cantiere-materiale-costi-m2");
    expect(costi).toHaveTextContent(/Previsto/i);
    expect(costi).not.toHaveTextContent(/Reale/i);
  });

  it("acquistato senza spesa mostra Non registrato e Registra spesa", () => {
    render(
      <CantiereOperativo
        cantiere={{
          ...cantiereCosti,
          spese: [],
        }}
        avanzamento={0}
        nuovaChecklist=""
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onRegistraSpesaDaMateriale={vi.fn()}
        onAggiornaCampo={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    const costi = screen.getByTestId("cantiere-materiale-costi-m1");
    expect(costi).toHaveTextContent(/Non registrato/i);
    expect(
      screen.getByTestId("cantiere-materiale-registra-spesa-m1")
    ).toBeInTheDocument();
  });

  it("due spese collegate mostrano totale corretto", () => {
    render(
      <CantiereOperativo
        cantiere={cantiereCosti}
        avanzamento={0}
        nuovaChecklist=""
        onImpostaChecklist={vi.fn()}
        onAggiungiChecklist={vi.fn()}
        onAggiornaChecklist={vi.fn()}
        onEliminaChecklist={vi.fn()}
        onAggiornaCampoMateriale={vi.fn()}
        onAggiungiMateriale={vi.fn()}
        onEliminaMateriale={vi.fn()}
        onToggleMaterialeAcquistato={vi.fn()}
        onRegistraSpesaDaMateriale={vi.fn()}
        onModificaSpesaMateriale={vi.fn()}
        onAggiornaCampo={vi.fn()}
        onAggiungiFoto={vi.fn()}
        onEliminaFoto={vi.fn()}
        onApriFoto={vi.fn()}
      />
    );

    expect(
      screen.getByTestId("cantiere-materiale-spesa-registrata-m1")
    ).toHaveTextContent(/2 spese registrate/i);
    expect(
      screen.getByTestId("cantiere-materiale-spesa-registrata-m1")
    ).toHaveTextContent(/70/);
    expect(screen.getByTestId("cantiere-riepilogo-costi-materiali")).toHaveTextContent(
      /750/
    );
    expect(screen.getByTestId("cantiere-riepilogo-costi-materiali")).toHaveTextContent(
      /70/
    );
  });
});
