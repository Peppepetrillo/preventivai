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

## 6. Diario event icons: emoji → Lucide

**Problem:** `features/diario/events/constants.js` still uses emoji icons; DS says Lucide only.

**Options:** map each `DIARIO_EVENT_TYPES` to a Lucide icon in timeline UI.

**Status:** 🛑 Deferred P3 (Sprint 22A) — typography polished; icon swap needs visual QA.

## 7. Freemium persistence key for trial start

**Problem:** Trial 15 giorni needs `trialIniziatoIl` (and later Store entitlement) persisted.
Domain logic exists in `src/domain/freemium/freemiumDomain.js` without a storage key.

**Options:**
- A) New `STORAGE_KEYS.abbonamento` (device-local, outside APP_DATA_KEYS until Store sync)
- B) Field on `datiAzienda` (changes azienda shape)
- C) Supabase Auth metadata / RevenueCat (cloud-only)

**Consequences:** A needs NATIVE key + backup decision; B touches azienda SoT; C needs accounts.

**Status:** 🛑 Waiting human GO. Do not invent STORAGE_KEYS.

## 8. Freemium — prezzi e catalogo feature PRO

**Problem:** Commercial model is TRIAL → FREE → PRO, but € prices and which features are Free vs Pro are undefined.

**Status:** 🛑 Human commercial decision. Paywall must stay non-destructive (data retained).

## 9. Voice incremental commands

**Problem:** Full-utterance Preventivo vocale is shipped (match + confirm). Incremental commands
(“Aggiungi 10 prese”, “Elimina due punti luce”, “Fammi vedere il totale”) not yet implemented.

**Status:** 🛑 / P2 product — document in VOICE-QUOTE.md; implement after October baseline.

## 10. October public path: unpaid beta vs IAP

**Problem:** Inizio ottobre may arrive before prices (#8) and trial persistence (#7) are decided.

**Options:**
- **X)** Public/TestFlight beta **without** IAP/paywall; add freemium in fast follow
- **Y)** Full TRIAL→FREE→PRO before Store submit (requires #7+#8)

**Status:** 🛑 Waiting Giuseppe. CTO recommendation in `FREEMIUM-RELEASE-PLAN.md`: prefer **X** if #7/#8 slip.
