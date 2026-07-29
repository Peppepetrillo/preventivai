import { describe, expect, it } from "vitest";

import { CalendarService } from "./calendarService";

describe("calendarService", () => {
  it("espone i metodi del layer astratto", () => {
    const service = new CalendarService();
    expect(typeof service.createCalendarEvent).toBe("function");
    expect(typeof service.updateCalendarEvent).toBe("function");
    expect(typeof service.deleteCalendarEvent).toBe("function");
    expect(typeof service.syncJob).toBe("function");
  });

  it("crea eventi in modalità locale senza adapter esterno", async () => {
    const service = new CalendarService();
    const risultato = await service.createCalendarEvent({
      id: "c1",
      titolo: "Villa Rossi",
      indirizzo: "Via Roma 12",
    });

    expect(risultato.ok).toBe(true);
    expect(risultato.provider).toBe("locale");
    expect(risultato.externalId).toBe("local-c1");
  });

  it("sincronizza un lavoro agenda", async () => {
    const service = new CalendarService();
    const risultato = await service.syncJob({
      id: "c1",
      titolo: "Intervento Rossi",
      cliente: "Rossi",
      tipoLavoro: "intervento",
      link: "/cantiere/c1",
    });

    expect(risultato.ok).toBe(true);
    expect(risultato.externalId).toBe("local-c1");
  });

  it("delega a un adapter esterno quando presente", async () => {
    const adapter = {
      createCalendarEvent: async () => ({
        ok: true,
        provider: "google",
        externalId: "g-123",
      }),
      updateCalendarEvent: async () => ({ ok: true, provider: "google" }),
      deleteCalendarEvent: async () => ({ ok: true, provider: "google" }),
      syncJob: async () => ({ ok: true, provider: "google", externalId: "g-456" }),
    };

    const service = new CalendarService(adapter);
    const risultato = await service.syncJob({ id: "c1", titolo: "Test" });
    expect(risultato.provider).toBe("google");
    expect(risultato.externalId).toBe("g-456");
  });
});
