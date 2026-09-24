/**
 * Estrazione locale materiali da memo vocale — senza prezzi.
 */

import {
  FIELD_CONFIDENZA,
  FIELD_TIPI,
  validaRispostaFieldAssistant,
} from "./fieldAssistantContract";
import {
  normalizzaSezioneCavo,
  patternNumeriField,
  risolviNumeroTestuale,
} from "./fieldAssistantTextUtils";

/**
 * @param {string} testo
 */
export function estraiMaterialiLocale(testo) {
  const originale = String(testo || "").trim();
  const testoNorm = normalizzaSezioneCavo(originale);
  const elementi = [];
  const elementiAmbigui = [];
  const informazioniExtra = [];
  const elementiNonRiconosciuti = [];
  const num = patternNumeriField();

  function push(lista, el) {
    const chiave = `${el.descrizione}|${el.quantita}|${el.unita}|${(el.specifiche || []).join(",")}`;
    if (lista.some((x) => `${x.descrizione}|${x.quantita}|${x.unita}|${(x.specifiche || []).join(",")}` === chiave)) {
      return;
    }
    lista.push(el);
  }

  // Cavo FG16 / N07V-K con sezione
  {
    const cavoRe = new RegExp(
      `${num}\\s*(?:metri|metro|m)?\\s*(?:di\\s+)?(?:cavo\\s+)?(fg\\s*16(?:\\s*or\\s*16)?|fg16or16|n07v-?k)\\s*(\\d+x\\d+(?:[.,]\\d+)?)?`,
      "gi"
    );
    let m;
    while ((m = cavoRe.exec(testoNorm)) !== null) {
      const qty = risolviNumeroTestuale(m[1]) ?? 1;
      const tipo = String(m[2] || "fg16")
        .replace(/\s+/g, "")
        .toUpperCase()
        .replace("FG16OR16", "FG16");
      const sezione = m[3] ? String(m[3]).replace(",", ".") : "";
      const specifiche = [];
      if (sezione) specifiche.push(sezione);
      push(elementi, {
        descrizione: sezione
          ? `cavo ${tipo.includes("FG") ? "FG16" : tipo} ${sezione}`
          : `cavo ${tipo.includes("FG") ? "FG16" : tipo}`,
        quantita: qty,
        unita: /metri|metro|\bm\b/.test(m[0]) || qty >= 5 ? "m" : "m",
        specifiche,
        note: "",
        ambiguo: !sezione,
      });
    }

    // "50 metri di cavo FG16 tre per due e mezzo" già normalizzato a 3x2.5
    const cavoAlt = new RegExp(
      `${num}\\s*(?:metri|metro|m)\\s*(?:di\\s+)?cavo\\s+(?:elettrico\\s+)?(?:fg\\s*16|fg16)?\\s*(\\d+x\\d+(?:\\.\\d+)?)?`,
      "gi"
    );
    while ((m = cavoAlt.exec(testoNorm)) !== null) {
      const qty = risolviNumeroTestuale(m[1]) ?? 1;
      const sezione = m[2] || "";
      // skip if already covered nearby
      if (
        elementi.some(
          (e) =>
            /cavo/i.test(e.descrizione) &&
            Math.abs(e.quantita - qty) < 0.01
        )
      ) {
        continue;
      }
      push(elementi, {
        descrizione: sezione ? `cavo FG16 ${sezione}` : "cavo FG16",
        quantita: qty,
        unita: "m",
        specifiche: sezione ? [sezione] : [],
        note: "",
        ambiguo: !sezione,
      });
    }
  }

  // Scatole / cassette 503 / 504
  {
    const re = new RegExp(
      `${num}\\s*(?:scatol[ea]|cassett[ea])\\s*(503|504|506)?|(?:scatol[ea]|cassett[ea])\\s*(503|504|506)`,
      "gi"
    );
    let m;
    while ((m = re.exec(testoNorm)) !== null) {
      const qty = risolviNumeroTestuale(m[1]) ?? 1;
      const tipo = m[2] || m[3] || "";
      push(elementi, {
        descrizione: tipo ? `scatola ${tipo}` : "scatola",
        quantita: qty,
        unita: "pz",
        specifiche: tipo ? [tipo] : [],
        note: "",
        ambiguo: !tipo,
      });
    }
  }

  // Magnetotermici C16 / C10 / B16
  {
    const re = new RegExp(
      `${num}\\s*magnetotermic[oi]\\s*([bc]\\s*\\d{1,2})?|magnetotermic[oi]\\s*([bc]\\s*\\d{1,2})`,
      "gi"
    );
    let m;
    while ((m = re.exec(testoNorm)) !== null) {
      const qty = risolviNumeroTestuale(m[1]) ?? 1;
      const curva = String(m[2] || m[3] || "")
        .replace(/\s+/g, "")
        .toUpperCase();
      push(elementi, {
        descrizione: curva
          ? `magnetotermico ${curva}`
          : "magnetotermico",
        quantita: qty,
        unita: "pz",
        specifiche: curva ? [curva] : [],
        note: "",
        ambiguo: !curva,
      });
    }
  }

  // Differenziale — non inventare amperaggio se assente
  {
    const re = new RegExp(
      `${num}?\\s*differenzial[ei]\\s*(?:da\\s+)?(?:${num}\\s*(?:ampere|amp|a)?)?`,
      "gi"
    );
    let m;
    while ((m = re.exec(testoNorm)) !== null) {
      const raw = m[0];
      const parts = [...raw.matchAll(new RegExp(num, "gi"))].map((x) =>
        risolviNumeroTestuale(x[1] || x[0])
      );
      let qty = 1;
      let ampere = null;
      if (parts.length === 1) {
        // "un differenziale" o "differenziale da 40"
        if (/ampere|amp|\ba\b|da\s+\d|da\s+quaranta/i.test(raw)) {
          ampere = parts[0];
        } else if (parts[0] != null && parts[0] <= 10) {
          qty = parts[0];
        } else if (parts[0] != null && parts[0] >= 16) {
          ampere = parts[0];
        }
      } else if (parts.length >= 2) {
        qty = parts[0] ?? 1;
        ampere = parts[1];
      }

      // "differenziale da quaranta" senza "un"
      const soloAmp = testoNorm.match(
        /differenzial[ei]\s+da\s+(quaranta|\d+)\s*(?:ampere|amp|a)?/
      );
      if (soloAmp && !/^\s*\d|un|uno|una|due/.test(raw)) {
        ampere = risolviNumeroTestuale(soloAmp[1]);
        qty = 1;
      }

      const el = {
        descrizione: ampere
          ? `differenziale ${ampere}A`
          : "differenziale",
        quantita: qty,
        unita: "pz",
        specifiche: ampere ? [`${ampere}A`] : [],
        note: ampere ? "" : "manca amperaggio/modello",
        ambiguo: !ampere,
      };
      if (!ampere) push(elementiAmbigui, el);
      else push(elementi, el);
    }
  }

  // Corrugato / tubo Ø
  {
    const re = new RegExp(
      `${num}\\s*(?:metri|metro|m)?\\s*(?:di\\s+)?(?:tubo\\s+)?corrugat[oi]\\s*(?:da\\s+)?(?:ø|o|diametro\\s*)?(\\d{2})?|(?:tubo\\s+)?corrugat[oi]\\s*(?:da\\s+)?(?:ø|o)?\\s*(\\d{2})`,
      "gi"
    );
    let m;
    while ((m = re.exec(testoNorm)) !== null) {
      const qty = risolviNumeroTestuale(m[1]) ?? 1;
      const diam = m[2] || m[3] || "";
      const usaMetri =
        /metri|metro|\bm\b/.test(m[0]) || qty >= 5 || /circa/.test(testoNorm);
      push(elementi, {
        descrizione: diam ? `corrugato Ø${diam}` : "corrugato",
        quantita: qty,
        unita: usaMetri ? "m" : "m",
        specifiche: diam ? [`Ø${diam}`] : [],
        note: "",
        ambiguo: !diam,
      });
    }
  }

  // "circa 30 metri" already handled if corrugato matched with circa in text
  if (/circa/.test(testoNorm)) {
    informazioniExtra.push("quantità approssimativa (circa)");
  }

  const confidence =
    elementi.length === 0 && elementiAmbigui.length === 0
      ? FIELD_CONFIDENZA.bassa
      : elementiAmbigui.length
        ? FIELD_CONFIDENZA.media
        : FIELD_CONFIDENZA.alta;

  return validaRispostaFieldAssistant(
    {
      tipo: FIELD_TIPI.materiali,
      testoOriginale: originale,
      elementi,
      elementiAmbigui,
      elementiNonRiconosciuti,
      informazioniExtra: [...new Set(informazioniExtra)],
      confidence,
    },
    FIELD_TIPI.materiali
  );
}
