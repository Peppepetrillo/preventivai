import { calcolaSaldo, calcolaTotali, normalizzaNumero } from "../../utils/preventivi";
import { estraiLavorazioniLocale } from "../aiFieldAssistant/estraiLavorazioniLocale";
import { matchLavorazioneConListino } from "../aiFieldAssistant/matchLavorazioneConListino";

const NUMERI_TESTUALI = {
  un: 1,
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  undici: 11,
  dodici: 12,
  quindici: 15,
  venti: 20,
  trenta: 30,
  quaranta: 40,
  cinquanta: 50,
  sessanta: 60,
  settanta: 70,
  ottanta: 80,
  novanta: 90,
  cento: 100,
};

/** Sinonimi → token listino (solo matching; mai prezzi). */
const SINONIMI_LISTINO = Object.freeze({
  presa: ["prese", "schuko", "punto presa", "punti presa"],
  prese: ["presa", "schuko", "punto presa", "punti presa"],
  luce: ["luci", "punto luce", "punti luce", "lampade", "faretti"],
  luci: ["luce", "punto luce", "punti luce"],
  punto: ["punti"],
  punti: ["punto"],
  quadro: ["centralino", "quadro elettrico"],
  canalina: ["canalina", "canaline", "passa cavi"],
  corrugato: ["corrugato", "tubo corrugato", "tubo"],
  cavo: ["cavi", "cavo elettrico"],
  citofono: ["videocitofono", "citofoni"],
  videocitofono: ["citofono", "videocitofoni"],
  videocitofoni: ["videocitofono", "citofono"],
});

function normalizzaTesto(testo) {
  return String(testo || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s%.,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(valore) {
  return String(valore).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenizza(testo) {
  return normalizzaTesto(testo)
    .split(" ")
    .filter((token) => token.length > 2);
}

/** Riduce plurale italiano grezzo (prese→presa, punti→punt). */
function radiceToken(token) {
  const t = String(token || "");
  if (t.length < 4) return t;
  if (t.endsWith("zioni")) return t.slice(0, -4);
  if (t.endsWith("ioni")) return t.slice(0, -3);
  if (t.endsWith("chi") || t.endsWith("ghi")) return t.slice(0, -1);
  if (t.endsWith("ci") || t.endsWith("gi")) return t.slice(0, -1);
  if (t.endsWith("he")) return `${t.slice(0, -2)}a`;
  if (t.endsWith("i") && !t.endsWith("ai") && !t.endsWith("ei")) {
    return `${t.slice(0, -1)}o`;
  }
  if (t.endsWith("e") && t.length > 4) return `${t.slice(0, -1)}a`;
  return t;
}

function espandiSinonimi(token) {
  const base = [token, radiceToken(token)];
  const extra = SINONIMI_LISTINO[token] || SINONIMI_LISTINO[radiceToken(token)];
  if (!extra) return [...new Set(base)];
  return [...new Set([...base, ...extra.flatMap((s) => tokenizza(s))])];
}

function trovaCliente(testoNormalizzato, clienti) {
  return clienti.find(
    (cliente) =>
      normalizzaTesto(cliente.nome).length > 2 &&
      testoNormalizzato.includes(normalizzaTesto(cliente.nome))
  );
}

function risolviNumero(valore) {
  if (NUMERI_TESTUALI[valore] != null) return NUMERI_TESTUALI[valore];
  return normalizzaNumero(String(valore).replace(",", "."), 1);
}

function estraiNumeroVicino(testoNormalizzato, nomeVoce) {
  const paroleNome = tokenizza(nomeVoce);
  const paroleChiave = [
    ...paroleNome.slice(0, 3),
    ...paroleNome.slice(0, 3).flatMap((p) => espandiSinonimi(p)),
  ].map(escapeRegex);
  const unici = [...new Set(paroleChiave)];
  const numeriAlt = Object.keys(NUMERI_TESTUALI).join("|");

  for (const parola of unici) {
    const prima = new RegExp(`(\\d+|${numeriAlt})\\s+\\w*\\s*${parola}`);
    const dopo = new RegExp(`${parola}\\s+\\w*\\s*(\\d+|${numeriAlt})`);
    const matchPrima = testoNormalizzato.match(prima);
    const matchDopo = testoNormalizzato.match(dopo);
    const valore = matchPrima?.[1] || matchDopo?.[1];
    if (valore) return risolviNumero(valore);
  }

  return 1;
}

function calcolaPunteggioVoce(testoNormalizzato, voce) {
  const tokenVoce = tokenizza(`${voce.nome} ${voce.categoria || ""}`);
  let punteggio = 0;
  const tokensTesto = new Set(tokenizza(testoNormalizzato));

  for (const token of tokenVoce) {
    const candidati = espandiSinonimi(token);
    if (
      candidati.some(
        (c) => testoNormalizzato.includes(c) || tokensTesto.has(c)
      )
    ) {
      punteggio += Math.max(token.length, 3);
    }
  }

  // Bonus se il nome completo (normalizzato) compare nel testo
  const nomeNorm = normalizzaTesto(voce.nome);
  if (nomeNorm.length > 4 && testoNormalizzato.includes(nomeNorm)) {
    punteggio += 10;
  }

  // Bonus sinonimo composto (es. "punti luce" ↔ "punto luce")
  const partiNome = tokenizza(voce.nome);
  if (partiNome.length >= 2) {
    const sinonimiFrase = partiNome.map((p) => espandiSinonimi(p));
    const tuttePresenti = sinonimiFrase.every((cands) =>
      cands.some((c) => testoNormalizzato.includes(c))
    );
    if (tuttePresenti) punteggio += 8;
  }

  return punteggio;
}

function creaLavorazioniSuggerite(testoNormalizzato, listino) {
  return listino
    .map((voce) => ({
      voce,
      punteggio: calcolaPunteggioVoce(testoNormalizzato, voce),
    }))
    .filter((match) => match.punteggio >= 5)
    .sort((a, b) => b.punteggio - a.punteggio)
    .slice(0, 10)
    .map(({ voce, punteggio }, index) => ({
      id: `match-${voce.id ?? voce.nome}-${index}`,
      listinoId: voce.id ?? null,
      nome: voce.nome,
      categoria: voce.categoria || "Lavorazioni",
      // Prezzo SOLO dal listino — mai inventato.
      prezzo: normalizzaNumero(voce.prezzo),
      quantita: estraiNumeroVicino(testoNormalizzato, voce.nome),
      unita: voce.unita || "cad",
      prezzoDalListino: true,
      punteggio,
    }));
}

/**
 * Frasi quantità+nome non coperte dal listino (per UI «Non trovo…»).
 */
export function estraiVociNonTrovate(testo, lavorazioniTrovate = []) {
  const testoNormalizzato = normalizzaTesto(testo);
  if (!testoNormalizzato) return [];

  const numeriAlt = Object.keys(NUMERI_TESTUALI).join("|");
  const re = new RegExp(
    `(\\d+|${numeriAlt})\\s+([a-z][a-z\\s]{1,40}?)(?=\\s+(?:e|con|piu|piu'|sconto|iva|acconto)\\b|,|;|$)`,
    "gi"
  );

  const trovatiNorm = lavorazioniTrovate.map((l) =>
    normalizzaTesto(l.nome)
  );
  const risultati = [];
  let match;
  while ((match = re.exec(testoNormalizzato)) !== null) {
    const quantita = risolviNumero(match[1]);
    const nome = String(match[2] || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!nome || nome.length < 3) continue;
    if (/^(euro|eur|metri|metro|cad|pezzi|giorni)$/i.test(nome)) continue;

    const nomeRadici = tokenizza(nome).map(radiceToken);
    const giaCoperto = trovatiNorm.some((n) => {
      if (n.includes(nome) || nome.includes(n)) return true;
      const nRadici = tokenizza(n).map(radiceToken);
      return nomeRadici.some((r) => nRadici.includes(r) && r.length > 3);
    });
    if (giaCoperto) continue;

    const chiave = `${quantita}|${nome}`;
    if (risultati.some((r) => r.chiave === chiave)) continue;
    risultati.push({
      chiave,
      nome,
      quantita,
      messaggio: `Non trovo «${nome}» nel tuo listino.`,
    });
  }

  return risultati.slice(0, 8);
}

function estraiPercentuale(testoNormalizzato, etichetta, fallback) {
  const match = testoNormalizzato.match(
    new RegExp(`${etichetta}\\s*(?:al|del|di)?\\s*(\\d+(?:[,.]\\d+)?)\\s*%?`)
  );
  return match ? normalizzaNumero(match[1].replace(",", "."), fallback) : fallback;
}

function estraiImporto(testoNormalizzato, etichetta, fallback = 0) {
  const match = testoNormalizzato.match(
    new RegExp(`${etichetta}\\s*(?:di|da)?\\s*(\\d+(?:[,.]\\d+)?)`)
  );
  return match ? normalizzaNumero(match[1].replace(",", "."), fallback) : fallback;
}

function estraiValidita(testoNormalizzato, fallback = 30) {
  const match = testoNormalizzato.match(
    /valid(?:ita|ita')?\s*(?:di|a)?\s*(\d+)\s*giorni/
  );
  return match ? normalizzaNumero(match[1], fallback) : fallback;
}

function estraiPagamento(testoNormalizzato, fallback = "Bonifico bancario") {
  if (testoNormalizzato.includes("bonifico")) return "Bonifico bancario";
  if (testoNormalizzato.includes("contanti")) return "Contanti";
  if (testoNormalizzato.includes("carta")) return "Carta";
  if (testoNormalizzato.includes("assegno")) return "Assegno";
  if (testoNormalizzato.includes("fine lavori")) return "Saldo a fine lavori";
  return fallback;
}

/**
 * Field Assistant → listino: prezzi solo da match deterministico.
 * @param {string} testo
 * @param {object[]} listino
 */
function lavorazioniDaFieldAssistant(testo, listino) {
  const estratto = estraiLavorazioniLocale(testo);
  if (!estratto.ok || !estratto.data?.elementi?.length) {
    return { lavorazioni: [], nonTrovate: [], informazioniExtra: [], confidence: null };
  }

  const lavorazioni = [];
  const nonTrovate = [];
  const ambigue = [];

  for (const el of estratto.data.elementi) {
    const match = matchLavorazioneConListino(el, listino);
    if (match.stato === "match" && match.candidato) {
      lavorazioni.push({
        id: `field-${match.candidato.listinoId || match.candidato.nome}-${lavorazioni.length}`,
        listinoId: match.candidato.listinoId,
        nome: match.candidato.nome,
        categoria: match.candidato.categoria || "Lavorazioni",
        prezzo: normalizzaNumero(match.candidato.prezzo),
        quantita: el.quantita ?? 1,
        unita: match.candidato.unita || el.unita || "cad",
        prezzoDalListino: true,
        punteggio: match.candidato.punteggio,
        candidatiAlternativi: [],
      });
    } else if (match.stato === "ambigui") {
      ambigue.push({
        ...el,
        candidati: match.candidati,
        messaggio: match.messaggio,
      });
      nonTrovate.push({
        chiave: `ambigua|${el.descrizione}|${el.quantita}`,
        nome: el.descrizione,
        quantita: el.quantita ?? 1,
        messaggio: match.messaggio || `Possibili corrispondenze per «${el.descrizione}».`,
        candidati: match.candidati,
      });
    } else {
      nonTrovate.push({
        chiave: `${el.quantita}|${el.descrizione}`,
        nome: el.descrizione,
        quantita: el.quantita ?? 1,
        messaggio: match.messaggio || `Non ho trovato «${el.descrizione}» nel listino.`,
      });
    }
  }

  for (const el of estratto.data.elementiAmbigui || []) {
    nonTrovate.push({
      chiave: `info|${el.descrizione}`,
      nome: el.descrizione,
      quantita: el.quantita ?? 1,
      messaggio: el.note || "Mi manca un'informazione — controlla prima di aggiungere.",
    });
  }

  return {
    lavorazioni,
    nonTrovate,
    informazioniExtra: estratto.data.informazioniExtra || [],
    confidence: estratto.data.confidence,
    ambigue,
  };
}

/**
 * Bozza da testo/voce: match listino locale, senza prezzi inventati.
 * Preferisce Field Assistant (NL) e integra il matcher diretto listino.
 */
export function generaBozzaPreventivoLocale({ testo, clienti, listino }) {
  const testoNormalizzato = normalizzaTesto(testo);
  const cliente = trovaCliente(testoNormalizzato, clienti);
  const elenco = Array.isArray(listino) ? listino : [];

  const field = lavorazioniDaFieldAssistant(testo, elenco);
  const dirette = creaLavorazioniSuggerite(testoNormalizzato, elenco);

  // Unisci: field first, poi dirette non duplicate
  const lavorazioni = [...field.lavorazioni];
  const nomiField = new Set(
    lavorazioni.map((l) => normalizzaTesto(l.nome))
  );
  for (const lav of dirette) {
    const chiave = normalizzaTesto(lav.nome);
    if (nomiField.has(chiave)) continue;
    lavorazioni.push(lav);
    nomiField.add(chiave);
  }

  const nonTrovateField = field.nonTrovate || [];
  const nonTrovateLegacy = estraiVociNonTrovate(testo, lavorazioni);
  const chiavi = new Set(nonTrovateField.map((n) => n.chiave));
  const nonTrovate = [
    ...nonTrovateField,
    ...nonTrovateLegacy.filter((n) => !chiavi.has(n.chiave)),
  ];

  const sconto = estraiPercentuale(testoNormalizzato, "sconto", 0);
  const iva = estraiPercentuale(testoNormalizzato, "iva", 22);
  const validita = estraiValidita(testoNormalizzato, 30);
  const pagamento = estraiPagamento(testoNormalizzato);
  const acconto = estraiImporto(testoNormalizzato, "acconto", 0);
  const totali = calcolaTotali(lavorazioni, sconto, iva);
  const saldo = calcolaSaldo(totali.totale, acconto);

  return {
    cliente: cliente?.nome || "",
    lavorazioni,
    nonTrovate,
    informazioniExtra: field.informazioniExtra || [],
    confidence: field.confidence,
    sconto,
    iva,
    validita,
    pagamento,
    acconto,
    note: String(testo || "").trim(),
    fonte: "listino_locale",
    riepilogo: {
      vociTrovate: lavorazioni.length,
      vociNonTrovate: nonTrovate.length,
      totale: totali.totale,
      saldo,
    },
    avvisi: [
      !cliente ? "Cliente non riconosciuto: selezionalo manualmente." : "",
      lavorazioni.length === 0
        ? "Nessuna voce listino riconosciuta: aggiungi lavorazioni dal listino."
        : "",
      nonTrovate.length > 0
        ? `${nonTrovate.length} richiesta/e non trovata/e nel listino.`
        : "",
    ].filter(Boolean),
  };
}

export async function generaBozzaPreventivoAI({ testo, clienti, listino }) {
  // Prezzi solo da listino. Nessun POST di anagrafica cliente.
  // L'endpoint AI Field (opzionale) arricchisce solo l'estrazione strutturata lato service UI.
  void import.meta.env.VITE_AI_ASSISTANT_ENDPOINT;
  return generaBozzaPreventivoLocale({ testo, clienti, listino });
}
