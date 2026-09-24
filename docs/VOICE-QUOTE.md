# Preventivo vocale (Voice Quote)

UX name: **Preventivo vocale** (ex Express).

Vedi anche: [AI Field Assistant](./AI-FIELD-ASSISTANT.md) (Descrivi + Memo materiali).

## Goal

Electrician speaks → PreventivAI matches **local listino** → preview → **confirm** → draft quote.

Prices come **only** from the user’s listino. The AI never invents prices.

## Flow

1. Home → **Preventivo vocale** (`/preventivi/nuovo?express=1`) or Componi → **Vocale** / **Descrivi**
2. Dictate (Web Speech) or type
3. **Analizza** → Field extract locale + matcher listino (`generaBozzaPreventivoLocale`)
4. Preview: matched rows + unmatched (“Non trovo… nel tuo listino”)
5. Actions on unmatched: Aggiungi al listino | Modifica | Ignora | scegli tra max 3 candidate
6. **Conferma bozza** applies to wizard (still editable manually)

## States

| UI | Meaning |
|----|---------|
| IDLE | Ready to speak/type |
| LISTENING | Mic active |
| PROCESSING | Matching listino |
| READY | Preview; waiting confirm |
| ERROR | Speech or analysis failure |

## Offline

- Speech recognition needs network (browser/OS engine). Copy states this clearly.
- Fallback: type the request; matching stays **local** (no PII POST).

## Architecture

- Matcher: `src/features/preventivi/assistentePreventivi.js` (+ `aiFieldAssistant`)
- Sheet: `src/features/preventivi/components/PreventivoExpress.jsx`
- Hook: `src/hooks/useRiconoscimentoVocale.js`
- Deep-link: `WizardPreventivo` reads `?express=1` / `?vocale=1`

## Incremental voice commands

| Command | Status |
|---------|--------|
| Aggiungi / togli / porta a / metti N | **SHIPPED** (preview → confirm) — `voiceIncremental.js` |
| Fammi vedere il totale | FUTURE (read-only) |
| Genera il PDF | **RICHIEDE ARCHITETTURA** — out of freeze |

Pipeline: comando → interpretazione → **anteprima** → **conferma** → carrello.  
Prezzi solo listino. Match mancante → messaggio + Modifica / Scegli listino / Ignora.

## Permissions

- iOS: `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`
- Android: `RECORD_AUDIO`
