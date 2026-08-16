import { beforeEach, describe, expect, it, vi } from "vitest";

const isNativePlatform = vi.fn(() => false);

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

import { apriUrlEsterno, esportaBlob, isPiattaformaNativa } from "./nativeExport";

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
      canShare: () => true,
    });

    const esito = await esportaBlob(new Blob(["pdf"], { type: "application/pdf" }), "p.pdf", {
      titolo: "Preventivo",
    });

    expect(esito.metodo).toBe("share");
    expect(share).toHaveBeenCalled();
    expect(share.mock.calls[0][0].files[0]).toBeInstanceOf(File);
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
