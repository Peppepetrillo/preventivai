# Progetto elettrico del cantiere

Feature mirata (freeze exception): allegare **un** PDF o **un’immagine** (anche scattata in app) del progetto/schema elettrico a un cantiere, consultabile offline in campo.

Entry: **Cantiere → tab Lavoro → Progetto elettrico**.

---

## UX

### Stato vuoto
- Copy: *Tieni qui lo schema del cantiere, sempre a portata di mano.*
- CTA: **＋ Aggiungi progetto** (min-height 52px)

### Aggiungi / Sostituisci (BottomSheet)
1. **Scegli PDF** — schema/documento tecnico  
2. **Scegli immagine** — dalla libreria  
3. **Scatta foto** — `input capture="environment"` (stesso pattern delle foto cantiere)

### Nome documento (BottomSheet, opzionale)
Dopo selezione/scatto: campo nome precompilato, **Salva**.  
Se vuoto → fallback (`Schema_unifilare` dal filename, oppure *Progetto elettrico* / *Schema fotografato*).

### Card salvata
- Icona + nome + `PDF · 2,4 MB` / `Immagine · …`
- CTA primaria: **Apri progetto**
- **•••** → Sostituisci / Elimina (ConfirmDialog)

---

## Modello dati

```js
cantiere.progettoElettrico = {
  id, tipo: "pdf"|"image", nome, mimeType, size,
  blobId, cantiereId, createdAt, updatedAt
}
```

**Mai** Base64 / `data:` nel LocalStorage.

---

## Storage

| Layer | Contenuto |
|-------|-----------|
| LocalStorage cantieri | Solo metadata |
| IndexedDB `preventivai-progetto-elettrico` | Blob (`cantiereId::blobId`) |

Limiti: PDF ≤ 20 MB, immagini ≤ 12 MB.  
Hard-delete cantiere → cleanup blob.

---

## Offline / cloud

- Add / open / replace / delete: **offline** (IndexedDB).
- Sync binario cloud: **non in 1.0**.
- Meta può viaggiare con `cantieri`; su altro device senza blob → “File non disponibile…”.

---

## Sicurezza route

- `CantiereOverview` remounta con `key={cantiere.id}`.
- La sezione resetta sheet/viewer/bozze su cambio `cantiereId`.
- Salvataggio ignora risultato se l’ID è cambiato a metà operazione.

---

## File codice

```
progettoElettricoBlobStore.js
progettoElettricoService.js
ProgettoElettricoSection.jsx
useCantieri (add/replace/delete)
eliminaCantiereService (cleanup)
cloudMediaPayload (sanitize meta)
```

---

## Test

Unit: validazione, nome, dimensioni, PDF/immagine, replace, delete, sanitizzazione.  
UI: empty, card+Apri, sheet 3 opzioni+camera, menu •••, ConfirmDialog, reset cambio cantiere.

---

## Limiti 1.0 / 2.0

Un solo progetto; no sync multi-device del file; no OCR/AI/annotazioni.  
Vedi `docs/PREVENTIVAI-2.0-BACKLOG.md`.
