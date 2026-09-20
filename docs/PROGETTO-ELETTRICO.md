# Progetto elettrico del cantiere

Feature mirata (freeze exception): allegare **un** PDF o **un’immagine** del progetto/schema elettrico a un cantiere, consultabile offline in campo.

Entry: **Cantiere → tab Lavoro → Progetto elettrico** (sopra checklist/materiali/foto).

---

## Cosa fa (1.0)

| Azione | Comportamento |
|--------|----------------|
| Aggiungi PDF | File picker `application/pdf` |
| Aggiungi immagine | jpeg/png/webp/gif |
| Apri | PDF → `PdfAnteprima`; immagine → `CantiereFotoViewer` |
| Sostituisci | Nuovo file salvato **prima**, poi cleanup del blob precedente |
| Elimina | ConfirmDialog → rimuove meta + blob |

Nessun OCR, AI, annotazioni, multi-documento.

---

## Modello dati

Campo sul cantiere (APP_DATA_KEYS / sync metadata):

```js
cantiere.progettoElettrico = {
  id,
  tipo: "pdf" | "image",
  nome,
  mimeType,
  size,
  blobId,       // chiave IndexedDB
  cantiereId,
  createdAt,    // ISO
  updatedAt,
}
```

**Mai** Base64 / `data:` URL nel LocalStorage o nel record cantiere.

---

## Storage

| Layer | Contenuto |
|-------|-----------|
| LocalStorage / Preferences | Solo metadata `progettoElettrico` |
| IndexedDB `preventivai-progetto-elettrico` | Blob binario (`cantiereId::blobId`) |

Limiti file: PDF ≤ 20 MB, immagini ≤ 12 MB.

Hard delete cantiere (`eliminaCantiereConPulizia`) elimina anche i blob IndexedDB del cantiere.

---

## Offline / cloud

- Aggiunta, apertura, sostituzione, eliminazione: **offline** (IndexedDB locale).
- Sync cloud del **binario**: **non implementato in 1.0** (niente nuovo bucket / coda parallela).
- Il metadata può viaggiare con `cantieri` via sync esistente; `sanitizzaCantieriPerAppRecords` mantiene solo campi meta (no payload binario).
- Su un altro device il meta può esserci senza file locale → messaggio “File non disponibile sul dispositivo.”

---

## File codice

```
src/features/cantieri/services/progettoElettricoBlobStore.js
src/features/cantieri/services/progettoElettricoService.js
src/features/cantieri/components/ProgettoElettricoSection.jsx
```

Hook: `useCantieri` → `aggiungiProgettoElettrico` / `sostituisciProgettoElettrico` / `eliminaProgettoElettrico`.

---

## Test

- Unit: validazione, add PDF/immagine, associazione cantiere, replace, delete, sanitizzazione, errori.
- UI: empty state, card, sheet scelta, ConfirmDialog.

---

## Limiti 1.0

- Un solo progetto per cantiere (sostituisci per cambiare).
- Nessun sync multi-device del file.
- Nessun plugin Capacitor Filesystem aggiuntivo.
- Viewer PDF = componente già usato per preventivi (iframe/fit-width), non editor.

---

## 2.0 (backlog)

Vedi `docs/PREVENTIVAI-2.0-BACKLOG.md` — sezione Progetto elettrico.
