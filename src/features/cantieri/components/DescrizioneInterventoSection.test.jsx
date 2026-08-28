import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DescrizioneInterventoSection from "./DescrizioneInterventoSection";

vi.mock("../services/miglioraDescrizioneInterventoService", () => ({
  miglioraDescrizioneIntervento: vi.fn(),
}));

import { miglioraDescrizioneIntervento } from "../services/miglioraDescrizioneInterventoService";

describe("DescrizioneInterventoSection", () => {
  it("salva modifiche descrizione", async () => {
    vi.useFakeTimers();
    const onSalva = vi.fn();
    render(
      <DescrizioneInterventoSection descrizione="" onSalva={onSalva} />
    );
    fireEvent.change(screen.getByTestId("descrizione-intervento-input"), {
      target: { value: "Cambiato MT" },
    });
    vi.advanceTimersByTime(400);
    expect(onSalva).toHaveBeenCalledWith("Cambiato MT");
    vi.useRealTimers();
  });

  it("mostra bozza IA e richiede conferma (non sostituisce da sola)", async () => {
    miglioraDescrizioneIntervento.mockResolvedValue({
      ok: true,
      bozza: "Sostituito il magnetotermico.",
    });
    const onSalva = vi.fn();
    render(
      <DescrizioneInterventoSection
        descrizione="cambiato mt"
        onSalva={onSalva}
      />
    );

    fireEvent.click(screen.getByTestId("migliora-descrizione-ia"));
    await waitFor(() => {
      expect(screen.getByTestId("migliora-descrizione-bozza")).toBeInTheDocument();
    });

    expect(onSalva).not.toHaveBeenCalledWith("Sostituito il magnetotermico.");

    fireEvent.click(screen.getByTestId("migliora-descrizione-usa"));
    expect(onSalva).toHaveBeenCalledWith("Sostituito il magnetotermico.");
  });

  it("annulla bozza senza applicare", async () => {
    miglioraDescrizioneIntervento.mockResolvedValue({
      ok: true,
      bozza: "Testo migliorato.",
    });
    const onSalva = vi.fn();
    render(
      <DescrizioneInterventoSection descrizione="test" onSalva={onSalva} />
    );
    fireEvent.click(screen.getByTestId("migliora-descrizione-ia"));
    await waitFor(() => screen.getByTestId("migliora-descrizione-bozza"));
    fireEvent.click(screen.getByTestId("migliora-descrizione-annulla"));
    expect(screen.queryByTestId("migliora-descrizione-bozza")).not.toBeInTheDocument();
    expect(onSalva).not.toHaveBeenCalledWith("Testo migliorato.");
  });

  it("mostra errore se IA non configurata", async () => {
    miglioraDescrizioneIntervento.mockResolvedValue({
      ok: false,
      nonConfigurato: true,
      errore: "Assistente IA non configurato.",
    });
    render(
      <DescrizioneInterventoSection descrizione="test" onSalva={vi.fn()} />
    );
    fireEvent.click(screen.getByTestId("migliora-descrizione-ia"));
    await waitFor(() => {
      expect(screen.getByTestId("migliora-descrizione-errore")).toHaveTextContent(
        /non configurato/i
      );
    });
  });
});
