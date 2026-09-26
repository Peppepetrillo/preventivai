# Freemium — Trial 15 giorni

## Commercial model (product)

```
TRIAL (15 giorni gratis)
  ↓ scadenza
FREE
  ↓ upgrade (Store / restore)
PRO
```

- Trial: clear, transparent, non-deceptive.
- After trial: user data **must remain** (no wipe, no lockout of existing records).
- Monetary prices: **not decided** — see HUMAN-DECISIONS.
- Which features are PRO: **not decided** — see HUMAN-DECISIONS.

## Code (safe scaffolding)

Pure domain (no new `STORAGE_KEYS` / `APP_DATA_KEYS`):

- `src/domain/freemium/freemiumDomain.js`
  - `TRIAL_GIORNI = 15`
  - `calcolaStatoFreemium({ trialIniziatoIl, pianoOverride, abbonamentoAttivo })`
  - `valutaAccessoFeature` — soft; Free not blocked until catalog decided

AI gate hook remains open: `puoEseguireAnalisiAi` (ready to wire piano later).

## Persistence — blocked

Starting/storing `trialIniziatoIl` needs a storage key decision (HUMAN GO).
Until then, domain is testable and UI can show “15 giorni all’attivazione” without inventing keys.

## Paywall principles

- Non-destructive: never delete clienti / preventivi / cantieri on expiry.
- Show remaining days during trial.
- Upgrade + restore purchase placeholders for Store wiring (Apple/Google) — human accounts.
