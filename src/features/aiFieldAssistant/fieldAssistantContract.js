/**
 * Contratto AI Field Assistant — JSON strutturato, senza prezzi.
 * AI propone; PreventivAI verifica (listino/catalogo); utente conferma; poi salva.
 */

export const FIELD_AI_AZIONI = Object.freeze({
  estraiLavorazioni: "estraiLavorazioniCampo",
  estraiMateriali: "estraiMaterialiCampo",
});

export const FIELD_TIPI = Object.freeze({
  lavorazioni: "lavorazioni",
  materiali: "materiali",
});

export const FIELD_CONFIDENZA = Object.freeze({
  alta: "alta",
  media: "media",
  bassa: "bassa",
});

export const ETICHETTE_FIELD_CONFIDENZA = Object.freeze({
  [FIELD_CONFIDENZA.alta]: "Ho riconosciuto con buona sicurezza.",
  [FIELD_CONFIDENZA.media]: "Controlla questi elementi.",
  [FIELD_CONFIDENZA.bassa]: "Alcuni elementi potrebbero essere ambigui.",
});

/** Limiti client + server (costi / abuse). */
export const FIELD_AI_LIMITI = Object.freeze({
  maxTestoLen: 4_000,
  maxElementi: 40,
  maxCandidateMatch: 3,
  maxAudioSec: 90,
  timeoutMs: 25_000,
  maxBodyBytes: 24_000,
  maxStringLen: 240,
  minIntervalloClientMs: 2_000,
});

/**
 * @param {unknown} v
 * @param {number} max
 */
export function troncaFieldStringa(v, max = FIELD_AI_LIMITI.maxStringLen) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * @param {unknown} raw
 * @returns {number|null}
 */
export function normalizzaQuantitaField(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1000) / 1000;
}

/**
 * @param {unknown} raw
 * @returns {"pz"|"m"|"mq"|"cad"|"altro"|string}
 */
export function normalizzaUnitaField(raw) {
  const u = String(raw || "")
    .trim()
    .toLowerCase();
  if (!u) return "pz";
  if (["pz", "pezzi", "pezzo", "cad", "n", "nr"].includes(u)) return "pz";
  if (["m", "mt", "metro", "metri"].includes(u)) return "m";
  if (["mq", "m2", "m²", "metri quadri", "metriquadrati"].includes(u)) {
    return "mq";
  }
  return troncaFieldStringa(u, 24) || "pz";
}

/**
 * @param {unknown} raw
 * @returns {object|null}
 */
export function normalizzaElementoLavorazione(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const descrizioneOriginale = troncaFieldStringa(
    raw.descrizioneOriginale || raw.descrizione || raw.nome,
    160
  );
  const descrizioneNormalizzata = troncaFieldStringa(
    raw.descrizioneNormalizzata || raw.descrizione || raw.nome,
    160
  );
  const descrizione = descrizioneNormalizzata || descrizioneOriginale;
  if (!descrizione) return null;
  const quantita = normalizzaQuantitaField(raw.quantita);
  return {
    descrizione,
    descrizioneOriginale: descrizioneOriginale || descrizione,
    descrizioneNormalizzata: descrizioneNormalizzata || descrizione,
    quantita: quantita ?? 1,
    unita: normalizzaUnitaField(raw.unita),
    note: troncaFieldStringa(raw.note, 200),
    ambiguo: Boolean(raw.ambiguo),
  };
}

/**
 * @param {unknown} raw
 * @returns {object|null}
 */
export function normalizzaElementoMateriale(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const descrizioneOriginale = troncaFieldStringa(
    raw.descrizioneOriginale || raw.descrizione || raw.nome,
    160
  );
  const descrizioneNormalizzata = troncaFieldStringa(
    raw.descrizioneNormalizzata || raw.descrizione || raw.nome,
    160
  );
  const descrizione = descrizioneNormalizzata || descrizioneOriginale;
  if (!descrizione) return null;
  const quantita = normalizzaQuantitaField(raw.quantita);
  const specifiche = Array.isArray(raw.specifiche)
    ? raw.specifiche
        .map((s) => troncaFieldStringa(s, 80))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  return {
    descrizione,
    descrizioneOriginale: descrizioneOriginale || descrizione,
    descrizioneNormalizzata: descrizioneNormalizzata || descrizione,
    quantita: quantita ?? 1,
    unita: normalizzaUnitaField(raw.unita),
    specifiche,
    note: troncaFieldStringa(raw.note, 200),
    ambiguo: Boolean(raw.ambiguo),
  };
}

/**
 * Valida risposta AI / locale verso contract.
 * @param {unknown} raw
 * @param {"lavorazioni"|"materiali"} tipoAtteso
 * @returns {{ ok: true, data: object }|{ ok: false, codice: string, messaggio: string }}
 */
export function validaRispostaFieldAssistant(raw, tipoAtteso) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      codice: "json_invalido",
      messaggio: "Risposta non strutturata.",
    };
  }

  const tipo = String(raw.tipo || tipoAtteso || "").trim();
  if (tipo !== FIELD_TIPI.lavorazioni && tipo !== FIELD_TIPI.materiali) {
    return {
      ok: false,
      codice: "tipo_invalido",
      messaggio: "Tipo risposta non valido.",
    };
  }
  if (tipoAtteso && tipo !== tipoAtteso) {
    return {
      ok: false,
      codice: "tipo_inatteso",
      messaggio: "Tipo risposta diverso da quello richiesto.",
    };
  }

  const normalizza =
    tipo === FIELD_TIPI.materiali
      ? normalizzaElementoMateriale
      : normalizzaElementoLavorazione;

  const elementi = (Array.isArray(raw.elementi) ? raw.elementi : [])
    .map(normalizza)
    .filter(Boolean)
    .slice(0, FIELD_AI_LIMITI.maxElementi);

  const elementiAmbigui = (
    Array.isArray(raw.elementiAmbigui) ? raw.elementiAmbigui : []
  )
    .map(normalizza)
    .filter(Boolean)
    .slice(0, FIELD_AI_LIMITI.maxElementi);

  const elementiNonRiconosciuti = (
    Array.isArray(raw.elementiNonRiconosciuti)
      ? raw.elementiNonRiconosciuti
      : []
  )
    .map((x) => troncaFieldStringa(x, 160))
    .filter(Boolean)
    .slice(0, 12);

  const informazioniExtra = (
    Array.isArray(raw.informazioniExtra) ? raw.informazioniExtra : []
  )
    .map((x) => troncaFieldStringa(x, 160))
    .filter(Boolean)
    .slice(0, 12);

  let confidence = String(raw.confidence || raw.confidenza || "").trim();
  if (!Object.values(FIELD_CONFIDENZA).includes(confidence)) {
    if (elementiAmbigui.length || elementiNonRiconosciuti.length) {
      confidence = FIELD_CONFIDENZA.media;
    } else if (elementi.length === 0) {
      confidence = FIELD_CONFIDENZA.bassa;
    } else {
      confidence = FIELD_CONFIDENZA.alta;
    }
  }

  // Blocca prezzi inventati nell'output AI
  const blob = JSON.stringify(raw);
  if (
    /"prezzo"\s*:|"importo"\s*:|"totale"\s*:|"costo"\s*:/i.test(blob) &&
    /€|\beuro\b|\bprezzo\b/i.test(blob)
  ) {
    // Se il modello ha messo campi prezzo espliciti → rifiuta
    if (
      Array.isArray(raw.elementi) &&
      raw.elementi.some(
        (el) =>
          el &&
          typeof el === "object" &&
          (el.prezzo != null || el.importo != null || el.costo != null)
      )
    ) {
      return {
        ok: false,
        codice: "prezzo_non_ammesso",
        messaggio: "L'AI non può proporre prezzi.",
      };
    }
  }

  return {
    ok: true,
    data: {
      tipo,
      testoOriginale: troncaFieldStringa(
        raw.testoOriginale,
        FIELD_AI_LIMITI.maxTestoLen
      ),
      elementi,
      elementiAmbigui,
      elementiNonRiconosciuti,
      informazioniExtra,
      confidence,
      confidenceEtichetta:
        ETICHETTE_FIELD_CONFIDENZA[confidence] ||
        ETICHETTE_FIELD_CONFIDENZA.media,
      tipoLavoro: troncaFieldStringa(raw.tipoLavoro, 80),
      descrizione: troncaFieldStringa(raw.descrizione, 400),
    },
  };
}

/**
 * @param {unknown} body
 * @param {string} azione
 */
export function validaRichiestaFieldAssistant(body, azione) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      codice: "payload_invalido",
      messaggio: "Richiesta non valida.",
    };
  }
  if (body.azione !== azione) {
    return {
      ok: false,
      codice: "azione_non_supportata",
      messaggio: "Azione non supportata.",
    };
  }
  const testo = troncaFieldStringa(body.testo, FIELD_AI_LIMITI.maxTestoLen);
  if (!testo || testo.length < 3) {
    return {
      ok: false,
      codice: "testo_mancante",
      messaggio: "Testo troppo corto.",
    };
  }
  const vietati = [
    "cliente",
    "clienteNome",
    "indirizzo",
    "telefono",
    "email",
    "codiceFiscale",
    "iban",
  ];
  for (const chiave of vietati) {
    if (Object.prototype.hasOwnProperty.call(body, chiave)) {
      return {
        ok: false,
        codice: "pii_rifiutata",
        messaggio: "Dati non ammessi nella richiesta.",
      };
    }
  }
  return { ok: true, data: { ...body, testo } };
}

export function costruisciSystemPromptField(tipo) {
  const focus =
    tipo === FIELD_TIPI.materiali
      ? "Estrai SOLO materiali elettrici (cavi, tubi, interruttori, cassette, ecc.) con quantità e unità. Non inventare sezioni/modelli non detti."
      : "Estrai SOLO lavorazioni da preventivo elettrico con quantità e unità. Non inventare lavorazioni non dette.";
  return [
    "Sei PreventivAI Field Assistant per elettricisti italiani.",
    focus,
    "NON inventare prezzi, costi, marche o modelli non espliciti nel testo.",
    "Se manca un'informazione (es. amperaggio differenziale), metti l'elemento in elementiAmbigui o nota.",
    "Rispondi SOLO con JSON valido secondo lo schema, senza markdown.",
  ].join(" ");
}
