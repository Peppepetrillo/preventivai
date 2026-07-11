import { calcolaSaldo, calcolaTotali, normalizzaNumero } from "../../utils/preventivi";

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
};

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

function trovaCliente(testoNormalizzato, clienti) {
  return clienti.find((cliente) =>
    normalizzaTesto(cliente.nome).length > 2 &&
    testoNormalizzato.includes(normalizzaTesto(cliente.nome))
  );
}

function estraiNumeroVicino(testoNormalizzato, nomeVoce) {
  const paroleNome = tokenizza(nomeVoce);
  const paroleChiave = paroleNome.slice(0, 3).map(escapeRegex);

  for (const parola of paroleChiave) {
    const prima = new RegExp(`(\\d+|${Object.keys(NUMERI_TESTUALI).join("|")})\\s+\\w*\\s*${parola}`);
    const dopo = new RegExp(`${parola}\\s+\\w*\\s*(\\d+|${Object.keys(NUMERI_TESTUALI).join("|")})`);
    const matchPrima = testoNormalizzato.match(prima);
    const matchDopo = testoNormalizzato.match(dopo);
    const valore = matchPrima?.[1] || matchDopo?.[1];

    if (valore) {
      return NUMERI_TESTUALI[valore] || normalizzaNumero(valore, 1);
    }
  }

  return 1;
}

function calcolaPunteggioVoce(testoNormalizzato, voce) {
  const tokenVoce = tokenizza(`${voce.nome} ${voce.categoria || ""}`);

  return tokenVoce.reduce((punteggio, token) => {
    if (testoNormalizzato.includes(token)) return punteggio + token.length;
    return punteggio;
  }, 0);
}

function creaLavorazioniSuggerite(testoNormalizzato, listino) {
  return listino
    .map((voce) => ({
      voce,
      punteggio: calcolaPunteggioVoce(testoNormalizzato, voce),
    }))
    .filter((match) => match.punteggio >= 7)
    .sort((a, b) => b.punteggio - a.punteggio)
    .slice(0, 8)
    .map(({ voce }, index) => ({
      id: `ai-${voce.id ?? voce.nome}-${Date.now()}-${index}`,
      nome: voce.nome,
      categoria: voce.categoria || "Lavorazioni",
      prezzo: normalizzaNumero(voce.prezzo),
      quantita: estraiNumeroVicino(testoNormalizzato, voce.nome),
      unita: voce.unita || "cad",
    }));
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
  const match = testoNormalizzato.match(/valid(?:ita|ita')?\s*(?:di|a)?\s*(\d+)\s*giorni/);
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

export function generaBozzaPreventivoLocale({ testo, clienti, listino }) {
  const testoNormalizzato = normalizzaTesto(testo);
  const cliente = trovaCliente(testoNormalizzato, clienti);
  const lavorazioni = creaLavorazioniSuggerite(testoNormalizzato, listino);
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
    sconto,
    iva,
    validita,
    pagamento,
    acconto,
    note: testo.trim(),
    riepilogo: {
      vociTrovate: lavorazioni.length,
      totale: totali.totale,
      saldo,
    },
    avvisi: [
      !cliente ? "Cliente non riconosciuto: selezionalo manualmente." : "",
      lavorazioni.length === 0 ? "Nessuna voce listino riconosciuta: aggiungi lavorazioni manualmente." : "",
    ].filter(Boolean),
  };
}

export async function generaBozzaPreventivoAI({ testo, clienti, listino }) {
  const endpoint = import.meta.env.VITE_AI_ASSISTANT_ENDPOINT;

  if (!endpoint) {
    return generaBozzaPreventivoLocale({ testo, clienti, listino });
  }

  const risposta = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      testo,
      clienti,
      listino,
    }),
  });

  if (!risposta.ok) {
    throw new Error("Assistente AI non disponibile.");
  }

  return risposta.json();
}
