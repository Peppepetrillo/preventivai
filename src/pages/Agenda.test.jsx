import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../app/storageKeys";
import Agenda from "./Agenda";

vi.mock("../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

function renderAgenda() {
  return render(
    <MemoryRouter>
      <Agenda />
    </MemoryRouter>
  );
}

describe("Agenda", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          nome: "Villa Rossi",
          cliente: "Rossi",
          indirizzo: "Via Roma 12",
          stato: "In corso",
          orario: "08:00",
          dataIntervento: "29/07/2026",
          checklist: [{ id: "1", testo: "Portare differenziale", completata: false }],
          materiali: [],
          telefono: "3331112222",
        },
        {
          id: "c2",
          nome: "Condominio Verdi",
          cliente: "Verdi",
          indirizzo: "Via Milano 5",
          stato: "Da iniziare",
          orario: "11:00",
          dataIntervento: "30/07/2026",
          checklist: [],
          materiali: [],
        },
      ])
    );
  });

  it("mostra gli interventi del giorno in timeline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    renderAgenda();

    expect(screen.getByText("Villa Rossi")).toBeInTheDocument();
    expect(screen.getAllByText("08:00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Portare differenziale/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Timeline$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Oggi$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nuovo/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("cambia giorno con i pulsanti di navigazione", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    renderAgenda();

    fireEvent.click(screen.getByLabelText("Giorno successivo"));
    expect(screen.getByText("Condominio Verdi")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Torna a oggi"));
    expect(screen.getByText("Villa Rossi")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("apre il cantiere con un tap sulla card", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    renderAgenda();

    const link = screen.getByTestId("agenda-lavoro-link");
    expect(link).toHaveAttribute("href", "/cantiere/c1");

    vi.useRealTimers();
  });

  it("deseleziona chip Oggi/Domani quando si naviga ad altri giorni", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    renderAgenda();

    const oggiTab = screen.getByRole("tab", { name: /^Oggi$/i });
    expect(oggiTab).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByLabelText("Giorno precedente"));
    expect(oggiTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: /^Domani$/i })).toHaveAttribute(
      "aria-selected",
      "false"
    );

    vi.useRealTimers();
  });

  it("segna un intervento come completato", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    renderAgenda();

    fireEvent.click(screen.getByRole("button", { name: /Lavoro finito/i }));

    const cantieri = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri) || "[]");
    expect(cantieri[0].stato).toBe("Completato");

    vi.useRealTimers();
  });

  it("FAB contestuale Agenda è l'unico + visibile", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    renderAgenda();

    expect(screen.getByTestId("agenda-toolbar-plus")).toBeInTheDocument();
    expect(screen.queryByTestId("global-create-fab")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("giornata libera mostra CTA consuntivo e cantiere", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 30, 10, 0, 0));

    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([]));

    renderAgenda();

    expect(screen.getByTestId("agenda-empty-registra-consuntivo")).toBeVisible();
    expect(screen.getByTestId("agenda-empty-pianifica-cantiere")).toBeVisible();

    vi.useRealTimers();
  });

  it("segna giornata prevista senza creare registroGiornate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          nome: "Villa Rossi",
          cliente: "Rossi",
          stato: "In corso",
          programmazione: [
            {
              id: "g1",
              data: "29/07/2026",
              oraInizio: "08:00",
              orePreviste: 4,
              operai: 1,
              attivita: "Tracce",
              stato: "programmata",
            },
          ],
          registroGiornate: [],
        },
      ])
    );

    renderAgenda();

    fireEvent.click(screen.getByTestId("agenda-segna-giornata-fatta"));

    const cantieri = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri) || "[]");
    expect(cantieri[0].programmazione[0].stato).toBe("completata");
    expect(cantieri[0].registroGiornate).toEqual([]);

    expect(screen.getByTestId("consuntivo-dopo-previsto")).toBeInTheDocument();
    expect(
      screen.getByTestId("consuntivo-dopo-previsto-confirm")
    ).toHaveTextContent("Registra consuntivo");

    fireEvent.click(screen.getByTestId("consuntivo-dopo-previsto-confirm"));

    expect(screen.getByTestId("registro-cantiere")).toHaveValue("c1");
    expect(screen.getByTestId("registro-operai")).toHaveValue("Io");
    expect(screen.getByTestId("registro-attivita")).toHaveValue("Tracce");

    vi.useRealTimers();
  });

  it("Più tardi non crea registroGiornate e lascia CTA consuntivo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          nome: "Villa Rossi",
          cliente: "Rossi",
          stato: "In corso",
          programmazione: [
            {
              id: "g1",
              data: "29/07/2026",
              oraInizio: "08:00",
              orePreviste: 4,
              operai: 1,
              attivita: "Tracce",
              stato: "programmata",
            },
          ],
          registroGiornate: [],
        },
      ])
    );

    renderAgenda();

    fireEvent.click(screen.getByTestId("agenda-segna-giornata-fatta"));
    fireEvent.click(screen.getByTestId("consuntivo-dopo-previsto-cancel"));

    const cantieri = JSON.parse(localStorage.getItem(STORAGE_KEYS.cantieri) || "[]");
    expect(cantieri[0].programmazione[0].stato).toBe("completata");
    expect(cantieri[0].registroGiornate).toEqual([]);

    expect(screen.getByText("Consuntivo da registrare")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-registra-consuntivo")).toBeInTheDocument();
    expect(screen.queryByTestId("agenda-consuntivo-registrato")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("Segna giornata fatta e Lavoro finito restano distinti", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 29, 10, 0, 0));

    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          nome: "Villa Rossi",
          cliente: "Rossi",
          stato: "In corso",
          dataIntervento: "29/07/2026",
          orario: "08:00",
        },
        {
          id: "c2",
          nome: "Condominio Verdi",
          cliente: "Verdi",
          stato: "In corso",
          programmazione: [
            {
              id: "g1",
              data: "29/07/2026",
              oraInizio: "14:00",
              orePreviste: 4,
              operai: 1,
              attivita: "Tracce",
              stato: "programmata",
            },
          ],
        },
      ])
    );

    renderAgenda();

    expect(screen.getByTestId("agenda-lavoro-finito")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-segna-giornata-fatta")).toBeInTheDocument();

    vi.useRealTimers();
  });
});
