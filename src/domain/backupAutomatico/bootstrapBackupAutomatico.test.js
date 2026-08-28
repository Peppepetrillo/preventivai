import { beforeEach, describe, expect, it, vi } from "vitest";

const eseguiBackupAutomaticoSeScaduto = vi.fn().mockResolvedValue({ eseguito: false });

vi.mock("./backupAutomaticoService", () => ({
  eseguiBackupAutomaticoSeScaduto: (...args) => eseguiBackupAutomaticoSeScaduto(...args),
}));

const appStateHandlers = [];
const addListener = vi.fn((event, handler) => {
  if (event === "appStateChange") appStateHandlers.push(handler);
  return Promise.resolve({ remove: vi.fn() });
});

vi.mock("@capacitor/app", () => ({
  App: { addListener },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

describe("bootstrapBackupAutomatico UX-7.2", () => {
  beforeEach(() => {
    eseguiBackupAutomaticoSeScaduto.mockClear();
    addListener.mockClear();
    appStateHandlers.length = 0;
    vi.resetModules();
  });

  it("avvia controllo all'avvio", async () => {
    const { avviaControlloBackupAutomatico } = await import("./bootstrapBackupAutomatico");
    await avviaControlloBackupAutomatico();
    expect(eseguiBackupAutomaticoSeScaduto).toHaveBeenCalledTimes(1);
  });

  it("PWA/desktop: resume via visibilitychange", async () => {
    const { registraListenerBackupAutomatico } = await import("./bootstrapBackupAutomatico");
    registraListenerBackupAutomatico();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(eseguiBackupAutomaticoSeScaduto).toHaveBeenCalled();
  });

  it("Capacitor: registra appStateChange e resume quando attiva", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    const { registraListenerBackupAutomatico } = await import("./bootstrapBackupAutomatico");
    registraListenerBackupAutomatico();

    expect(addListener).toHaveBeenCalledWith("appStateChange", expect.any(Function));

    appStateHandlers[0]?.({ isActive: true });
    expect(eseguiBackupAutomaticoSeScaduto).toHaveBeenCalled();
  });

  it("Capacitor: non esegue backup quando app va in background", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    const { registraListenerBackupAutomatico } = await import("./bootstrapBackupAutomatico");
    registraListenerBackupAutomatico();

    eseguiBackupAutomaticoSeScaduto.mockClear();
    appStateHandlers[0]?.({ isActive: false });
    expect(eseguiBackupAutomaticoSeScaduto).not.toHaveBeenCalled();
  });
});
