/**
 * Contratto condiviso PreventivAI Intelligence (client + Edge Function).
 * Modulo puro ESM — nessuna secret, nessun fetch.
 */

export const AI_AZIONE = "analisiPreventivoIntelligence";

export const LIVELLI_CONFIDENZA = Object.freeze([
  "insufficiente",
  "bassa",
  "media",
  "buona",
]);

/** Limiti payload / costi (client + server). */
export const AI_LIMITI = Object.freeze({
  maxBodyBytes: 48_000,
  timeoutMs: 25_000,
  maxLavoriSimili: 8,
  maxVoci: 20,
  maxStringLen: 500,
  /** Minimo ms tra due analisi AI nello stesso processo client. */
  minIntervalloClientMs: 2_500,
  maxOutputTokens: 900,
});

const PII_PATTERN =
  /\b(iban|codice\s*fiscale|partita\s*iva|p\.?\s*iva|telefono|email|@|via\s+\w+|corso\s+\w+|piazza\s+\w+)\b/i;

/**
 * @param {unknown} v
 * @param {number} max
 */
export function troncaStringa(v, max = AI_LIMITI.maxStringLen) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, data: object }|{ ok: false, codice: string, messaggio: string }}
 */
export function validaRichiestaAnalisi(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      codice: "payload_invalido",
      messaggio: "Richiesta non valida.",
    };
  }

  if (body.azione !== AI_AZIONE) {
    return {
      ok: false,
      codice: "azione_non_supportata",
      messaggio: "Azione non supportata.",
    };
  }

  if (!body.nuovoLavoro || typeof body.nuovoLavoro !== "object") {
    return {
      ok: false,
      codice: "nuovo_lavoro_mancante",
      messaggio: "Dati del nuovo lavoro mancanti.",
    };
  }

  const vietati = [
    "cliente",
    "clienteNome",
    "nomeCliente",
    "indirizzo",
    "telefono",
    "email",
    "codiceFiscale",
    "partitaIva",
    "iban",
    "cf",
    "piva",
  ];
  const grezzo = JSON.stringify(body);
  for (const chiave of vietati) {
    if (
      Object.prototype.hasOwnProperty.call(body, chiave) ||
      Object.prototype.hasOwnProperty.call(body.nuovoLavoro || {}, chiave)
    ) {
      return {
        ok: false,
        codice: "pii_rifiutata",
        messaggio: "Dati non ammessi nella richiesta.",
      };
    }
  }

  if (PII_PATTERN.test(grezzo) && /"iban"|"telefono"|"email"|"codiceFiscale"/i.test(grezzo)) {
    return {
      ok: false,
      codice: "pii_rifiutata",
      messaggio: "Dati non ammessi nella richiesta.",
    };
  }

  const simili = Array.isArray(body.lavoriSimili) ? body.lavoriSimili : [];
  if (simili.length > AI_LIMITI.maxLavoriSimili) {
    return {
      ok: false,
      codice: "payload_troppo_grande",
      messaggio: "Troppi lavori simili nella richiesta.",
    };
  }

  return { ok: true, data: body };
}

/**
 * @param {unknown} raw
 * @returns {{ etichetta: string, valore: string }[]}
 */
export function normalizzaDatiConfronto(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") {
        const t = troncaStringa(item, 240);
        return t ? { etichetta: "Dato", valore: t } : null;
      }
      if (item && typeof item === "object") {
        const etichetta = troncaStringa(item.etichetta || item.label || "Dato", 80);
        const valore = troncaStringa(item.valore || item.value || "", 240);
        if (!valore) return null;
        return { etichetta: etichetta || "Dato", valore };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 12);
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizzaListaStringhe(raw, max = 8) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => troncaStringa(x, 240))
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Valida e normalizza l'output del modello.
 * @param {unknown} raw
 * @returns {{ ok: true, insight: object }|{ ok: false, codice: string }}
 */
export function validaRispostaInsight(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, codice: "json_invalido" };
  }

  const valutazione = troncaStringa(raw.valutazione, 600);
  if (!valutazione) {
    return { ok: false, codice: "campo_mancante" };
  }

  let livello = String(raw.livelloConfidenza || "").trim();
  if (!LIVELLI_CONFIDENZA.includes(livello)) {
    livello = "insufficiente";
  }

  // Blocca prezzo automatico aggressivo tipo "dovrebbe essere €1234"
  const prezzoForzato =
    /(?:dovrebbe|consigliat[oa]|preventivo)\s+(?:essere\s+)?€\s*\d{2,}/i.test(
      valutazione
    ) ||
    /(?:dovrebbe|consigliat[oa]|preventivo)\s+(?:essere\s+)?€\s*\d{2,}/i.test(
      String(raw.suggerimento || "")
    );

  if (prezzoForzato) {
    return { ok: false, codice: "prezzo_non_ammesso" };
  }

  return {
    ok: true,
    insight: {
      titolo: troncaStringa(raw.titolo || "Analisi PreventivAI", 120),
      valutazione,
      motivazione: troncaStringa(raw.motivazione, 800),
      datiDiConfronto: normalizzaDatiConfronto(raw.datiDiConfronto),
      cosaControllare: normalizzaListaStringhe(raw.cosaControllare),
      rischi: normalizzaListaStringhe(raw.rischi),
      suggerimento: troncaStringa(raw.suggerimento, 600),
      livelloConfidenza: livello,
    },
  };
}

/**
 * System prompt server-side (non accettato dal client come unico input).
 */
export function costruisciSystemPrompt() {
  return [
    "Sei PreventivAI, assistente operativo per elettricisti italiani.",
    "Usa SOLO i dati JSON forniti dall'utente. Non inventare prezzi, costi, ore, margini o dati mancanti.",
    "Non dare consulenza fiscale, legale o contabile.",
    "Se i dati sono insufficienti, dillo chiaramente e suggerisci quali informazioni registrare.",
    "Non proporre un importo di preventivo unico tipo «dovrebbe costare €X».",
    "Aiuta a capire cosa considerare nella preparazione del preventivo confrontando lavori potenzialmente simili.",
    "Rispondi SOLO con JSON valido secondo lo schema richiesto, senza markdown.",
  ].join(" ");
}

/**
 * @param {object} data — body già validato
 */
export function costruisciUserPrompt(data) {
  return JSON.stringify({
    istruzione:
      "Analizza il nuovo lavoro rispetto allo storico aggregato e restituisci il JSON richiesto.",
    schema: {
      titolo: "string",
      valutazione: "string",
      motivazione: "string",
      datiDiConfronto: [{ etichetta: "string", valore: "string" }],
      cosaControllare: ["string"],
      rischi: ["string"],
      suggerimento: "string",
      livelloConfidenza: "insufficiente|bassa|media|buona",
    },
    dati: {
      nuovoLavoro: data.nuovoLavoro,
      portfolio: data.portfolio || {},
      livelloConfidenzaDati: data.livelloConfidenza,
      lavoriSimili: data.lavoriSimili || [],
      statistiche: data.statistiche || {},
      vincoli: data.vincoli || {},
    },
  });
}
