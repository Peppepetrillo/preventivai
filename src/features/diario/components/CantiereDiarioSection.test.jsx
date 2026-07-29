import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CantiereDiarioSection from "./CantiereDiarioSection";

const cantiere = {
  id: "c1",
  diario: [
    {
      id: "e1",
      type: "foto",
      icon: "📷",
      title: "Foto aggiunta",
      description: "Quadro elettrico principale",
      timestamp: new Date(2026, 6, 29, 9, 12).getTime(),
      attachments: [
        {
          id: "a1",
          src: "https://example.com/foto.jpg",
          thumbnail: "https://example.com/foto-thumb.jpg",
          alt: "Quadro elettrico",
        },
      ],
      meta: {},
    },
    {
      id: "e2",
      type: "nota-manuale",
      icon: "📝",
      title: "Nota",
      description: "Cliente richiede una presa aggiuntiva",
      timestamp: new Date(2026, 6, 29, 10, 4).getTime(),
      attachments: [],
      meta: {},
    },
  ],
};

describe("CantiereDiarioSection", () => {
  it("filtra e cerca nel diario", () => {
    render(<CantiereDiarioSection cantiere={cantiere} />);

    fireEvent.click(screen.getByRole("button", { name: "Foto" }));
    expect(screen.getByText("Foto aggiunta")).toBeInTheDocument();
    expect(screen.queryByText("Cliente richiede una presa aggiuntiva")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tutti" }));
    fireEvent.change(screen.getByLabelText("Cerca nel diario"), {
      target: { value: "presa" },
    });
    expect(screen.getByText("Cliente richiede una presa aggiuntiva")).toBeInTheDocument();
    expect(screen.queryByText("Foto aggiunta")).not.toBeInTheDocument();
  });

  it("aggiunge una nota manuale veloce", () => {
    const onAddManualNote = vi.fn();
    render(
      <CantiereDiarioSection
        cantiere={{ ...cantiere, diario: [] }}
        onAddManualNote={onAddManualNote}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Nuova nota/i }));
    fireEvent.change(screen.getByPlaceholderText(/Cliente preferisce/i), {
      target: { value: "Passare il corrugato nel controsoffitto" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Salva nota/i }));

    expect(onAddManualNote).toHaveBeenCalledWith(
      "Passare il corrugato nel controsoffitto"
    );
  });

  it("apre gli allegati foto con un tap", () => {
    const onOpenAttachment = vi.fn();
    render(
      <CantiereDiarioSection
        cantiere={cantiere}
        onOpenAttachment={onOpenAttachment}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Apri allegato/i }));
    expect(onOpenAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1" })
    );
  });
});
