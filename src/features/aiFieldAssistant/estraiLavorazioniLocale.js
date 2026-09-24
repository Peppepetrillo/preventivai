/**
 * Estrazione locale lavorazioni da testo naturale — senza prezzi.
 */

import {
  FIELD_CONFIDENZA,
  FIELD_TIPI,
  validaRispostaFieldAssistant,
} from "./fieldAssistantContract";
import {
  normalizzaTestoField,
  patternNumeriField,
  risolviNumeroTestuale,
} from "./fieldAssistantTextUtils";

/** Pattern tipici elettricista → descrizione canonica. */
const PATTERN_LAVORAZIONI = Object.freeze([
  {
    id: "punto-luce",
    re: /(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|quindici|venti|trenta|quaranta|cinquanta|sessanta|settanta|ottanta|novanta|cento)\s*(?:punti?\s+)?(?:di\s+)?luc[ei]|punti?\s+luc[ei]\s*(?:circa\s+)?(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|quindici|venti|trenta|quaranta|cinquanta|sessanta|settanta|ottanta|novanta|cento)?/gi,
    descrizione: "punto luce",
    unita: "pz",
    qtyFrom: "first",
  },
  {
    id: "punto-presa",
    re: /(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|quindici|venti|trenta|quaranta|cinquanta|sessanta|settanta|ottanta|novanta|cento)\s*(?:punti?\s+)?(?:di\s+)?pres[ea]|punti?\s+pres[ea]\s*(?:circa\s+)?(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|quindici|venti|trenta|quaranta|cinquanta|sessanta|settanta|ottanta|novanta|cento)?|(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|quindici|venti|trenta|quaranta|cinquanta|sessanta|settanta|ottanta|novanta|cento)\s*schuko/gi,
    descrizione: "punto presa",
    unita: "pz",
    qtyFrom: "first",
  },
  {
    id: "linea-dedicata",
    re: /(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+linee?\s+dedicat[ea]i?(?:\s+per\s+([a-z0-9\s]+?))?(?=\s*(?:,|e\s+\d|e\s+un|\.|$|quadro|video|predisposizione|nuovo))/gi,
    descrizione: "linea dedicata",
    unita: "pz",
    qtyFrom: "first",
    splitPer: true,
  },
  {
    id: "quadro",
    re: /quadro(?:\s+elettrico)?(?:\s+nuovo)?(?:\s+da\s+(\d+)\s+moduli)?|centralino(?:\s+da\s+(\d+)\s+moduli)?|(?:nuovo\s+)?quadro\s+(\d+)\s+moduli/gi,
    descrizione: "quadro elettrico",
    unita: "pz",
    defaultQty: 1,
    moduli: true,
  },
  {
    id: "videocitofono",
    re: /(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro)?\s*video?\s*-?\s*citofon[oi]/gi,
    descrizione: "videocitofono",
    unita: "pz",
    defaultQty: 1,
  },
  {
    id: "citofono",
    re: /(\d+(?:[.,]\d+)?|un|uno|una|due|tre)?\s*citofon[oi](?!\s*video)/gi,
    descrizione: "citofono",
    unita: "pz",
    defaultQty: 1,
  },
  {
    id: "predisposizione-clima",
    re: /predisposizion[ei]\s+(?:per\s+)?(?:(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+)?climatizzator[ei]|(\d+(?:[.,]\d+)?|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+climatizzator[ei]/gi,
    descrizione: "predisposizione climatizzatore",
    unita: "pz",
    defaultQty: 1,
  },
  {
    id: "impianto",
    re: /rifacimento\s+impianto|impianto\s+elettrico|nuovo\s+impianto/gi,
    descrizione: "impianto elettrico",
    unita: "pz",
    defaultQty: 1,
    extraOnly: false,
  },
]);

function pushUnico(lista, el) {
  const desc = el.descrizioneNormalizzata || el.descrizione;
  const chiave = `${desc}|${el.quantita}|${el.unita}|${el.note || ""}`;
  if (
    lista.some(
      (x) =>
        `${x.descrizioneNormalizzata || x.descrizione}|${x.quantita}|${x.unita}|${x.note || ""}` ===
        chiave
    )
  ) {
    return;
  }
  const descrizione = desc;
  lista.push({
    ...el,
    descrizione,
    descrizioneOriginale: el.descrizioneOriginale || descrizione,
    descrizioneNormalizzata: el.descrizioneNormalizzata || descrizione,
  });
}

function estraiMq(testoNorm) {
  const m = testoNorm.match(
    /(?:circa\s+)?(\d+(?:[.,]\d+)?)\s*(?:m(?:etri)?\s*(?:quadrati?|quadri)|mq|m2|m²)/
  );
  if (!m) return null;
  const n = risolviNumeroTestuale(m[1]);
  return n ? `circa ${n} m²` : null;
}

/**
 * @param {string} testo
 * @returns {ReturnType<typeof validaRispostaFieldAssistant>}
 */
export function estraiLavorazioniLocale(testo) {
  const originale = String(testo || "").trim();
  const testoNorm = normalizzaTestoField(originale);
  const elementi = [];
  const elementiAmbigui = [];
  const informazioniExtra = [];
  const elementiNonRiconosciuti = [];

  const mq = estraiMq(testoNorm);
  if (mq) informazioniExtra.push(mq);

  if (/appartamento|villetta|casa|ufficio|negozio/.test(testoNorm)) {
    const ctx = testoNorm.match(
      /(appartamento|villetta|casa|ufficio|negozio)(?:\s+di)?/
    );
    if (ctx) informazioniExtra.push(ctx[1]);
  }

  for (const pattern of PATTERN_LAVORAZIONI) {
    const re = new RegExp(pattern.re.source, pattern.re.flags);
    let match;
    while ((match = re.exec(testoNorm)) !== null) {
      if (pattern.id === "linea-dedicata" && pattern.splitPer) {
        const qty = risolviNumeroTestuale(match[1]) ?? pattern.defaultQty ?? 1;
        const destinazioni = String(match[2] || "")
          .split(/\s+e\s+|\s*,\s*/)
          .map((s) => s.trim())
          .filter((s) => s && s.length > 2 && !/^(per|con|da)$/.test(s));

        if (destinazioni.length >= 2 && destinazioni.length === qty) {
          for (const dest of destinazioni) {
            pushUnico(elementi, {
              descrizione: `linea dedicata ${dest}`.trim(),
              quantita: 1,
              unita: "pz",
              note: "",
              ambiguo: false,
            });
          }
        } else if (destinazioni.length === 1) {
          pushUnico(elementi, {
            descrizione: `linea dedicata ${destinazioni[0]}`.trim(),
            quantita: qty,
            unita: "pz",
            note: "",
            ambiguo: false,
          });
        } else {
          pushUnico(elementi, {
            descrizione: "linea dedicata",
            quantita: qty,
            unita: "pz",
            note: destinazioni.join(", "),
            ambiguo: destinazioni.length === 0,
          });
        }
        continue;
      }

      if (pattern.moduli) {
        const moduli =
          risolviNumeroTestuale(match[1]) ||
          risolviNumeroTestuale(match[2]) ||
          risolviNumeroTestuale(match[3]);
        pushUnico(elementi, {
          descrizione: moduli
            ? `quadro elettrico ${moduli} moduli`
            : "quadro elettrico",
          quantita: 1,
          unita: "pz",
          note: moduli ? `${moduli} moduli` : "",
          ambiguo: false,
        });
        continue;
      }

      let qty = null;
      for (let i = 1; i < match.length; i += 1) {
        if (match[i]) {
          const n = risolviNumeroTestuale(match[i]);
          if (n != null) {
            qty = n;
            break;
          }
        }
      }
      qty = qty ?? pattern.defaultQty ?? 1;

      pushUnico(elementi, {
        descrizione: pattern.descrizione,
        quantita: qty,
        unita: pattern.unita || "pz",
        note: "",
        ambiguo: false,
      });
    }
  }

  // "prese e punti luce" senza quantità separate ma con numeri prima: già coperto.
  // "70 prese e punti luce" → stessa quantità per entrambi
  const combo = testoNorm.match(
    new RegExp(
      `${patternNumeriField()}\\s+pres[ea]\\s+e\\s+punt[oi]\\s+luc[ei]`,
      "i"
    )
  );
  if (combo) {
    const qty = risolviNumeroTestuale(combo[1]) ?? 1;
    pushUnico(elementi, {
      descrizione: "punto presa",
      quantita: qty,
      unita: "pz",
      note: "",
      ambiguo: false,
    });
    pushUnico(elementi, {
      descrizione: "punto luce",
      quantita: qty,
      unita: "pz",
      note: "",
      ambiguo: false,
    });
  }

  const confidence =
    elementi.length === 0
      ? FIELD_CONFIDENZA.bassa
      : elementiAmbigui.length
        ? FIELD_CONFIDENZA.media
        : FIELD_CONFIDENZA.alta;

  return validaRispostaFieldAssistant(
    {
      tipo: FIELD_TIPI.lavorazioni,
      testoOriginale: originale,
      tipoLavoro: /impianto|appartamento|rifacimento/.test(testoNorm)
        ? "impianto elettrico"
        : "",
      descrizione: originale.slice(0, 200),
      elementi,
      elementiAmbigui,
      elementiNonRiconosciuti,
      informazioniExtra: [...new Set(informazioniExtra)],
      confidence,
    },
    FIELD_TIPI.lavorazioni
  );
}
