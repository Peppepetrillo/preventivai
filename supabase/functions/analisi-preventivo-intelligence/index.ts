/**
 * Edge Function: analisiPreventivoIntelligence
 *
 * Secret SERVER-SIDE (Supabase Dashboard → Edge Functions → Secrets):
 *   OPENAI_API_KEY   (obbligatoria)
 *   OPENAI_MODEL     (opzionale, default gpt-4o-mini)
 *
 * Nessuna key nel client. Endpoint pubblico:
 *   ${VITE_SUPABASE_URL}/functions/v1/analisi-preventivo-intelligence
 * oppure VITE_AI_ASSISTANT_ENDPOINT puntato a questa URL.
 */

import {
  AI_LIMITI,
  costruisciSystemPrompt,
  costruisciUserPrompt,
  validaRichiestaAnalisi,
  validaRispostaInsight,
} from "./contract.js";

/** Origini tipiche Capacitor / Vite (senza aprire a tutto il web). */
const ORIGINI_BASE = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://localhost",
  "http://127.0.0.1",
  "https://127.0.0.1",
];

/**
 * CORS per app iOS (Capacitor) + dev Vite.
 * Extra: ALLOWED_ORIGINS (csv) nei Secrets della function.
 * @param {Request} req
 */
function corsHeaders(req) {
  const origin = String(req.headers.get("Origin") || "").trim();
  const extra = String(Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowlist = [...ORIGINI_BASE, ...extra];

  function originConsentita(o) {
    if (!o) return true; // alcune richieste native senza Origin
    if (allowlist.includes(o)) return true;
    // Vite / preview su localhost con porta
    try {
      const u = new URL(o);
      if (
        (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
        (u.protocol === "http:" || u.protocol === "https:")
      ) {
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  const consentita = originConsentita(origin);
  const allowOrigin = !origin ? "*" : consentita ? origin : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/**
 * Rate limit molto semplice in-memory (per istanza Edge).
 * Non sostituisce un rate limit di produzione.
 */
const rateMap = new Map();

function checkRateLimit(key) {
  const ora = Date.now();
  const prev = rateMap.get(key) || 0;
  if (ora - prev < 1500) return false;
  rateMap.set(key, ora);
  if (rateMap.size > 500) {
    for (const [k, t] of rateMap) {
      if (ora - t > 60_000) rateMap.delete(k);
    }
  }
  return true;
}

async function chiamaOpenAI({ system, user, apiKey, model }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_LIMITI.timeoutMs);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: AI_LIMITI.maxOutputTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      // Non loggare body provider (può contenere dettagli inutili)
      console.error("openai_http", res.status);
      return { ok: false, codice: "provider_upstream" };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return { ok: false, codice: "provider_risposta_vuota" };
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { ok: false, codice: "json_invalido" };
    }

    return { ok: true, parsed };
  } catch (err) {
    const aborted = err?.name === "AbortError";
    console.error(aborted ? "openai_timeout" : "openai_fetch_error");
    return { ok: false, codice: aborted ? "timeout" : "provider_non_raggiungibile" };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, 405, { ok: false, errore: "Metodo non consentito." });
  }

  const apiKey = String(Deno.env.get("OPENAI_API_KEY") || "").trim();
  if (!apiKey) {
    console.error("missing_openai_key");
    return json(req, 503, {
      ok: false,
      codice: "provider_non_configurato",
      errore: "Servizio AI non configurato.",
    });
  }

  const model =
    String(Deno.env.get("OPENAI_MODEL") || "").trim() || "gpt-4o-mini";

  const clientKey =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    "anon";
  if (!checkRateLimit(clientKey)) {
    return json(req, 429, {
      ok: false,
      codice: "rate_limit",
      errore: "Troppe richieste. Riprova tra poco.",
    });
  }

  let rawText;
  try {
    rawText = await req.text();
  } catch {
    return json(req, 400, {
      ok: false,
      codice: "payload_invalido",
      errore: "Corpo non leggibile.",
    });
  }

  if (!rawText || rawText.length > AI_LIMITI.maxBodyBytes) {
    return json(req, 413, {
      ok: false,
      codice: "payload_troppo_grande",
      errore: "Richiesta troppo grande.",
    });
  }

  let body;
  try {
    body = JSON.parse(rawText);
  } catch {
    return json(req, 400, {
      ok: false,
      codice: "payload_invalido",
      errore: "JSON non valido.",
    });
  }

  const validazione = validaRichiestaAnalisi(body);
  if (!validazione.ok) {
    return json(req, 400, {
      ok: false,
      codice: validazione.codice,
      errore: validazione.messaggio,
    });
  }

  const system = costruisciSystemPrompt();
  const user = costruisciUserPrompt(validazione.data);
  const esitoModel = await chiamaOpenAI({
    system,
    user,
    apiKey,
    model,
  });

  if (!esitoModel.ok) {
    const status = esitoModel.codice === "timeout" ? 504 : 502;
    return json(req, status, {
      ok: false,
      codice: esitoModel.codice,
      errore: "Non riesco a completare l'analisi in questo momento.",
    });
  }

  const validOut = validaRispostaInsight(esitoModel.parsed);
  if (!validOut.ok) {
    return json(req, 502, {
      ok: false,
      codice: validOut.codice,
      errore: "Risposta AI non valida.",
    });
  }

  return json(req, 200, {
    ok: true,
    ...validOut.insight,
  });
});
