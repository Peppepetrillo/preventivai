# PreventivAI — Documentation changelog

Session-oriented log for Cloud Agents. Product release notes remain in root `CHANGELOG.md`.

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
