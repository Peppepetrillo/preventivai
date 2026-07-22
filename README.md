# PreventivAI

Gestionale offline-first per elettricisti: preventivi, cantieri, clienti, incassi e assistente operativo basato sull’esperienza.

**Versione:** `1.0.0-rc.3` (Release Candidate)

## Stack

- React 19 + Vite + Tailwind
- Capacitor (iOS/Android) + PWA (`vite-plugin-pwa`)
- Supabase (auth + `app_records` + storage foto) — opzionale

## Avvio locale

```bash
npm install
cp .env.example .env   # se usi Supabase
npm run dev
```

```bash
npm test
npm run lint
npm run build
```

Build nativo:

```bash
npm run sync
npm run open:ios
# oppure
npm run open:android
```

## Percorsi principali

| Area | Route |
|------|--------|
| Home | `/` |
| Nuovo preventivo (wizard) | `/preventivi` |
| Archivio preventivi | `/archivio` |
| Dettaglio preventivo | `/preventivo/:id` |
| Cantieri (lista) | `/cantieri` |
| Dettaglio cantiere | `/cantiere/:id` |
| Incassi / Clienti / Listino / Impostazioni | rispettive route in `src/app/routes.js` |

## Sicurezza (RC-3)

- PIN locale opzionale 4–6 cifre, salvato come **hash PBKDF2** (mai in chiaro)
- Timeout di inattività configurabile in Impostazioni
- PIN **non** sincronizzato sul cloud
- Face ID / Touch ID: predisposti, non ancora collegati

## Cloud sync

Vedi `supabase/README.md`. Dataset sincronizzato: preventivi, cantieri, clienti, dati azienda, listino, esperienze.

## Release

- Changelog: `CHANGELOG.md`
- Checklist QA / Go-NoGo: `docs/RC3-RELEASE-CHECKLIST.md`
- Tag consigliato: `v1.0.0-rc3` (dopo commit di rilascio)

## Licenza

Progetto privato — tutti i diritti riservati.
