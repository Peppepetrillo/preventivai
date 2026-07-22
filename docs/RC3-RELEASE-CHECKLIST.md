# RC-3 — Release Checklist & Validation

Versione target: **1.0.0-rc.3** · Tag Git consigliato: **`v1.0.0-rc3`**

## Automatizzato (CI / locale)

| Check | Comando | Esito atteso |
|-------|---------|--------------|
| Test | `npm test` | tutti verdi |
| Lint | `npm run lint` | zero errori |
| Build | `npm run build` | ok |

## Sicurezza

- [x] PIN mai in plaintext (hash PBKDF2)
- [x] Disattivazione blocco (campo PIN vuoto + Salva)
- [x] Timeout inattività configurabile
- [x] PIN fuori da `APP_DATA_KEYS` (no sync)
- [x] Android `allowBackup=false`
- [ ] Face ID / Touch ID nativo — **rimandato post-1.0** (stub pronto)
- [ ] Encrypt-at-rest LocalStorage — **rimandato 1.1**

## Performance (codice)

- [x] Liste grandi: render a pagine (80) + “Mostra altri”
- [x] Clienti: rimosse animazioni Framer per-riga (costose su N alti)
- [x] Stress test filtro 1000 preventivi &lt; 100ms
- [ ] Profiling device reale (iPhone mid-range / Android) — **QA manuale**

## Stress test (automatico)

- [x] 500 clienti / 1000 preventivi / 300 cantieri in storage+backup
- [x] Sanitizzazione foto `data:` verso cloud
- [x] Nessun id duplicato su dataset sintetico
- [ ] Stress UI su device (scroll continuo, foto reali) — **QA manuale**

## PWA (manuale — dispositivi reali)

- [ ] Installazione (iOS Safari / Android Chrome)
- [ ] Icona + splash
- [ ] Offline shell + riapertura dopo sospensione
- [ ] Update `registerType: autoUpdate` dopo nuovo deploy
- [ ] HashRouter deep link (`/#/cantiere/:id`)

Config verificata in codice: `vite.config.js` (manifest, autoUpdate), icone `public/icon-192.png` / `icon-512.png`.

## Cloud (manuale + test unitari esistenti)

Scenario A→offline→modifiche→online→B:

- [x] Coda offline vs realtime (RC-1A test)
- [x] Wipe-safe nuove chiavi (RC-2A test)
- [x] Esperienze in sync keys
- [ ] Validazione cross-device reale con due account/sessioni — **QA manuale**
- [ ] Limite noto: LWW a **collezione intera** (conflitti multi-writer) — documentato

## Qualità

- [x] Nessun `console.log` di debug in `src/`
- [x] `.env` ignorato da git
- [x] README / CHANGELOG aggiornati
- [ ] Screenshot marketing ufficiali — **da acquisire in QA**
- [ ] Tag Git `v1.0.0-rc3` — dopo commit di rilascio

## Go / No-Go (bozza tecnica)

| Criterio | Stato |
|----------|--------|
| Nessuna perdita dati nota (single device + coda) | OK |
| Test/lint/build verdi | da confermare in run finale |
| Bug critici aperti | nessuno noto post RC-1/2/3 codice |
| Cloud multi-writer perfetto | **NO** (LWW collezione) — OK se release notes lo dichiarano |
| PWA su device | **pending QA** |
| PIN sicuro | OK (hash); non è full-disk encryption |

**Raccomandazione CTO:** **GO condizionato** a (1) smoke PWA su 1 iPhone + 1 Android, (2) un passaggio cloud A/B offline, (3) release notes che dichiarano limiti multi-device e assenza biometria.
