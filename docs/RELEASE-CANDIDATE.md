# PreventivAI — Release Candidate status

**Version track:** `1.0.0-rc.3`  
**Audit branch:** `cursor/release-candidate-audit-74ac`  
**Audit date:** 2026-09-16 (Cursor Cloud, Sprint 25)  
**Companion:** `docs/RC3-RELEASE-CHECKLIST.md`, `docs/HUMAN-DECISIONS.md`, `docs/ROADMAP.md`

This document is an **evidence-based** gate between Beta and a Release Candidate
for a first group of electricians. It is not a marketing checklist.

---

## Technical verdict

**READY FOR HUMAN DEVICE QA**

Automated suite, lint (0 errors), build, and `npx cap sync ios` are green.
Remaining blockers for a tagged public RC are **human device QA**, **remote AI
deploy**, and **explicit product decisions** in `HUMAN-DECISIONS.md` — not open
P0 code defects found in this audit.

---

## 1. What works (code + tests)

| Area | Evidence |
|------|----------|
| Preventivo → Accettato → Cantiere (no duplicate) | Domain + workflow tests |
| Cantiere diretto → preventivo (same `cantiereId`) | `creaPreventivoDaCantiereDiretto` tests |
| Soft-delete Cestino → restore nested payload | `cestinoService` tests |
| Share → soft «Segna come inviato?» (Bozza only) | Page + helper tests (Sprint 24) |
| PDF omit empty ACCONTO / Firme | `pdfTemplateService` / report tests |
| PIN hashed (PBKDF2), outside sync keys | `pinSecurity` tests |
| Wipe-safe sync / offline queue | cloud sync tests |
| Primary AI insight: JWT client path + structured PII scrub | `aiProvider` / scrub tests |
| Remount on `:id` (stale form) | DettaglioPreventivo / Cliente tests |

---

## 2. What was verified this sprint

### Automated

| Check | Result |
|-------|--------|
| `npm test` | **1824 passed** |
| `npm run lint` | **0 errors** (14 pre-existing warnings) |
| `npm run build` | OK |
| `npx cap sync ios` | OK |

### Release checklist matrix

Legend: **PASS** = code+tests or Cloud smoke · **FAIL** = concrete defect ·
**BLOCKED** = needs human decision/deploy · **NOT TESTABLE** = needs real device/account

| Item | Status | Notes |
|------|--------|-------|
| Installazione | NOT TESTABLE | PWA/Capacitor on real iPhone/Android |
| Primo avvio | PASS | Home CTA dati azienda when missing |
| Dati azienda | PASS | PDF empty brand honesty |
| Cliente | PASS | Prefill cantiere query; save failure honesty fixed |
| Preventivo | PASS | Hero CTA by state; remount on id |
| PDF | PASS | Omit empty fields; long tables paginate |
| Condivisione | PASS | Storico + soft Inviato prompt |
| Stato inviato | PASS | Confirm only; Scarica no prompt |
| Accettazione | PASS | Segna accettato → workflow |
| Cantiere | PASS | Overview keyed; double-submit sheets |
| Cantiere diretto | PASS | Origine diretto preserved |
| Giornate | PASS | Sheets gate on `success:false` |
| Spese / Pagamenti | PASS | Storage re-read + save ok check |
| Economia | PASS | Cantiere-only SoT (by design) |
| Materiali / Distinta / Acquisti | PASS / 🟡 | Device-local satellites |
| Varianti | PASS | Domain module |
| Foto / Note / Chiusura | PASS | Soft-delete honesty copy |
| Storico | PASS | Completati/Storico wording |
| Cestino / Ripristino | PASS | Soft restore keeps payload |
| AI | PASS / BLOCKED | Locale Express; remote insight deploy 🛑 |
| Offline | PASS | Queue + Preferences hydrate tests |
| Navigazione / gesture | PASS | Remount, catalog back guard |
| Safe-area | PASS | Sticky CTA calc (code); device TBD |
| Backup | PASS / BLOCKED | Honesty copy; satellite expand 🛑 |
| Sync | PASS / NOT TESTABLE | Unit wipe-safe; cross-device TBD |
| Error handling | PASS | Italian workflow messages; no `window.alert` |

---

## 3. What was corrected (Sprint 25)

1. **False save success** — `salvaStorage` exposes synchronous `.ok`; cliente /
   preventivo / cantiere mutators stop claiming success when localStorage write fails.
2. **Express AI PII** — `generaBozzaPreventivoAI` no longer POSTs `clienti`/`listino`
   to unauthenticated endpoints; stays local.
3. **Migliora descrizione** — free-text scrubbed before remote POST.
4. **Cestinato preventivo link** — `creaPreventivoDaCantiereDiretto` refuses recreate
   when linked preventivo is in Cestino (avoids dual claim).
5. Sync photo error log uses id, not filename.

---

## 4. What remains

| Item | Class |
|------|-------|
| Real iPhone / Android PWA + Capacitor smoke | P1 BEFORE BETA (human) |
| Cross-device sync A/B offline | P1 BEFORE BETA (human) |
| Remote Edge `verify_jwt=true` + server `OPENAI_API_KEY` | P0 BLOCKER for *remote* AI only |
| Expand `APP_DATA_KEYS` for satellites | 🛑 human (P1 if multi-device restore required) |
| Seed `preventivo.incassato` → `pagamenti[]` | 🛑 human |
| Diario emoji → Lucide | P3 FUTURE |
| Marketing screenshots / tag `v1.0.0-rc3` | after human GO |

---

## 5. Blockers (technical)

### P0 BLOCKER

- **None for offline-first single-device Beta** found in this audit.
- **Remote AI production:** human must deploy Edge Function with `verify_jwt=true`
  and server-only `OPENAI_API_KEY`. Repo is ready; remote is 🛑.

### P1 BEFORE BETA (first electrician cohort)

1. Device QA: install, safe-area, share→Inviato, PDF open, keyboard/sheets.
2. One offline→online sync smoke with two sessions (document LWW collection limit).
3. Confirm Impostazioni backup honesty matches expectation (satellites not in cloud).

### P2 POST BETA

- Lint warning backlog (`setState-in-effect` remount leftovers).
- Verbal address scrub in free-text AI (optional; 🛑 #5).
- Upsert-by-id on pagamento/spesa if double-submit ever bypasses UI locks.

### P3 FUTURE

- Diario emoji → Lucide (🛑 #6).
- Face ID / encrypt-at-rest (already deferred in RC3 checklist).

---

## 6. Human decisions (unchanged)

Do **not** invent architecture. See `docs/HUMAN-DECISIONS.md`:

1. Expand `APP_DATA_KEYS` for satellites  
2. `economia.movimenti` SoT  
3. Remote AI `verify_jwt` deploy  
4. Seed incassato → pagamenti on convert  
5. Verbal address scrub  
6. Diario emoji → Lucide  

---

## 7–9. Test / build / Capacitor

| Command | Sprint 25 result |
|---------|------------------|
| `npm test` | 1824 pass |
| `npm run lint` | 0 errors / 14 warnings |
| `npm run build` | OK |
| `npx cap sync ios` | OK |

---

## 10. Security (client)

| Check | Status |
|-------|--------|
| No `OPENAI_API_KEY` / `VITE_OPENAI_*` in bundle | PASS |
| Public `VITE_SUPABASE_*` / anon only | PASS |
| PIN PBKDF2, not in `APP_DATA_KEYS` | PASS |
| Express AI no longer ships CRM list | PASS (fixed) |
| Primary insight JWT + structured scrub | PASS |
| Remote Edge deploy | BLOCKED (human) |

---

## 11. Data safety

| Check | Status |
|-------|--------|
| SoT / `APP_DATA_KEYS` / storage keys | **Unchanged** this sprint |
| No destructive migration / reset | PASS |
| Convert / diretto / cestino links | PASS (+ cestinato recreate guard) |
| Save failure honesty | PASS (fixed) |
| Satellites outside backup/cloud | Documented; expand 🛑 |

---

## 12. AI (product)

| Check | Status |
|-------|--------|
| Insight does not auto-edit preventivo | PASS |
| Does not invent prices in locale Express | PASS (listino match only) |
| Offline / fallback paths | PASS |
| Remote insight | BLOCKED until human deploy |
| Express remote | Disabled (locale only) for privacy |

---

## Scenario notes (code evidence; Cloud cannot replace device)

| Scenario | Automated evidence | Device |
|----------|-------------------|--------|
| S1 Cliente→preventivo→PDF→share→inviato→accetta→cantiere | Domain + UI tests | NOT TESTABLE here |
| S2 Diretto→giornata→spesa→pagamento→chiusura | Sheet/save tests | NOT TESTABLE here |
| S3 Diretto→crea preventivo same cantiere | Unit tests | — |
| S4 False success on save failure | Fixed + storage tests | — |
| S5 Offline persist | Sync/queue tests | Device smoke pending |

---

## Next single autonomous mission

**Device QA script only (no feature work):** produce a one-page human checklist for
iPhone notch + one Android covering install, share→Inviato, PDF, sticky CTA, and
offline reopen — attach results to this document. Do not expand SoT or deploy AI.
