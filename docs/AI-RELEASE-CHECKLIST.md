# AI — Release Checklist (October 2026)

**Do not deploy** from agents. **Do not** change `verify_jwt` remotely without Giuseppe.

---

## Components

| Piece | Location | Status |
|-------|----------|--------|
| Client provider | `src/features/ai/aiProvider.js` | READY |
| Contract / limits | `aiContract.js`, `aiTypes.js` | READY |
| Deterministic fallback | locale insight when offline/unconfigured | READY |
| PII scrub (structured) | shipped | READY |
| Free-text address scrub | optional HUMAN #5 | FUTURE |
| Preventivo vocale / Express | locale listino matcher only | READY |
| Edge Function | `supabase/functions/analisi-preventivo-intelligence/` | READY in repo |
| Server secret `OPENAI_API_KEY` | Supabase secrets | **BLOCKED — HUMAN** |
| `verify_jwt=true` on project | deploy config | **BLOCKED — HUMAN** (#3) |
| Client `VITE_OPENAI_*` | must never exist | READY (absent) |
| Rate limit / anti double-tap | client `ultimoInvioMs` | READY |
| Freemium gate hook | `puoEseguireAnalisiAi` | READY soft (no block) |

---

## READY

- No OpenAI key in client bundles.
- Express/voce never POSTs clienti/listino.
- Invalid/offline AI → Italian user messages + local fallback.
- JWT expected on client path when endpoint configured.

---

## BLOCKED

| Item | Owner |
|------|-------|
| Deploy function + `OPENAI_API_KEY` secret | Giuseppe |
| Confirm production `verify_jwt=true` | Giuseppe |
| Decide if Oct marketing requires cloud AI | Giuseppe |
| Feature gate AI on Free (#8) | Giuseppe |

---

## HUMAN ACTION (copy-paste)

```bash
# On Giuseppe machine / CI with Supabase login
supabase secrets set OPENAI_API_KEY=<server-only>
supabase secrets set OPENAI_MODEL=gpt-4o-mini
supabase functions deploy analisi-preventivo-intelligence
# Ensure gateway verify_jwt=true for the function
```

Client env (public URL only):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
# optional override:
# VITE_AI_ASSISTANT_ENDPOINT=https://<ref>.supabase.co/functions/v1/analisi-preventivo-intelligence
```

---

## October product stance

| If… | Then… |
|-----|-------|
| Cloud AI not marketed | Ship without remote deploy; locale voce + fallback insight enough |
| Cloud AI marketed | **P1 before public** — complete HUMAN actions above |

**CTO recommendation:** do **not** block October on cloud AI if voce locale + PDF work. Treat remote AI as upsell after #3.
