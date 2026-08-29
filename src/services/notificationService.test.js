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
    addListener: vi.fn(),
  },
}));

import {
  NOTIFICATION_TYPES,
  NotificationService,
  calcolaScheduledAtAttivita,
  calcolaScheduledAtPerTipo,
  campiNotificaGiornataCambiati,
  campiNotificaLavoroCambiati,
  cancellaNotifica,
  cancellaTutteNotifiche,
  combinaDataOraItaliana,
  controllaPermessoNotifiche,
  elencaIdNotificheAttivita,
  elencaIdNotificheGiornata,
  elencaIdNotificheLavoro,
  giornataNotificabile,
  normalizzaDataNotifica,
  notificheDisponibili,
  programmaMaterialiDaAcquistare,
  programmaNotifica,
  programmaPromemoriaSopralluogo,
  richiediPermessoNotifiche,
  risolviStartAtGiornata,
  risolviStartAtLavoro,
  riferimentoNotificaGiornata,
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
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(schedule).toHaveBeenCalledTimes(1);
    const payload = schedule.mock.calls[0][0].notifications[0];
    expect(payload.title).toBe("Sopralluogo");
    expect(payload.body).toBe("Cliente Rossi");
    expect(payload.schedule.at).toEqual(at);
  });

  it("native: errore plugin non propaga eccezione", async () => {
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "granted" });
    cancel.mockResolvedValue(undefined);
    schedule.mockRejectedValue(new Error("ios_schedule_fallito"));

    const esito = await programmaNotifica({
      id: "err-1",
      titolo: "Test",
      data: dataFutura(),
    });

    expect(esito).toEqual({ success: false, error: "ios_schedule_fallito" });
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

  it("controllaPermessoNotifiche — solo check, nessuna richiesta", async () => {
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "granted" });

    const esito = await controllaPermessoNotifiche();

    expect(esito).toEqual({
      granted: true,
      display: "granted",
      disponibile: true,
    });
    expect(requestPermissions).not.toHaveBeenCalled();
  });

  it("controllaPermessoNotifiche su web → non disponibile", async () => {
    isNativePlatform.mockReturnValue(false);
    const esito = await controllaPermessoNotifiche();
    expect(esito.disponibile).toBe(false);
    expect(checkPermissions).not.toHaveBeenCalled();
  });

  it("controllaPermessoNotifiche — errore API → no crash", async () => {
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockRejectedValue(new Error("api_error"));

    const esito = await controllaPermessoNotifiche();

    expect(esito).toEqual({
      granted: false,
      display: "denied",
      disponibile: true,
    });
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
    cancel.mockResolvedValue(undefined);
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

  it("reschedule con stesso id non duplica in pianificate", async () => {
    isNativePlatform.mockReturnValue(false);
    const service = new NotificationService();

    service.schedule({
      id: "stabile-1",
      type: NOTIFICATION_TYPES.REMINDER_60MIN,
      titolo: "Prima",
      messaggio: "Uno",
      lavoroId: "c1",
      scheduledAt: dataFutura(120),
    });
    service.schedule({
      id: "stabile-1",
      type: NOTIFICATION_TYPES.REMINDER_60MIN,
      titolo: "Dopo",
      messaggio: "Due",
      lavoroId: "c1",
      scheduledAt: dataFutura(180),
    });

    expect(service.listPianificate("c1")).toHaveLength(1);
    expect(service.listPianificate("c1")[0].titolo).toBe("Dopo");
  });

  it("data passata via planner cancella pendente senza schedule", async () => {
    isNativePlatform.mockReturnValue(true);
    cancel.mockResolvedValue(undefined);
    const service = new NotificationService();

    service.schedule({
      id: "past-native-1",
      type: NOTIFICATION_TYPES.REMINDER_60MIN,
      titolo: "Test",
      messaggio: "Test",
      scheduledAt: Date.now() - 60_000,
    });

    await vi.waitFor(() => {
      expect(cancel).toHaveBeenCalled();
    });
    expect(schedule).not.toHaveBeenCalled();
  });

  it("planForLavoro calcola scheduledAt da startAt", () => {
    isNativePlatform.mockReturnValue(false);
    const service = new NotificationService();
    const startAt = Date.now() + 4 * 60 * 60_000;

    const piani = service.planForLavoro(
      {
        id: "c99",
        titolo: "Intervento",
        cliente: "Rossi",
        orario: "15:00",
        startAt,
        reminderEnabled: true,
        reminderMinutes: 60,
      },
      { reminderMinutes: 60 }
    );

    expect(piani[0].scheduledAt).toBe(startAt - 60 * 60_000);
  });
});

describe("notificationService — parsing date e scheduling", () => {
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

  it("risolviStartAtLavoro e calcolaScheduledAtPerTipo", () => {
    const startAt = new Date("2026-09-15T09:00:00").getTime();
    expect(
      risolviStartAtLavoro({
        scheduledDate: "15/09/2026",
        scheduledTime: "09:00",
      })
    ).toBeTruthy();

    expect(
      calcolaScheduledAtPerTipo(
        NOTIFICATION_TYPES.REMINDER_60MIN,
        { startAt },
        null
      )
    ).toBe(startAt - 60 * 60_000);
  });

  it("calcolaScheduledAtAttivita da data e ora italiane", () => {
    const ts = calcolaScheduledAtAttivita({
      data: "17/08/2026",
      ora: "14:15",
    });
    expect(new Date(ts).getHours()).toBe(14);
  });
});

describe("notificationService — resync lavoro/attività", () => {
  let service;
  let adapterSchedule;
  let adapterCancel;

  beforeEach(() => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "granted" });
    schedule.mockResolvedValue({ notifications: [] });
    cancel.mockResolvedValue(undefined);
    adapterSchedule = vi.fn().mockResolvedValue(undefined);
    adapterCancel = vi.fn().mockResolvedValue(undefined);
    service = new NotificationService({
      schedule: adapterSchedule,
      cancel: adapterCancel,
    });
  });

  function lavoroBase(override = {}) {
    const startAt = Date.now() + 4 * 60 * 60_000;
    return {
      id: "lavoro-1",
      titolo: "Intervento",
      cliente: "Rossi",
      orario: "15:00",
      startAt,
      reminderEnabled: true,
      reminderMinutes: 60,
      ...override,
    };
  }

  it("creazione lavoro via resync programma notifica con ID stabile", async () => {
    const lavoro = lavoroBase();
    const piani = await service.resyncNotificheLavoro(lavoro);

    expect(piani).toHaveLength(1);
    expect(piani[0].id).toBe(
      `${NOTIFICATION_TYPES.REMINDER_60MIN}-lavoro-1`
    );
    expect(piani[0].stato).toBe("pianificata");
    expect(adapterSchedule).toHaveBeenCalledTimes(1);
  });

  it("modifica startAt cancella vecchia notifica e programma la nuova", async () => {
    const lavoro = lavoroBase();
    await service.resyncNotificheLavoro(lavoro);
    adapterCancel.mockClear();
    adapterSchedule.mockClear();

    const startAtNuovo = Date.now() + 6 * 60 * 60_000;
    const piani = await service.resyncNotificheLavoro(
      lavoroBase({ startAt: startAtNuovo, orario: "17:00" })
    );

    const idsAttesi = elencaIdNotificheLavoro("lavoro-1");
    for (const id of idsAttesi) {
      expect(adapterCancel).toHaveBeenCalledWith(id);
    }
    expect(piani[0].scheduledAt).toBe(startAtNuovo - 60 * 60_000);
    expect(adapterSchedule).toHaveBeenCalledTimes(1);
  });

  it("reminder ON → OFF cancella senza nuova schedule", async () => {
    await service.resyncNotificheLavoro(lavoroBase());
    adapterCancel.mockClear();
    adapterSchedule.mockClear();

    const piani = await service.resyncNotificheLavoro(
      lavoroBase({ reminderEnabled: false })
    );

    expect(piani).toHaveLength(0);
    expect(adapterCancel).toHaveBeenCalled();
    expect(adapterSchedule).not.toHaveBeenCalled();
  });

  it("reminder OFF → ON programma nuova notifica", async () => {
    await service.resyncNotificheLavoro(lavoroBase({ reminderEnabled: false }));
    adapterSchedule.mockClear();

    const piani = await service.resyncNotificheLavoro(lavoroBase());

    expect(piani).toHaveLength(1);
    expect(adapterSchedule).toHaveBeenCalledTimes(1);
  });

  it("data nel passato mantiene piano in-memory ma adapter non schedule", async () => {
    const serviceNativo = new NotificationService();
    await serviceNativo.resyncNotificheLavoro(lavoroBase());
    await vi.waitFor(() => expect(schedule).toHaveBeenCalled());
    cancel.mockClear();
    schedule.mockClear();

    const piani = await serviceNativo.resyncNotificheLavoro(
      lavoroBase({ startAt: Date.now() - 60_000 })
    );

    expect(piani).toHaveLength(1);
    await vi.waitFor(() => expect(cancel).toHaveBeenCalled());
    expect(schedule).not.toHaveBeenCalled();
  });

  it("eliminazione lavoro cancella tutte le notifiche associate", async () => {
    await service.resyncNotificheLavoro(lavoroBase());
    adapterCancel.mockClear();

    await service.cancelNotificheLavoro("lavoro-1");

    const idsAttesi = elencaIdNotificheLavoro("lavoro-1");
    expect(adapterCancel).toHaveBeenCalledTimes(idsAttesi.length);
    expect(service.listPianificate("lavoro-1")).toHaveLength(0);
  });

  it("modifica attività aggiorna notifica con stesso ID di cancel", async () => {
    const attivita = {
      id: "att-1",
      titolo: "Chiama cliente",
      data: "01/09/2026",
      ora: "10:00",
      reminder: true,
    };
    await service.resyncNotificheAttivita(attivita);
    const idSchedulato = `${NOTIFICATION_TYPES.REMINDER_ATTIVITA}-att-1`;
    expect(elencaIdNotificheAttivita("att-1")).toContain(idSchedulato);

    adapterCancel.mockClear();
    adapterSchedule.mockClear();

    await service.resyncNotificheAttivita({
      ...attivita,
      ora: "11:30",
    });

    expect(adapterCancel).toHaveBeenCalledWith(idSchedulato);
    expect(adapterSchedule).toHaveBeenCalledTimes(1);
  });

  it("resync ripetuto non duplica notifiche in-memory", async () => {
    const lavoro = lavoroBase();
    await service.resyncNotificheLavoro(lavoro);
    await service.resyncNotificheLavoro(lavoro);

    expect(service.listPianificate("lavoro-1")).toHaveLength(1);
  });

  it("errore plugin cancel non causa crash", async () => {
    const serviceNativo = new NotificationService();
    cancel.mockRejectedValueOnce(new Error("plugin fail"));
    await expect(
      serviceNativo.cancelNotificheLavoro("lavoro-x")
    ).resolves.toBeUndefined();
  });

  it("ID cancel nativi corrispondono agli ID di scheduling", async () => {
    const serviceNativo = new NotificationService();
    const lavoro = lavoroBase({ id: "c-sync" });
    const piani = await serviceNativo.resyncNotificheLavoro(lavoro);
    const idLogico = piani[0].id;

    cancel.mockClear();
    await serviceNativo.cancelNotificheLavoro("c-sync");

    expect(cancel).toHaveBeenCalledWith({
      notifications: [{ id: toNumericNotificationId(idLogico) }],
    });
  });

  it("campiNotificaLavoroCambiati rileva modifica scheduling", () => {
    const prev = { reminderEnabled: true, scheduledDate: "01/09/2026", scheduledTime: "10:00" };
    const next = { reminderEnabled: true, scheduledDate: "01/09/2026", scheduledTime: "15:00" };
    expect(campiNotificaLavoroCambiati(prev, next)).toBe(true);
    expect(campiNotificaLavoroCambiati(prev, prev)).toBe(false);
  });
});

describe("notificationService — audit finale ID e multi-giornata", () => {
  let service;

  beforeEach(() => {
    service = new NotificationService();
  });

  it("ID logici distinti per cantieri, tipi e attività", () => {
    const lavoroA = elencaIdNotificheLavoro("1001");
    const lavoroB = elencaIdNotificheLavoro("1002");
    const attivita = elencaIdNotificheAttivita("1001");

    expect(lavoroA[0]).not.toBe(lavoroB[0]);
    expect(lavoroA[0]).not.toBe(attivita[0]);
    expect(new Set(lavoroA).size).toBe(lavoroA.length);
  });

  it("resync ripetuto mantiene gli stessi ID logici", async () => {
    const lavoro = {
      id: "c-stabile",
      titolo: "Test",
      startAt: Date.now() + 3_600_000,
      reminderEnabled: true,
      reminderMinutes: 60,
    };
    const prima = await service.resyncNotificheLavoro(lavoro);
    const seconda = await service.resyncNotificheLavoro(lavoro);

    expect(seconda[0].id).toBe(prima[0].id);
  });

  it("toNumericNotificationId gestisce numeri, UUID e valori vuoti", () => {
    expect(toNumericNotificationId(42)).toBe(42);
    expect(toNumericNotificationId("550e8400-e29b-41d4-a716-446655440000")).toBeGreaterThan(0);
    expect(toNumericNotificationId("")).toBe(1);
    expect(toNumericNotificationId("reminder-60min-9999999999999")).toBeGreaterThan(0);
  });

  it("toNumericNotificationId è deterministico — stesso ID → stesso numero", () => {
    const id = "reminder-60min-cantiere-123:g1";
    expect(toNumericNotificationId(id)).toBe(toNumericNotificationId(id));
  });

  it("toNumericNotificationId — ID diversi realistici → numeri diversi", () => {
    const ids = [
      "reminder-60min-c1:g1",
      "reminder-60min-c1:g2",
      "reminder-materiali-c1:g1",
      "reminder-attivita-a1",
      "reminder-serata-legacy-99",
    ];
    const numerici = ids.map((id) => toNumericNotificationId(id));
    expect(new Set(numerici).size).toBe(ids.length);
  });

  it("toNumericNotificationId gestisce ID con :, -, _ e stringhe lunghe", () => {
    const lungo = `reminder-60min-${"x".repeat(200)}:g1`;
    const n1 = toNumericNotificationId(lungo);
    const n2 = toNumericNotificationId("reminder-60min-c1:g1");
    expect(n1).toBeGreaterThan(0);
    expect(n1).toBeLessThan(2147483647);
    expect(n2).toBeGreaterThan(0);
    expect(n2).toBeLessThan(2147483647);
    expect(n1).not.toBe(n2);
  });

  it("toNumericNotificationId non produce valori negativi o zero", () => {
    const campioni = [
      "",
      "a",
      "reminder-60min-c1:g1",
      "550e8400-e29b-41d4-a716-446655440000",
      "backup-automatico-daily",
    ];
    for (const id of campioni) {
      const n = toNumericNotificationId(id);
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThan(2147483647);
    }
  });

  it("campi realistici non collidono su ID numerico nativo", () => {
    const entita = [];
    for (let i = 0; i < 200; i += 1) {
      entita.push(`reminder-60min-${Date.now() + i}`);
      entita.push(`reminder-attivita-${Date.now() + i}`);
      entita.push(`reminder-attivita-${Date.now() + i}-urgente`);
      entita.push(`reminder-materiali-${1000 + i}`);
    }
    const numerici = entita.map((id) => toNumericNotificationId(id));
    expect(new Set(numerici).size).toBe(entita.length);
  });

  it("cancelNotificheLavoro è idempotente", async () => {
    const adapterCancel = vi.fn().mockResolvedValue(undefined);
    const svc = new NotificationService({ cancel: adapterCancel });
    await svc.cancelNotificheLavoro("idempotente-1");
    await svc.cancelNotificheLavoro("idempotente-1");
    expect(adapterCancel.mock.calls.length).toBe(
      elencaIdNotificheLavoro("idempotente-1").length * 2
    );
  });

  it("multi-giornata: 3 giornate producono 3 set indipendenti di notifiche", async () => {
    const cantiere = {
      id: "c-multi",
      nome: "Cantiere multi",
      cliente: "Rossi",
      reminderEnabled: true,
      reminderMinutes: 60,
      programmazione: [
        { id: "g1", data: "02/09/2026", oraInizio: "08:00", stato: "programmata" },
        { id: "g2", data: "05/09/2026", oraInizio: "08:00", stato: "programmata" },
        { id: "g3", data: "08/09/2026", oraInizio: "08:00", stato: "programmata" },
      ],
    };

    const piani = await service.resyncNotificheCantiere(cantiere);

    expect(piani).toHaveLength(3);
    const ids = piani.map((p) => p.id);
    expect(ids).toContain(`${NOTIFICATION_TYPES.REMINDER_60MIN}-c-multi:g1`);
    expect(ids).toContain(`${NOTIFICATION_TYPES.REMINDER_60MIN}-c-multi:g2`);
    expect(ids).toContain(`${NOTIFICATION_TYPES.REMINDER_60MIN}-c-multi:g3`);
    expect(new Set(ids).size).toBe(3);
    expect(piani.every((p) => p.cantiereId === "c-multi")).toBe(true);
  });

  it("modifica programmazione[] non rilevata da campiNotificaLavoroCambiati", () => {
    const precedente = {
      id: "c1",
      reminderEnabled: true,
      programmazione: [{ id: "g1", data: "02/09/2026", oraInizio: "08:00" }],
    };
    const prossimo = {
      ...precedente,
      programmazione: [{ id: "g1", data: "05/09/2026", oraInizio: "10:00" }],
    };

    expect(campiNotificaLavoroCambiati(precedente, prossimo)).toBe(false);
  });
});

describe("notificationService — notifiche per giornata programmata", () => {
  let service;
  let adapterSchedule;
  let adapterCancel;

  function cantiereMulti() {
    return {
      id: "cantiere-123",
      nome: "Villa Rossi",
      cliente: "Rossi",
      reminderEnabled: true,
      reminderMinutes: 60,
      checklist: [],
      materiali: [],
      programmazione: [
        { id: "g1", data: "02/09/2026", oraInizio: "08:00", stato: "programmata" },
        { id: "g2", data: "05/09/2026", oraInizio: "08:00", stato: "programmata" },
        { id: "g3", data: "08/09/2026", oraInizio: "08:00", stato: "programmata" },
      ],
    };
  }

  beforeEach(() => {
    adapterSchedule = vi.fn().mockResolvedValue(undefined);
    adapterCancel = vi.fn().mockResolvedValue(undefined);
    service = new NotificationService({
      schedule: adapterSchedule,
      cancel: adapterCancel,
    });
  });

  it("cantiere senza programmazione usa scheduling legacy", async () => {
    const cantiere = {
      id: "legacy-1",
      titolo: "Intervento",
      reminderEnabled: true,
      reminderMinutes: 60,
      startAt: Date.now() + 4 * 60 * 60_000,
      orario: "10:00",
    };
    const piani = await service.resyncNotificheCantiere(cantiere);
    expect(piani).toHaveLength(1);
    expect(piani[0].id).toBe(`${NOTIFICATION_TYPES.REMINDER_60MIN}-legacy-1`);
  });

  it("giornate diverse producono ID notifiche diversi", () => {
    const idG1 = elencaIdNotificheGiornata("cantiere-123", "g1")[0];
    const idG2 = elencaIdNotificheGiornata("cantiere-123", "g2")[0];
    expect(idG1).toBe(`${NOTIFICATION_TYPES.REMINDER_SERATA}-cantiere-123:g1`);
    expect(idG2).not.toBe(idG1);
  });

  it("resync ripetuto stessa giornata non duplica", async () => {
    const cantiere = cantiereMulti();
    const g1 = cantiere.programmazione[0];
    await service.resyncNotificheGiornata(cantiere, g1);
    await service.resyncNotificheGiornata(cantiere, g1);
    const ref = riferimentoNotificaGiornata("cantiere-123", "g1");
    expect(service.listPianificate(ref)).toHaveLength(1);
  });

  it("data passata → cancel senza schedule", async () => {
    isNativePlatform.mockReturnValue(true);
    const serviceNativo = new NotificationService();
    const cantiere = cantiereMulti();
    const gPassata = {
      id: "g-past",
      data: "01/01/2020",
      oraInizio: "08:00",
      stato: "programmata",
    };
    await serviceNativo.resyncNotificheGiornata(cantiere, gPassata);
    cancel.mockClear();
    schedule.mockClear();
    await serviceNativo.resyncNotificheGiornata(cantiere, gPassata);
    await vi.waitFor(() => expect(cancel).toHaveBeenCalled());
    expect(schedule).not.toHaveBeenCalled();
  });

  it("giornata senza data → cancel senza crash", async () => {
    const cantiere = cantiereMulti();
    await expect(
      service.resyncNotificheGiornata(cantiere, {
        id: "g-invalid",
        data: "",
        stato: "programmata",
      })
    ).resolves.toEqual([]);
  });

  it("modifica ora giornata → cancel + nuova schedule", async () => {
    const cantiere = cantiereMulti();
    const g1 = { ...cantiere.programmazione[0] };
    await service.resyncNotificheGiornata(cantiere, g1);
    adapterCancel.mockClear();
    adapterSchedule.mockClear();
    await service.resyncNotificheGiornata(cantiere, {
      ...g1,
      oraInizio: "11:00",
    });
    expect(adapterCancel).toHaveBeenCalled();
    expect(adapterSchedule).toHaveBeenCalledTimes(1);
  });

  it("modifica reminder globale → resync tutte le giornate", async () => {
    const cantiere = cantiereMulti();
    await service.resyncNotificheCantiere(cantiere);
    adapterSchedule.mockClear();
    await service.resyncNotificheCantiere({
      ...cantiere,
      reminderMinutes: 30,
    });
    expect(adapterSchedule).toHaveBeenCalledTimes(3);
  });

  it("modifica una giornata non tocca le altre", async () => {
    const cantiere = cantiereMulti();
    await service.resyncNotificheCantiere(cantiere);
    adapterCancel.mockClear();
    adapterSchedule.mockClear();
    await service.resyncNotificheGiornata(cantiere, {
      ...cantiere.programmazione[0],
      oraInizio: "09:30",
    });
    const idsCancel = adapterCancel.mock.calls.map((c) => c[0]);
    expect(idsCancel.every((id) => id.includes(":g1"))).toBe(true);
    expect(idsCancel.some((id) => id.includes(":g2"))).toBe(false);
  });

  it("elimina giornata → cancel solo quella giornata", async () => {
    const cantiere = cantiereMulti();
    await service.resyncNotificheCantiere(cantiere);
    adapterCancel.mockClear();
    await service.cancelNotificheGiornata("cantiere-123", "g2");
    const ids = adapterCancel.mock.calls.map((c) => c[0]);
    expect(ids.length).toBe(elencaIdNotificheGiornata("cantiere-123", "g2").length);
    expect(ids.every((id) => id.includes(":g2"))).toBe(true);
  });

  it("giornata completata non è notificabile", () => {
    expect(
      giornataNotificabile(
        { id: "g1", data: "02/09/2026", oraInizio: "08:00", stato: "completata" },
        { reminderEnabled: true }
      )
    ).toBe(false);
  });

  it("elimina cantiere multi-giornata → cancel tutte le giornate", async () => {
    const cantiere = cantiereMulti();
    await service.resyncNotificheCantiere(cantiere);
    adapterCancel.mockClear();
    await service.cancelNotificheCantiereCompleto(cantiere);
    const refs = ["g1", "g2", "g3", cantiere.id];
    for (const ref of refs) {
      expect(
        adapterCancel.mock.calls.some((c) => String(c[0]).includes(String(ref)))
      ).toBe(true);
    }
  });

  it("reminder OFF su multi-giornata → cancel tutte senza schedule", async () => {
    const cantiere = cantiereMulti();
    await service.resyncNotificheCantiere(cantiere);
    adapterCancel.mockClear();
    adapterSchedule.mockClear();
    await service.resyncNotificheCantiere({ ...cantiere, reminderEnabled: false });
    expect(adapterCancel).toHaveBeenCalled();
    expect(adapterSchedule).not.toHaveBeenCalled();
  });

  it("nessuna collisione tra giornata e attività", () => {
    const giornata = elencaIdNotificheGiornata("cantiere-123", "g1");
    const attivita = elencaIdNotificheAttivita("g1");
    expect(giornata.some((id) => attivita.includes(id))).toBe(false);
  });

  it("cancel usa gli stessi ID dello scheduling", async () => {
    const cantiere = cantiereMulti();
    const piani = await service.resyncNotificheGiornata(
      cantiere,
      cantiere.programmazione[0]
    );
    adapterCancel.mockClear();
    await service.cancelNotificheGiornata("cantiere-123", "g1");
    expect(adapterCancel).toHaveBeenCalledWith(piani[0].id);
  });

  it("campiNotificaGiornataCambiati rileva modifica data/ora/stato", () => {
    const prev = { data: "02/09/2026", oraInizio: "08:00", stato: "programmata" };
    const next = { data: "03/09/2026", oraInizio: "08:00", stato: "programmata" };
    expect(campiNotificaGiornataCambiati(prev, next)).toBe(true);
  });

  it("risolviStartAtGiornata usa data e oraInizio", () => {
    const ts = risolviStartAtGiornata({ data: "02/09/2026", oraInizio: "08:00" });
    expect(new Date(ts).getHours()).toBe(8);
  });

  it("completamento g1 → cancel solo g1, g2 e g3 restano", async () => {
    const cantiere = cantiereMulti();
    await service.resyncNotificheCantiere(cantiere);

    const refG2 = riferimentoNotificaGiornata("cantiere-123", "g2");
    const refG3 = riferimentoNotificaGiornata("cantiere-123", "g3");
    expect(service.listPianificate(refG2)).toHaveLength(1);
    expect(service.listPianificate(refG3)).toHaveLength(1);

    adapterCancel.mockClear();
    await service.cancelNotificheGiornata("cantiere-123", "g1");

    expect(service.listPianificate(refG2)).toHaveLength(1);
    expect(service.listPianificate(refG3)).toHaveLength(1);
    expect(
      riferimentoNotificaGiornata("cantiere-123", "g1")
    ).toBeTruthy();
    const idsCancel = adapterCancel.mock.calls.map((c) => c[0]);
    expect(idsCancel.every((id) => id.includes(":g1"))).toBe(true);
    expect(idsCancel.some((id) => id.includes(":g2"))).toBe(false);
    expect(idsCancel.some((id) => id.includes(":g3"))).toBe(false);
  });

  it("cancelNotificheCantiereCompleto non cancella attività", async () => {
    const cantiere = cantiereMulti();
    await service.resyncNotificheCantiere(cantiere);
    await service.resyncNotificheAttivita({
      id: "att-99",
      titolo: "Sopralluogo",
      data: "10/09/2026",
      ora: "09:00",
    });

    adapterCancel.mockClear();
    await service.cancelNotificheCantiereCompleto(cantiere);

    const idsCancel = adapterCancel.mock.calls.map((c) => c[0]);
    const attivitaIds = elencaIdNotificheAttivita("att-99");
    expect(idsCancel.some((id) => attivitaIds.includes(id))).toBe(false);
    const attivitaAttive = service.pianificate.filter(
      (p) => p.attivitaId === "att-99" && p.stato === "pianificata"
    );
    expect(attivitaAttive.length).toBeGreaterThan(0);
  });
});
