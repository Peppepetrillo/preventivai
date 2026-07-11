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

La cache locale resta usata solo per continuità UI, migrazione iniziale e uso temporaneo quando il cloud non è configurato.
