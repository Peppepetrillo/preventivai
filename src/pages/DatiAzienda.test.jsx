import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { ROUTES } from "../app/routes";
import {
  leggiProfiloAzienda,
  salvaProfiloAzienda
} from "../features/azienda/aziendaService";
import DatiAzienda from "./DatiAzienda";

describe("DatiAzienda pagina", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mostra back verso Impostazioni e salva profilo", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.datiAzienda]}>
        <DatiAzienda />
      </MemoryRouter>
    );

    expect(screen.getByTestId("dati-azienda-back")).toHaveAttribute(
      "data-parent",
      ROUTES.impostazioni
    );

    fireEvent.change(screen.getByTestId("dati-azienda-nome"), {
      target: { value: "Elettro SRL" },
    });
    fireEvent.change(screen.getByTestId("dati-azienda-iban"), {
      target: { value: "IT60X0542811101000000123456" },
    });
    fireEvent.click(screen.getByTestId("dati-azienda-salva"));

    expect(screen.getByTestId("dati-azienda-messaggio")).toHaveTextContent(
      /salvati/i
    );
    const salvato = leggiProfiloAzienda();
    expect(salvato.nomeDitta).toBe("Elettro SRL");
    expect(salvato.iban).toContain("IT60");
  });

  it("rilegge dati già salvati", () => {
    salvaProfiloAzienda({ nomeDitta: "Già salvata", telefono: "333" });

    render(
      <MemoryRouter initialEntries={[ROUTES.datiAzienda]}>
        <DatiAzienda />
      </MemoryRouter>
    );

    expect(screen.getByTestId("dati-azienda-nome")).toHaveValue("Già salvata");
    expect(screen.getByTestId("dati-azienda-telefono")).toHaveValue("333");
  });
});
