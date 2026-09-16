/**
 * Provider AI astratto — nessuna API key nel client.
 * Usa VITE_AI_ASSISTANT_ENDPOINT (Supabase Edge Function / backend).
 */

import {
  AI_LIMITI,
  normalizzaDatiConfronto,
  normalizzaListaStringhe,
  troncaStringa,
  validaRispostaInsight,
} from "./aiContract";
import { costruisciPayloadInsightAi } from "./aiPromptBuilder";
import { ETICHETTE_CONFIDENZA_AI, LIVELLI_CONFIDENZA_AI } from "./aiTypes";
import { supabase } from "../../lib/supabaseClient";

/** Anti doppio-tap / spam client-side. null = mai inviato. */
let ultimoInvioMs = null;

/**
 * Hook freemium: oggi sempre consentito.
 * Collegare `calcolaStatoFreemium` + limiti PRO quando human decide catalogo piani.
 * @param {{ piano?: string }=} ctx
 * @returns {{ ok: boolean, codice?: string }}
 */
export function puoEseguireAnalisiAi(ctx = {}) {
  // Soft-wire: Free non blocca ancora (HUMAN-DECISIONS: feature PRO).
  void ctx?.piano;
  return { ok: true };
}

/**
 * Costruisce l'URL pubblico della Edge Function AI da URL progetto Supabase.
 * @param {string} supabaseUrl es. https://abcd.supabase.co
 * @returns {string}
 */
export function endpointAnalisiDaSupabaseUrl(supabaseUrl = "") {
  const base = String(supabaseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!base) return "";
  return `${base}/functions/v1/analisi-preventivo-intelligence`;
}

/**
 * Endpoint pubblico AI.
 * Priorità: VITE_AI_ASSISTANT_ENDPOINT → derivato da VITE_SUPABASE_URL.
 * Nessuna secret OpenAI.
 * @returns {string}
 */
export function getAiAssistantEndpoint() {
  const esplicito = String(
    import.meta.env.VITE_AI_ASSISTANT_ENDPOINT || ""
  ).trim();
  if (esplicito) return esplicito;
  return endpointAnalisiDaSupabaseUrl(
    import.meta.env.VITE_SUPABASE_URL || ""
  );
}

/**
 * @returns {boolean}
 */
export function isAiProviderConfigurato() {
  return Boolean(getAiAssistantEndpoint());
}

/**
 * Normalizza risposta provider verso lo schema insight UI.
 * @param {object} payload
 * @param {object} contesto
 */
export function normalizzaRispostaInsightAi(payload = {}, contesto = {}) {
  const valid = validaRispostaInsight(payload);
  if (valid.ok) {
    const livelloDati =
      contesto.livelloConfidenza || LIVELLI_CONFIDENZA_AI.insufficiente;
    return {
      fonte: "provider",
      ...valid.insight,
      // Confidence mostrata = qualità dati locali (non quella inventata dal modello)
      livelloConfidenza: livelloDati,
      livelloConfidenzaEtichetta:
        ETICHETTE_CONFIDENZA_AI[livelloDati] || livelloDati,
      datiDiConfronto: normalizzaDatiConfronto(
        valid.insight.datiDiConfronto.length
          ? valid.insight.datiDiConfronto
          : payload.datiDiConfronto
      ),
    };
  }

  // Compat legacy string[]
  const livello =
    contesto.livelloConfidenza ||
    payload.livelloConfidenza ||
    LIVELLI_CONFIDENZA_AI.insufficiente;

  const valutazione = troncaStringa(payload.valutazione, 600);
  if (!valutazione) return null;

  return {
    fonte: "provider",
    titolo: troncaStringa(payload.titolo || "Analisi PreventivAI", 120),
    valutazione,
    motivazione: troncaStringa(payload.motivazione, 800),
    datiDiConfronto: normalizzaDatiConfronto(payload.datiDiConfronto),
    rischi: normalizzaListaStringhe(payload.rischi),
    cosaControllare: normalizzaListaStringhe(payload.cosaControllare),
    suggerimento: troncaStringa(payload.suggerimento || payload.obiettivo, 600),
    livelloConfidenza: livello,
    livelloConfidenzaEtichetta: ETICHETTE_CONFIDENZA_AI[livello] || livello,
  };
}

/**
 * Messaggio utente da codice errore tecnico.
 * @param {string} codice
 */
export function messaggioErroreAi(codice) {
  switch (codice) {
    case "provider_non_configurato":
      return "Analisi AI non configurata. Uso i dati disponibili.";
    case "provider_non_raggiungibile":
      return "Sei offline o l'AI non è raggiungibile. Uso i tuoi dati.";
    case "non_autenticato":
      return "Accedi per usare l'analisi PreventivAI. Uso i dati disponibili.";
    case "timeout":
      return "L'analisi sta impiegando troppo. Riprova o usa i tuoi dati.";
    case "rate_limit":
    case "troppo_frequente":
      return "Attendi un momento prima di ripetere l'analisi.";
    case "payload_troppo_grande":
      return "Troppi dati da analizzare. Riduci le voci e riprova.";
    case "freemium_bloccato":
      return "Limite analisi raggiunto per questo account.";
    default:
      return "Non riesco a completare l'analisi in questo momento.";
  }
}

/**
 * Header autenticati per Edge Function (JWT sessione Supabase + anon key).
 * Nessuna OPENAI key. Se sessione assente → null (fallback deterministico).
 * @param {{
 *   getSession?: () => Promise<{ access_token?: string }|null>,
 *   anonKey?: string,
 * }=} opzioni
 * @returns {Promise<Record<string, string>|null>}
 */
export async function costruisciHeadersRichiestaAi(opzioni = {}) {
  const getSession =
    opzioni.getSession ||
    (async () => {
      if (!supabase) return null;
      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    });

  const sessione = await getSession();
  const token = String(sessione?.access_token || "").trim();
  if (!token) return null;

  const anonKey = String(
    opzioni.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""
  ).trim();

  /** @type {Record<string, string>} */
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (anonKey) headers.apikey = anonKey;
  return headers;
}

/**
 * @param {object} contesto
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   timeoutMs?: number,
 *   nowMs?: number,
 *   getSession?: () => Promise<{ access_token?: string }|null>,
 *   anonKey?: string,
 * }=} opzioni
 */
export async function generaInsightDaProvider(contesto, opzioni = {}) {
  const gate = puoEseguireAnalisiAi();
  if (!gate.ok) {
    return {
      ok: false,
      motivo: gate.codice || "freemium_bloccato",
      messaggioUtente: messaggioErroreAi(gate.codice || "freemium_bloccato"),
      puoRiprovare: false,
    };
  }

  const endpoint = getAiAssistantEndpoint();
  if (!endpoint) {
    return {
      ok: false,
      motivo: "provider_non_configurato",
      messaggioUtente: messaggioErroreAi("provider_non_configurato"),
      puoRiprovare: false,
    };
  }

  const now = Number(opzioni.nowMs) || Date.now();
  if (
    ultimoInvioMs != null &&
    now - ultimoInvioMs < AI_LIMITI.minIntervalloClientMs
  ) {
    return {
      ok: false,
      motivo: "troppo_frequente",
      messaggioUtente: messaggioErroreAi("troppo_frequente"),
      puoRiprovare: true,
    };
  }

  const body = costruisciPayloadInsightAi(contesto);
  const serializzato = JSON.stringify(body);
  if (serializzato.length > AI_LIMITI.maxBodyBytes) {
    return {
      ok: false,
      motivo: "payload_troppo_grande",
      messaggioUtente: messaggioErroreAi("payload_troppo_grande"),
      puoRiprovare: false,
    };
  }

  const fetchImpl = opzioni.fetchImpl || fetch;
  const timeoutMs = Number(opzioni.timeoutMs) || AI_LIMITI.timeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = await costruisciHeadersRichiestaAi(opzioni);
    if (!headers) {
      return {
        ok: false,
        motivo: "non_autenticato",
        messaggioUtente: messaggioErroreAi("non_autenticato"),
        puoRiprovare: true,
      };
    }

    // Conta solo tentativi autenticati (evita di bruciare rate-limit su 401).
    ultimoInvioMs = now;

    const risposta = await fetchImpl(endpoint, {
      method: "POST",
      headers,
      body: serializzato,
      signal: controller.signal,
    });

    if (risposta.status === 401 || risposta.status === 403) {
      return {
        ok: false,
        motivo: "non_autenticato",
        messaggioUtente: messaggioErroreAi("non_autenticato"),
        puoRiprovare: true,
      };
    }

    if (risposta.status === 429) {
      return {
        ok: false,
        motivo: "rate_limit",
        messaggioUtente: messaggioErroreAi("rate_limit"),
        puoRiprovare: true,
      };
    }

    if (!risposta.ok) {
      let codice = "provider_errore_http";
      try {
        const errBody = await risposta.json();
        if (errBody?.codice) codice = String(errBody.codice);
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        motivo: codice,
        messaggioUtente: messaggioErroreAi(codice),
        puoRiprovare: risposta.status >= 500 || risposta.status === 504,
      };
    }

    const payload = await risposta.json();
    if (payload && payload.ok === false) {
      const codice = String(payload.codice || "provider_errore_http");
      return {
        ok: false,
        motivo: codice,
        messaggioUtente: messaggioErroreAi(codice),
        puoRiprovare: true,
      };
    }

    const insight = normalizzaRispostaInsightAi(payload, contesto);
    if (!insight?.valutazione) {
      return {
        ok: false,
        motivo: "provider_risposta_vuota",
        messaggioUtente: messaggioErroreAi("provider_risposta_vuota"),
        puoRiprovare: true,
      };
    }

    return { ok: true, insight };
  } catch (err) {
    const timeout = err?.name === "AbortError";
    const motivo = timeout ? "timeout" : "provider_non_raggiungibile";
    return {
      ok: false,
      motivo,
      messaggioUtente: messaggioErroreAi(motivo),
      puoRiprovare: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Solo per test. */
export function _resetRateLimitClientPerTest() {
  ultimoInvioMs = null;
}
