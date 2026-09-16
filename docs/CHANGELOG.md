# PreventivAI — Documentation changelog

Session-oriented log for Cloud Agents. Product release notes remain in root `CHANGELOG.md`.

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
