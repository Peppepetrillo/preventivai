# Progetti elettrici del cantiere

Feature mirata: allegare **0→N** PDF o immagini (anche scattate in app) del progetto/schema elettrico a un cantiere, consultabili offline in campo, con zoom su apertura.

Entry: **Cantiere → tab Lavoro → Progetti elettrici**.

---

## UX

### Stato vuoto
- Titolo: **Progetti elettrici**
- Copy: *Gli schemi e i progetti di questo lavoro, sempre a portata di mano.*
- CTA: **＋ Aggiungi progetto** (min-height 52px)

### Con progetti
- Titolo + CTA **＋ Aggiungi progetto** in alto
- Lista card (una per progetto): icona · nome · `PDF · 2,4 MB` / `Immagine · …`
- **Apri progetto** + **•••** (Rinomina / Sostituisci / Elimina)

### Aggiungi / Sostituisci (BottomSheet)
1. **Scegli PDF**
2. **Scegli immagine**
3. **Scatta foto** — `input capture="environment"`

Ogni **Aggiungi** crea un **nuovo** progetto (non sostituisce gli esistenti).  
**Sostituisci** aggiorna solo il progetto selezionato (nuovo blob prima, cleanup del vecchio dopo).

### Nome documento (BottomSheet, opzionale)
Dopo selezione/scatto: campo nome precompilato, **Salva**.

### Viewer
- **Immagine**: `CantiereFotoViewer` fullscreen — pinch-to-zoom, pan se zoomato, doppio tap
- **PDF**: `PdfAnteprima` con `abilitaZoom` → canvas same-document (`PdfZoomStage` + pdf.js) e pinch/pan/double-tap condivisi con foto (`usePinchZoomPan`). Senza zoom resta iframe FitH.

---

## Modello dati

```js
cantiere.progettiElettrici = [
  {
    id, tipo: "pdf"|"image", nome, mimeType, size,
    blobId, cantiereId, createdAt, updatedAt
  },
  // …
]
```

**Mai** Base64 / `data:` nel LocalStorage.

### Migrazione (idempotente)

```
cantiere.progettoElettrico  →  cantiere.progettiElettrici = [quel progetto]
```

- Non duplica se già migrato
- Conserva lo stesso `blobId` (nessuna copia del binario)
- `elencaProgettiElettrici(cantiere)` legge array o legacy senza mutare

---

## Storage

| Layer | Contenuto |
|-------|-----------|
| LocalStorage cantieri | Solo metadata (array) |
| IndexedDB `preventivai-progetto-elettrico` | Blob (`cantiereId::blobId`) |

Limiti: PDF ≤ 20 MB, immagini ≤ 12 MB.  
Lista = solo metadata (blob caricati on-demand all’apertura).  
Hard-delete cantiere → cleanup di tutti i blob del cantiere.  
Elimina singolo → solo quel blob.

---

## Offline / cloud

- Add / open / replace / delete / rename: **offline** (IndexedDB).
- Sync binario cloud: **non in 1.0**.
- Meta può viaggiare con `cantieri`; su altro device senza blob → “File non disponibile…”.
- Non dichiarare sincronizzato un file non uploadato.

---

## Sicurezza route / cambio cantiere

- `CantiereOverview` remounta con `key={cantiere.id}`.
- La sezione resetta sheet/viewer/bozze su cambio `cantiereId`.
- Salvataggio ignora risultato se l’ID è cambiato a metà operazione.
- Progetti del cantiere A non compaiono nel B.

---

## File codice

```
progettoElettricoBlobStore.js
progettoElettricoService.js   (lista, migrazione, CRUD)
pinchZoomPan.js / usePinchZoomPan.js
ProgettoElettricoSection.jsx
CantiereFotoViewer.jsx (zoom)
PdfAnteprima.jsx (zoom)
useCantieri (add/replace/delete/rename)
eliminaCantiereService (cleanup multi)
cloudMediaPayload (sanitize array + legacy)
```

---

## Test

Unit: empty/1/2/3+, PDF/immagine, replace target, delete leave others, migrazione + idempotenza, cambio cantiere, blob distinti, cleanup, offline open, no Base64, pinchZoomPan.  
UI: empty, lista multi, sheet 3 opzioni+camera, menu ••• Rinomina/Sostituisci/Elimina, ConfirmDialog con id, reset cambio cantiere, open viewer zoom.

---

## Limiti 1.0 / 2.0

Multi-progetto locale sì; sync multi-device del binario no; no OCR/AI/annotazioni.  
Zoom reale pinch: implementato via canvas+pdf.js; **validare su iPhone/iPad fisico** (Human QA).  
Vedi `docs/PREVENTIVAI-2.0-BACKLOG.md`.
