import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../app/storageKeys";
import { leggiStorage } from "../utils/storage";

function preparaSupabaseMock({ recordCloud = [] } = {}) {
  const upsert = vi.fn(() => ({
    select: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          record_key: STORAGE_KEYS.clienti,
          updated_at: "2026-07-22T15:00:00.000Z",
        },
        error: null,
      }),
    })),
  }));

  const remove = vi.fn().mockResolvedValue({ error: null });
  const createSignedUrl = vi.fn().mockResolvedValue({
    data: { signedUrl: "https://signed.example/foto.jpg" },
    error: null,
  });
  const upload = vi.fn().mockResolvedValue({ error: null });

  const selectEq = vi.fn().mockResolvedValue({
    data: recordCloud,
    error: null,
  });
  const select = vi.fn(() => ({
    eq: selectEq,
  }));

  let realtimeHandler = null;
  const channelApi = {
    on: vi.fn((...args) => {
      const handler = args[args.length - 1];
      if (typeof handler === "function") {
        realtimeHandler = handler;
      }
      return channelApi;
    }),
    subscribe: vi.fn(),
  };

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
      channel: vi.fn(() => channelApi),
      removeChannel: vi.fn(),
    },
  }));

  return {
    upsert,
    remove,
    createSignedUrl,
    upload,
    getRealtimeHandler: () => realtimeHandler,
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
      expect(supabaseMock.upsert).toHaveBeenCalled();
    });

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

  it("genera URL firmati per foto cantiere private", async () => {
    const supabaseMock = preparaSupabaseMock();
    const servizio = await importaCloudSync();

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });

    await expect(
      servizio.creaUrlFirmatoFotoCantiere("user-1/c1/f1.jpeg")
    ).resolves.toBe("https://signed.example/foto.jpg");

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

  it("il realtime non sovrascrive una chiave presente in coda offline", async () => {
    const supabaseMock = preparaSupabaseMock();
    const servizio = await importaCloudSync();

    servizio.salvaDatoCloud(STORAGE_KEYS.clienti, [
      { id: 1, nome: "Locale pendente" },
    ]);
    localStorage.setItem(
      STORAGE_KEYS.clienti,
      JSON.stringify([{ id: 1, nome: "Locale pendente" }])
    );

    expect(servizio.haModificheOfflinePendenti(STORAGE_KEYS.clienti)).toBe(true);

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    servizio.avviaRealtimeCloud();

    const handler = supabaseMock.getRealtimeHandler();
    expect(handler).toBeTypeOf("function");

    handler({
      eventType: "UPDATE",
      new: {
        record_key: STORAGE_KEYS.clienti,
        payload: [{ id: 9, nome: "Cloud remoto" }],
        updated_at: "2099-01-01T00:00:00.000Z",
      },
    });

    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toEqual([
      { id: 1, nome: "Locale pendente" },
    ]);
  });

  it("il realtime applica il cloud se la chiave non è in coda e updated_at è più recente", async () => {
    const supabaseMock = preparaSupabaseMock();
    const servizio = await importaCloudSync();

    localStorage.setItem(
      STORAGE_KEYS.clienti,
      JSON.stringify([{ id: 1, nome: "Vecchio" }])
    );
    localStorage.setItem(
      "preventivai-cloud-local-revisions",
      JSON.stringify({
        [STORAGE_KEYS.clienti]: "2026-01-01T00:00:00.000Z",
      })
    );

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    servizio.avviaRealtimeCloud();

    supabaseMock.getRealtimeHandler()({
      eventType: "UPDATE",
      new: {
        record_key: STORAGE_KEYS.clienti,
        payload: [{ id: 2, nome: "Nuovo cloud" }],
        updated_at: "2026-07-22T18:00:00.000Z",
      },
    });

    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toEqual([
      { id: 2, nome: "Nuovo cloud" },
    ]);
  });

  it("sincronizzaDaCloud non applica cloud più vecchio del locale e lo rimette in coda", async () => {
    const supabaseMock = preparaSupabaseMock({
      recordCloud: [
        {
          record_key: STORAGE_KEYS.clienti,
          payload: [{ id: 1, nome: "Cloud vecchio" }],
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    const servizio = await importaCloudSync();

    localStorage.setItem(
      STORAGE_KEYS.clienti,
      JSON.stringify([{ id: 1, nome: "Locale nuovo" }])
    );
    localStorage.setItem(
      "preventivai-cloud-local-revisions",
      JSON.stringify({
        [STORAGE_KEYS.clienti]: "2026-07-22T12:00:00.000Z",
      })
    );

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    await servizio.sincronizzaDaCloud();

    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toEqual([
      { id: 1, nome: "Locale nuovo" },
    ]);

    await vi.waitFor(() => {
      expect(supabaseMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: [{ id: 1, nome: "Locale nuovo" }],
        }),
        expect.anything()
      );
    });
  });

  it("drena la coda anche se arriva un secondo salvataggio durante il flush", async () => {
    let sbloccaPrimo;
    const barrieraPrimo = new Promise((resolve) => {
      sbloccaPrimo = resolve;
    });

    let passate = 0;
    const upsert = vi.fn(() => {
      passate += 1;
      const passata = passate;

      return {
        select: vi.fn(() => ({
          maybeSingle: vi.fn(async () => {
            if (passata === 1) {
              await barrieraPrimo;
            }
            return {
              data: {
                record_key: STORAGE_KEYS.clienti,
                updated_at: `2026-07-22T15:0${passata}:00.000Z`,
              },
              error: null,
            };
          }),
        })),
      };
    });

    const selectEq = vi.fn().mockResolvedValue({ data: [], error: null });
    vi.doMock("../lib/supabaseClient", () => ({
      supabaseConfigurato: true,
      supabase: {
        from: vi.fn(() => ({
          upsert,
          select: vi.fn(() => ({ eq: selectEq })),
        })),
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ error: null }),
            remove: vi.fn().mockResolvedValue({ error: null }),
            createSignedUrl: vi.fn().mockResolvedValue({
              data: { signedUrl: "" },
              error: null,
            }),
          })),
        },
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
      },
    }));

    const servizio = await importaCloudSync();
    servizio.impostaSessioneCloud({ user: { id: "user-1" } });

    servizio.salvaDatoCloud(STORAGE_KEYS.clienti, [{ id: 1, nome: "A" }]);

    await vi.waitFor(() => {
      expect(upsert).toHaveBeenCalled();
    });

    servizio.salvaDatoCloud(STORAGE_KEYS.clienti, [{ id: 1, nome: "B" }]);
    sbloccaPrimo();

    await vi.waitFor(() => {
      expect(servizio.haModificheOfflinePendenti(STORAGE_KEYS.clienti)).toBe(
        false
      );
    });

    const ultimiPayload = upsert.mock.calls.map((call) => call[0].payload);
    expect(ultimiPayload.some((p) => p?.[0]?.nome === "B")).toBe(true);
  });

  it("wipe-safe: chiave cloud assente non cancella dati locali (nuove chiavi)", async () => {
    const supabaseMock = preparaSupabaseMock({ recordCloud: [] });
    const servizio = await importaCloudSync();

    const esperienzeLocali = [{ id: "e1", tipoLavoro: "impianto" }];
    localStorage.setItem(
      STORAGE_KEYS.esperienze,
      JSON.stringify(esperienzeLocali)
    );
    // Utente già sincronizzato in passato: senza wipe-safe la nuova chiave verrebbe azzerata
    localStorage.setItem(
      "preventivai-cloud-sync",
      JSON.stringify({ userId: "user-1", syncedAt: "2026-07-01T00:00:00.000Z" })
    );

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    await servizio.sincronizzaDaCloud();

    expect(leggiStorage(STORAGE_KEYS.esperienze, [])).toEqual(esperienzeLocali);

    await vi.waitFor(() => {
      expect(supabaseMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          record_key: STORAGE_KEYS.esperienze,
          payload: esperienzeLocali,
        }),
        expect.anything()
      );
    });
  });

  it("accoda esperienze come chiave APP_DATA e non mette data: URL nei cantieri cloud", async () => {
    const supabaseMock = preparaSupabaseMock();
    const servizio = await importaCloudSync();

    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    servizio.salvaDatoCloud(STORAGE_KEYS.esperienze, [
      { id: "e-cloud", cliente: "Verdi" },
    ]);

    await vi.waitFor(() => {
      expect(supabaseMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          record_key: STORAGE_KEYS.esperienze,
        }),
        expect.anything()
      );
    });

    localStorage.setItem(
      STORAGE_KEYS.cantieri,
      JSON.stringify([
        {
          id: "c1",
          foto: [
            {
              id: "f1",
              src: "data:image/jpeg;base64,FULLSIZE",
              miniatura: "data:image/jpeg;base64,THUMB",
              daSincronizzare: true,
            },
          ],
        },
      ])
    );

    servizio.salvaDatoCloud(STORAGE_KEYS.cantieri, [
      {
        id: "c1",
        foto: [
          {
            id: "f1",
            src: "data:image/jpeg;base64,FULLSIZE",
            miniatura: "data:image/jpeg;base64,THUMB",
            daSincronizzare: true,
          },
        ],
      },
    ]);

    await vi.waitFor(() => {
      const callCantieri = supabaseMock.upsert.mock.calls.find(
        (call) => call[0]?.record_key === STORAGE_KEYS.cantieri
      );
      expect(callCantieri).toBeTruthy();
      expect(callCantieri[0].payload[0].foto[0].src).toBe("");
    });
  });

  it("logout pulisce anche le esperienze locali", async () => {
    preparaSupabaseMock();
    const servizio = await importaCloudSync();

    localStorage.setItem(
      STORAGE_KEYS.esperienze,
      JSON.stringify([{ id: "e1" }])
    );
    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    servizio.pulisciSessioneCloudLocale();

    expect(leggiStorage(STORAGE_KEYS.esperienze, [])).toEqual([]);
  });
});
