import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import CollegaDistintaSheet from "./CollegaDistintaSheet";
import PreventivoDistintaSection from "./PreventivoDistintaSection";
import UsaDistintaConversioneSheet from "./UsaDistintaConversioneSheet";

describe("PreventivoDistintaSection", () => {
  it("mostra CTA collega quando assente", () => {
    const onCollega = vi.fn();
    render(
      <MemoryRouter>
        <PreventivoDistintaSection distinta={null} onCollega={onCollega} />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /Distinta materiali/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("preventivo-collega-distinta"));
    expect(onCollega).toHaveBeenCalled();
  });

  it("visualizza distinta collegata con azioni", () => {
    const onScollega = vi.fn();
    render(
      <MemoryRouter>
        <PreventivoDistintaSection
          distinta={{
            id: "d1",
            titolo: "BOM Villa",
            voci: [{ id: "v1" }, { id: "v2" }],
            updatedAt: "2026-03-01T10:00:00.000Z",
          }}
          onScollega={onScollega}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("BOM Villa")).toBeInTheDocument();
    expect(screen.getByText(/2 materiali/)).toBeInTheDocument();
    expect(screen.getByTestId("preventivo-apri-distinta")).toHaveAttribute(
      "href",
      expect.stringContaining("/distinte-materiali/d1")
    );
    fireEvent.click(screen.getByTestId("preventivo-scollega-distinta"));
    expect(onScollega).toHaveBeenCalled();
  });
});

describe("CollegaDistintaSheet", () => {
  it("ricerca e conferma selezione", () => {
    const onRicerca = vi.fn();
    const onConferma = vi.fn();
    render(
      <CollegaDistintaSheet
        open
        onClose={vi.fn()}
        ricerca=""
        onRicerca={onRicerca}
        onConferma={onConferma}
        distinte={[
          {
            id: "d1",
            titolo: "Quadro",
            nVoci: 3,
            clienteNome: "Rossi",
          },
          {
            id: "d2",
            titolo: "Allarme",
            nVoci: 1,
            collegataAltrove: true,
          },
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText(/Cerca distinta/i), {
      target: { value: "qua" },
    });
    expect(onRicerca).toHaveBeenCalledWith("qua");

    fireEvent.click(screen.getByTestId("collega-distinta-d1"));
    fireEvent.click(screen.getByTestId("collega-distinta-conferma"));
    expect(onConferma).toHaveBeenCalledWith("d1");
    expect(
      screen.getByText(/Già collegata a un altro preventivo/i)
    ).toBeInTheDocument();
  });
});

describe("UsaDistintaConversioneSheet", () => {
  it("offre Usa distinta e Continua senza", () => {
    const onUsa = vi.fn();
    const onSenza = vi.fn();
    render(
      <UsaDistintaConversioneSheet
        open
        onClose={vi.fn()}
        distinta={{ id: "d1", titolo: "BOM", voci: [{ id: "v1" }] }}
        onUsaDistinta={onUsa}
        onContinuaSenza={onSenza}
      />
    );
    expect(screen.getByText(/È disponibile una distinta/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("conversione-usa-distinta"));
    expect(onUsa).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("conversione-continua-senza"));
    expect(onSenza).toHaveBeenCalled();
  });
});
