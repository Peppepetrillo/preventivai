import { APP_EVENTS, notificaEventoApp } from "../app/events";
import {
  APP_DATA_KEYS,
  CLOUD_SYNC_STORAGE_KEYS,
  STORAGE_KEYS,
} from "../app/storageKeys";
import { supabase, supabaseConfigurato } from "../lib/supabaseClient";
import { leggiStorage, salvaStorage } from "../utils/storage";
import { comprimiImmagine, generaMiniatura } from "../utils/immagini";
import {
  deveApplicareAggiornamentoCloud,
  deveRispingereLocaleVersoCloud,
} from "./cloudSyncIntegrity";
import {
  creaPathFotoCantiereImmutabile,
  preparaPayloadCloud,
} from "./cloudMediaPayload";

const TABELLA_RECORD = "app_records";
const STORAGE_SYNC = CLOUD_SYNC_STORAGE_KEYS.syncMeta;
const STORAGE_REVISIONI = CLOUD_SYNC_STORAGE_KEYS.revisions;
const BUCKET_FOTO_CANTIERI = "foto-cantieri";

let sessioneCorrente = null;
let sincronizzazioneAttiva = false;
let sincronizzazioneRichiesta = false;
let canaleRealtime = null;

const STORAGE_CODA = CLOUD_SYNC_STORAGE_KEYS.queue;
const STORAGE_CODA_ELIMINAZIONE_MEDIA = CLOUD_SYNC_STORAGE_KEYS.mediaDelete;

function leggiCodaPersistente() {
  const coda = leggiStorage(STORAGE_CODA, []);
  return Array.isArray(coda) ? coda : [];
}

function salvaCodaPersistente(codaArray) {
  void salvaStorage(STORAGE_CODA, Array.isArray(codaArray) ? codaArray : []);
}

const codaSalvataggi = new Map(leggiCodaPersistente());
const codaEliminazioneMedia = new Set(leggiCodaEliminazioneMedia());

function aggiungiACoda(chiave, valore) {
  if (valore === undefined) return;
  codaSalvataggi.set(chiave, valore);
  salvaCodaPersistente(Array.from(codaSalvataggi.entries()));
}

function rimuoviDaCoda(chiave) {
  codaSalvataggi.delete(chiave);
  salvaCodaPersistente(Array.from(codaSalvataggi.entries()));
}

function svuotaCoda() {
  codaSalvataggi.clear();
  salvaCodaPersistente([]);
}

function chiaveInCodaOffline(chiave) {
  return codaSalvataggi.has(chiave);
}

/**
 * Ricarica code in memoria dopo Preferences → localStorage (boot Capacitor).
 */
export function ricaricaCodeCloudDaDisco() {
  codaSalvataggi.clear();
  for (const entry of leggiCodaPersistente()) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const [chiave, valore] = entry;
    if (chiave == null || valore === undefined) continue;
    codaSalvataggi.set(chiave, valore);
  }

  codaEliminazioneMedia.clear();
  for (const path of leggiCodaEliminazioneMedia()) {
    if (path) codaEliminazioneMedia.add(path);
  }
}

function leggiRevisioniLocali() {
  return leggiStorage(STORAGE_REVISIONI, {});
}

function leggiRevisioneLocale(chiave) {
  return leggiRevisioniLocali()[chiave] || null;
}

function salvaRevisioneLocale(chiave, updatedAt) {
  if (!chiave) return;
  const iso = updatedAt || new Date().toISOString();
  const revisioni = {
    ...leggiRevisioniLocali(),
    [chiave]: iso,
  };
  salvaStorage(STORAGE_REVISIONI, revisioni);
}

function svuotaRevisioniLocali() {
  salvaStorage(STORAGE_REVISIONI, {});
}

function leggiCodaEliminazioneMedia() {
  const coda = leggiStorage(STORAGE_CODA_ELIMINAZIONE_MEDIA, []);
  return Array.isArray(coda) ? coda : [];
}

function salvaCodaEliminazioneMedia() {
  void salvaStorage(
    STORAGE_CODA_ELIMINAZIONE_MEDIA,
    Array.from(codaEliminazioneMedia)
  );
}

function accodaEliminazioneMedia(paths) {
  paths
    .filter(Boolean)
    .forEach((path) => codaEliminazioneMedia.add(path));
  salvaCodaEliminazioneMedia();
}

function svuotaCodaEliminazioneMedia() {
  codaEliminazioneMedia.clear();
  salvaCodaEliminazioneMedia();
}

function haValoreLocale(valore, fallback) {
  if (Array.isArray(fallback)) return Array.isArray(valore) && valore.length > 0;
  if (fallback && typeof fallback === "object") {
    return valore && typeof valore === "object" && Object.keys(valore).length > 0;
  }
  return valore !== undefined && valore !== null && valore !== fallback;
}

function salvaMetaSync(meta) {
  return salvaStorage(STORAGE_SYNC, meta);
}

function notificaDatiAggiornati() {
  notificaEventoApp(APP_EVENTS.preventiviAggiornati);
  notificaEventoApp(APP_EVENTS.cloudSyncAggiornata);
}

function applicaRecordLocale(record) {
  if (!record?.record_key) return false;
  const fallback = APP_DATA_KEYS[record.record_key];

  if (fallback === undefined && !(record.record_key in APP_DATA_KEYS)) {
    return false;
  }

  salvaStorage(record.record_key, record.payload ?? fallback);
  salvaRevisioneLocale(record.record_key, record.updated_at);
  return true;
}

/**
 * Applica un record remoto solo se non viola coda offline / updated_at.
 * @param {object} record
 * @returns {boolean} true se lo storage locale è stato aggiornato
 */
function provaAdApplicareRecordCloud(record) {
  if (!record?.record_key) return false;

  const chiave = record.record_key;
  const inCoda = chiaveInCodaOffline(chiave);

  if (
    !deveApplicareAggiornamentoCloud({
      chiaveInCoda: inCoda,
      updatedAtCloud: record.updated_at,
      updatedAtLocale: leggiRevisioneLocale(chiave),
    })
  ) {
    return false;
  }

  return applicaRecordLocale(record);
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
  if (!cloudDisponibile() || !sessioneCorrente?.user) return null;

  const payload = preparaPayloadCloud(chiave, valore);

  const { data, error } = await supabase
    .from(TABELLA_RECORD)
    .upsert(
      {
        user_id: sessioneCorrente.user.id,
        record_key: chiave,
        payload,
      },
      {
        onConflict: "user_id,record_key",
      }
    )
    .select("record_key,updated_at")
    .maybeSingle();

  if (error) throw error;
  return data;
}

function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

async function migraImmaginiEsistenti() {
  const cantieri = leggiStorage(STORAGE_KEYS.cantieri, []);
  let modificato = false;

  for (const cantiere of cantieri) {
    if (!cantiere.foto || cantiere.foto.length === 0) continue;

    for (const foto of cantiere.foto) {
      if (foto.src && foto.src.startsWith("data:") && !foto.miniatura) {
        try {
          const imgCompressa = await comprimiImmagine(foto.src, 1200, 0.7);
          const miniatura = await generaMiniatura(foto.src);

          foto.src = imgCompressa;
          foto.miniatura = miniatura;
          foto.daSincronizzare = true;
          modificato = true;
        } catch (e) {
          console.error("Errore migrazione retrocompatibile foto:", e);
        }
      }
    }
  }

  if (modificato) {
    salvaStorage(STORAGE_KEYS.cantieri, cantieri);
    salvaRevisioneLocale(STORAGE_KEYS.cantieri, new Date().toISOString());
    aggiungiACoda(STORAGE_KEYS.cantieri, cantieri);
  }
}

async function sincronizzaMediaCantieri() {
  if (!cloudDisponibile() || !sessioneCorrente?.user) return;

  const utenteId = sessioneCorrente.user.id;
  const cantieri = leggiStorage(STORAGE_KEYS.cantieri, []);
  let modificato = false;

  for (const cantiere of cantieri) {
    if (!cantiere.foto || cantiere.foto.length === 0) continue;

    for (const foto of cantiere.foto) {
      if (foto.daSincronizzare && foto.src && foto.src.startsWith("data:")) {
        try {
          const blob = dataURLtoBlob(foto.src);
          const estensione = blob.type.split("/")[1] || "jpeg";
          // Path immutabile + upsert:false: evita dipendere da policy UPDATE su Storage.
          const path = creaPathFotoCantiereImmutabile({
            utenteId,
            cantiereId: cantiere.id,
            fotoId: foto.id,
            estensione,
          });
          const pathPrecedente = foto.storagePath;

          const { error } = await supabase.storage
            .from(BUCKET_FOTO_CANTIERI)
            .upload(path, blob, {
              contentType: blob.type,
              upsert: false,
            });

          if (error) throw error;

          foto.storagePath = path;
          foto.src = foto.miniatura || "";
          foto.daSincronizzare = false;
          modificato = true;

          if (
            pathPrecedente &&
            pathPrecedente !== path &&
            typeof pathPrecedente === "string"
          ) {
            accodaEliminazioneMedia([pathPrecedente]);
          }
        } catch (errore) {
          console.error(`Errore caricamento storage foto ${foto.nome}:`, errore);
        }
      }
    }
  }

  if (modificato) {
    salvaStorage(STORAGE_KEYS.cantieri, cantieri);
    salvaRevisioneLocale(STORAGE_KEYS.cantieri, new Date().toISOString());
    aggiungiACoda(STORAGE_KEYS.cantieri, cantieri);
    notificaDatiAggiornati();
  }
}

async function inviaCodaEliminazioneMedia() {
  if (
    !cloudDisponibile() ||
    !sessioneCorrente?.user ||
    codaEliminazioneMedia.size === 0
  ) {
    return;
  }

  const paths = Array.from(codaEliminazioneMedia);
  const { error } = await supabase.storage
    .from(BUCKET_FOTO_CANTIERI)
    .remove(paths);

  if (error) throw error;

  paths.forEach((path) => codaEliminazioneMedia.delete(path));
  salvaCodaEliminazioneMedia();
}

let invioInCorso = false;
let drenaggioCodaRichiesto = false;

async function eseguiPassataCodaSalvataggi() {
  await inviaCodaEliminazioneMedia();
  await sincronizzaMediaCantieri();

  if (codaSalvataggi.size === 0) {
    return;
  }

  const salvataggi = Array.from(codaSalvataggi.entries());

  for (const [chiave, valore] of salvataggi) {
    try {
      // Per i cantieri rileggi lo storage dopo media sync e sanitizza:
      // la coda non deve mai portare data: URL in app_records.
      const daInviare =
        chiave === STORAGE_KEYS.cantieri
          ? preparaPayloadCloud(
              chiave,
              leggiStorage(STORAGE_KEYS.cantieri, APP_DATA_KEYS[STORAGE_KEYS.cantieri])
            )
          : preparaPayloadCloud(chiave, valore);

      const salvato = await salvaRecordCloud(chiave, daInviare);
      if (codaSalvataggi.get(chiave) === valore) {
        rimuoviDaCoda(chiave);
        salvaRevisioneLocale(
          chiave,
          salvato?.updated_at || new Date().toISOString()
        );
      }
    } catch (errore) {
      console.error(`Errore invio record per chiave ${chiave}:`, errore);
    }
  }
}

/**
 * Svuota la coda in modo affidabile: se arriva un nuovo salvataggio durante
 * un flush, ripete; errori su singole chiavi lasciano la voce in coda.
 */
async function inviaCodaSalvataggi() {
  if (!cloudDisponibile() || !sessioneCorrente?.user) {
    return;
  }

  if (invioInCorso) {
    drenaggioCodaRichiesto = true;
    return;
  }

  invioInCorso = true;

  try {
    do {
      drenaggioCodaRichiesto = false;
      await eseguiPassataCodaSalvataggi();
    } while (drenaggioCodaRichiesto);
  } finally {
    invioInCorso = false;

    if (drenaggioCodaRichiesto) {
      drenaggioCodaRichiesto = false;
      inviaCodaSalvataggi().catch((errore) => {
        console.error("Errore drenaggio coda cloud:", errore);
      });
    }
  }
}

export function salvaDatoCloud(chiave, valore) {
  if (!APP_DATA_KEYS[chiave] && !(chiave in APP_DATA_KEYS)) return;
  if (valore === undefined) return;

  salvaRevisioneLocale(chiave, new Date().toISOString());
  aggiungiACoda(chiave, preparaPayloadCloud(chiave, valore));

  if (!sessioneCorrente?.user) return;

  inviaCodaSalvataggi().catch((errore) => {
    console.error("Errore sincronizzazione cloud:", errore);
  });
}

export async function salvaDatoCloudImmediato(chiave, valore) {
  if (!APP_DATA_KEYS[chiave] && !(chiave in APP_DATA_KEYS)) return;
  if (valore === undefined) return;

  const payload = preparaPayloadCloud(chiave, valore);
  salvaRevisioneLocale(chiave, new Date().toISOString());

  // Offline / senza sessione: resta in coda (non perdere il push).
  if (!sessioneCorrente?.user) {
    aggiungiACoda(chiave, payload);
    return;
  }

  try {
    const salvato = await salvaRecordCloud(chiave, payload);
    if (!salvato) {
      aggiungiACoda(chiave, payload);
      return;
    }
    rimuoviDaCoda(chiave);
    salvaRevisioneLocale(chiave, salvato.updated_at || new Date().toISOString());
  } catch (errore) {
    console.error("Errore salvataggio cloud immediato:", errore);
    aggiungiACoda(chiave, payload);
  }
}

export function eliminaFotoCantiereStorage(storagePaths) {
  const paths = Array.isArray(storagePaths) ? storagePaths : [storagePaths];
  accodaEliminazioneMedia(paths);

  if (!sessioneCorrente?.user) return;

  inviaCodaEliminazioneMedia().catch((errore) => {
    console.error("Errore eliminazione foto da Supabase Storage:", errore);
  });
}

export async function creaUrlFirmatoFotoCantiere(storagePath) {
  if (!cloudDisponibile() || !sessioneCorrente?.user || !storagePath) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_FOTO_CANTIERI)
    .createSignedUrl(storagePath, 60);

  if (error) throw error;
  return data?.signedUrl || "";
}

function gestisciEventoRealtime(evento) {
  if (evento.eventType === "DELETE") {
    const chiave = evento.old?.record_key;
    if (!chiave || !(chiave in APP_DATA_KEYS)) return;

    // Modifica locale pendente: non cancellare lo storage locale.
    if (chiaveInCodaOffline(chiave)) {
      inviaCodaSalvataggi().catch((errore) => {
        console.error("Errore flush coda dopo DELETE realtime:", errore);
      });
      return;
    }

    salvaStorage(chiave, APP_DATA_KEYS[chiave]);
    salvaRevisioneLocale(chiave, new Date().toISOString());
    notificaDatiAggiornati();
    return;
  }

  const record = evento.new;
  const chiave = record?.record_key;

  if (chiave && chiaveInCodaOffline(chiave)) {
    // Coda offline vince: non applicare il cloud; prova a drenare.
    inviaCodaSalvataggi().catch((errore) => {
      console.error("Errore flush coda dopo evento realtime:", errore);
    });
    return;
  }

  const applicato = provaAdApplicareRecordCloud(record);
  if (applicato) {
    notificaDatiAggiornati();
  }
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
      gestisciEventoRealtime
    )
    .subscribe();
}

export function fermaRealtimeCloud() {
  if (!canaleRealtime || !supabase) return;

  supabase.removeChannel(canaleRealtime);
  canaleRealtime = null;
}

async function eseguiSincronizzazioneDaCloud() {
  await migraImmaginiEsistenti();

  const recordCloud = await caricaRecordCloud();
  const recordPerChiave = new Map(
    recordCloud.map((record) => [record.record_key, record])
  );
  const utenteId = sessioneCorrente.user.id;

  for (const [chiave, fallback] of Object.entries(APP_DATA_KEYS)) {
    if (chiaveInCodaOffline(chiave)) {
      continue;
    }

    const recordCloudChiave = recordPerChiave.get(chiave);
    const valoreLocale = leggiStorage(chiave, fallback);
    const updatedAtLocale = leggiRevisioneLocale(chiave);

    if (recordCloudChiave) {
      const applicabile = deveApplicareAggiornamentoCloud({
        chiaveInCoda: false,
        updatedAtCloud: recordCloudChiave.updated_at,
        updatedAtLocale,
      });

      if (applicabile) {
        await salvaStorage(chiave, recordCloudChiave.payload ?? fallback);
        salvaRevisioneLocale(chiave, recordCloudChiave.updated_at);
        continue;
      }

      if (
        deveRispingereLocaleVersoCloud({
          chiaveInCoda: false,
          updatedAtCloud: recordCloudChiave.updated_at,
          updatedAtLocale,
          haValoreLocale: haValoreLocale(valoreLocale, fallback),
        })
      ) {
        aggiungiACoda(chiave, preparaPayloadCloud(chiave, valoreLocale));
      }

      continue;
    }

    // RC-2A wipe-safe: chiave assente sul cloud → non cancellare mai il locale.
    // Nuove chiavi APP_DATA (es. esperienze) o record mancanti: push se c'è dato locale,
    // altrimenti seed cloud con fallback senza toccare lo storage.
    if (haValoreLocale(valoreLocale, fallback)) {
      aggiungiACoda(chiave, preparaPayloadCloud(chiave, valoreLocale));
      continue;
    }

    await salvaRecordCloud(chiave, fallback);
    salvaRevisioneLocale(chiave, new Date().toISOString());
  }

  await inviaCodaSalvataggi();
  await salvaMetaSync({
    userId: utenteId,
    syncedAt: new Date().toISOString(),
  });
  notificaDatiAggiornati();
}

export async function sincronizzaDaCloud() {
  if (!cloudDisponibile() || !sessioneCorrente?.user) {
    return;
  }

  if (sincronizzazioneAttiva) {
    sincronizzazioneRichiesta = true;
    return;
  }

  sincronizzazioneAttiva = true;

  try {
    do {
      sincronizzazioneRichiesta = false;
      await eseguiSincronizzazioneDaCloud();
    } while (sincronizzazioneRichiesta);
  } finally {
    sincronizzazioneAttiva = false;

    if (sincronizzazioneRichiesta) {
      sincronizzazioneRichiesta = false;
      sincronizzaDaCloud().catch((errore) => {
        console.error("Errore sincronizzazione cloud differita:", errore);
      });
    }
  }
}

export function pulisciSessioneCloudLocale() {
  fermaRealtimeCloud();
  sessioneCorrente = null;
  svuotaCoda();
  svuotaCodaEliminazioneMedia();
  svuotaRevisioniLocali();
  sessionStorage.removeItem("preventivai-sbloccata");
  for (const [chiave, fallback] of Object.entries(APP_DATA_KEYS)) {
    salvaStorage(chiave, fallback);
  }
  salvaStorage(STORAGE_KEYS.pinAccesso, "");
  salvaMetaSync({});
  notificaDatiAggiornati();
}

/** Esposto per test RC-1A: indica se una chiave ha modifiche offline pendenti. */
export function haModificheOfflinePendenti(chiave) {
  return chiaveInCodaOffline(chiave);
}
