# PreventivAI — Documentation changelog

## 2026-09-15 — Preventivo → Cantiere hardening

- Confirmed existing workflow (no rewrite): Accettato → Crea cantiere → link bi-direzionale.
- Added `APP_EVENTS.cantieriAggiornati` fired from `salvaCantieri`.
- UI: CTA label «Crea cantiere», busy lock, clearer post-conversion banner.
- Service: `creaCantierePerPreventivoId` (strict Accettato).
- Tests: rejection cases, reload persistence, offline sync queue + event.
- See `docs/PREVENTIVO-CANTIERE.md`.
