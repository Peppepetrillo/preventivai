import { beforeEach, describe, expect, it, vi } from "vitest";

const isNativePlatform = vi.fn(() => true);
const checkPermissions = vi.fn();
const requestPermissions = vi.fn();
const addListener = vi.fn();
const appAddListener = vi.fn();

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => "ios",
  },
}));

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (...args) => appAddListener(...args),
  },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: (...args) => checkPermissions(...args),
    requestPermissions: (...args) => requestPermissions(...args),
    addListener: (...args) => addListener(...args),
  },
}));

import {
  inizializzaNotifiche,
  leggiUltimoPermessoResume,
  navigaDaNotifica,
  resetInizializzazioneNotifiche,
  verificaPermessoAlResume,
} from "./notificationBootstrap";

describe("notificationBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetInizializzazioneNotifiche();
    isNativePlatform.mockReturnValue(true);
    checkPermissions.mockResolvedValue({ display: "granted" });
    requestPermissions.mockResolvedValue({ display: "granted" });
    addListener.mockResolvedValue({ remove: vi.fn() });
    appAddListener.mockResolvedValue({ remove: vi.fn() });
    window.location.hash = "";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  it("richiede permesso e registra listener al bootstrap", async () => {
    const esito = await inizializzaNotifiche();

    expect(esito).toEqual({ disponibile: true, granted: true });
    expect(checkPermissions).toHaveBeenCalled();
    expect(addListener).toHaveBeenCalledWith(
      "localNotificationActionPerformed",
      expect.any(Function)
    );
  });

  it("bootstrap idempotente — seconda chiamata non ripete listener", async () => {
    await inizializzaNotifiche();
    const callsAfterFirst = addListener.mock.calls.length;
    await inizializzaNotifiche();

    expect(addListener.mock.calls.length).toBe(callsAfterFirst);
  });

  it("registra listener resume una sola volta", async () => {
    await inizializzaNotifiche();
    const appCallsFirst = appAddListener.mock.calls.length;
    await inizializzaNotifiche();

    expect(appAddListener.mock.calls.length).toBe(appCallsFirst);
  });

  it("naviga al cantiere su tap con lavoroId (legacy senza giornataId)", () => {
    navigaDaNotifica({ lavoroId: "42" });
    expect(window.location.hash).toBe("#/cantiere/42");
  });

  it("naviga al cantiere con giornata evidenziata (lavoroId + giornataId)", () => {
    navigaDaNotifica({ lavoroId: "c-123", giornataId: "g1" });
    expect(window.location.hash).toBe(
      "#/cantiere/c-123?sezione=sezione-programmazione&giornataId=g1"
    );
  });

  it("giornataId vuoto → navigazione cantiere standard", () => {
    navigaDaNotifica({ lavoroId: "c-123", giornataId: "   " });
    expect(window.location.hash).toBe("#/cantiere/c-123");
  });

  it("naviga all'agenda per promemoria attività", () => {
    navigaDaNotifica({ attivitaId: "a1", type: "reminder-attivita" });
    expect(window.location.hash).toBe("#/agenda");
  });

  it("naviga alle impostazioni per backup automatico", () => {
    navigaDaNotifica({ tipo: "backup-automatico" });
    expect(window.location.hash).toBe("#/impostazioni");
  });

  it("payload incompleto o malformato non crasha", () => {
    expect(() => navigaDaNotifica(null)).not.toThrow();
    expect(() => navigaDaNotifica(undefined)).not.toThrow();
    expect(window.location.hash).toBe("");
  });

  it("listener tap esegue navigazione con giornataId", async () => {
    await inizializzaNotifiche();
    const handler = addListener.mock.calls.find(
      ([evento]) => evento === "localNotificationActionPerformed"
    )?.[1];

    expect(typeof handler).toBe("function");
    handler({
      notification: { extra: { lavoroId: "99", giornataId: "g2" } },
    });
    expect(window.location.hash).toBe(
      "#/cantiere/99?sezione=sezione-programmazione&giornataId=g2"
    );
  });

  it("tipo sconosciuto senza ID non crasha e non naviga", () => {
    navigaDaNotifica({ type: "tipo-sconosciuto" });
    expect(window.location.hash).toBe("");
  });

  it("type reminder generico senza ID naviga all'agenda", () => {
    navigaDaNotifica({ type: "reminder-generico" });
    expect(window.location.hash).toBe("#/agenda");
  });

  it("payload parziale con solo lavoroId vuoto non naviga", () => {
    navigaDaNotifica({ lavoroId: "  ", attivitaId: "" });
    expect(window.location.hash).toBe("");
  });

  it("permesso negato al bootstrap non crasha", async () => {
    checkPermissions.mockResolvedValue({ display: "denied" });
    requestPermissions.mockResolvedValue({ display: "denied" });
    const esito = await inizializzaNotifiche();
    expect(esito.granted).toBe(false);
    expect(esito.disponibile).toBe(true);
  });

  it("resume con permesso granted — solo check, nessuna richiesta", async () => {
    await inizializzaNotifiche();
    requestPermissions.mockClear();
    checkPermissions.mockResolvedValue({ display: "granted" });

    const esito = await verificaPermessoAlResume();

    expect(esito?.granted).toBe(true);
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(leggiUltimoPermessoResume()).toBe("granted");
  });

  it("resume con permesso denied — nessun popup", async () => {
    await inizializzaNotifiche();
    requestPermissions.mockClear();
    checkPermissions.mockResolvedValue({ display: "denied" });

    const esito = await verificaPermessoAlResume();

    expect(esito?.granted).toBe(false);
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(leggiUltimoPermessoResume()).toBe("denied");
  });

  it("errore API permessi al resume → no crash", async () => {
    await inizializzaNotifiche();
    checkPermissions.mockRejectedValue(new Error("permesso non disponibile"));

    await expect(verificaPermessoAlResume()).resolves.toEqual({
      granted: false,
      display: "denied",
      disponibile: true,
    });
  });

  it("appStateChange isActive → verifica permesso", async () => {
    await inizializzaNotifiche();
    const handler = appAddListener.mock.calls.find(
      ([evento]) => evento === "appStateChange"
    )?.[1];
    checkPermissions.mockClear();

    expect(typeof handler).toBe("function");
    await handler({ isActive: true });

    expect(checkPermissions).toHaveBeenCalled();
  });

  it("appStateChange isActive false → nessun check", async () => {
    await inizializzaNotifiche();
    const handler = appAddListener.mock.calls.find(
      ([evento]) => evento === "appStateChange"
    )?.[1];
    checkPermissions.mockClear();

    await handler({ isActive: false });

    expect(checkPermissions).not.toHaveBeenCalled();
  });
});
