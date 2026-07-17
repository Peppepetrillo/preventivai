import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../app/storageKeys";

function preparaSupabaseMock() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const createSignedUrl = vi.fn().mockResolvedValue({
    data: { signedUrl: "https://signed.example/foto.jpg" },
    error: null,
  });
  const upload = vi.fn().mockResolvedValue({ error: null });
  const select = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
  }));
  const from = vi.fn(() => ({
    upsert,
    select,
  }));

  vi.doMock("../lib/supabaseClient", () => ({
    supabaseConfigurato: true,
    supabase: {
      from,
      storage: {
        from: vi.fn(() => ({
          upload,
          remove,
          createSignedUrl,
        })),
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    },
  }));

  return {
    upsert,
    remove,
    createSignedUrl,
    upload,
  };
}

async function importaCloudSync() {
  return import("./cloudSyncService");
}

describe("cloudSyncService", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("accoda e sincronizza un salvataggio cloud quando esiste una sessione", async () => {
    const supabaseMock = preparaSupabaseMock();
    const servizio = await importaCloudSync();

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    servizio.salvaDatoCloud(STORAGE_KEYS.clienti, [{ id: 1, nome: "Mario" }]);

    await vi.waitFor(() => {
      expect(supabaseMock.upsert).toHaveBeenCalledWith(
        {
          user_id: "user-1",
          record_key: STORAGE_KEYS.clienti,
          payload: [{ id: 1, nome: "Mario" }],
        },
        {
          onConflict: "user_id,record_key",
        }
      );
    });
  });

  it("genera URL firmati per foto cantiere private", async () => {
    const supabaseMock = preparaSupabaseMock();
    const servizio = await importaCloudSync();

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });

    await expect(servizio.creaUrlFirmatoFotoCantiere("user-1/c1/f1.jpeg"))
      .resolves.toBe("https://signed.example/foto.jpg");

    expect(supabaseMock.createSignedUrl).toHaveBeenCalledWith(
      "user-1/c1/f1.jpeg",
      60
    );
  });

  it("accoda ed esegue eliminazioni media pendenti", async () => {
    const supabaseMock = preparaSupabaseMock();
    const servizio = await importaCloudSync();

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    servizio.eliminaFotoCantiereStorage("user-1/c1/f1.jpeg");

    await vi.waitFor(() => {
      expect(supabaseMock.remove).toHaveBeenCalledWith(["user-1/c1/f1.jpeg"]);
    });
  });
});
