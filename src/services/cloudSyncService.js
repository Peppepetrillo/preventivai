import { APP_EVENTS, notificaEventoApp } from "../app/events";
import { APP_DATA_KEYS, STORAGE_KEYS } from "../app/storageKeys";
import { supabase, supabaseConfigurato } from "../lib/supabaseClient";
import { leggiStorage, salvaStorage } from "../utils/storage";
import { comprimiImmagine, generaMiniatura } from "../utils/immagini";

const TABELLA_RECORD = "app_records";
const STORAGE_SYNC = "preventivai-cloud-sync";
const BUCKET_FOTO_CANTIERI = "foto-cantieri";

let sessioneCorrente = null;
let sincronizzazioneAttiva = false;
let canaleRealtime = null;

const STORAGE_CODA = "preventivai-cloud-sync-queue";
const STORAGE_CODA_ELIMINAZIONE_MEDIA = "preventivai-cloud-media-delete-queue";

function leggiCodaPersistente() {
  try {
    const dato = localStorage.getItem(STORAGE_CODA);
    return dato ? JSON.parse(dato) : [];
  } catch (e) {
    console.error("Errore lettura coda persistente:", e);
    return [];
  }
}

function salvaCodaPersistente(codaArray) {
  try {
    localStorage.setItem(STORAGE_CODA, JSON.stringify(codaArray));
  } catch (e) {
    console.error("Errore salvataggio coda persistente:", e);
  }
}

const codaSalvataggi = new Map(leggiCodaPersistente());
const codaEliminazioneMedia = new Set(leggiCodaEliminazioneMedia());

function aggiungiACoda(chiave, valore) {
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

function leggiCodaEliminazioneMedia() {
  try {
    const dato = localStorage.getItem(STORAGE_CODA_ELIMINAZIONE_MEDIA);
    return dato ? JSON.parse(dato) : [];
  } catch (errore) {
    console.error("Errore lettura coda eliminazione media:", errore);
    return [];
  }
}

function salvaCodaEliminazioneMedia() {
  try {
    localStorage.setItem(
      STORAGE_CODA_ELIMINAZIONE_MEDIA,
      JSON.stringify(Array.from(codaEliminazioneMedia))
    );
  } catch (errore) {
    console.error("Errore salvataggio coda eliminazione media:", errore);
  }
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
      // Se l'immagine è in Base64 ed è sprovvista di miniatura (vecchio formato), eseguiamo la migrazione
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
          const path = `${utenteId}/${cantiere.id}/${foto.id}.${estensione}`;

          // Carica su Supabase Storage
          const { error } = await supabase.storage
            .from(BUCKET_FOTO_CANTIERI)
            .upload(path, blob, {
              contentType: blob.type,
              upsert: true,
            });

          if (error) throw error;

          foto.storagePath = path;
          foto.src = foto.miniatura || "";
          foto.daSincronizzare = false;
          modificato = true;
        } catch (errore) {
          console.error(`Errore caricamento storage foto ${foto.nome}:`, errore);
        }
      }
    }
  }

  if (modificato) {
    salvaStorage(STORAGE_KEYS.cantieri, cantieri);
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

async function inviaCodaSalvataggi() {
  if (!cloudDisponibile() || !sessioneCorrente?.user || invioInCorso) {
    return;
  }

  invioInCorso = true;

  try {
    await inviaCodaEliminazioneMedia();

    // Prima carichiamo i file multimediali pendenti su Supabase Storage
    await sincronizzaMediaCantieri();

    if (codaSalvataggi.size === 0) {
      return;
    }

    const salvataggi = Array.from(codaSalvataggi.entries());

    for (const [chiave, valore] of salvataggi) {
      try {
        await salvaRecordCloud(chiave, valore);
        // Rimuoviamo dalla coda solo se il valore non è cambiato nel frattempo
        if (codaSalvataggi.get(chiave) === valore) {
          rimuoviDaCoda(chiave);
        }
      } catch (errore) {
        console.error(`Errore invio record per chiave ${chiave}:`, errore);
      }
    }
  } finally {
    invioInCorso = false;
  }
}

export function salvaDatoCloud(chiave, valore) {
  if (!APP_DATA_KEYS[chiave] && !(chiave in APP_DATA_KEYS)) return;

  aggiungiACoda(chiave, valore);

  if (!sessioneCorrente?.user) return;

  inviaCodaSalvataggi().catch((errore) => {
    console.error("Errore sincronizzazione cloud:", errore);
  });
}

export async function salvaDatoCloudImmediato(chiave, valore) {
  if (!APP_DATA_KEYS[chiave] && !(chiave in APP_DATA_KEYS)) return;

  rimuoviDaCoda(chiave);

  if (!sessioneCorrente?.user) return;

  await salvaRecordCloud(chiave, valore);
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
    // Esegui la migrazione e compressione delle vecchie immagini in chiaro (retrocompatibilità)
    await migraImmaginiEsistenti();

    const recordCloud = await caricaRecordCloud();
    const recordPerChiave = new Map(
      recordCloud.map((record) => [record.record_key, record.payload])
    );
    const meta = leggiMetaSync();
    const utenteId = sessioneCorrente.user.id;
    const primaSincronizzazioneUtente = meta.userId !== utenteId;

    for (const [chiave, fallback] of Object.entries(APP_DATA_KEYS)) {
      if (codaSalvataggi.has(chiave)) {
        // C'è una modifica locale pendente in coda (offline). Non sovrascriverla con il cloud.
        continue;
      }

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
  svuotaCoda();
  svuotaCodaEliminazioneMedia();
  sessionStorage.removeItem("preventivai-sbloccata");
  for (const [chiave, fallback] of Object.entries(APP_DATA_KEYS)) {
    salvaStorage(chiave, fallback);
  }
  salvaStorage(STORAGE_KEYS.pinAccesso, "");
  salvaMetaSync({});
  notificaDatiAggiornati();
}
