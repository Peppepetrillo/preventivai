# Supabase setup

## Collegare il progetto già esistente (Sprint 21B)

1. Installa la CLI (se manca):

```bash
brew install supabase/tap/supabase
```

Alternativa npm: `npm install -g supabase`

2. Recupera il **Project Ref** dalla Dashboard Supabase:
   - Project Settings → General → **Reference ID**
   - oppure dall’URL: `https://<PROJECT-REF>.supabase.co`

3. Login e link (dal root del repo):

```bash
supabase login
supabase link --project-ref <PROJECT-REF>
```

4. Secrets AI (solo server — valori reali solo in console, non nel repo):

```bash
supabase secrets set OPENAI_API_KEY=<la-tua-key>
# opzionale
supabase secrets set OPENAI_MODEL=gpt-4o-mini
```

5. Deploy Edge Function:

```bash
supabase functions deploy analisi-preventivo-intelligence
```

6. Client `.env` (locale, gitignored):

```env
VITE_SUPABASE_URL=https://<PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-pubblica>
VITE_AI_ASSISTANT_ENDPOINT=https://<PROJECT-REF>.supabase.co/functions/v1/analisi-preventivo-intelligence
```

`VITE_SUPABASE_ANON_KEY` è la chiave **anon/public** (non service_role).  
`OPENAI_API_KEY` non va mai nel client.

7. Rebuild app:

```bash
npm run build && npx cap sync ios
```

---

## Setup sync (storico)

1. (Se non ne hai uno) Crea un progetto Supabase.
2. Applica la migration in `supabase/migrations`.
3. Abilita Email/Password in Authentication.
4. Copia URL progetto e anon key in `.env`.

La tabella `app_records` salva le collezioni dell'app per utente autenticato:

- `archivioPreventivi`
- `cantieri`
- `clienti`
- `datiAzienda`
- `listinoLocale`
- `preventivai:esperienze` (Experience Engine — RC-2A)

## Integrità sync (RC-1A)

Regole in `src/services/cloudSyncService.js` + `cloudSyncIntegrity.js`:

1. Coda offline vince sul realtime.
2. Drenaggio affidabile della coda.
3. Conflitti `updated_at` con revisioni locali.

## Data trust (RC-2A)

1. Wipe-safe per nuove chiavi `APP_DATA_KEYS`.
2. Foto cantieri con path immutabili.
3. UI live su `cloud-sync-aggiornata`.

## Edge Function AI (Sprint 21 / 21B)

Funzione: `analisi-preventivo-intelligence`  
`verify_jwt = false` in `supabase/config.toml` (niente auth obbligatoria in questo sprint).  
CORS: Capacitor (`capacitor://localhost`) + localhost Vite; extra via secret `ALLOWED_ORIGINS` (csv).

Una chiamata AI reale ha un costo lato provider (token OpenAI).  
Con endpoint vuoto e senza `VITE_SUPABASE_URL` l'app usa il fallback deterministico.
