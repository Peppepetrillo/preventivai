import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AgendaLavoroCard from "./AgendaLavoroCard";

const lavoroBase = {
  id: "c1",
  tipoLavoro: "intervento",
  tipoLavoroLabel: "Intervento",
  titolo: "Villa Rossi",
  cliente: "Rossi",
  indirizzo: "Via Roma 12",
  orario: "09:00",
  durataStimataLabel: "1 h",
  checklist: [],
  saldo: 0,
  telefono: "3331234567",
  link: "/cantiere/c1",
};

function renderCard(lavoro, props = {}) {
  return render(
    <MemoryRouter>
      <AgendaLavoroCard
        lavoro={lavoro}
        onSegnaCompletato={vi.fn()}
        onRegistraConsuntivo={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );
}

describe("AgendaLavoroCard UX-9.2", () => {
  it("mostra tipo lavoro, durata e Lavoro finito per intervento pianificato", () => {
    renderCard({
      ...lavoroBase,
      stato: "pianificato",
      statoLabel: "Pianificato",
      statoBadgeClass: "ds-badge ds-badge-da-iniziare",
    });

    expect(screen.getByText("Intervento")).toBeInTheDocument();
    expect(screen.getByText(/Durata prevista: 1 h/)).toBeInTheDocument();
    expect(screen.getByTestId("agenda-lavoro-finito")).toBeInTheDocument();
  });

  it("giornata prevista mostra Segna giornata fatta", () => {
    renderCard({
      ...lavoroBase,
      id: "c1:g1",
      kind: "lavoro-giornata",
      tipoLavoroLabel: "Previsto",
      stato: "pianificato",
      statoLabel: "Programmata",
      statoBadgeClass: "ds-badge ds-badge-da-iniziare",
    });

    expect(screen.getByTestId("agenda-segna-giornata-fatta")).toBeInTheDocument();
    expect(screen.queryByTestId("agenda-registra-consuntivo")).not.toBeInTheDocument();
  });

  it("giornata fatta senza consuntivo mostra Registra consuntivo", () => {
    const onRegistraConsuntivo = vi.fn();

    renderCard(
      {
        ...lavoroBase,
        id: "c1:g1",
        kind: "lavoro-giornata",
        tipoLavoroLabel: "Previsto",
        stato: "completato",
        consuntivoMancante: true,
        statoLabel: "Consuntivo da registrare",
        statoBadgeClass: "ds-badge ds-badge-sospeso",
      },
      { onRegistraConsuntivo }
    );

    fireEvent.click(screen.getByTestId("agenda-registra-consuntivo"));
    expect(onRegistraConsuntivo).toHaveBeenCalled();
    expect(screen.queryByTestId("agenda-segna-giornata-fatta")).not.toBeInTheDocument();
  });

  it("giornata fatta con consuntivo non duplica CTA consuntivo", () => {
    renderCard({
      ...lavoroBase,
      id: "c1:g1",
      kind: "lavoro-giornata",
      tipoLavoroLabel: "Previsto",
      stato: "completato",
      consuntivoMancante: false,
      statoLabel: "Fatta",
      statoBadgeClass: "ds-badge ds-badge-completato",
    });

    expect(screen.getByTestId("agenda-giornata-fatta")).toBeInTheDocument();
    expect(screen.queryByTestId("agenda-registra-consuntivo")).not.toBeInTheDocument();
  });

  it("item consuntivo mostra stato registrato senza CTA duplicata", () => {
    renderCard({
      ...lavoroBase,
      id: "reg-c1-r1",
      kind: "giornata-lavorativa",
      tipoLavoroLabel: "Consuntivo",
      stato: "completato",
      statoLabel: "Consuntivo registrato",
      statoBadgeClass: "ds-badge ds-badge-completato",
      durataStimataLabel: "4 h",
    });

    expect(screen.getByTestId("agenda-consuntivo-registrato")).toBeInTheDocument();
    expect(screen.getByText(/Ore lavorate: 4 h/)).toBeInTheDocument();
    expect(screen.queryByTestId("agenda-registra-consuntivo")).not.toBeInTheDocument();
  });
});
