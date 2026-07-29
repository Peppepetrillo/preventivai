import { beforeEach, describe, expect, it } from "vitest";

import {
  NOTIFICATION_TYPES,
  NotificationService,
} from "./notificationService";

describe("notificationService", () => {
  let service;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("pianifica notifiche senza inviarle", () => {
    const piano = service.schedule({
      type: NOTIFICATION_TYPES.REMINDER_60MIN,
      titolo: "Tra un'ora",
      messaggio: "Intervento imminente",
      lavoroId: "c1",
    });

    expect(piano.stato).toBe("pianificata");
    expect(service.listPianificate("c1")).toHaveLength(1);
  });

  it("genera tutti i tipi di reminder per un lavoro", () => {
    const piani = service.planForLavoro({
      id: "c1",
      titolo: "Villa Rossi",
      cliente: "Rossi",
      orario: "09:00",
      saldo: 300,
      checklist: ["Portare differenziale"],
      materialiDaComprare: [{ nome: "Cavo" }],
    });

    const tipi = piani.map((p) => p.type);
    expect(tipi).toContain(NOTIFICATION_TYPES.REMINDER_SERATA);
    expect(tipi).toContain(NOTIFICATION_TYPES.REMINDER_60MIN);
    expect(tipi).toContain(NOTIFICATION_TYPES.REMINDER_MATERIALI);
    expect(tipi).toContain(NOTIFICATION_TYPES.REMINDER_PAGAMENTO);
    expect(tipi).toContain(NOTIFICATION_TYPES.REMINDER_CHECKLIST);
  });

  it("annulla una notifica pianificata", () => {
    const piano = service.schedule({
      type: NOTIFICATION_TYPES.REMINDER_SERATA,
      titolo: "Test",
      messaggio: "Test",
    });

    const annullata = service.cancel(piano.id);
    expect(annullata?.stato).toBe("annullata");
    expect(service.listPianificate()).toHaveLength(0);
  });
});
