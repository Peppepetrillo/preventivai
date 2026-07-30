import { describe, expect, it } from "vitest";

import {
  calcolaEndAt,
  calcolaReminderAt,
  calcolaStartAt,
  costruisciSchedulingDaForm,
  leggiScheduling,
  risolviStatoPianificazione,
  STATO_PIANIFICAZIONE,
} from "./schedulingDomain";
import { creaLavoroPianificato } from "./creaLavoroPianificato";

describe("schedulingDomain", () => {
  it("calcola startAt e endAt da data/ora/durata", () => {
    const startAt = calcolaStartAt("29/07/2026", "09:00");
    expect(startAt).toBeTruthy();
    const endAt = calcolaEndAt(startAt, 90);
    expect(endAt - startAt).toBe(90 * 60_000);
  });

  it("costruisce scheduling con alias legacy", () => {
    const scheduling = costruisciSchedulingDaForm({
      scheduledDate: "30/07/2026",
      scheduledTime: "11:00",
      estimatedDuration: 60,
      reminderEnabled: true,
      reminderMinutes: 30,
    });

    expect(scheduling.dataIntervento).toBe("30/07/2026");
    expect(scheduling.orario).toBe("11:00");
    expect(scheduling.durataStimata).toBe(60);
    expect(scheduling.reminderMinutes).toBe(30);
    expect(scheduling.startAt).toBeTruthy();
    expect(scheduling.endAt).toBeTruthy();
  });

  it("legge scheduling da record legacy", () => {
    const scheduling = leggiScheduling({
      dataIntervento: "29/07/2026",
      orario: "08:00",
      durataStimata: 45,
    });
    expect(scheduling.scheduledDate).toBe("29/07/2026");
    expect(scheduling.scheduledTime).toBe("08:00");
    expect(scheduling.estimatedDuration).toBe(45);
  });

  it("risolve stati pianificazione incluso rimandato", () => {
    expect(risolviStatoPianificazione({ stato: "Rimandato" })).toBe(
      STATO_PIANIFICAZIONE.RIMANDATO
    );
    expect(risolviStatoPianificazione({ stato: "Da iniziare" })).toBe(
      STATO_PIANIFICAZIONE.PIANIFICATO
    );
  });

  it("calcola reminder At", () => {
    const start = calcolaStartAt("29/07/2026", "10:00");
    expect(calcolaReminderAt(start, 15)).toBe(start - 15 * 60_000);
  });
});

describe("creaLavoroPianificato", () => {
  it("crea un lavoro agenda con campi scheduling", () => {
    const lavoro = creaLavoroPianificato({
      tipoLavoro: "sopralluogo",
      titolo: "Sopralluogo Villa",
      cliente: "Rossi",
      scheduledDate: "29/07/2026",
      scheduledTime: "09:00",
      estimatedDuration: 60,
      priorita: "alta",
      reminderEnabled: true,
      reminderMinutes: 15,
      note: "Portare tester",
    });

    expect(lavoro.tipoLavoro).toBe("sopralluogo");
    expect(lavoro.scheduledDate).toBe("29/07/2026");
    expect(lavoro.orario).toBe("09:00");
    expect(lavoro.dataIntervento).toBe("29/07/2026");
    expect(lavoro.origine).toBe("agenda");
    expect(lavoro.reminderMinutes).toBe(15);
    expect(lavoro.diario).toHaveLength(1);
  });
});
