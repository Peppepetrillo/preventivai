import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import { routePreventivo } from "../app/routes";
import ArchivioPreventivi from "../pages/ArchivioPreventivi";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
  salvaDatoCloudImmediato: vi.fn(),
}));

describe("ArchivioPreventivi RC-2B", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([
        {
          id: "p1",
          cliente: "Mario Rossi",
          numero: "PREV-001",
          stato: "Inviato",
          totale: 100,
          data: "20/07/2026",
        },
        {
          id: "p2",
          cliente: "Bianchi SRL",
          numero: "PREV-002",
          stato: "Bozza",
          totale: 50,
          data: "21/07/2026",
        },
      ])
    );
  });

  it("usa routePreventivo e filtra per cliente", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ArchivioPreventivi />
      </MemoryRouter>
    );

    const linkMario = screen.getByRole("link", { name: /Mario Rossi/i });
    expect(linkMario).toHaveAttribute("href", routePreventivo("p1"));

    await user.type(
      screen.getByRole("searchbox", { name: /Cerca cliente/i }),
      "Bianchi"
    );

    expect(screen.getByRole("link", { name: /Bianchi SRL/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Mario Rossi/i })).not.toBeInTheDocument();
  });
});
