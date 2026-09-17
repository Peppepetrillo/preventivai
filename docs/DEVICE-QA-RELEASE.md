# Device QA — October Release (manual)

**Owner:** Giuseppe (+ optional agent assist on Cloud — Cloud ≠ real device)  
**Devices:** 1× iPhone (notch/Dynamic Island) + 1× Android mid-range  
**Build:** `1.0.0-rc.3` / Capacitor sync after `npm run build`  
**Pass rule:** every P0 row PASS before Store submit.

Legend: ☐ todo · ✅ pass · ❌ fail · ⚠ note

---

## iPhone

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Installazione (TestFlight / Xcode) | ☐ | |
| 2 | Primo avvio (no crash, Home) | ☐ | |
| 3 | Onboarding: CTA dati azienda se vuoti | ☐ | |
| 4 | Cliente nuovo + salva | ☐ | |
| 5 | Preventivo wizard manuale | ☐ | |
| 6 | **Preventivo vocale** (mic permission + Analizza + Conferma) | ☐ | Offline: digita |
| 7 | PDF genera / anteprima | ☐ | No campi inventati |
| 8 | Share sheet / WhatsApp / Mail + «Segna inviato?» | ☐ | |
| 9 | Accetta → Cantiere (no duplicato) | ☐ | |
| 10 | Cantiere diretto da cliente | ☐ | |
| 11 | Giornata previsto + fatto | ☐ | |
| 12 | Spesa | ☐ | |
| 13 | Pagamento / incasso | ☐ | |
| 14 | Economia cantiere coerente | ☐ | |
| 15 | Materiali / catalogo | ☐ | |
| 16 | Distinta → acquisti | ☐ | |
| 17 | Variante | ☐ | |
| 18 | Foto cantiere (camera perm) | ☐ | |
| 19 | Diario / nota | ☐ | |
| 20 | Chiusura cantiere | ☐ | |
| 21 | Storico / Completati copy | ☐ | |
| 22 | Cestino elimina + ripristina | ☐ | |
| 23 | Backup export / restore smoke | ☐ | CORE only |
| 24 | Offline: modifica → kill app → riapri → sync later | ☐ | |
| 25 | AI insight (se endpoint live) o fallback IT | ☐ | |
| 26 | Navigazione indietro / gesture | ☐ | |
| 27 | Safe area vs BottomNav / sticky CTA | ☐ | |
| 28 | Keyboard non copre input principali | ☐ | |
| 29 | Lock PIN set/unlock | ☐ | |

---

## Android (essential)

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| A1 | Install APK / Play internal | ☐ | |
| A2 | Hardware back (wizard, sheets, cantiere) | ☐ | |
| A3 | Safe area / gesture nav | ☐ | |
| A4 | Keyboard | ☐ | |
| A5 | Mic permission + Preventivo vocale | ☐ | |
| A6 | Camera / photos | ☐ | |
| A7 | Share PDF | ☐ | |
| A8 | Offline reopen | ☐ | |
| A9 | File backup share | ☐ | |

---

## Sign-off

| Role | Name | Date | GO / NO-GO |
|------|------|------|------------|
| QA | | | |
| Giuseppe | | | |

**Known Cloud limitation:** agents cannot replace this checklist.
