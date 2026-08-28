import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NuovoCantiereForm from "./NuovoCantiereForm";

describe("NuovoCantiereForm", () => {
  it("notifica i cambi dei campi e la creazione del cantiere", async () => {
    const user = userEvent.setup();
    const onAggiornaCampo = vi.fn();
    const onCreaCantiere = vi.fn();

    render(
      <NuovoCantiereForm
        cantiere={{
          nome: "",
          cliente: "",
          indirizzo: "",
          tipoIntervento: "Riparazione",
          descrizioneIntervento: "",
        }}
        onAggiornaCampo={onAggiornaCampo}
        onCreaCantiere={onCreaCantiere}
      />
    );

    await user.click(screen.getByRole("button", { name: /^Manutenzione$/i }));
    expect(onAggiornaCampo).toHaveBeenCalledWith("tipoIntervento", "Manutenzione");

    await user.type(screen.getByPlaceholderText("Nome lavoro"), "A");
    await user.type(screen.getByPlaceholderText("Cliente"), "B");
    await user.type(screen.getByPlaceholderText("Indirizzo"), "C");
    await user.click(screen.getByRole("button", { name: /crea lavoro/i }));

    expect(onAggiornaCampo).toHaveBeenCalledWith("nome", "A");
    expect(onAggiornaCampo).toHaveBeenCalledWith("cliente", "B");
    expect(onAggiornaCampo).toHaveBeenCalledWith("indirizzo", "C");
    expect(onCreaCantiere).toHaveBeenCalledOnce();
  });
});
