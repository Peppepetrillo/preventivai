# PreventivAI — Documentation changelog

Session-oriented log for Cloud Agents. Product release notes remain in root `CHANGELOG.md`.

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
