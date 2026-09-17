# Device QA — October Release (manual)

**Owner:** Giuseppe (+ optional agent assist — Cloud ≠ real device)  
**Devices:** 1× iPhone (notch/Dynamic Island) + 1× Android mid-range  
**Build:** `1.0.0-rc.3` after `npm run build && npx cap sync`  
**Pass rule:** every P0 row PASS before Store submit.

Legend: ☐ todo · ✅ PASS · ❌ FAIL · ⚠ note  

For each row fill: **PASS / FAIL / NOTE**

---

## iPhone

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Installazione (TestFlight / Xcode) | ☐ | |
| 2 | Apertura / primo avvio (no crash) | ☐ | |
| 3 | Safe area + Dynamic Island vs BottomNav | ☐ | |
| 4 | Tastiera non copre CTA principali | ☐ | |
| 5 | Scroll liste preventivi/cantieri | ☐ | |
| 6 | Onboarding 5′ → Salta per ora | ☐ | |
| 7 | **Preventivo vocale** mic + Analizza + Conferma | ☐ | |
| 8 | Comando «Aggiungi 10 prese» → preview → conferma | ☐ | |
| 9 | Mic negato → messaggio italiano (no exception) | ☐ | |
| 10 | Offline: digita voce request (no fake STT) | ☐ | |
| 11 | PDF genera | ☐ | no empty blocks / no invented fields |
| 12 | Share + «Segna inviato?» | ☐ | |
| 13 | Offline CRUD → kill → reopen → sync later | ☐ | |
| 14 | PIN set/unlock | ☐ | |
| 15 | Cestino restore | ☐ | |
| 16 | Firma cliente | ☐ | |
| 17 | Edge swipe back (no fight with sheets) | ☐ | |
| 18 | Impostazioni: copy satellite device-local | ☐ | |

---

## Android

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| A1 | Install APK / Play internal | ☐ | |
| A2 | Hardware back (wizard, sheets, cantiere) | ☐ | |
| A3 | Mic permission + Preventivo vocale | ☐ | |
| A4 | Incremental voice confirm | ☐ | |
| A5 | PDF + share | ☐ | |
| A6 | Offline reopen | ☐ | |
| A7 | Keyboard + navigation gestures | ☐ | |
| A8 | Sync status honesty (CORE only) | ☐ | |

---

## Sign-off

| Role | Name | Date | GO / NO-GO |
|------|------|------|------------|
| QA | | | |
| Giuseppe | | | |

**Do not mark PASS without real device execution.**
