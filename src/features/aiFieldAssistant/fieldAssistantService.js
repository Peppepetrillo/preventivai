/**
 * Orchestrazione Field Assistant:
 * testo → estrazione (locale, opzionale AI) → match listino/catalogo → preview.
 * Nessun salvataggio qui.
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
 * @param {string} testo
 * @param {{
 *   listino?: object[],
 *   usaProvider?: boolean,
 *   providerOpzioni?: object,
 * }=} opzioni
 */
export async function elaboraLavorazioniDaTesto(testo, opzioni = {}) {
  const locale = estraiLavorazioniLocale(testo);
  let estrazione = locale.ok ? locale.data : null;
  let fonte = "locale";
  let avvisoAi = "";

  if (opzioni.usaProvider && getAiAssistantEndpoint()) {
    const remoto = await estraiConProviderAi(
      FIELD_TIPI.lavorazioni,
      testo,
      opzioni.providerOpzioni
    );
    if (remoto.ok) {
      estrazione = remoto.data;
      fonte = "provider";
    } else if (!estrazione || estrazione.elementi.length === 0) {
      avvisoAi =
        remoto.messaggio || "Assistente AI non disponibile offline.";
    }
  } else if (opzioni.usaProvider && !getAiAssistantEndpoint()) {
    avvisoAi = "Assistente AI non disponibile offline.";
  }

  if (!estrazione) {
    return {
      ok: false,
      codice: locale.codice || "estrazione_fallita",
      messaggio: "Non riesco a elaborare il contenuto.",
      testoOriginale: String(testo || ""),
      avvisoAi,
    };
  }

  const listino =
    opzioni.listino || selezionaVociAttive(leggiListino()) || [];
  const abbinate = abbinaLavorazioniAlListino(estrazione.elementi, listino);
  const ambigueEstratte = abbinaLavorazioniAlListino(
    estrazione.elementiAmbigui || [],
    listino
  );

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
    // Nessun salvataggio — solo preview
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

  if (opzioni.usaProvider && getAiAssistantEndpoint()) {
    const remoto = await estraiConProviderAi(
      FIELD_TIPI.materiali,
      testo,
      opzioni.providerOpzioni
    );
    if (remoto.ok) {
      estrazione = remoto.data;
      fonte = "provider";
    } else if (!estrazione || estrazione.elementi.length === 0) {
      avvisoAi =
        remoto.messaggio || "Assistente AI non disponibile offline.";
    }
  } else if (opzioni.usaProvider && !getAiAssistantEndpoint()) {
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

  let catalogo = opzioni.catalogo;
  if (!catalogo) {
    try {
      catalogo = caricaCatalogoMateriali();
    } catch {
      catalogo = undefined;
    }
  }

  const materiali = abbinaMaterialiAlCatalogo(estrazione.elementi, catalogo);
  const materialiAmbigui = abbinaMaterialiAlCatalogo(
    estrazione.elementiAmbigui || [],
    catalogo
  );

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
        nome: candidato?.nome || m.descrizione,
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
