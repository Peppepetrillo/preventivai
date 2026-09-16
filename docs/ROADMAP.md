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
| S1 | Offline queue persistence | ✅ | Persist + log on save failure; Preferences reload |
| S2 | Wipe-safe sync | ✅ | Empty/null/wrong-type cloud vs non-empty local; DELETE protected |
| S3 | Photo payload / no orphan `data:` in records | ✅ / 🟡 | Immutable paths; keep watching delete queue |
| S4 | PIN hash (no plaintext) | ✅ | PBKDF2; Cloud WebCrypto uses `Uint8Array` salt (compat fix) |
| S5 | Automated test/lint/build green on Cloud | ✅ | Verified after salt fix |
| S6 | Lint warning backlog | 🟡 | 0 errors; SuggerimentiAccessori remounted in 22A; pages/nav remain |
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
| RC audit evidence (`docs/RELEASE-CANDIDATE.md`) | ✅ Sprint 25 |
| PWA device QA | ⬜ manual (`docs/RC3-RELEASE-CHECKLIST.md`) |
| Cross-device sync smoke | ⬜ manual |
| Marketing screenshots | ⬜ |
| Tag `v1.0.0-rc3` | ⬜ after human GO + device QA |

---

## Beta readiness (Sprint 23–25 evidence)

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| P0 | PDF invents brand as ragione sociale | ✅ fixed | empty → «Ditta non impostata» / blank DTO |
| P0 | Report empty Data apertura / Preventivo origine as `—` | ✅ fixed | omit lines |
| P1 | Cliente→Nuovo cantiere drops prefill | ✅ fixed | query params |
| P1 | Sticky cantiere CTA vs safe-area BottomNav | ✅ fixed | calc + inset |
| P1 | First-5-min no azienda setup | ✅ fixed | Home CTA |
| P1 | Accetta CTA unclear / hard to tap on Bozza | ✅ fixed | Segna accettato + btn-secondary |
| P2 | Distinta→Acquisti silent without cantiere | ✅ fixed | flash hint |
| P2 | Chiusura looks like delete on Attivi list | ✅ fixed | Completati/Storico copy |
| P2 | AI offline hard-error wording | ✅ fixed | provider_non_raggiungibile map |
| P2 | Share success never offers Inviato | ✅ fixed | soft ConfirmDialog after Email/WA/Share on Bozza |
| P2 | Empty ACCONTO / firme blocks on PDF | ✅ fixed | omit-if-empty preventivo + report |
| P1 | False save success on LS write failure | ✅ fixed | Sprint 25 sync `.ok` + UI guards |
| P1 | Express AI POSTed clienti without auth | ✅ fixed | locale only |
| P2 | Recreate preventivo over cestinato link | ✅ fixed | `preventivo_cestinato` |
| P3 | Diario emoji → Lucide | 🛑 / P3 | HUMAN-DECISIONS #6 |
| 🛑 | APP_DATA_KEYS satellites | 🛑 | HUMAN-DECISIONS #1 |
| 🛑 | economia.movimenti SoT | 🛑 | HUMAN-DECISIONS #2 |
| 🛑 | Remote AI verify_jwt deploy | 🛑 | HUMAN-DECISIONS #3 |

## Next agent actions (ordered)

1. **Human device QA** — iPhone notch + Android: install, share→Inviato, PDF, sticky CTA, offline reopen (`docs/RELEASE-CANDIDATE.md`).
2. **Human deploy** — AI `verify_jwt=true` + server `OPENAI_API_KEY` (only if remote AI required for cohort).
3. Human: `APP_DATA_KEYS` expansion decision before promising multi-device satellite restore.
4. Tag `v1.0.0-rc3` after device QA GO.
5. Optional polish: Diario emoji → Lucide (HUMAN-DECISIONS #6) after visual QA.

## Stop / ask human

- Expanding `APP_DATA_KEYS` / storage key renames
- Sync conflict strategy beyond collection LWW
- Destructive Supabase migrations
- Pricing / legal copy
- New major frameworks
