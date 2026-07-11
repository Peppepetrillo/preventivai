import { APP_EVENTS, notificaEventoApp } from "../app/events";
import { APP_DATA_KEYS, STORAGE_KEYS } from "../app/storageKeys";
import { supabase, supabaseConfigurato } from "../lib/supabaseClient";
import { leggiStorage, salvaStorage } from "../utils/storage";

const TABELLA_RECORD = "app_records";
const STORAGE_SYNC = "preventivai-cloud-sync";

let sessioneCorrente = null;
let sincronizzazioneAttiva = false;
let canaleRealtime = null;
const codaSalvataggi = new Map();

function haValoreLocale(valore, fallback) {
  if (Array.isArray(fallback)) return Array.isArray(valore) && valore.length > 0;
  if (fallback && typeof fallback === "object") {
    return valore && typeof valore === "object" && Object.keys(valore).length > 0;
  }
  return valore !== undefined && valore !== null && valore !== fallback;
}

function leggiMetaSync() {
  return leggiStorage(STORAGE_SYNC, {});
}

function salvaMetaSync(meta) {
  return salvaStorage(STORAGE_SYNC, meta);
}

function notificaDatiAggiornati() {
  notificaEventoApp(APP_EVENTS.preventiviAggiornati);
  notificaEventoApp(APP_EVENTS.cloudSyncAggiornata);
}

function applicaRecordLocale(record) {
  if (!record?.record_key) return;
  const fallback = APP_DATA_KEYS[record.record_key];

  if (fallback === undefined && !(record.record_key in APP_DATA_KEYS)) return;

  salvaStorage(record.record_key, record.payload ?? fallback);
}

export function cloudDisponibile() {
  return supabaseConfigurato && Boolean(supabase);
}

export function impostaSessioneCloud(sessione) {
  sessioneCorrente = sessione;
}

export function utenteCloudCorrente() {
  return sessioneCorrente?.user || null;
}

async function caricaRecordCloud() {
  if (!cloudDisponibile() || !sessioneCorrente?.user) return [];

  const { data, error } = await supabase
    .from(TABELLA_RECORD)
    .select("record_key,payload,updated_at")
    .eq("user_id", sessioneCorrente.user.id);

  if (error) throw error;
  return data || [];
}

async function salvaRecordCloud(chiave, valore) {
  if (!cloudDisponibile() || !sessioneCorrente?.user) return;

  const { error } = await supabase
    .from(TABELLA_RECORD)
    .upsert(
      {
        user_id: sessioneCorrente.user.id,
        record_key: chiave,
        payload: valore,
      },
      {
        onConflict: "user_id,record_key",
      }
    );

  if (error) throw error;
}

async function inviaCodaSalvataggi() {
  if (!cloudDisponibile() || !sessioneCorrente?.user || codaSalvataggi.size === 0) {
    return;
  }

  const salvataggi = Array.from(codaSalvataggi.entries());
  codaSalvataggi.clear();

  await Promise.all(
    salvataggi.map(([chiave, valore]) => salvaRecordCloud(chiave, valore))
  );
}

export function salvaDatoCloud(chiave, valore) {
  if (!APP_DATA_KEYS[chiave] && !(chiave in APP_DATA_KEYS)) return;

  codaSalvataggi.set(chiave, valore);

  if (!sessioneCorrente?.user) return;

  inviaCodaSalvataggi().catch((errore) => {
    console.error("Errore sincronizzazione cloud:", errore);
  });
}

export async function salvaDatoCloudImmediato(chiave, valore) {
  if (!APP_DATA_KEYS[chiave] && !(chiave in APP_DATA_KEYS)) return;

  codaSalvataggi.delete(chiave);

  if (!sessioneCorrente?.user) return;

  await salvaRecordCloud(chiave, valore);
}

export function avviaRealtimeCloud() {
  if (!cloudDisponibile() || !sessioneCorrente?.user || canaleRealtime) return;

  const userId = sessioneCorrente.user.id;

  canaleRealtime = supabase
    .channel(`app-records-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABELLA_RECORD,
        filter: `user_id=eq.${userId}`,
      },
      (evento) => {
        if (evento.eventType === "DELETE") {
          const chiave = evento.old?.record_key;
          if (chiave in APP_DATA_KEYS) {
            salvaStorage(chiave, APP_DATA_KEYS[chiave]);
          }
        } else {
          applicaRecordLocale(evento.new);
        }

        notificaDatiAggiornati();
      }
    )
    .subscribe();
}

export function fermaRealtimeCloud() {
  if (!canaleRealtime || !supabase) return;

  supabase.removeChannel(canaleRealtime);
  canaleRealtime = null;
}

export async function sincronizzaDaCloud() {
  if (!cloudDisponibile() || !sessioneCorrente?.user || sincronizzazioneAttiva) {
    return;
  }

  sincronizzazioneAttiva = true;

  try {
    const recordCloud = await caricaRecordCloud();
    const recordPerChiave = new Map(
      recordCloud.map((record) => [record.record_key, record.payload])
    );
    const meta = leggiMetaSync();
    const utenteId = sessioneCorrente.user.id;
    const primaSincronizzazioneUtente = meta.userId !== utenteId;

    for (const [chiave, fallback] of Object.entries(APP_DATA_KEYS)) {
      const valoreCloud = recordPerChiave.get(chiave);
      const valoreLocale = leggiStorage(chiave, fallback);

      if (valoreCloud !== undefined) {
        await salvaStorage(chiave, valoreCloud);
        continue;
      }

      if (primaSincronizzazioneUtente && haValoreLocale(valoreLocale, fallback)) {
        await salvaRecordCloud(chiave, valoreLocale);
        continue;
      }

      await salvaRecordCloud(chiave, fallback);
      await salvaStorage(chiave, fallback);
    }

    await inviaCodaSalvataggi();
    await salvaMetaSync({
      userId: utenteId,
      syncedAt: new Date().toISOString(),
    });
    notificaDatiAggiornati();
  } finally {
    sincronizzazioneAttiva = false;
  }
}

export function pulisciSessioneCloudLocale() {
  fermaRealtimeCloud();
  sessioneCorrente = null;
  codaSalvataggi.clear();
  sessionStorage.removeItem("preventivai-sbloccata");
  for (const [chiave, fallback] of Object.entries(APP_DATA_KEYS)) {
    salvaStorage(chiave, fallback);
  }
  salvaStorage(STORAGE_KEYS.pinAccesso, "");
  salvaMetaSync({});
  notificaDatiAggiornati();
}
