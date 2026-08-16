import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/assistantService", () => ({
  getDashboardAssistant: vi.fn(() => ({ cards: [] })),
}));

import { getDashboardAssistant } from "../../services/assistantService";
import {
  calcolaOggi,
  selezionaAssistantCardsHome,
  selezionaLavoriInRitardo,
  selezionaPreventiviDaInviare,
  selezionaPromemoriaImminenti,
} from "./oggiService";
import { selezionaCantieriAperti } from "../dashboard/dashboardSelectors";
import { selezionaDaComprare } from "../../domain/listaSpesa/acquistiSelectors";

describe("oggiService", () => {
  const oggi = new Date(2026, 7, 17, 9, 0, 0); // 17/08/2026

  it("calcola cantieri aperti", () => {
    const cantieri = [
      { id: "1", stato: "In corso" },
      { id: "2", stato: "Completato" },
      { id: "3", stato: "Da iniziare" },
    ];
    expect(selezionaCantieriAperti(cantieri)).toHaveLength(2);
    const snap = calcolaOggi({ cantieri, ora: oggi });
    expect(snap.cantieriAperti).toHaveLength(2);
    expect(snap.riepilogo.find((r) => r.id === "cantieri-aperti")?.conteggio).toBe(
      2
    );
  });

  it("calcola preventivi da inviare / bozze", () => {
    const preventivi = [
      { id: "p1", stato: "Bozza", cliente: "Rossi" },
      { id: "p2", stato: "Inviato", cliente: "Bianchi" },
      { id: "p3", stato: "Bozza", cliente: "Verdi" },
    ];
    expect(selezionaPreventiviDaInviare(preventivi)).toHaveLength(2);
    const snap = calcolaOggi({ preventivi, ora: oggi });
    expect(snap.preventiviDaInviare).toHaveLength(2);
    expect(
      snap.riepilogo.find((r) => r.id === "preventivi-inviare")?.conteggio
    ).toBe(2);
  });

  it("calcola materiali da acquistare", () => {
    const listaSpesa = [
      { id: "a1", nome: "Cavo", acquistato: false },
      { id: "a2", nome: "Tubo", acquistato: true },
      { id: "a3", nome: "Scatola", acquistato: false },
    ];
    expect(selezionaDaComprare(listaSpesa)).toHaveLength(2);
    const snap = calcolaOggi({ listaSpesa, ora: oggi });
    expect(snap.materialiDaAcquistare).toHaveLength(2);
    expect(snap.riepilogo.find((r) => r.id === "materiali")?.conteggio).toBe(2);
  });

  it("individua lavori in ritardo da scheduledDate passata", () => {
    const cantieri = [
      {
        id: "ritardo",
        stato: "In corso",
        scheduledDate: "10/08/2026",
        cliente: "Vecchio",
      },
      {
        id: "ok",
        stato: "In corso",
        scheduledDate: "20/08/2026",
        cliente: "Futuro",
      },
      {
        id: "fatto",
        stato: "Completato",
        scheduledDate: "01/08/2026",
      },
    ];
    const ritardi = selezionaLavoriInRitardo(cantieri, oggi);
    expect(ritardi.map((c) => c.id)).toEqual(["ritardo"]);
    expect(calcolaOggi({ cantieri, ora: oggi }).lavoriInRitardo).toHaveLength(1);
  });

  it("seleziona promemoria imminenti", () => {
    const attivita = [
      {
        id: "pr1",
        titolo: "Chiama fornitore",
        data: "17/08/2026",
        ora: "10:00",
        reminder: true,
      },
      {
        id: "pr2",
        titolo: "Vecchio",
        data: "01/01/2020",
        ora: "08:00",
        reminder: true,
      },
      {
        id: "pr3",
        titolo: "Senza reminder",
        data: "17/08/2026",
        ora: "11:00",
      },
    ];
    const lista = selezionaPromemoriaImminenti(attivita, oggi);
    expect(lista.map((a) => a.id)).toEqual(["pr1"]);
  });

  it("assistant cards assenti", () => {
    getDashboardAssistant.mockReturnValue({ cards: [] });
    expect(selezionaAssistantCardsHome()).toEqual([]);
    expect(calcolaOggi({ ora: oggi }).assistantCards).toEqual([]);
  });

  it("assistant cards presenti (max 3)", () => {
    getDashboardAssistant.mockReturnValue({
      cards: [
        { id: "c1", titolo: "Uno" },
        { id: "c2", titolo: "Due" },
        { id: "c3", titolo: "Tre" },
        { id: "c4", titolo: "Quattro" },
      ],
    });
    const cards = selezionaAssistantCardsHome();
    expect(cards).toHaveLength(3);
    expect(calcolaOggi({ ora: oggi }).assistantCards).toHaveLength(3);
  });

  it("stato vuoto quando non c'è operatività", () => {
    const snap = calcolaOggi({
      cantieri: [],
      preventivi: [],
      listaSpesa: [],
      attivita: [],
      ora: oggi,
    });
    expect(snap.vuoto).toBe(true);
    expect(snap.frase).toBe("Giornata libera.");
  });

  it("non è vuoto con bozza o materiale", () => {
    expect(
      calcolaOggi({
        preventivi: [{ id: "p1", stato: "Bozza" }],
        ora: oggi,
      }).vuoto
    ).toBe(false);
    expect(
      calcolaOggi({
        listaSpesa: [{ id: "a1", nome: "Cavo", acquistato: false }],
        ora: oggi,
      }).vuoto
    ).toBe(false);
  });
});
