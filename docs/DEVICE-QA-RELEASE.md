# Device QA — October Release (manual)

**Owner:** Giuseppe  
**Build:** `1.0.0-rc.3` after `npm run build && npx cap sync`  
**Cloud agents must mark hardware rows as `NOT TESTED` only.**

Legend: `NOT TESTED` · `PASS` · `FAIL` · note  

---

## iPhone

| # | Scenario | Result |
|---|----------|--------|
| 1 | Installazione | NOT TESTED |
| 2 | Apertura | NOT TESTED |
| 3 | Onboarding + Salta per ora | NOT TESTED |
| 4 | Home (CTA preventivo / vocale) | NOT TESTED |
| 5 | Dynamic Island / safe area | NOT TESTED |
| 6 | Tastiera | NOT TESTED |
| 7 | Preventivo wizard | NOT TESTED |
| 8 | Voice baseline | NOT TESTED |
| 9 | Voice incremental | NOT TESTED |
| 10 | Microfono permesso/negato | NOT TESTED |
| 11 | Quick Quote `?express=1` | NOT TESTED |
| 12 | PDF | NOT TESTED |
| 13 | Share + Inviato | NOT TESTED |
| 14 | Cliente | NOT TESTED |
| 15 | Cantiere (+ diretto) | NOT TESTED |
| 16 | Giornata | NOT TESTED |
| 17 | Spesa | NOT TESTED |
| 18 | Pagamento | NOT TESTED |
| 19 | Economia | NOT TESTED |
| 20 | Offline → chiusura → riapertura | NOT TESTED |
| 21 | Sync | NOT TESTED |
| 22 | PIN | NOT TESTED |
| 23 | Firma | NOT TESTED |
| 24 | Cestino | NOT TESTED |
| 25 | Navigation / edge swipe | NOT TESTED |
| 26 | Altro → Prossimamente (no fake actions) | NOT TESTED |

---

## Android

| # | Scenario | Result |
|---|----------|--------|
| A1 | Installazione | NOT TESTED |
| A2 | Onboarding | NOT TESTED |
| A3 | Home | NOT TESTED |
| A4 | Hardware Back | NOT TESTED |
| A5 | Voice + mic | NOT TESTED |
| A6 | PDF + share | NOT TESTED |
| A7 | Offline + sync | NOT TESTED |
| A8 | Keyboard | NOT TESTED |
| A9 | Navigation | NOT TESTED |
| A10 | Altro → Prossimamente | NOT TESTED |

---

## Sign-off

| Role | Date | GO / NO-GO |
|------|------|------------|
| Giuseppe | | |

Next after PASS: TestFlight / internal → fix P0/P1 only → beta → Store.
