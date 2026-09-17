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

## October 2026 — product track

| Item | Status | Notes |
|------|--------|-------|
| Product audit matrix | ✅ | `PRODUCT-AUDIT-OCTOBER.md` |
| **Definitive release plan** | ✅ | `OCTOBER-RELEASE-PLAN.md` (2026-09-17) |
| Freemium release plan | ✅ docs | `FREEMIUM-RELEASE-PLAN.md` — persist/prices 🛑 |
| Backup core/satellite plan | ✅ docs | `BACKUP-RELEASE-PLAN.md` — expand 🛑 #1 |
| AI release checklist | ✅ docs | `AI-RELEASE-CHECKLIST.md` — deploy 🛑 #3 |
| Device QA checklist | ✅ docs | `DEVICE-QA-RELEASE.md` — human execute |
| App Store Giuseppe checklist | ✅ docs | `APP-STORE-RELEASE.md` |
| Preventivo vocale (match+confirm) | ✅ / 🟡 | incremental cmds FUTURE/P2 |
| Quick quote Home `?express=1` | ✅ | |
| Freemium domain 15d trial | ✅ scaffolding | Persistence 🛑 #7; prices 🛑 #8 |
| Mic / speech permissions iOS+Android | ✅ | |
| Voice incremental commands | ⬜ P2 | HUMAN-DECISIONS #9 |

## Next agent actions (ordered)

1. **Human device QA** — execute `docs/DEVICE-QA-RELEASE.md` (iPhone + Android).
2. **Human commercial** — Path X unpaid beta **or** #7+#8 for IAP (`FREEMIUM-RELEASE-PLAN.md`).
3. **Human Store** — `docs/APP-STORE-RELEASE.md` (privacy URL, signing, screenshots).
4. **Human deploy AI** — only if marketing needs cloud AI (`AI-RELEASE-CHECKLIST.md`).
5. Fix only P0/P1 from device QA; no large features.
6. Tag `v1.0.0-rc3` after GO → submit.

## Stop / ask human

- Expanding `APP_DATA_KEYS` / storage key renames
- Sync conflict strategy beyond collection LWW
- Destructive Supabase migrations
- Pricing / legal copy / PRO feature catalog
- New major frameworks
- Trial persistence key without GO
- Apple/Google signing or account changes
