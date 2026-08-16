import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLOUD_SYNC_STORAGE_KEYS,
  STORAGE_KEYS,
} from "../app/storageKeys";
import { leggiStorage } from "../utils/storage";

function preparaSupabaseMock({ recordCloud = [] } = {}) {
  const upsert = vi.fn(() => ({
    select: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          record_key: STORAGE_KEYS.clienti,
          updated_at: "2026-08-17T12:00:00.000Z",
        },
        error: null,
      }),
    })),
  }));

  const selectEq = vi.fn().mockResolvedValue({
    data: recordCloud,
    error: null,
  });

  const from = vi.fn(() => ({
    upsert,
    select: vi.fn(() => ({ eq: selectEq })),
  }));

  vi.doMock("../lib/supabaseClient", () => ({
    supabaseConfigurato: true,
    supabase: {
      from,
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ error: null }),
          remove: vi.fn().mockResolvedValue({ error: null }),
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://signed.example/x" },
            error: null,
          }),
        })),
      },
      channel: vi.fn(() => ({
        on: vi.fn(function on() {
          return this;
        }),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    },
  }));

  return { upsert, selectEq };
}

async function importaCloudSync() {
  return import("./cloudSyncService");
}

describe("affidabilità offline → riapertura → sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("cliente e preventivo offline restano in coda dopo riapertura simulata", async () => {
    preparaSupabaseMock();
    const prima = await importaCloudSync();

    const clienti = [{ id: "c1", nome: "Rossi" }];
    const preventivi = [{ id: "p1", cliente: "Rossi", stato: "Bozza" }];

    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify(clienti));
    localStorage.setItem(STORAGE_KEYS.preventivi, JSON.stringify(preventivi));
    prima.salvaDatoCloud(STORAGE_KEYS.clienti, clienti);
    prima.salvaDatoCloud(STORAGE_KEYS.preventivi, preventivi);

    expect(prima.haModificheOfflinePendenti(STORAGE_KEYS.clienti)).toBe(true);
    expect(prima.haModificheOfflinePendenti(STORAGE_KEYS.preventivi)).toBe(true);

    const codaDisco = leggiStorage(CLOUD_SYNC_STORAGE_KEYS.queue, []);
    expect(codaDisco.some((e) => e[0] === STORAGE_KEYS.clienti)).toBe(true);
    expect(codaDisco.some((e) => e[0] === STORAGE_KEYS.preventivi)).toBe(true);

    // Riapertura app: modulo reinizializzato idrata la coda da localStorage
    vi.resetModules();
    preparaSupabaseMock();
    const dopo = await importaCloudSync();
    expect(dopo.haModificheOfflinePendenti(STORAGE_KEYS.clienti)).toBe(true);
    expect(dopo.haModificheOfflinePendenti(STORAGE_KEYS.preventivi)).toBe(true);
    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toEqual(clienti);
    expect(leggiStorage(STORAGE_KEYS.preventivi, [])).toEqual(preventivi);

    // Boot Capacitor: Preferences ripristina LS dopo il load del modulo
    localStorage.setItem(
      CLOUD_SYNC_STORAGE_KEYS.queue,
      JSON.stringify([
        [STORAGE_KEYS.cantieri, [{ id: "cant-boot", stato: "In corso" }]],
      ])
    );
    dopo.ricaricaCodeCloudDaDisco();
    expect(dopo.haModificheOfflinePendenti(STORAGE_KEYS.cantieri)).toBe(true);
    expect(dopo.haModificheOfflinePendenti(STORAGE_KEYS.clienti)).toBe(false);
  });

  it("coda offline blocca overwrite da cloud più vecchio su sync", async () => {
    const mock = preparaSupabaseMock({
      recordCloud: [
        {
          record_key: STORAGE_KEYS.clienti,
          payload: [{ id: "old", nome: "CloudVecchio" }],
          updated_at: "2020-01-01T00:00:00.000Z",
        },
      ],
    });
    const servizio = await importaCloudSync();

    const locali = [{ id: "new", nome: "LocaleNuovo" }];
    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify(locali));
    servizio.salvaDatoCloud(STORAGE_KEYS.clienti, locali);
    servizio.impostaSessioneCloud({ user: { id: "user-1" } });

    await servizio.sincronizzaDaCloud();

    await vi.waitFor(() => {
      expect(mock.upsert).toHaveBeenCalled();
    });

    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toEqual(locali);
  });

  it("cantiere completato offline registra esperienza e la accoda senza duplicati", async () => {
    preparaSupabaseMock();
    const sync = await importaCloudSync();
    const { registraEsperienzaCompletamento, recuperaEsperienze } = await import(
      "./experienceService"
    );

    const cantiere = {
      id: "cant-1",
      cliente: "Bianchi",
      stato: "Completato",
      checklist: [{ id: "1", testo: "Quadro", completata: true }],
      materiali: [{ id: 1, nome: "Cavo", quantita: 10, unita: "m" }],
      dataCreazione: "10/08/2026",
      aggiornatoIl: "17/08/2026",
    };

    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([cantiere]));
    sync.salvaDatoCloud(STORAGE_KEYS.cantieri, [cantiere]);

    registraEsperienzaCompletamento(cantiere);
    registraEsperienzaCompletamento(cantiere);

    const esperienze = recuperaEsperienze();
    expect(esperienze.filter((e) => e.cantiereId === "cant-1")).toHaveLength(1);
    expect(sync.haModificheOfflinePendenti(STORAGE_KEYS.esperienze)).toBe(true);
    expect(sync.haModificheOfflinePendenti(STORAGE_KEYS.cantieri)).toBe(true);

    vi.resetModules();
    preparaSupabaseMock();
    const dopo = await importaCloudSync();
    expect(dopo.haModificheOfflinePendenti(STORAGE_KEYS.esperienze)).toBe(true);
    expect(
      leggiStorage(STORAGE_KEYS.esperienze, []).filter(
        (e) => e.cantiereId === "cant-1"
      )
    ).toHaveLength(1);
  });

  it("salvaDatoCloudImmediato senza sessione riaccoda e bumpa revisione", async () => {
    preparaSupabaseMock();
    const servizio = await importaCloudSync();

    await servizio.salvaDatoCloudImmediato(STORAGE_KEYS.esperienze, [
      { id: "e1", cantiereId: "c1" },
    ]);

    expect(servizio.haModificheOfflinePendenti(STORAGE_KEYS.esperienze)).toBe(
      true
    );
    const revisioni = leggiStorage(CLOUD_SYNC_STORAGE_KEYS.revisions, {});
    expect(revisioni[STORAGE_KEYS.esperienze]).toBeTruthy();
  });

  it("sync successivo non crea duplicati clienti", async () => {
    const mock = preparaSupabaseMock();
    const servizio = await importaCloudSync();
    const clienti = [{ id: "c1", nome: "Unico" }];

    localStorage.setItem(STORAGE_KEYS.clienti, JSON.stringify(clienti));
    servizio.salvaDatoCloud(STORAGE_KEYS.clienti, clienti);
    servizio.impostaSessioneCloud({ user: { id: "user-1" } });
    await servizio.sincronizzaDaCloud();

    await vi.waitFor(() => expect(mock.upsert).toHaveBeenCalled());

    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toEqual(clienti);
    expect(leggiStorage(STORAGE_KEYS.clienti, [])).toHaveLength(1);
  });
});
