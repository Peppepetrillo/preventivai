# Preventivo vocale (Voice Quote)

UX name: **Preventivo vocale** (ex Express).

## Goal

Electrician speaks → PreventivAI matches **local listino** → preview → **confirm** → draft quote.

Prices come **only** from the user’s listino. The AI never invents prices.

## Flow

1. Home → **Preventivo vocale** (`/preventivi/nuovo?express=1`) or Componi → **Vocale**
2. Dictate (Web Speech) or type
3. **Analizza** → locale matcher (`generaBozzaPreventivoLocale`)
4. Preview: matched rows + unmatched (“Non trovo… nel tuo listino”)
5. Actions on unmatched: Aggiungi al listino | Modifica | Ignora
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

- Matcher: `src/features/preventivi/assistentePreventivi.js`
- Sheet: `src/features/preventivi/components/PreventivoExpress.jsx`
- Hook: `src/hooks/useRiconoscimentoVocale.js`
- Deep-link: `WizardPreventivo` reads `?express=1` / `?vocale=1`

## Incremental voice commands

| Command | Verdict |
|---------|---------|
| Aggiungi / togli / modifica quantità su carrello | **IMPLEMENTABILE ORA** (P2 post-baseline) |
| Fammi vedere il totale | **IMPLEMENTABILE ORA** (UI read-only) |
| Genera il PDF | **RICHIEDE ARCHITETTURA** (wizard + PDF + confirm) |

Full-utterance → draft + confirm is the **October baseline**. Incremental is not a release blocker.

## Permissions

- iOS: `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`
- Android: `RECORD_AUDIO`
