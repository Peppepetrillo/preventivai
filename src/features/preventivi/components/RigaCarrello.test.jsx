import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RigaCarrello from "./RigaCarrello";

describe("RigaCarrello premium hierarchy", () => {
  it("mostra nome, prezzo, quantità e totale in gerarchia leggibile", () => {
    render(
      <RigaCarrello
        indice={0}
        lavorazione={{
          id: "1",
          nome: "Punto luce",
          prezzo: 45,
          quantita: 3,
          unita: "cad",
        }}
        prezzoListino={45}
        onAumentaQuantita={vi.fn()}
        onDiminuisciQuantita={vi.fn()}
        onImpostaQuantita={vi.fn()}
        onImpostaPrezzo={vi.fn()}
        onRimuoviLavorazione={vi.fn()}
      />
    );

    expect(screen.getByText("Punto luce")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /prezzo .*tocca per modificare/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/totale riga/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /quantità punto luce: 3/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rimuovi punto luce/i })
    ).toBeInTheDocument();
  });
});
