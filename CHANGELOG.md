# Changelog

## 1.0.0-rc.3 — 2026-07-22

### Sicurezza
- PIN locale opzionale con hash PBKDF2 (migrazione automatica da PIN legacy in chiaro)
- Timeout di inattività configurabile; blocco sessione senza impatto sul cloud sync
- Stub predisposizione Face ID / Touch ID
- `android:allowBackup=false`; `.env` in `.gitignore`

### Robustezza dati (RC-2A, confermata)
- Esperienze in sync/backup
- Wipe-safe per nuove chiavi cloud
- Foto: path immutabili, niente full `data:` in `app_records`
- UI live post-sync (Dashboard, Cantieri, Clienti, Incassi, Archivio)

### UX & navigazione (RC-2B, confermata)
- Percorso Cantieri unificato `/cantiere/:id`
- Archivio in BottomNav (tab Preventivi)
- Highlight Incassi/Preventivi corretto
- CTA Sopralluogo non operativa rimossa dalla Home

### Performance
- Paginazione progressiva liste (Archivio, Clienti, Cantieri)
- Stress test automatici su dataset grandi (500/1000/300)

### Documentazione
- README prodotto, checklist RC-3, versione npm `1.0.0-rc.3`

## 1.0.0-rc.2 — 2026-07-22

- RC-2A Data Trust + RC-2B UX Navigation Completion

## 1.0.0-rc.1 — 2026-07-22

- RC-1A Cloud Integrity + RC-1B Cantieri Unified Experience
