/**
 * Provider opzionale Field Assistant — riusa VITE_AI_ASSISTANT_ENDPOINT.
 * Nessuna API key nel client. Offline → null (usa locale).
 */

import {
  getAiAssistantEndpoint,
  costruisciHeadersRichiestaAi,
  messaggioErroreAi,
} from "../ai/aiProvider";
import { scrubTestoLiberoAi } from "../ai/scrubTestoLiberoAi";
import {
  FIELD_AI_AZIONI,
  FIELD_AI_LIMITI,
  FIELD_TIPI,
  validaRispostaFieldAssistant,
  validaRichiestaFieldAssistant,
} from "./fieldAssistantContract";

let ultimoInvioMs = null;

/**
 * @param {"lavorazioni"|"materiali"} tipo
 * @param {string} testo
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   timeoutMs?: number,
 *   nowMs?: number,
 *   getSession?: () => Promise<{ access_token?: string }|null>,
 *   anonKey?: string,
 * }=} opzioni
 * @returns {Promise<{ ok: true, data: object, fonte: "provider" }|{ ok: false, codice: string, messaggio: string }>}
 */
export async function estraiConProviderAi(tipo, testo, opzioni = {}) {
  const endpoint = getAiAssistantEndpoint();
  if (!endpoint) {
    return {
      ok: false,
      codice: "provider_non_configurato",
      messaggio: "Assistente AI non disponibile offline.",
    };
  }

  const azione =
    tipo === FIELD_TIPI.materiali
      ? FIELD_AI_AZIONI.estraiMateriali
      : FIELD_AI_AZIONI.estraiLavorazioni;

  const testoPulito = scrubTestoLiberoAi(testo).slice(
    0,
    FIELD_AI_LIMITI.maxTestoLen
  );
  const validReq = validaRichiestaFieldAssistant(
    { azione, testo: testoPulito },
    azione
  );
  if (!validReq.ok) {
    return {
      ok: false,
      codice: validReq.codice,
      messaggio: validReq.messaggio,
    };
  }

  const now = opzioni.nowMs ?? Date.now();
  if (
    ultimoInvioMs != null &&
    now - ultimoInvioMs < FIELD_AI_LIMITI.minIntervalloClientMs
  ) {
    return {
      ok: false,
      codice: "troppo_frequente",
      messaggio: messaggioErroreAi("troppo_frequente"),
    };
  }

  const headers = await costruisciHeadersRichiestaAi({
    getSession: opzioni.getSession,
    anonKey: opzioni.anonKey,
  });
  if (!headers) {
    return {
      ok: false,
      codice: "non_autenticato",
      messaggio: "Assistente AI non disponibile offline.",
    };
  }

  const fetchImpl = opzioni.fetchImpl || fetch;
  const timeoutMs = opzioni.timeoutMs ?? FIELD_AI_LIMITI.timeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    ultimoInvioMs = now;
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ azione, testo: testoPulito }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        ok: false,
        codice: res.status === 429 ? "rate_limit" : "provider_errore",
        messaggio: messaggioErroreAi(
          res.status === 429 ? "rate_limit" : "provider_non_raggiungibile"
        ),
      };
    }

    const json = await res.json();
    const payload = json?.data || json?.risultato || json;
    const valid = validaRispostaFieldAssistant(payload, tipo);
    if (!valid.ok) {
      return {
        ok: false,
        codice: valid.codice || "json_invalido",
        messaggio: valid.messaggio || "Risposta AI non valida.",
      };
    }
    return { ok: true, data: valid.data, fonte: "provider" };
  } catch (err) {
    const aborted = err?.name === "AbortError";
    return {
      ok: false,
      codice: aborted ? "timeout" : "provider_non_raggiungibile",
      messaggio: messaggioErroreAi(
        aborted ? "timeout" : "provider_non_raggiungibile"
      ),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Test helper */
export function _resetRateFieldAssistant() {
  ultimoInvioMs = null;
}
