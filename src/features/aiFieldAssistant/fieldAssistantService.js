/**
 * Orchestrazione Field Assistant:
 * testo → estrazione locale → match listino/catalogo → (AI solo se locale debole) → preview.
 * Nessun salvataggio qui. Matching locale PRIMA di qualsiasi chiamata AI.
 */

import { selezionaVociAttive } from "../listino/listinoCatalogDomain";
import { leggiListino } from "../../repositories/listinoRepository";
import { caricaCatalogoMateriali } from "../../domain/catalogoMateriali/materialiCatalogService";
import {
  ETICHETTE_FIELD_CONFIDENZA,
  FIELD_TIPI,
} from "./fieldAssistantContract";
import { estraiLavorazioniLocale } from "./estraiLavorazioniLocale";
import { estraiMaterialiLocale } from "./estraiMaterialiLocale";
import { abbinaLavorazioniAlListino } from "./matchLavorazioneConListino";
import { abbinaMaterialiAlCatalogo } from "./matchMaterialeConCatalogo";
import { estraiConProviderAi } from "./fieldAssistantProvider";
import { getAiAssistantEndpoint } from "../ai/aiProvider";

/**
 * Locale "forte" = almeno un elemento e confidence non bassa.
 * @param {object|null} estrazione
 */
function estrazioneLocaleSufficiente(estrazione) {
  if (!estrazione) return false;
  const n = (estrazione.elementi || []).length;
  if (n === 0) return false;
  if (estrazione.confidence === "bassa" && n < 2) return false;
  return true;
}

/**
 * @param {string} testo
 * @param {{
 *   listino?: object[],
 *   usaProvider?: boolean,
 *   providerOpzioni?: object,
 * }=} opzioni
 */
export async function elaboraLavorazioniDaTesto(testo, opzioni = {}) {
  // 1) Locale sempre
  const locale = estraiLavorazioniLocale(testo);
  let estrazione = locale.ok ? locale.data : null;
  let fonte = "locale";
  let avvisoAi = "";

  const listino =
    opzioni.listino || selezionaVociAttive(leggiListino()) || [];

  // 2) Match locale PRIMA di qualsiasi AI (privacy + costi)
  let abbinate = abbinaLavorazioniAlListino(
    estrazione?.elementi || [],
    listino
  );
  let ambigueEstratte = abbinaLavorazioniAlListino(
    estrazione?.elementiAmbigui || [],
    listino
  );

  const localeOk = estrazioneLocaleSufficiente(estrazione);
  const matchDebole =
    abbinate.length === 0 ||
    abbinate.every((v) => v.match?.stato === "non_trovato");

  // 3) AI solo se richiesto E locale insufficiente
  const vuoleAi = Boolean(opzioni.usaProvider);
  const endpointOk = Boolean(getAiAssistantEndpoint());

  if (vuoleAi && endpointOk && (!localeOk || matchDebole)) {
    const remoto = await estraiConProviderAi(
      FIELD_TIPI.lavorazioni,
      testo,
      opzioni.providerOpzioni
    );
    if (remoto.ok && remoto.data?.elementi?.length) {
      estrazione = remoto.data;
      fonte = "provider";
      abbinate = abbinaLavorazioniAlListino(estrazione.elementi, listino);
      ambigueEstratte = abbinaLavorazioniAlListino(
        estrazione.elementiAmbigui || [],
        listino
      );
    } else {
      avvisoAi =
        remoto.messaggio ||
        "Assistente AI non disponibile. Uso interpretazione locale.";
    }
  } else if (vuoleAi && !endpointOk) {
    avvisoAi = "Assistente AI non disponibile offline.";
  } else if (vuoleAi && localeOk && !matchDebole) {
    // Locale sufficiente: nessuna chiamata AI (privacy/costi)
    avvisoAi = "";
  }

  if (!estrazione || !(estrazione.elementi || []).length) {
    return {
      ok: false,
      codice: locale.codice || "estrazione_fallita",
      messaggio: "Non riesco a elaborare il contenuto.",
      testoOriginale: String(testo || ""),
      avvisoAi:
        avvisoAi ||
        (vuoleAi && !endpointOk
          ? "Assistente AI non disponibile offline."
          : ""),
    };
  }

  return {
    ok: true,
    fonte,
    testoOriginale: estrazione.testoOriginale || String(testo || ""),
    tipoLavoro: estrazione.tipoLavoro || "",
    descrizione: estrazione.descrizione || "",
    confidence: estrazione.confidence,
    confidenceEtichetta:
      estrazione.confidenceEtichetta ||
      ETICHETTE_FIELD_CONFIDENZA[estrazione.confidence],
    informazioniExtra: estrazione.informazioniExtra || [],
    elementiNonRiconosciuti: estrazione.elementiNonRiconosciuti || [],
    voci: abbinate,
    vociAmbigue: ambigueEstratte,
    avvisoAi,
    persistito: false,
  };
}

/**
 * @param {string} testo
 * @param {{
 *   catalogo?: object[],
 *   usaProvider?: boolean,
 *   providerOpzioni?: object,
 * }=} opzioni
 */
export async function elaboraMaterialiDaTesto(testo, opzioni = {}) {
  const locale = estraiMaterialiLocale(testo);
  let estrazione = locale.ok ? locale.data : null;
  let fonte = "locale";
  let avvisoAi = "";

  let catalogo = opzioni.catalogo;
  if (!catalogo) {
    try {
      catalogo = caricaCatalogoMateriali();
    } catch {
      catalogo = undefined;
    }
  }

  let materiali = abbinaMaterialiAlCatalogo(
    estrazione?.elementi || [],
    catalogo
  );
  let materialiAmbigui = abbinaMaterialiAlCatalogo(
    estrazione?.elementiAmbigui || [],
    catalogo
  );

  const localeOk = estrazioneLocaleSufficiente(estrazione);
  const matchDebole =
    materiali.length === 0 ||
    materiali.every((m) => m.match?.stato === "non_trovato");

  const vuoleAi = Boolean(opzioni.usaProvider);
  const endpointOk = Boolean(getAiAssistantEndpoint());

  if (vuoleAi && endpointOk && (!localeOk || matchDebole)) {
    const remoto = await estraiConProviderAi(
      FIELD_TIPI.materiali,
      testo,
      opzioni.providerOpzioni
    );
    if (remoto.ok && remoto.data?.elementi?.length) {
      estrazione = remoto.data;
      fonte = "provider";
      materiali = abbinaMaterialiAlCatalogo(estrazione.elementi, catalogo);
      materialiAmbigui = abbinaMaterialiAlCatalogo(
        estrazione.elementiAmbigui || [],
        catalogo
      );
    } else {
      avvisoAi =
        remoto.messaggio ||
        "Assistente AI non disponibile. Uso interpretazione locale.";
    }
  } else if (vuoleAi && !endpointOk) {
    avvisoAi = "Assistente AI non disponibile offline.";
  }

  if (!estrazione) {
    return {
      ok: false,
      codice: locale.codice || "estrazione_fallita",
      messaggio: "Non riesco a elaborare il contenuto.",
      testoOriginale: String(testo || ""),
      trascrizione: String(testo || ""),
      avvisoAi,
    };
  }

  return {
    ok: true,
    fonte,
    testoOriginale: estrazione.testoOriginale || String(testo || ""),
    trascrizione: estrazione.testoOriginale || String(testo || ""),
    confidence: estrazione.confidence,
    confidenceEtichetta:
      estrazione.confidenceEtichetta ||
      ETICHETTE_FIELD_CONFIDENZA[estrazione.confidence],
    informazioniExtra: estrazione.informazioniExtra || [],
    elementiNonRiconosciuti: estrazione.elementiNonRiconosciuti || [],
    materiali,
    materialiAmbigui,
    avvisoAi,
    persistito: false,
  };
}

/**
 * Costruisce payload cantiere.materiali da preview confermata (niente prezzi inventati).
 * @param {object[]} materialiConfermati — voci con match scelto dall'utente
 */
export function payloadMaterialiDaConferma(materialiConfermati = []) {
  return (Array.isArray(materialiConfermati) ? materialiConfermati : [])
    .filter((m) => m && !m.escluso)
    .map((m) => {
      const candidato = m.matchScelto || m.match?.candidato || null;
      return {
        nome:
          candidato?.nome ||
          m.descrizioneNormalizzata ||
          m.descrizione ||
          m.descrizioneOriginale,
        quantita: Number(m.quantita) || 1,
        unita: candidato?.unita || m.unita || "pz",
        famigliaId: candidato?.famigliaId || undefined,
        varianteId: candidato?.varianteId || undefined,
        note: m.note || undefined,
        origine: "memo_vocale",
        prezzoUnitario:
          candidato?.prezzoIndicativo != null
            ? candidato.prezzoIndicativo
            : undefined,
      };
    });
}

/**
 * Costruisce lavorazioni wizard da preview confermata (prezzi SOLO listino).
 */
export function payloadLavorazioniDaConferma(vociConfermate = []) {
  return (Array.isArray(vociConfermate) ? vociConfermate : [])
    .filter((v) => v && !v.escluso && (v.matchScelto || v.match?.candidato))
    .map((v) => {
      const c = v.matchScelto || v.match.candidato;
      return {
        id: `field-${c.listinoId || c.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        listinoId: c.listinoId,
        nome: c.nome,
        categoria: c.categoria || "Lavorazioni",
        prezzo: Number(c.prezzo) || 0,
        quantita: Number(v.quantita) || 1,
        unita: c.unita || v.unita || "cad",
        prezzoDalListino: true,
      };
    });
}
