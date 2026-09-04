import { beforeEach, describe, expect, it, vi } from "vitest";

const isNativePlatform = vi.fn(() => false);

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

import { apriUrlEsterno, condividiBlob, esportaBlob, isPiattaformaNativa } from "./nativeExport";

describe("nativeExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(false);
  });

  it("isPiattaformaNativa rispecchia Capacitor", () => {
    isNativePlatform.mockReturnValue(true);
    expect(isPiattaformaNativa()).toBe(true);
  });

  it("su web scarica il blob via link download", async () => {
    const click = vi.fn();
    const remove = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      rel: "",
      click,
      remove,
    });
    vi.spyOn(document.body, "appendChild").mockImplementation(() => undefined);
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const esito = await esportaBlob(new Blob(["pdf"]), "test.pdf");

    expect(esito).toEqual({ success: true, metodo: "download" });
    expect(click).toHaveBeenCalled();
  });

  it("su native usa navigator.share con File", async () => {
    isNativePlatform.mockReturnValue(true);
    const share = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", {
      share,
      canShare: () => false,
    });

    const esito = await esportaBlob(new Blob(["pdf"], { type: "application/pdf" }), "p.pdf", {
      titolo: "Preventivo",
    });

    expect(esito.metodo).toBe("share");
    expect(share).toHaveBeenCalled();
    expect(share.mock.calls[0][0].files[0]).toBeInstanceOf(File);
    expect(share.mock.calls[0][0].files[0].name).toBe("p.pdf");
  });

  it("condividiBlob su native non usa fallback share_testo se canShare è false", async () => {
    isNativePlatform.mockReturnValue(true);
    const share = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", {
      share,
      canShare: () => false,
    });

    const esito = await condividiBlob(
      new Blob(["pdf"], { type: "application/pdf" }),
      "Report_Cantiere.pdf",
      { titolo: "Report cantiere" }
    );

    expect(esito).toEqual({ success: true, metodo: "share" });
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0][0].files).toHaveLength(1);
    expect(share.mock.calls[0][0].files[0].type).toBe("application/pdf");
    expect(share.mock.calls[0][0].title).toBe("Report cantiere");
    expect(share.mock.calls[0][0].text).toBeUndefined();
  });

  it("condividiBlob se annullato non è un errore applicativo", async () => {
    isNativePlatform.mockReturnValue(true);
    const abort = Object.assign(new Error("Abort"), { name: "AbortError" });
    vi.stubGlobal("navigator", {
      share: vi.fn(async () => {
        throw abort;
      }),
      canShare: () => true,
    });

    const esito = await condividiBlob(new Blob(["pdf"], { type: "application/pdf" }), "p.pdf");

    expect(esito).toEqual({
      success: false,
      error: "annullato",
      annullato: true,
    });
  });

  it("esportaBlob e condividiBlob restano distinti su web", async () => {
    isNativePlatform.mockReturnValue(false);
    const share = vi.fn(async () => undefined);
    const click = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      rel: "",
      click,
      remove: vi.fn(),
    });
    vi.spyOn(document.body, "appendChild").mockImplementation(() => undefined);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal("navigator", {
      share,
      canShare: () => false,
    });

    const exportEsito = await esportaBlob(new Blob(["pdf"]), "test.pdf");
    expect(exportEsito).toEqual({ success: true, metodo: "download" });
    expect(share).not.toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it("Capacitor native (iPhone o iPad) usa lo stesso percorso share — nessun ramo device", async () => {
    isNativePlatform.mockReturnValue(true);
    const share = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", {
      share,
      canShare: () => true,
    });

    const esito = await esportaBlob(
      new Blob(['{"app":"PreventivAI"}'], { type: "application/json" }),
      "preventivai-backup-test.json",
      { titolo: "Backup PreventivAI" }
    );

    expect(isPiattaformaNativa()).toBe(true);
    expect(esito).toEqual({ success: true, metodo: "share" });
    expect(share.mock.calls[0][0].files[0].type).toContain("json");
  });

  it("su web con canShare(files) usa Share Sheet (Safari/PWA)", async () => {
    isNativePlatform.mockReturnValue(false);
    const share = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", {
      share,
      canShare: (payload) => Array.isArray(payload?.files) && payload.files.length > 0,
    });

    const esito = await esportaBlob(
      new Blob(['{"ok":true}'], { type: "application/json" }),
      "preventivai-backup-2026-08-20.json",
      { titolo: "Backup PreventivAI" }
    );

    expect(esito).toEqual({ success: true, metodo: "share" });
    expect(share).toHaveBeenCalled();
    expect(share.mock.calls[0][0].files[0].name).toBe(
      "preventivai-backup-2026-08-20.json"
    );
  });

  it("su web se share annullato restituisce annullato", async () => {
    isNativePlatform.mockReturnValue(false);
    const abort = Object.assign(new Error("Abort"), { name: "AbortError" });
    vi.stubGlobal("navigator", {
      share: vi.fn(async () => {
        throw abort;
      }),
      canShare: () => true,
    });

    const esito = await esportaBlob(new Blob(["x"]), "b.json", {
      titolo: "Backup PreventivAI",
    });

    expect(esito).toEqual({ success: false, error: "annullato", annullato: true });
  });

  it("apriUrlEsterno su native usa location.href", () => {
    isNativePlatform.mockReturnValue(true);
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const location = { href: "" };
    vi.stubGlobal("location", location);

    apriUrlEsterno("https://wa.me/?text=ciao");

    expect(location.href).toBe("https://wa.me/?text=ciao");
    expect(open).not.toHaveBeenCalled();
  });
});
