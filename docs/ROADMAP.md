# PreventivAI — Night development roadmap

Based on **code inspection** of `1.0.0-rc.3` (not a wishlist).  
Companion: `docs/ARCHITECTURE.md`, root `AGENTS.md`, `docs/CLOUD-AGENT-OVERNIGHT.md`.

## Status legend

- ✅ Done in codebase (verify before re-implementing)
- 🟡 Partial / needs hardening
- ⬜ Not started or only stub
- 🛑 Needs human decision (data/security/architecture)

---

## PRIORITÀ 1 — STABILITÀ (current focus)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| S1 | Offline queue persistence | ✅ | `cloudSyncService` + Preferences reload; covered by `affidabilitaOffline.test.js` |
| S2 | Wipe-safe sync | ✅ | RC-2A tests |
| S3 | Photo payload / no orphan `data:` in records | ✅ / 🟡 | Immutable paths; keep watching delete queue |
| S4 | PIN hash (no plaintext) | ✅ | PBKDF2; Cloud WebCrypto uses `Uint8Array` salt (compat fix) |
| S5 | Automated test/lint/build green on Cloud | ✅ | Verified after salt fix |
| S6 | Lint warning backlog | 🟡 | 0 errors; `set-state-in-effect` remains (`docs/TODO-LINT-SPRINT.md`) |
| S7 | Backup boundary clarity | 🟡 | Tests document device-local keys; expanding `APP_DATA_KEYS` is 🛑 |

## PRIORITÀ 2 — PREVENTIVO → CANTIERE

| ID | Item | Status | Notes |
|----|------|--------|-------|
| P1 | Accettato → Inizia cantiere | ✅ | Hero CTA + workflow |
| P2 | `creaCantiereDaPreventivo` + bi-directional ids | ✅ | Domain + workflow tests |
| P3 | Prevent duplicate cantiere | ✅ | `trovaCantiereCollegato` / convert path |
| P4 | Lavoro diretto senza preventivo | ✅ | `origine: diretto` |
| P5 | UX copy / edge cases | ✅ | Soft-delete banner, duplica strip, diretto→crea preventivo |

**Do not re-build this feature.** Prefer small reliability/UX PRs only.

## PRIORITÀ 3 — PRODUCT DEPTH (later)

| Area | Status | Code anchors |
|------|--------|--------------|
| Varianti cantiere | ✅ / 🟡 | `domain/varianti`, Cantiere Economico |
| Acconto / saldo / pagamenti | ✅ | cantiere pagamenti + Incassi |
| Checklist cantiere | ✅ | cantiere.checklist |
| Materiali / distinte / acquisti | ✅ / 🟡 | catalogo, distinte, lista spesa (catalog sync 🛑) |
| Agenda | ✅ | `features/agenda` |
| Firma cliente | ✅ / 🟡 | `domain/firma` |
| PDF professionale | ✅ / 🟡 | company fields; keep empty-field omission |
| AI assistant | 🟡 | JWT required client+gateway; deterministic fallback; deploy `verify_jwt=true` on remote |
| Catalogo scalabile Categoria→Famiglia→Prodotto | 🟡 | analyze before expanding; no mass seed |

## PRIORITÀ 4 — RELEASE

| Item | Status |
|------|--------|
| PWA device QA | ⬜ manual (`docs/RC3-RELEASE-CHECKLIST.md`) |
| Cross-device sync smoke | ⬜ manual |
| Marketing screenshots | ⬜ |
| Tag `v1.0.0-rc3` | ⬜ after human GO |

---

## Next agent actions (ordered)

1. **Human deploy** — apply `supabase/config.toml` `verify_jwt=true` for AI function on the linked project.
2. **S6** — One page of safe `set-state-in-effect` cleanup with tests.
3. Human: decide `APP_DATA_KEYS` expansion (distinte / listaSpesa / firme / varianti) before coding sync.
4. Human: PWA + A/B offline sync smoke.
5. Optional: economia generale senza cantiere (`preventivai.economia.movimenti`) — product decision first.

## Stop / ask human

- Expanding `APP_DATA_KEYS` / storage key renames
- Sync conflict strategy beyond collection LWW
- Destructive Supabase migrations
- Pricing / legal copy
- New major frameworks
