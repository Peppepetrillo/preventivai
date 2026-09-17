# Release Hardening Report — October 2026 pre-beta freeze

**Date:** 2026-09-17  
**Branch:** `cursor/release-hardening-october-74ac`  
**Base:** release-plan tip (`52a3d8e`) + October voice/freemium work  
**Version track:** `1.0.0-rc.3` (unchanged — no commercial bump to 1.0.0)

---

## 1. Stato iniziale

- 1847 tests PASS, lint 0 errors, build OK, `cap sync ios` OK  
- Preventivo vocale baseline (full utterance → confirm) already shipped  
- Freemium domain scaffold; persistence/prices HUMAN  
- Device QA / Store still human  

## 2. Modifiche effettuate

| Area | Change |
|------|--------|
| Voice incremental | `voiceIncremental.js` + preview/confirm in `PreventivoExpress` |
| Onboarding 5′ | `OnboardingRapido` on Home — skippable, local pref only |
| Backup honesty | Impostazioni Cloud copy: CORE vs satellite device-local |
| Mic UX | Italian permission messages (settings guidance) |
| Docs | This report + DEVICE-QA / VOICE / CHANGELOG updates |

## 3. Bug trovati

- Nessun P0 nuovo in code audit  
- P2: native version `1.0` vs npm `1.0.0-rc.3` mismatch (documented, not auto-bumped)  
- Double-submit: major sheets already guard with `salvando` / `salvataggioInCorso` — no new P1  

## 4. Bug risolti

- N/A (hardening features, not defect hotfixes)  

## 5–8. Verifica

| Check | Result |
|-------|--------|
| `npm test` | **1856 PASS** / 0 FAIL |
| `npm run lint` | **0 errors** (warnings preexisting + minor) |
| `npm run build` | OK |
| `npx cap sync ios` | OK |

## 9. Voice

- Baseline: unchanged deterministic listino prices + confirm  
- Incremental: aggiungi / togli / porta a / metti — **preview then confirm**  
- Fallback: non-match → Italian message + Modifica / Scegli listino / Ignora  
- Speech offline: no fake transcript  

## 10. Offline / Backup

- No APP_DATA_KEYS change  
- Honesty UX strengthened on Cloud panel  
- Offline core paths unchanged (prior wipe-safe / `.ok` save)  

## 11. Store readiness

- Bundle ID untouched  
- Mic/camera/photo strings present  
- Version align = HUMAN before public submit  

## 12. Device QA ancora necessario

Execute `docs/DEVICE-QA-RELEASE.md` on real iPhone + Android.

## 13. Decisioni umane aperte

HUMAN #1, #3, #7, #8, #10 (see `HUMAN-DECISIONS.md`)

## 14. Rischi residui

Speech OS/network dependent; satellite loss on new phone if oversold; Store without privacy URL

## 15. Raccomandazione tecnica finale

**READY FOR DEVICE QA / TestFlight internal** — not “READY FOR STORE” until Giuseppe completes device checklist + Store listing + freemium path decision.
