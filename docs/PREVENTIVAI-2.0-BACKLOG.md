# PreventivAI 2.0 — Backlog (non implementare in 1.0)

**Status:** frozen ideas for post-1.0.  
**Rule:** Do **not** implement these during release freeze. Ship 1.0 first.

Source of roadmap UI: `src/features/roadmap/prossimamenteCatalog.js` (display only).

---

## Feature list

### 1. PDF-by-voice
- **Idea:** After voice draft, say “Genera il PDF” with explicit confirm.
- **Value:** Fewer taps from sopralluogo to send.
- **Dependencies:** Wizard PDF pipeline, confirm UX, no silent status change.
- **Risk:** Medium — accidental PDF / wrong stato.
- **1.0:** Not implemented.

### 2. Face ID / Touch ID
- **Idea:** Biometric unlock alongside PIN.
- **Value:** Faster unlock on site.
- **Dependencies:** Capacitor biometric plugin, Apple/Google entitlements.
- **Risk:** Medium — device QA, fallback PIN.
- **1.0:** Not implemented (stub note in Impostazioni only).

### 3. Encrypt-at-rest
- **Idea:** Protect local storage / Preferences beyond PIN gate.
- **Value:** Stronger data protection if device unlocked.
- **Dependencies:** Crypto design, migration, performance on mid Android.
- **Risk:** High — data loss if keys mishandled.
- **1.0:** Not implemented.

### 4. `economia.movimenti` SoT
- **Idea:** Movements without cantiere (payroll, materials outside job).
- **Value:** Full P&L for the electrician.
- **Dependencies:** HUMAN SoT decision (#2), migration, no duplicate with cantiere spese/pagamenti.
- **Risk:** High — double counting.
- **1.0:** Not implemented (cantiere-only remains).

### 5. Diario Lucide icons
- **Idea:** Replace emoji icons in diario with Lucide.
- **Value:** Design-system consistency.
- **Dependencies:** Visual QA map of event types.
- **Risk:** Low.
- **1.0:** Deferred P3 (HUMAN #6).

### 6. Multi-listino / brand catalogs
- **Idea:** BTicino / Vimar / Gewiss / personale listini.
- **Value:** Faster quoting with preferred brands.
- **Dependencies:** Catalog architecture already partially reserved; seed discipline.
- **Risk:** Medium — UX complexity, storage size.
- **1.0:** Not implemented.

### 7. Backup / sync satellites
- **Idea:** Expand backup+sync to distinte, firme, varianti, lista spesa.
- **Value:** New phone without losing satellite data.
- **Dependencies:** HUMAN APP_DATA_KEYS GO (#1).
- **Risk:** High — sync surface, backup size.
- **1.0:** Honesty copy only; expansion blocked.

### 8. Voice evolutions
- **Idea:** “Fammi vedere il totale”, multi-turn editing, materials via voice.
- **Value:** Hands-busy cantiere speed.
- **Dependencies:** Incremental cmds (partially shipped in 1.0), TTS optional.
- **Risk:** Medium — false matches.
- **1.0:** Baseline + incremental qty only.

### 9. Cloud AI as Pro upsell
- **Idea:** Gate remote insight behind PRO after commercial decision.
- **Value:** Smarter comparisons when online.
- **Dependencies:** HUMAN #3 deploy, #8 catalog, privacy.
- **Risk:** Medium — PII, cost.
- **1.0:** Optional; locale fallback required.

### 10. Onboarding analytics / tips engine
- **Idea:** Contextual tips after first week.
- **Value:** Retention without long tutorials.
- **Dependencies:** Local prefs only (no creepy tracking without GO).
- **Risk:** Low–medium (noise).
- **1.0:** Static 5′ onboarding only.

---

## Priority suggestion (for Giuseppe, not agents)

| Priority | Items |
|----------|--------|
| After beta feedback | Voice evolutions, Diario Lucide |
| After Store live | Face ID, satellite backup (#1) |
| Major 2.0 | economia.movimenti, multi-listino, encrypt-at-rest |

---

## Explicitly out of 1.0 freeze

Do not start: new SoT, IAP, pricing, Bundle ID change, destructive migrations, PDF-by-voice architecture.

---

## Calcoli elettrici — evoluzioni 2.0

Baseline 1.0 (freeze exception): Ohm, potenza/corrente, caduta indicativa, stima sezione (solo ΔU), consumo, conversioni, stima carico. Offline, no save.

**Non implementare in 1.0:**

- Dimensionamento più completo (portata, posa, temperatura, fattori di correzione)
- Verifica coordinamento protezioni
- Calcoli trifase avanzati (sbilanciamento, sequenze)
- Rifasamento
- Motori / avviamento
- Trasformatori
- Fotovoltaico / batterie
- Impianti speciali
- Memoria ultimi calcoli / storico locale
- Collegamento calcoli a un cantiere
- Esportazione PDF dei risultati
- Claim normativi o “sezione a norma” automatica

---

## Progetto elettrico — evoluzioni 2.0

Baseline 1.0: un PDF/immagine per cantiere, IndexedDB locale, Apri/Sostituisci/Elimina. Nessun sync binario cloud.

**Non implementare in 1.0:**

- Più progetti per cantiere (unifilare, planimetria, quadro, documenti tecnici)
- Annotazioni / markup sul PDF
- OCR / AI lettura schema
- Riconoscimento simboli
- Collegamento progetto → materiali / preventivo
- Sync multi-device del file (bucket dedicato + coda offline)
- Firma digitale sul progetto
- Condivisione avanzata
