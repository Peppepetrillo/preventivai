# Preventivo → Cantiere

## Status

Implemented and hardened on branch `cursor/feature-preventivo-to-cantiere-74ac`.

## Flow (existing architecture)

```text
Preventivo (Accettato)
  → CTA «Crea cantiere» (hero / banner)
  → convertiInCantiere(preventivoId)  [domain/workflow]
  → creaCantiereDaPreventivo(preventivo)  [cantieriDomain]
  → persist LocalStorage + cloud queue
  → preventivo.cantiereId ↔ cantiere.preventivoId
  → navigate to cantiere (Pagamenti)
  → banner «Cantiere creato»
```

## Key APIs

| Layer | Symbol |
|-------|--------|
| Domain | `creaCantiereDaPreventivo` |
| Workflow | `convertiInCantiere`, `accettaPreventivo` |
| Service | `creaCantierePerPreventivoId`, `convertiPreventivoInCantiere` (legacy auto-accept) |
| Events | `APP_EVENTS.cantieriAggiornati`, `preventiviAggiornati` |

## Guarantees

- No duplicate cantiere on double convert / legacy `preventivoId` link
- Rejects non-accepted and missing preventivo (`solo_accettato_convertibile`, `preventivo_non_trovato`)
- Offline: `salvaCantieri` / `salvaPreventivi` enqueue via existing cloud sync
- UI busy lock prevents double-tap while converting
