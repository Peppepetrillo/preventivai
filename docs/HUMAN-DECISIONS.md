# Human decisions required — production readiness

Documented by Cloud Agent. Do **not** invent product architecture without GO.

## 1. Expand `APP_DATA_KEYS` for satellite data?

**Problem:** Distinte materiali, lista spesa, firme, varianti (+ timeline) are
device-local today. Backup/cloud restore of cantieri/preventivi does **not**
bring them back on a new device.

**Options:**
- A) Expand `APP_DATA_KEYS` + backup + sync (backward-compatible defaults)
- B) Keep device-local; improve UX honesty (done in Impostazioni copy)
- C) Partial: only distinte + firme first

**Consequences:** A changes sync surface and backup size; needs migration tests.
B risks silent data loss on new phone. C reduces risk stepwise.

**Files:** `src/app/storageKeys.js`, `src/utils/backup.js`, `cloudSyncService.js`

**Status:** 🛑 Waiting human GO. Interim: B copy shipped.

## 2. General `preventivai.economia.movimenti` SoT?

**Problem:** Economia today = `cantiere.pagamenti[]` + `cantiere.spese[]` only.
No movements without cantiere.

**Options:** invent new SoT key vs keep cantiere-only.

**Status:** 🛑 Not invented. UI already explains.

## 3. Remote AI `verify_jwt` deploy

**Problem:** Repo has JWT-required Edge Function; production project may still
need human deploy of secrets + `verify_jwt=true`.

**Command (human):** deploy `analisi-preventivo-intelligence` with server
`OPENAI_API_KEY` only; never `VITE_OPENAI_*`.

**Status:** 🛑 Human deploy.

## 4. Seed `preventivo.incassato` → `cantiere.pagamenti[]` on convert

**Status:** 🛑 Product SoT decision (session banner exists today).

## 5. AI scrub of verbal addresses in free-text

**Status:** 🛑 Optional; structured PII scrub already shipped.
