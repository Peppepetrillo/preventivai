# Freemium — Release Plan (October 2026)

**Status:** scaffolding READY · store ship **BLOCKED — HUMAN**  
**Code:** `src/domain/freemium/freemiumDomain.js` (`TRIAL_GIORNI = 15`)  
**Do not invent € prices or PRO feature lists.**

---

## Commercial ladder

```
TRIAL (15 giorni gratis, trasparente)
        ↓ scadenza automatica
FREE (dati conservati; limiti TBD)
        ↓ upgrade / restore purchase
PRO (catalogo feature TBD)
```

### Principles (non-negotiable)

- Trial clear, not dark-pattern.
- On expiry: **never delete** clienti / preventivi / cantieri / listino.
- Paywall non-destructive (read existing data always).
- Restore purchase required for Store guidelines when IAP ships.

---

## TRIAL 15 GIORNI

| Item | Status |
|------|--------|
| Duration constant | READY (`TRIAL_GIORNI = 15`) |
| Remaining-days calculator | READY (`calcolaStatoFreemium`) |
| Trial start timestamp persist | **BLOCKED — HUMAN** (#7) |
| UI banner “X giorni rimanenti” | NEEDS WORK (after #7) |
| Soft paywall at day 0 | BLOCKED until #8 |

**Recommended after GO #7:** option A — `STORAGE_KEYS.abbonamento` device-local, **outside** `APP_DATA_KEYS` until Store sync designed.

---

## FREE

| Item | Status |
|------|--------|
| Piano enum | READY |
| Feature limits | **BLOCKED — HUMAN** (#8) |
| Data retention | READY (domain guarantees `datiConservati: true`) |
| Soft message | READY in domain copy |

Until #8: `valutaAccessoFeature` does **not** hard-block Free (avoids shipping empty paywall).

---

## PRO

| Item | Status |
|------|--------|
| Piano enum / override | READY |
| Store product IDs | **BLOCKED — HUMAN** |
| Feature catalog | **BLOCKED — HUMAN** (#8) |
| Entitlement sync | FUTURE (RevenueCat / StoreKit / Play Billing) |

---

## FEATURE GATING

Wire points already reserved:

- `puoEseguireAnalisiAi({ piano })` — always `ok: true` today  
- `valutaAccessoFeature({ piano, feature })` — soft Free signal only  

**Do not gate** core offline work (clienti, preventivi, cantieri, PDF) without explicit commercial GO — electricians must keep working after trial.

Suggested (for Giuseppe to approve, not implement):

| Feature | Trial | Free | Pro |
|---------|-------|------|-----|
| Core CRUD + PDF | ✅ | ✅ | ✅ |
| Preventivo vocale | ✅ | ? | ✅ |
| AI insight remoto | ✅ | limit / no | ✅ |
| Sync multi-device | ✅ | ? | ✅ |
| Satellite sync | TBD | TBD | TBD |

`?` = **HUMAN DECISION** — agent must not fill.

---

## HUMAN DECISIONS (blocking Store freemium)

| ID | Decision | Options |
|----|----------|---------|
| #7 | Where to persist `trialIniziatoIl` | A abbonamento key · B datiAzienda · C cloud auth |
| #8 | Prices + PRO catalog | Giuseppe commercial |
| NEW | October path | **(X)** unpaid public beta no IAP · **(Y)** trial+IAP after #7+#8 |

**Recommendation CTO:** Path **X** for inizio ottobre if #7/#8 not decided by Week 1 end; add IAP in a fast follow without data migration pain.

---

## Agent autonomy

| Allowed | Forbidden |
|---------|-------------|
| Domain tests, UI copy “15 giorni” after GO | Invent STORAGE_KEYS |
| Non-destructive paywall shell after #8 | Invent € |
| Restore-purchase placeholder UI | Delete data on expiry |
