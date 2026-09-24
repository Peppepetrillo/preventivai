# Backup & Sync — Release Plan (October 2026)

**Rule:** Do **not** expand `APP_DATA_KEYS` or invent SoT without HUMAN GO (#1).  
**Code:** `src/app/storageKeys.js`, `src/utils/backup.js`, cloud sync service.

---

## CORE (backup + cloud sync today)

Included in `APP_DATA_KEYS` / `creaBackupCompleto()`:

| Key | Content |
|-----|---------|
| `archivioPreventivi` | Preventivi |
| `cantieri` | Cantieri (incl. spese, pagamenti, giornate nested) |
| `clienti` | Clienti |
| `datiAzienda` | Azienda / operatore |
| `listinoLocale` | Listino |
| `preventivai:esperienze` | Experience engine |
| `preventivai.operai` | Operai (backup locale via `BACKUP_DATA_KEYS`; **not** cloud sync) |

**Changing phone + restore/sync:** CORE keys come back via cloud; operai come back via **file backup** restore (not cloud in 1.0).

---

## SATELLITE (device-local today)

Present in `STORAGE_KEYS` / Preferences but **outside** `APP_DATA_KEYS` (and mostly outside backup unless listed in `BACKUP_DATA_KEYS`):

| Area | Key(s) | Lost on new device? |
|------|--------|---------------------|
| Operai | `preventivai.operai` | **No** if restore from file backup (`BACKUP_DATA_KEYS`); **Yes** if cloud-only |
| Distinte materiali | `preventivai.distinteMateriali` | **Yes** (unless export) |
| Lista spesa / acquisti | `preventivai.listaSpesa` | **Yes** |
| Firme | `preventivai.firme` | **Yes** |
| Varianti + timeline | `preventivai.varianti*` | **Yes** |
| Catalogo materiali custom | `preventivai.catalogoMateriali` | **Yes** |
| Agenda attività | `preventivai.attivita` | **Yes** |
| Workflow / brain / insights | various `preventivai.*` | **Yes** |
| PIN / app lock | `pinAccesso`, app-lock | Device-only (correct) |
| Backup automatico config/snapshot | `backupAutomatico.*` | Local |

**Impostazioni** already carries honesty copy (option B interim).

---

## Proposal (for Giuseppe — not implemented)

| Option | Action | Risk |
|--------|--------|------|
| **B (Oct default)** | Keep satellites local; loud release notes + Impostazioni | Low code risk; user education |
| **C** | Expand only `distinte` + `firme` into APP_DATA_KEYS | Medium; needs migration tests |
| **A** | Full satellite expansion | Highest; defer post-Oct |

**CTO recommendation for inizio ottobre:** ship **B**. Schedule **C** only if beta users hit multi-device pain.

---

## Sync limits (declare in release notes)

- Offline queue + Preferences hydrate: READY (tests).
- Conflict model: **LWW per collection** — last writer wins whole collection.
- Photos: path-based; no `data:` orphans in cloud payloads (hardened).

---

## Agent autonomy

| Allowed | Forbidden |
|---------|-------------|
| Honesty UX, tests documenting boundaries | Change `APP_DATA_KEYS` |
| Backup download/restore of CORE | New SoT `economia.movimenti` (#2) |
| Document satellite loss scenarios | Silent sync of satellites |
