# PreventivAI — Documentation changelog

Session-oriented log for Cloud Agents. Product release notes remain in root `CHANGELOG.md`.

## 2026-09-17 — Definitive October release plan (docs)

### Completed
- Branch `cursor/release-plan-october-74ac`
- Master plan: `docs/OCTOBER-RELEASE-PLAN.md` (READY/NEEDS/BLOCKED/FUTURE + weeks + do-not-do)
- `FREEMIUM-RELEASE-PLAN.md`, `BACKUP-RELEASE-PLAN.md`, `AI-RELEASE-CHECKLIST.md`
- `DEVICE-QA-RELEASE.md`, `APP-STORE-RELEASE.md`
- ROADMAP updated to point at release gates
- **No SoT / APP_DATA_KEYS / pricing / deploy / signing changes**

### Intentionally not done
- Large features / voice incremental (P2)
- Freemium persistence without HUMAN #7
- Device QA (requires Giuseppe hardware)

## 2026-09-16 — October release: Preventivo vocale + freemium scaffold

### Completed
- Branch `cursor/autonomous-october-release-74ac`
- Preventivo vocale: listino match only, preview + confirm (no auto-apply, no invented prices)
- Unmatched UX: Aggiungi al listino / Modifica / Ignora
- Speech hook: offline/network/permission Italian errors; mic requires rete
- Home CTA → `/preventivi/nuovo?express=1`; wizard deep-link
- Freemium pure domain: TRIAL 15d → FREE → PRO (`docs/FREEMIUM.md`)
- iOS mic+speech usage strings; Android `RECORD_AUDIO`
- Docs: `VOICE-QUOTE.md`, `FREEMIUM.md`; HUMAN-DECISIONS #7–#9

### Intentionally not done
- Trial persistence STORAGE_KEY (HUMAN #7)
- Prezzi / feature PRO catalog (HUMAN #8)
- Incremental voice commands (HUMAN #9)
- SoT / APP_DATA_KEYS / remote AI deploy

## 2026-09-16 — Production polish + QA (UX / performance)

### Completed
- Branch `cursor/production-polish-qa-74ac`
- Backup auto errors: Italian labels (no snake_case in Impostazioni)
- Typology chips / AI copy: no emoji; Express undo ≥44px
- Acquisti + Preventivi filtered empty: «Azzera ricerca e filtri»
- PDF blobUrl revoke when callers keep only Blob (wizard / distinta / acquisti share)
- Tests for each change

### Intentionally not done
- Diario emoji → Lucide (HUMAN-DECISIONS #6)
- Broad setState-in-effect remount sweep
- SoT / APP_DATA_KEYS / AI contract / remote deploy

## 2026-09-16 — Sprint 25 Release Candidate audit

### Completed
- Branch `cursor/release-candidate-audit-74ac`
- Evidence checklist → `docs/RELEASE-CANDIDATE.md` (verdict: READY FOR HUMAN DEVICE QA)
- Fix: false save success (`salvaStorage` sync `.ok` + UI/cantiere guards)
- Fix: Express AI never POSTs clienti/listino (locale only)
- Fix: scrub migliora-descrizione free-text; photo sync log uses id
- Fix: refuse cantiere→preventivo recreate when linked preventivo is cestinato
- Verified: `npm test` 1824 pass, lint 0 errors, build OK, `npx cap sync ios` OK

### Intentionally not done
- HUMAN-DECISIONS #1–#6 (no autonomous SoT / APP_DATA_KEYS / remote AI deploy)
- Device PWA / cross-device sync (NOT TESTABLE in Cloud)
- Tag `v1.0.0-rc3` (human GO)

## 2026-09-16 — Sprint 24 Release polish + document workflow

### Completed
- Branch `cursor/autonomous-sprint-24-74ac` (PR draft)
- Share (Email/WhatsApp/Share) on Bozza → soft ConfirmDialog «Segna questo preventivo come inviato?» (Segna come inviato / Non ora)
- Scarica PDF does **not** prompt (local only); no auto state change; double-submit guard
- PDF preventivo: omit ACCONTO when richiesto=0; omit Firme when no signature data
- PDF report cantiere: omit empty Firme placeholder lines
- Tests: prompt helper, PDF omit/print, CondivisioneSection callback
- Verified: `npm test` 1820 pass, lint 0 errors, build OK, `npx cap sync ios` OK
- InstallPrompt: removed emoji title (Lucide Smartphone already present)

### Intentionally not done
- HUMAN-DECISIONS (APP_DATA_KEYS, economia.movimenti, remote AI JWT, seed incassato, diario emoji)
- No new preventivo stati / SoT / storage keys
- No cantiere redesign

## 2026-09-16 — Sprint 23 Beta product audit + workflow hardening

### Completed
- Branch `cursor/autonomous-sprint-23-74ac`
- Cliente → Nuovo cantiere: query prefill (clienteId/cliente/indirizzo)
- PDF: empty azienda no longer becomes «PreventivAI»; report omits empty data/preventivo lines; installatore placeholder off by default
- Home first-5-min: CTA «Completa i dati azienda» when missing
- Cantiere sticky CTA safe-area above BottomNav
- Hero/workflow «Segna accettato»; chiusura copy → Completati/Storico
- Distinta save hint for Acquisti without cantiere; AI offline honesty copy

### Intentionally not done
- HUMAN-DECISIONS (APP_DATA_KEYS, economia.movimenti, remote AI JWT, seed incassato)
- Share success → auto Inviato prompt (deferred P2)
- Empty PDF ACCONTO / firme block shrink (P2 polish)

## 2026-09-16 — Sprint 22B Deep Navigation + State Hardening

### Completed
- Branch `cursor/autonomous-sprint-22b-74ac`
- Remount `DettaglioPreventivo` / `DettaglioCliente` on `:id` (stale form after duplica / deep-link)
- Double-submit guard on preventivo Duplica
- `CantiereOverview` keyed by cantiere id; `useCantieri` clears drafts on id change
- `CantiereOperativo` closes material sheets on cantiere switch
- Catalogo Materiali: edge/hardware back drills one vista level via `setGuardiaNavigazioneIndietro`
- Distinta editor: clear sheets/flash when route id changes

### Intentionally not done
- Expanding `APP_DATA_KEYS` (🛑)
- `economia.movimenti` SoT (🛑)
- Remote AI deploy (🛑)
- Diario emoji → Lucide (P3)

## 2026-09-16 — Sprint 22A Production UX + Navigation Hardening

### Completed
- Branch `cursor/autonomous-sprint-22a-74ac`
- Remount `SuggerimentiAccessoriSheet` (no setState-in-effect) + double-submit guard
- Giornata programmata: close only on save success; parent sections return esito
- Double-submit: `LavorazionePersonalizzataSheet`, `SelettoreMaterialeSheet`
- Listino empty CTA; DiarioTimeline DS typography; Varianti dialog `z-[80]`
- Condivisione DOWNLOAD label «Scarica»; accessori «Q.tà ×»

### Intentionally not done
- Expanding `APP_DATA_KEYS` (🛑)
- `economia.movimenti` SoT (🛑)
- Remote AI deploy (🛑)
- Diario emoji → Lucide (P3; needs icon map + test updates)

## 2026-09-16 — Production hardening branch (Cloud Agent)

### Completed
- Branch `cursor/autonomous-production-hardening-74ac`
- Remount `SpesaSheet` + `GiornataLavorativaSheet`; consuntivo closes only on save success
- Remount `DateCalendarSheet` (lint 14→13)
- Banner «Inizia cantiere» double-submit guard
- Impostazioni backup honesty (satellite data device-local)
- Listino compact row `min-h-[44px]`
- Docs: `HUMAN-DECISIONS.md` for APP_DATA_KEYS / economia / AI deploy

### Intentionally not done
- Expanding `APP_DATA_KEYS` (🛑)
- `economia.movimenti` SoT (🛑)
- Remote AI deploy (🛑)

## 2026-09-16 — S6 remount + AI free-text scrub (Cloud Agent)

### Completed
- S6: remount `InsightRapidoSheet`, `NuovoLavoroSheet`, `AttivitaFormSheet` (no setState-in-effect)
- S6: remount `PagamentoSheet`, `GiornataProgrammataSheet` (lint 21→16)
- AI: `scrubTestoLiberoAi` masks email/IBAN/CF/cellulare IT in `normalizzaNuovoLavoroAi`

### Intentionally not done
- Address free-text redaction (product), remote AI deploy, `APP_DATA_KEYS`, economia.movimenti SoT (🛑)

## 2026-09-16 — PDF empty fields + catalog guards (Cloud Agent)

### Completed
- Preventivo PDF: omit empty Data / Validità / Oggetto (no `—`)
- Report cantiere: omit empty fornitore/metodo on expense rows
- Listino badge On/Off → Attiva/Spenta; Impostazioni cloud copy without `VITE_*`
- Double-submit guards: listino, famiglie/varianti materiali, voce distinta
- Cestino empty CTA; `.ds-chip` min-height 44px
- Auth/Condivisione: Italian error/fallback copy (no English technical toast)

### Intentionally not done
- Remote AI deploy, `APP_DATA_KEYS`, economia.movimenti SoT (🛑)
- Address free-text redaction in AI payloads (product decision)

## 2026-09-16 — Money integrity + soft-delete clarity (Cloud Agent)

### Completed
- Pagamento/Spesa sheets: close + flash only when save returns success (no false-positive feedback)
- Cantiere Overview: preventivo soft-deleted → amber banner + link Cestino (not “mancante”)
- AI migliora descrizione: 20s timeout, offline copy, no `VITE_*` in user-facing errors
- Agenda Attività/Insight + Varianti: double-submit guards
- Incassi/Storico empty: CTA verso preventivi/cantieri; filtri spese e tap target ≥44px
- `messaggioErroreWorkflow`: titoli/variante/pagamento/spesa/nessun_cantiere

### Intentionally not done
- Remote AI deploy, `APP_DATA_KEYS`, economia.movimenti SoT (🛑)

## 2026-09-16 — Professional UX polish (Cloud Agent)

### Completed
- Incassi: save feedback + double-submit guard on pagamento/saldato
- Economia empty: CTA “Apri cantieri”
- Preventivo manuale: delete-row hit target 44px
- NuovoClienteSheet: create guard
- LavorazionePersonalizzataSheet: remount form (S6, lint 21→20)
- Variante/cantiere errors: Italian copy via `messaggioErroreWorkflow`
- Preventivo PDF: no `—` placeholder for empty cliente nome

### Intentionally not done
- Remote AI deploy, `APP_DATA_KEYS`, economia.movimenti SoT (🛑)

## 2026-09-16 — Continuous night hardening (Cloud Agent)

### Completed
- Agenda: storage-backed `creaLavoro` / `segnaCompletato` / `registraGiornataLavorativa` + NuovoLavoroSheet double-submit guard
- Cantieri / Distinte: double-submit guards on create/save
- Foto delete hit target ≥44px
- Report cantiere PDF: omit empty Cliente/Indirizzo (no `—` blocks)
- S6 slice: `DescrizioneInterventoSection` remount by `cantiere.id` (lint 22→21 warnings)

### Intentionally not done
- Remote AI deploy, `APP_DATA_KEYS` expansion, economia.movimenti SoT (🛑)
- Remaining `set-state-in-effect` sheets (page-by-page)

## 2026-09-16 — Sprint 22 pre-release hardening (Cloud Agent)

### Completed
- P0 sync: anti-wipe when cloud payload is empty/null but local APP_DATA_KEYS hold data; realtime DELETE re-queues non-empty local
- P0 sync: `normalizzaPayloadCloud` rejects wrong-type payloads (e.g. `{}` on array keys)
- P0 cestino: hard-delete preventivo clears orphan `preventivoId` / `preventivoNumero` on cantieri
- P0 duplica: strips `incassato` / `noteIncasso` / `deletedAt`
- P1 cantieri: storage-backed rapid updates (no lost checklist/materiali on double-tap)
- P1 UX: double-submit guards on PreventivoManuale + Clienti create
- P1 UX: CantiereOverview shows missing-preventivo message for dead links
- Docs: AI `verify_jwt` remote deploy still requires human credentials

### Intentionally not done
- `APP_DATA_KEYS` expansion (🛑)
- `preventivai.economia.movimenti` general SoT (🛑 product)
- Remote AI `verify_jwt` deploy (human)
- Mass `set-state-in-effect` lint refactor (B/D — safe backlog)

## 2026-09-16 — Autonomous night (Cloud Agent)

### Completed
- P0: `duplicaPreventivo` no longer inherits `cantiereId` / workflow timestamps
- P1: Convertito + cantiere soft-deleted → live id only + Cestino banner (no dead navigate / no second cantiere)
- P1: Cantiere diretto → **Crea preventivo** linked to same cantiere (idempotent SoT)
- P1: Economia breakdown entrate/uscite per categoria from existing movimenti
- P2: InstallPrompt close tap target ≥44px; backup tests document more local-only keys
- Docs: ROADMAP Candidate A / P5 marked done

### Intentionally not done
- `APP_DATA_KEYS` expansion (🛑)
- `preventivai.economia.movimenti` general SoT (🛑 product)
- Remote AI `verify_jwt` deploy (human)

## 2026-09-15 — Night session Sprint 22/23 (Cloud Agent)

### Completed
- AI P0: Edge Function requires Bearer JWT; client sends session + anon key; `verify_jwt=true` in `supabase/config.toml`; deterministic fallback on `non_autenticato`
- Navigation: leave-guard for wizard dirty draft (Back / edge swipe / Android / BottomNav) via `ConfirmDialog` (no `window.confirm`)
- `DettaglioPreventivo`: replace `window.alert` / `window.confirm` with `ConfirmDialog`
- Distinte: delete uses shared `ConfirmDialog` (z-[80], above BottomNav)
- Economia copy: clarify SoT (cantieri only) and how to register movements; document missing general movimenti
- Docs: ARCHITECTURE/ROADMAP/CHANGELOG aligned with code (no invented `preventivai.economia.movimenti` SoT)

### Intentionally not done
- No `APP_DATA_KEYS` expansion (🛑 human decision)
- No general economia movimenti storage invented
- No destructive migrations / STORAGE_KEYS renames

## 2026-09-15 — Night session (Cloud Agent)

### Completed
- Agent operating system: `AGENTS.md`, `.cursor/environment.json`, workflow/data-safety rules, planner/feature/qa subagents
- Overnight guides: `docs/CLOUD-AGENT-OVERNIGHT.md`, `docs/NEXT-PR-CANDIDATES.md`
- Architecture + night roadmap: `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`
- Cursor rules pack: `architecture`, `mobile-ux`, `testing`, `security`, `workflow`
- Safe lint: split `react-refresh` helper exports from UI modules (warnings 33 → 22)
- Backup boundary tests (document device-local vs `APP_DATA_KEYS` without migrations)
- RC-3 Cloud verification log row in `docs/RC3-RELEASE-CHECKLIST.md`
- Stability: PIN PBKDF2 salt passed as `Uint8Array` for WebCrypto/jsdom Cloud compatibility (storage format unchanged)

### In progress / follow-up
- Remaining `set-state-in-effect` lint warnings
- Candidate A — cantieri↔preventivi clarity (no SoT change)

### Not done (intentionally)
- No `APP_DATA_KEYS` expansion
- No PWA device QA claims
- No Preventivo→Cantiere rewrite (already shipped)
## Earlier product releases

See root `CHANGELOG.md` (`1.0.0-rc.1` … `1.0.0-rc.3`).
