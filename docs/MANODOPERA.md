# Manodopera PreventivAI

Gestione semplice di **operai → giornate/ore → costo → pagato/da pagare → riepilogo settimanale**.

**Non è** un gestionale paghe: niente buste, contributi, INPS/INAIL, cedolini.

---

## Entry points

| Dove | Cosa |
|------|------|
| **Altro → Operai** | Anagrafica (`/operai`) |
| **Altro → Manodopera** | Riepilogo settimanale globale (`/manodopera`) |
| **Cantiere → tab Giornate → Manodopera** | Registro costi + **Segna pagato** |

---

## Modello operaio

Storage: `preventivai.operai` (LocalStorage; **incluso nel backup locale** via `BACKUP_DATA_KEYS`; **fuori** `APP_DATA_KEYS` — sync cloud non incluso in 1.0).

```js
{
  id, nome, cognome, ruolo,
  costoGiornata, // number | null
  costoOra,      // number | null
  attivo,        // false = soft delete
  createdAt, updatedAt
}
```

Regole:
- nome + cognome obbligatori
- almeno uno tra `costoGiornata` / `costoOra`
- disattivare, non cancellare, se esistono giornate storiche

---

## Modello giornata manodopera

Source of truth: `cantiere.giornateManodopera[]` (viaggia con i cantieri).

```js
{
  id, cantiereId, operaioId, data, // DD/MM/YYYY — giorno di lavoro
  ore, tipo: "giornata" | "ore",
  costo,
  pagato,          // stato pagamento (SoT)
  pagatoIl,        // DD/MM/YYYY — data effettiva pagamento (opz.)
  createdAt, updatedAt
}
```

Distinto da:
- `programmazione[]` — previsto
- `registroGiornate[]` — consuntivo attività (nomi liberi, senza costo)
- `spese[]` — uscite economia

Costo:
- precompilato da costo giornata / ore×costo ora
- **sempre modificabile** sulla singola registrazione senza cambiare l’anagrafica

---

## Giornata ≠ pagamento

| Stato | Cosa significa | Economia |
|-------|----------------|----------|
| Giornata registrata, `pagato: false` | Lavoro fatto, costo teorico | **Nessuna** uscita |
| `pagato: true` | Pagamento reale all’operaio | **Una** uscita in `spese[]` |

Solo il pagamento reale genera l’uscita. Registrare la giornata **non** crea movimenti di cassa.

---

## Pagamento → uscita Economia

Flusso (Cantiere → Manodopera → tocco **Pagato**):

1. `giornata.pagato = true` (+ `pagatoIl` = data odierna se assente)
2. Creazione/upsert di **una** spesa:
   - `categoria: "manodopera"`
   - `origine: "manodopera"`
   - `giornataManodoperaId` → link stabile alla giornata
   - `operaioId`, descrizione `Manodopera — {nome}`
   - `importo` = `giornata.costo`
   - `data` = `pagatoIl` (data pagamento, non necessariamente data lavoro)
3. Economia / Controllo economico leggono `spese[]` → l’uscita compare nei totali **una sola volta**

Modulo: `src/features/manodopera/manodoperaPagamentoEconomia.js`  
Hook: `useCantieri.impostaPagatoManodopera` → `registraPagamentoGiornataManodopera`.

### Idempotenza

- Doppio tap / ri-applica sullo stesso `pagato: true` → **non** crea seconda uscita
- Se la spesa collegata esiste già → viene riusata/aggiornata (importo/descrizione)
- `pagato: false` (toggle “da pagare”) → rimuove **solo** le spese con quel `giornataManodoperaId`
- Eliminazione giornata pagata → rimuove anche l’uscita collegata

### Anti doppio conteggio

- `calcolaTotaleSpeseCantiere` / Economia / Controllo **non** sommano `giornateManodopera.costo`
- Contano solo `spese[]`
- Quindi: giornata €120 + spesa collegata €120 = **€120** in Economia (non €240)

Spese manodopera **manuali** (senza `giornataManodoperaId`) restano distinte e non vengono toccate dal toggle.

---

## Date

- **`data`** = giorno di lavoro sul cantiere  
- **`pagatoIl`** = giorno in cui risulta pagato (usata come `spesa.data`)  
  Se assente al momento del pagamento → data odierna (calendario dispositivo)

---

## Aggregazioni Manodopera (pagina Altro)

`riepilogoManodoperaService` legge lo **stesso** `pagato` sulle giornate (nessuno stato parallelo):
- filtra per settimana (lun→dom)
- filtri opzionali operaio / cantiere
- totali + per operaio + per cantiere (`pagato` / `daPagare`)

---

## Backup / sync

- Giornate + spese (incluso link `giornataManodoperaId`) vivono in `cantieri` → backup e sync cantieri
- Anagrafica operai: backup locale sì, sync cloud no (1.0)
- Backup pre-integrazione: giornate senza `pagatoIl` / spese senza link restano valide; al primo “Segna pagato” si crea il link

---

## Limiti

- No sync cloud anagrafica operai
- No buste / contributi
- No widget Home dedicato
- “Annulla pagamento” = toggle esistente da Pagato → Da pagare (rimuove uscita collegata). Nessuna UX aggiuntiva di storno bancario.

---

## File

```
src/features/manodopera/
  operaiDomain.js
  giornateManodoperaService.js
  manodoperaPagamentoEconomia.js   ← sync pagamento ↔ spese
  riepilogoManodoperaService.js
  settimanaUtils.js
  components/
src/repositories/operaiRepository.js
src/pages/Operai.jsx
src/pages/Manodopera.jsx
```
