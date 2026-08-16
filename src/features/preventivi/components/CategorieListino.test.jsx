import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CategorieListino from "./CategorieListino";
import { filtraListino } from "../utils/listinoGrouping";

const LISTINO = [
  { id: "1", nome: "Punto luce", categoria: "Illuminazione", prezzo: 40, unita: "cad" },
  { id: "2", nome: "Punto presa", categoria: "Prese", prezzo: 55, unita: "cad" },
  { id: "3", nome: "Quadro elettrico", categoria: "Quadro", prezzo: 350, unita: "cad" },
];

function renderCategorie({
  listino = LISTINO,
  ricerca = "",
  categorieAperteDefault = ["Illuminazione"],
} = {}) {
  return render(
    <CategorieListino
      listino={listino}
      ricerca={ricerca}
      categorieAperteDefault={categorieAperteDefault}
      quantitaPerVoce={new Map()}
      onAggiungiVoce={vi.fn()}
    />
  );
}

function pulsanteCategoria(nome) {
  return screen.getByRole("button", { name: new RegExp(`^${nome}`, "i") });
}

describe("CategorieListino ricerca intelligente", () => {
  it("con ricerca attiva apre la categoria che contiene risultati", () => {
    const filtrato = filtraListino(LISTINO, "presa");
    renderCategorie({ listino: filtrato, ricerca: "presa" });

    expect(pulsanteCategoria("Prese")).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /Aggiungi Punto presa/i })
    ).toBeInTheDocument();
  });

  it("categoria inizialmente chiusa si apre con la ricerca", () => {
    const filtrato = filtraListino(LISTINO, "presa");
    renderCategorie({
      listino: filtrato,
      ricerca: "presa",
      categorieAperteDefault: ["Illuminazione"],
    });

    expect(pulsanteCategoria("Prese")).toHaveAttribute("aria-expanded", "true");
  });

  it("categoria senza risultati non viene mostrata", () => {
    const filtrato = filtraListino(LISTINO, "presa");
    renderCategorie({ listino: filtrato, ricerca: "presa" });

    expect(screen.queryByRole("button", { name: /^Illuminazione/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Quadro/i })).not.toBeInTheDocument();
  });

  it("ricerca senza risultati mostra empty state", () => {
    renderCategorie({
      listino: [],
      ricerca: "inesistente",
    });

    expect(screen.getByText(/Nessuna voce nel listino/i)).toBeInTheDocument();
  });

  it("cancellando la ricerca ripristina lo stato normale", async () => {
    const filtrato = filtraListino(LISTINO, "presa");

    const { rerender } = renderCategorie({
      listino: filtrato,
      ricerca: "presa",
      categorieAperteDefault: ["Illuminazione"],
    });

    expect(pulsanteCategoria("Prese")).toHaveAttribute("aria-expanded", "true");

    rerender(
      <CategorieListino
        listino={LISTINO}
        ricerca=""
        categorieAperteDefault={["Illuminazione"]}
        quantitaPerVoce={new Map()}
        onAggiungiVoce={vi.fn()}
      />
    );

    expect(pulsanteCategoria("Illuminazione")).toHaveAttribute("aria-expanded", "true");
    expect(pulsanteCategoria("Prese")).toHaveAttribute("aria-expanded", "false");
  });

  it("permette ancora di aggiungere una voce dal listino", async () => {
    const user = userEvent.setup();
    const onAggiungiVoce = vi.fn();
    const filtrato = filtraListino(LISTINO, "presa");

    render(
      <CategorieListino
        listino={filtrato}
        ricerca="presa"
        categorieAperteDefault={[]}
        quantitaPerVoce={new Map()}
        onAggiungiVoce={onAggiungiVoce}
      />
    );

    await user.click(screen.getByRole("button", { name: /Aggiungi Punto presa/i }));

    expect(onAggiungiVoce).toHaveBeenCalledWith(
      expect.objectContaining({ id: "2", nome: "Punto presa", prezzo: 55 })
    );
  });
});
