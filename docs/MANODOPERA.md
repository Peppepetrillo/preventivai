# Manodopera PreventivAI

Gestione semplice di **operai → giornate/ore → costo → pagato/da pagare → riepilogo settimanale**.

**Non è** un gestionale paghe: niente buste, contributi, INPS/INAIL, cedolini.

---

## Entry points

| Dove | Cosa |
|------|------|
| **Altro → Operai** | Anagrafica (`/operai`) |
| **Altro → Manodopera** | Riepilogo settimanale globale (`/manodopera`) |
| **Cantiere → tab Giornate → Manodopera** | Registro costi sul cantiere |

---

## Modello operaio

Storage: `preventivai.operai` (LocalStorage, **fuori** `APP_DATA_KEYS` in 1.0 — sync cloud non incluso).

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
  id, cantiereId, operaioId, data, // DD/MM/YYYY
  ore, tipo: "giornata" | "ore",
  costo, pagato,
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

## Pagato / Da pagare

Campo booleano `pagato` sulla giornata. Toggle idempotente (protezione doppio tap in UI).

---

## Aggregazioni

`riepilogoManodoperaService`:
- filtra per settimana (lun→dom)
- filtri opzionali operaio / cantiere
- totali + per operaio + per cantiere

---

## Integrazione economica — **NON effettuata in 1.0**

**Decisione:** manodopera **separata** da Spese/Economia.

Motivo: esiste già `spese[].categoria === "manodopera"`. Sommare automaticamente `giornateManodopera.costo` in `calcolaTotaleSpeseCantiere` / margine **raddoppierebbe** i costi se l’utente registra anche una spesa.

La sezione cantiere mostra i totali manodopera a scopo operativo e dichiara esplicitamente che non entrano in Economia.

### Evoluzione futura (2.0)
- Azione esplicita “Genera spesa da giornate” con link `giornataManodoperaId`
- oppure flag “includi in economia” per giornata, con anti-duplicazione

---

## Progetti elettrici

Inclusi in questo branch tip (da `cursor/progetti-elettrici-zoom-74ac`): multi-progetto, migrazione, IndexedDB, zoom.

---

## Limiti 1.0

- No sync cloud anagrafica operai
- No buste / contributi
- No auto-spesa da giornate
- Home: nessun widget (evita clutter; entry da Altro)

---

## File

```
src/features/manodopera/
  operaiDomain.js
  giornateManodoperaService.js
  riepilogoManodoperaService.js
  settimanaUtils.js
  components/
src/repositories/operaiRepository.js
src/pages/Operai.jsx
src/pages/Manodopera.jsx
```
