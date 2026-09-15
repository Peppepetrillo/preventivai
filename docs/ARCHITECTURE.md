# PreventivAI — Architecture (as implemented)

Living document. Describes what exists in the repository today (`1.0.0-rc.3`), not a target ideal.

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + Vite 8 + Tailwind 4 |
| Routing | `react-router-dom` HashRouter (`/#/...`) — PWA/iOS friendly |
| Native | Capacitor 8 (iOS/Android) + Preferences |
| Offline shell | `vite-plugin-pwa` (autoUpdate) |
| Optional cloud | Supabase Auth + `app_records` + Storage bucket `foto-cantieri` |
| PDF | jsPDF + domain layout in `src/domain/pdf` / services |
| Tests | Vitest + Testing Library + jsdom |
| Lint | ESLint 10 (0 errors required; warnings tracked in `docs/TODO-LINT-SPRINT.md`) |

## Top-level layout

```text
src/
  app/           routes, storage keys, events, navigation config
  pages/         route screens (mobile-first)
  components/    shared UI (ConfirmDialog, BottomNav, PdfAnteprima, …)
  features/      feature modules (preventivi, cantieri, agenda, ai, economia, …)
  domain/        pure(ish) domain + workflow (cestino, firma, varianti, …)
  repositories/  read/write LocalStorage (preventivi, cantieri, clienti, …)
  services/      cloud sync, PIN, PDF, notifications, assistant
  hooks/         shared React hooks
  navigation/    back / edge-swipe / Android back
  utils/         storage, backup, images
  lib/           supabase client
supabase/        Edge Functions + config
```

## Data model (local-first)

- Primary persistence: `localStorage` via `src/utils/storage.js`.
- Capacitor Preferences: native restore of `NATIVE_STORAGE_KEYS` after WKWebView wipe.
- Sync dataset: `APP_DATA_KEYS` in `src/app/storageKeys.js` (preventivi, cantieri, clienti, datiAzienda, listino, esperienze).
- Device-local (not in cloud backup keys today): catalogo materiali, attività, brain*, PIN, backup-auto config, etc.
- Soft-delete: `src/domain/cestino` for clienti / cantieri / preventivi.

**Do not change `STORAGE_KEYS` / `APP_DATA_KEYS` / sync conflict semantics without human approval.**

## Offline sync

Implemented in `src/services/cloudSyncService.js`:

- Persistent offline queue in `CLOUD_SYNC_STORAGE_KEYS.queue` (survives process restart via storage + Preferences reload: `ricaricaCodeCloudDaDisco()`).
- Media delete queue for Storage paths.
- Integrity helpers: offline queue wins over older cloud (`cloudSyncIntegrity.js`).
- Wipe-safe: missing cloud key does not erase local data.
- Conflict model: last-write-wins at **collection** level (documented limit).

## Auth & security

- Optional Supabase email/password for cloud (`CloudAuthProvider` / supabase client).
- App lock PIN: `src/services/pinSecurity.js` — PBKDF2 hash, **not** synced.
- AI Edge Function: server-side OpenAI key; client must not embed secrets (`VITE_*` only for public endpoint/anon).

## Preventivo → Cantiere (already shipped)

| Piece | Location |
|-------|----------|
| Domain create from quote | `creaCantiereDaPreventivo` in `features/cantieri/cantieriDomain.js` |
| Workflow convert | `convertiInCantiere` / `accettaPreventivo` in `domain/workflow` |
| Legacy adapter | `convertiPreventivoInCantiere` / `creaCantierePerPreventivo` |
| UI CTA | Hero «Inizia cantiere» when accepted (`preventivoHeroCta`) |
| Link fields | `preventivo.cantiereId` ↔ `cantiere.preventivoId` |
| Direct work (no quote) | `creaCantiere` with `origine: diretto` |

Tests cover conversion, no-duplicate, and UI hero CTA.

## Economy SoT

- With cantiere: `cantiere.pagamenti[]` + `cantiere.spese[]`.
- Without cantiere: `preventivai.economia.movimenti` (general movements).
- Incassi page: payments on preventivi **before** cantiere.
- No double counting by design.

## PDF / photos

- Preventivo PDF: `preventiviPdfService` + company profile fields.
- Cantiere report: `cantiereReportPdfService`.
- Photos: immutable Storage paths; no full `data:` URLs in cloud records (`cloudMediaPayload`).

## Routing (HashRouter)

Canonical paths live in `src/app/routes.js` (e.g. `/preventivi`, `/preventivo/:id`, `/cantiere/:id`, `/economia`, `/incassi`, `/altro`, …).

Back gesture policy: page → history/parent; sheet/modal → close overlay; Agenda day swipe and SwipeableRow are excluded from edge-back.

## Design system

See `.cursor/rules/preventivai-design-system.mdc` and tokens in `src/index.css`.
Mobile-first, one-hand CTA, Lucide icons only, `.btn-primary` / `.btn-secondary` / `.btn-danger`.
