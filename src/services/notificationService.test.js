import { beforeEach, describe, expect, it, vi } from "vitest";

const isNativePlatform = vi.fn(() => false);
const checkPermissions = vi.fn();
const requestPermissions = vi.fn();
const schedule = vi.fn();
const cancel = vi.fn();
const getPending = vi.fn();

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: (...args) => checkPermissions(...args),
    requestPermissions: (...args) => requestPermissions(...args),
    schedule: (...args) => schedule(...args),
    cancel: (...args) => cancel(...args),
    getPending: (...args) => getPending(...args),
  },
}));

import {
  NOTIFICATION_TYPES,
  NotificationService,
  cancellaNotifica,
  cancellaTutteNotifiche,
  combinaDataOraItaliana,
  normalizzaDataNotifica,
  notificheDisponibili,
  programmaMaterialiDaAcquistare,
  programmaNotifica,
  programmaPromemoriaSopralluogo,
  richiediPermessoNotifiche,
  toNumericNotificationId,
} from "./notificationService";

function dataFutura(minuti = 60) {
  return new Date(Date.now() + minuti * 60_000);
}

describe("notificationService — planner esistente", () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(false);
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

  it("pianifica reminder con minuti personalizzati", () => {
    const piani = service.planForLavoro(
      {
        id: "c1",
        titolo: "Intervento",
        cliente: "Rossi",
        orario: "10:00",
        startAt: Date.now() + 3_600_000,
      },
      { reminderMinutes: 15 }
    );

    expect(piani[0].type).toBe(NOTIFICATION_TYPES.REMINDER_15MIN);
    expect(piani[0].reminderMinutes).toBe(15);
  });

  it("pianifica reminder per attività, spesa e promemoria", () => {
    const attivita = service.planForActivity({
      id: "a1",
      titolo: "Chiama fornitore",
      ora: "10:00",
      reminder: true,
      priorita: "alta",
    });
    expect(attivita.length).toBeGreaterThanOrEqual(1);
    expect(attivita[0].type).toBe(NOTIFICATION_TYPES.REMINDER_ATTIVITA);

    const spesa = service.planForShopping([
      { id: "s1", nome: "Magnetotermico" },
      { id: "s2", nome: "Differenziale" },
    ]);
    expect(spesa).toHaveLength(1);
    expect(spesa[0].type).toBe(NOTIFICATION_TYPES.REMINDER_SPESA);

    const reminder = service.planForReminder({
      titolo: "Ricorda fattura",
      messaggio: "Invia fattura Rossi",
    });
    expect(reminder[0].type).toBe(NOTIFICATION_TYPES.REMINDER_GENERICO);
  });
});

describe("notificationService — API Capacitor locale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(false);
    checkPermissions.mockResolvedValue({ display: "prompt" });
    requestPermissions.mockResolvedValue({ display: "granted" });
    schedule.mockResolvedValue({ notifications: [] });
    cancel.mockResolvedValue(undefined);
    getPending.mockResolvedValue({ notifications: [] });
  });

  it("web fallback: notifiche non disponibili e nessun crash", async () => {
    expect(notificheDisponibili()).toBe(false);
    const permesso = await richiediPermessoNotifiche();
    expect(permesso).toEqual({
      granted: false,
      display: "prompt",
      disponibile: false,
    });
    expect(checkPermissions).not.toHaveBeenCalled();

    const esito = await programmaNotifica({
      id: "web-1",
      titolo: "Test",
      corpo: "Corpo",
      data: dataFutura(),
    });
    expect(esito.success).toBe(true);
    expect(esito.skipped).toBe(true);
    expect(schedule).not.toHaveBeenCalled();

    await expect(cancellaNotifica("web-1")).resolves.toMatchObject({
      success: true,
      skipped: true,
    });
    await expect(cancellaTutteNotifiche()).resolves.toMatchObject({
      success: true,
      skipped: true,
    });
  });

  it("native: permesso granted programma notifica", async () => {
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "granted" });

    const at = dataFutura(90);
    const esito = await programmaNotifica({
      id: "n-1",
      titolo: "Sopralluogo",
      corpo: "Cliente Rossi",
      data: at,
      extra: { tipo: "sopralluogo" },
    });

    expect(esito.success).toBe(true);
    expect(esito.id).toBe(toNumericNotificationId("n-1"));
    expect(schedule).toHaveBeenCalledTimes(1);
    const payload = schedule.mock.calls[0][0].notifications[0];
    expect(payload.title).toBe("Sopralluogo");
    expect(payload.body).toBe("Cliente Rossi");
    expect(payload.schedule.at).toEqual(at);
  });

  it("native: permesso denied non programma", async () => {
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "denied" });
    requestPermissions.mockResolvedValue({ display: "denied" });

    const esito = await programmaNotifica({
      id: "n-2",
      titolo: "Test",
      data: dataFutura(),
    });

    expect(esito).toEqual({ success: false, error: "permesso_negato" });
    expect(schedule).not.toHaveBeenCalled();
  });

  it("cancella notifica e tutte le pending", async () => {
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "granted" });
    getPending.mockResolvedValue({
      notifications: [{ id: 11 }, { id: 22 }],
    });

    await expect(cancellaNotifica("abc")).resolves.toEqual({ success: true });
    expect(cancel).toHaveBeenCalledWith({
      notifications: [{ id: toNumericNotificationId("abc") }],
    });

    await expect(cancellaTutteNotifiche()).resolves.toEqual({
      success: true,
      cancellate: 2,
    });
    expect(cancel).toHaveBeenLastCalledWith({
      notifications: [{ id: 11 }, { id: 22 }],
    });
  });

  it("rifiuta dati incompleti e data invalida senza crash", async () => {
    await expect(programmaNotifica({})).resolves.toEqual({
      success: false,
      error: "dati_incompleti",
    });
    await expect(
      programmaNotifica({ id: "x", titolo: "Ok", data: "non-una-data" })
    ).resolves.toEqual({ success: false, error: "data_invalida" });
    await expect(
      programmaNotifica({
        id: "x",
        titolo: "Ok",
        data: new Date(Date.now() - 60_000),
      })
    ).resolves.toEqual({ success: false, error: "data_passata" });
    await expect(cancellaNotifica("")).resolves.toEqual({
      success: false,
      error: "dati_incompleti",
    });
  });

  it("helper sopralluogo e materiali usano programmaNotifica", async () => {
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "granted" });

    await programmaPromemoriaSopralluogo({
      id: "sop-1",
      cliente: "Bianchi",
      data: dataFutura(120),
      indirizzo: "Via Roma 1",
    });
    expect(schedule.mock.calls[0][0].notifications[0].title).toBe("Sopralluogo");

    await programmaMaterialiDaAcquistare({
      id: "mat-1",
      quantita: 3,
      data: dataFutura(180),
    });
    expect(schedule.mock.calls[1][0].notifications[0].title).toBe(
      "Materiali da acquistare"
    );
  });

  it("su native il planner con scheduledAt chiama LocalNotifications", async () => {
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "granted" });
    const service = new NotificationService();

    service.schedule({
      id: "plan-native-1",
      type: NOTIFICATION_TYPES.REMINDER_ATTIVITA,
      titolo: "Chiama",
      messaggio: "Fornitore",
      scheduledAt: dataFutura(45),
    });

    await vi.waitFor(() => {
      expect(schedule).toHaveBeenCalled();
    });
  });
});

describe("notificationService — parsing date", () => {
  it("normalizza Date, epoch e formato IT", () => {
    const d = new Date("2026-09-01T10:00:00");
    expect(normalizzaDataNotifica(d)).toEqual(d);
    expect(normalizzaDataNotifica(d.getTime())?.getTime()).toBe(d.getTime());
    expect(normalizzaDataNotifica("01/09/2026 10:30")?.getHours()).toBe(10);
    expect(normalizzaDataNotifica("")).toBeNull();
    expect(normalizzaDataNotifica("foo")).toBeNull();
  });

  it("combina data e ora italiane", () => {
    const d = combinaDataOraItaliana("17/08/2026", "14:15");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(7);
    expect(d?.getDate()).toBe(17);
    expect(d?.getHours()).toBe(14);
    expect(d?.getMinutes()).toBe(15);
  });
});
