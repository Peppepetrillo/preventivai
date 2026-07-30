import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AgendaLavoroCard from "./AgendaLavoroCard";

describe("AgendaLavoroCard", () => {
  it("mostra tipo lavoro, durata e azioni rapide", () => {
    render(
      <MemoryRouter>
        <AgendaLavoroCard
          lavoro={{
            id: "c1",
            tipoLavoro: "intervento",
            tipoLavoroLabel: "Intervento",
            titolo: "Villa Rossi",
            cliente: "Rossi",
            indirizzo: "Via Roma 12",
            orario: "09:00",
            durataStimataLabel: "1 h",
            stato: "pianificato",
            statoLabel: "Pianificato",
            statoBadgeClass: "ds-badge ds-badge-da-iniziare",
            checklist: [],
            saldo: 0,
            telefono: "3331234567",
            link: "/cantiere/c1",
          }}
          onSegnaCompletato={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Intervento")).toBeInTheDocument();
    expect(screen.getByText("Rossi")).toBeInTheDocument();
    expect(screen.getByText("Pianificato")).toBeInTheDocument();
    expect(screen.getByText(/Durata prevista: 1 h/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Apri lavoro/i })).toHaveAttribute(
      "href",
      "/cantiere/c1"
    );
    expect(screen.getByRole("link", { name: /Chiama/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Naviga/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Segna completato/i })
    ).toBeInTheDocument();
  });
});
