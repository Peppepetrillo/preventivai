import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { ROUTES } from "../app/routes";
import { creaDistintaMateriali } from "../domain/distinteMateriali/distintaMaterialiService";
import DistinteMateriali from "./DistinteMateriali";
import DistintaMaterialiEditor from "./DistintaMaterialiEditor";

function renderLista() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.distinteMateriali]}>
      <Routes>
        <Route path={ROUTES.distinteMateriali} element={<DistinteMateriali />} />
        <Route
          path={ROUTES.nuovaDistintaMateriali}
          element={<DistintaMaterialiEditor />}
        />
        <Route
          path={ROUTES.distintaMateriali}
          element={<DistintaMaterialiEditor />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("DistinteMateriali UI — elenco", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mostra stato vuoto", () => {
    renderLista();
    expect(
      screen.getByRole("heading", { name: /Distinte materiali/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("distinte-empty")).toBeInTheDocument();
    expect(screen.getByText(/Nessuna distinta/i)).toBeInTheDocument();
  });

  it("elenca distinte con titolo, cliente, voci e data", () => {
    creaDistintaMateriali({
      titolo: "BOM Rossi",
      clienteNome: "Mario Rossi",
      voci: [
        { nome: "Tubo", quantita: 10, unita: "m" },
        { nome: "Cavo", quantita: 20, unita: "m" },
      ],
    });
    renderLista();
    expect(screen.getByTestId("distinte-list")).toBeInTheDocument();
    expect(screen.getByText("BOM Rossi")).toBeInTheDocument();
    expect(screen.getByText(/Mario Rossi/)).toBeInTheDocument();
    expect(screen.getByText(/2 voci/)).toBeInTheDocument();
  });

  it("apre editor da Nuova distinta", () => {
    renderLista();
    fireEvent.click(screen.getByTestId("distinte-nuova"));
    expect(
      screen.getByRole("heading", { name: /Nuova distinta/i })
    ).toBeInTheDocument();
  });

  it("apre editor da Apri", () => {
    const d = creaDistintaMateriali({ titolo: "Apri me" });
    renderLista();
    fireEvent.click(screen.getByRole("button", { name: /^Apri$/i }));
    expect(
      screen.getByRole("heading", { name: /Modifica distinta/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("distinta-titolo")).toHaveValue("Apri me");
    expect(d.id).toBeTruthy();
  });

  it("duplica distinta", () => {
    creaDistintaMateriali({
      titolo: "Originale",
      voci: [{ nome: "Tubo", quantita: 5, unita: "m" }],
    });
    renderLista();
    fireEvent.click(screen.getByRole("button", { name: /Duplica/i }));
    expect(
      screen.getByRole("heading", { name: /Modifica distinta/i })
    ).toBeInTheDocument();
    const titolo = screen.getByTestId("distinta-titolo");
    expect(titolo.value).toMatch(/Originale/);
    expect(titolo.value).not.toBe("Originale");
  });

  it("elimina distinta dopo conferma", () => {
    creaDistintaMateriali({ titolo: "Da eliminare" });
    renderLista();
    fireEvent.click(screen.getByRole("button", { name: "Elimina" }));
    expect(screen.getByText(/Elimina distinta\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("distinte-confirm-delete"));
    expect(screen.getByTestId("distinte-empty")).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.distinteMateriali)).toMatch(/\[\]/);
  });
});
