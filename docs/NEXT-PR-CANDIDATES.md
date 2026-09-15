# Next small PR candidates (inspection only)

Generated for Cloud Agent overnight handoff. **No data-model changes in this note.**

## Candidate A — Cantieri ↔ Preventivi link clarity (recommended next)

**Why:** Operators need to trust when a cantiere already has a preventivo, when “Crea preventivo” should attach vs create, and when Incassi vs Economia apply.

**Safe scope for a follow-up PR:**

- Audit services that create/link cantieri and preventivi (search `creaCantiere`, `collega`, `preventivoId`, `origine`).
- Add/extend domain tests for:
  - cantiere diretto → crea preventivo → stesso `cantiereId`
  - preventivo → inizia cantiere → no duplicate cantiere
  - soft-delete + restore preserves `preventivoId` / payments / spese
- UX copy only if needed (no SoT change): Incassi = preventivi pre-cantiere; Economia = movimenti reali.

**Stop if:** requires changing storage keys, sync semantics, or payment SoT.

## Candidate B — Offline dataset coverage documentation + tests

**Why:** Backup/sync currently covers `APP_DATA_KEYS` / `CHIAVI_DATI_APP`. Several operational keys remain device-local (catalogo, attività, brain, …).

**Safe scope:**

- Tests that assert which keys are included vs excluded from backup (no key migrations).
- Doc table in `docs/` or README cloud section listing local-only keys and risk.

**Stop if:** expanding `APP_DATA_KEYS` without explicit human approval.

## Candidate C — Continue lint cleanup (`set-state-in-effect`)

**Why:** Remaining warnings are mostly sheet/form sync effects.

**Safe scope:** one page at a time with existing tests; prefer remount `key=` / lazy init over behavior changes.

**Stop if:** unclear UX for Agenda/Cantieri/Distinte/Wizard sheets.
