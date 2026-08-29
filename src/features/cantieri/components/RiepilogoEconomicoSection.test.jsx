import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RiepilogoEconomicoSection from "./RiepilogoEconomicoSection";
import { CATEGORIE_SPESA } from "../services/speseCantiereService";

describe("RiepilogoEconomicoSection UX-Spese v1", () => {
  it("mostra totale, incassato, spese e margine lordo", () => {
    render(
      <RiepilogoEconomicoSection
        cantiere={{
          id: "c1",
          origine: "diretto",
          totaleLavoro: 5000,
          pagamenti: [
            {
              id: "p1",
              data: "01/09/2026",
              importo: 3000,
              tipo: "acconto",
              metodo: "contanti",
            },
          ],
          spese: [
            {
              id: "s1",
              data: "02/09/2026",
              importo: 800,
              descrizione: "Materiali",
              categoria: CATEGORIE_SPESA.materiali,
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId("riepilogo-totale-cantiere")).toHaveTextContent(
      /5000/
    );
    expect(screen.getByTestId("riepilogo-incassato")).toHaveTextContent(/3000/);
    expect(screen.getByTestId("riepilogo-spese")).toHaveTextContent(/800/);
    expect(screen.getByTestId("riepilogo-margine-lordo")).toHaveTextContent(
      /2200/
    );
  });
});
