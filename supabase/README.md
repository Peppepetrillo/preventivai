# Supabase setup

1. Crea un progetto Supabase.
2. Applica la migration in `supabase/migrations`.
3. Abilita Email/Password in Authentication.
4. Copia URL progetto e anon key in `.env`:

```env
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
```

La tabella `app_records` salva le collezioni dell'app per utente autenticato:

- `archivioPreventivi`
- `cantieri`
- `clienti`
- `datiAzienda`
- `listinoLocale`
- `preventivai:esperienze` (Experience Engine — RC-2A)

## Integrità sync (RC-1A)

Regole implementate in `src/services/cloudSyncService.js` + `cloudSyncIntegrity.js`:

1. **Coda offline vince sul realtime** — se una `record_key` è in coda locale, gli eventi realtime (UPDATE/DELETE) non sovrascrivono lo storage.
2. **Drenaggio affidabile** — se arriva un nuovo `salvaDatoCloud` durante un flush, la coda viene riprocessata; errori su una chiave lasciano la voce in coda.
3. **Conflitti `updated_at`** — ogni scrittura locale aggiorna una revisione in `preventivai-cloud-local-revisions`. Il cloud sostituisce il locale solo se `updated_at` cloud ≥ revisione locale (e la chiave non è in coda). Se il locale è più recente, viene rimesso in coda verso il cloud (niente overwrite silenzioso).

## Data trust (RC-2A)

1. **Wipe-safe nuove chiavi** — se una `record_key` di `APP_DATA_KEYS` manca sul cloud, i dati locali non vengono mai azzerati: si fa push del locale oppure seed cloud con fallback vuoto.
2. **Foto cantieri** — upload con path immutabili (`upsert: false`); i payload `app_records` non contengono mai `data:` URL (solo miniatura / `storagePath`).
3. **UI live** — le schermate operative ascoltano `cloud-sync-aggiornata` e non rileggono lo storage a ogni render.

La cache locale resta usata per continuità UI, migrazione iniziale e uso quando il cloud non è configurato.
