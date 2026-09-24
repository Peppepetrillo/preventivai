# PreventivAI — AI Field Assistant

Assistente operativo sul campo. **Non è un chatbot.**

Principio assoluto:

> AI propone → PreventivAI verifica (listino/catalogo) → utente conferma → solo dopo si salva.

## Capacità

| Capabilità | Entry point | Persistenza |
|------------|-------------|-------------|
| **A — Preventivo vocale** | Home / Componi → Vocale | Solo dopo conferma bozza |
| **B — Preventivo manuale + Descrivi** | Componi → Descrivi | Solo dopo «Conferma lavorazioni» |
| **C — Memo materiali** | Lavoro → Da comprare → Memo materiali | Solo dopo «Aggiungi al lavoro» |

## Architettura

```
UTENTE (parla / scrive)
        ↓
estrazione locale (sempre)  +  AI cloud opzionale (stesso endpoint)
        ↓
match deterministico Listino / Catalogo materiali
        ↓
preview modificabile
        ↓
conferma utente
        ↓
salvataggio su strutture esistenti (carrello preventivo / cantiere.materiali)
```

### Moduli

| Path | Ruolo |
|------|--------|
| `src/features/aiFieldAssistant/` | Contract, extractors, matchers, service, UI sheets |
| `src/features/preventivi/assistentePreventivi.js` | Voice quote: field extract + listino match (prezzi solo listino) |
| `src/features/preventivi/voiceIncremental.js` | Comandi deterministici aggiungi/togli/porta a/metti (prioritari) |
| `src/hooks/useRiconoscimentoVocale.js` | Web Speech — riusato, non duplicato |
| Edge `analisi-preventivo-intelligence` | Azioni insight + `estraiLavorazioniCampo` / `estraiMaterialiCampo` |

### Priorità comprensione

1. Comando incrementale deterministico (se riconoscibile)
2. Estrazione Field locale
3. AI cloud (se online + auth + endpoint) — solo struttura, mai prezzi
4. Fallback messaggio + testo originale integro

## Flusso preventivo vocale

1. Detta o digita
2. Analizza → locale (+ AI opzionale per NL)
3. Preview voci listino + «Non trovo…»
4. Azioni unmatched: abbina / ignora
5. **Conferma bozza** → wizard

Prezzi: **solo listino**. Match ambiguo → max 3 candidate, sceglie l'utente.

## Flusso preventivo manuale (Descrivi)

1. CTA **Descrivi** in Componi
2. Testo / mic → **Genera lavorazioni**
3. Preview modificabile (escludi, scegli match)
4. **Conferma lavorazioni** → aggiunge al carrello

Offline: estrazione locale funziona; messaggio «Assistente AI non disponibile offline» se provider assente.

## Flusso memo materiali

1. CTA **Memo materiali** su lavoro/cantiere (sezione Da comprare)
2. Registrazione breve (Web Speech) o testo
3. Mostra **Trascrizione** (trasparente)
4. Mostra **Materiali riconosciuti** + match catalogo
5. Ambiguo / non trovato → Abbina / Lascia senza abbinamento
6. **Aggiungi al lavoro** → `creaMateriale` / `aggiungiMaterialeDaPayload` esistenti (`origine: memo_vocale`)

Nessun sistema materiali parallelo. Nessun memo spesa in questo sprint (architettura pronta a estendere lo stesso contract).

## AI contract

Risposta JSON (validata sempre):

```json
{
  "tipo": "lavorazioni|materiali",
  "testoOriginale": "...",
  "elementi": [{ "descrizione", "quantita", "unita", "note", "specifiche?" }],
  "elementiAmbigui": [],
  "elementiNonRiconosciuti": [],
  "informazioniExtra": [],
  "confidence": "alta|media|bassa"
}
```

- JSON invalido → fallback locale / errore con testo conservato
- Campi `prezzo`/`importo`/`costo` negli elementi → **rifiuto**
- Confidence: etichette operative, non percentuali

## Matching

### Listino — `matchLavorazioneConListino()`

Sinonimi + score token. Stati: `match` | `ambigui` (≤3) | `non_trovato`.

### Catalogo — `matchMaterialeConCatalogo()`

Lookup famiglie/varianti. Nessun prezzo inventato. `prezzoIndicativo` solo se già in catalogo.

## Privacy

- PII scrub (`scrubTestoLiberoAi`) prima di POST
- Nessun cliente/indirizzo/telefono nel payload Field
- Nessuna API key nel client (`OPENAI_*` solo server Edge)
- Audio: Web Speech OS — niente upload file audio in 1.0
- Trascrizione conservata solo se l'utente conferma il memo

## Offline

| Funzione | Offline |
|----------|---------|
| Estrazione locale lavorazioni/materiali | Sì |
| Match listino/catalogo | Sì |
| Mic Web Speech | Di solito no (messaggio chiaro + digita) |
| Provider AI | No → «Assistente AI non disponibile offline» |
| Preventivo manuale classico | Intatto |

## Error handling

- AI fail / timeout → testo originale resta; [Riprova] [Modifica]
- Chiusura sheet / rifiuto preview → **nessun salvataggio**
- `persistito: false` fino a conferma esplicita

## Limiti

Vedi `FIELD_AI_LIMITI` / `AI_LIMITI`: testo 4k, max 40 elementi, timeout 25s, rate client, max 3 candidate match.

## Device QA

### iPhone / iPad

- [ ] Preventivo vocale frase lunga
- [ ] Elementi ambigui + conferma/modifica
- [ ] Prezzi reali listino
- [ ] Descrivi → preview → conferma
- [ ] Memo: trascrizione + match catalogo + salvataggio
- [ ] Dark mode sheets
- [ ] Offline: manuale + voce locale + AI unavailable

## Deployment umano (NON eseguito dall'agent)

1. Deploy Edge Function aggiornata (`analisi-preventivo-intelligence`)
2. Verificare secrets `OPENAI_API_KEY` / `OPENAI_MODEL`
3. `VITE_AI_ASSISTANT_ENDPOINT` o URL Supabase derivato
4. Test su device reale con sessione autenticata

REMOTE DEPLOYMENT: **NOT PERFORMED**
