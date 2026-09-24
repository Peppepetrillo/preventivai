/**
 * Comandi vocali incrementali sul carrello preventivo.
 * Prezzi SOLO dal listino. Mai applicare senza conferma UI.
 */

import { normalizzaNumero } from "../../utils/preventivi";

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

const SINONIMI = Object.freeze({
  presa: ["prese", "schuko", "punto presa", "punti presa"],
  prese: ["presa", "schuko", "punto presa"],
  luce: ["luci", "punto luce", "punti luce", "led", "lampade"],
  luci: ["luce", "punto luce", "led"],
  led: ["luce", "luci", "punto luce", "faretti"],
  punto: ["punti"],
  punti: ["punto"],
  quadro: ["centralino", "quadro elettrico"],
  canalina: ["canaline"],
  corrugato: ["tubo corrugato", "tubo"],
});

export const AZIONE_INCREMENTALE = Object.freeze({
  AGGIUNGI: "aggiungi",
  RIMUOVI: "rimuovi",
  IMPOSTA: "imposta",
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

function tokenizza(testo) {
  return normalizzaTesto(testo)
    .split(" ")
    .filter((t) => t.length > 2);
}

function radiceToken(token) {
  const t = String(token || "");
  if (t.length < 4) return t;
  if (t.endsWith("i") && !t.endsWith("ai") && !t.endsWith("ei")) {
    return `${t.slice(0, -1)}o`;
  }
  if (t.endsWith("e") && t.length > 4) return `${t.slice(0, -1)}a`;
  return t;
}

const TOKEN_GENERICI = new Set(["punto", "punti", "voce", "lavoro"]);

function espandi(token) {
  const base = [token, radiceToken(token)];
  const extra = SINONIMI[token] || SINONIMI[radiceToken(token)] || [];
  const daSinonimi = extra.flatMap((s) => {
    const parti = tokenizza(s);
    if (parti.length <= 1) return parti;
    // Frasi tipo «punto presa»: tieni i token distintivi, non «punto» da solo.
    return parti.filter((p) => !TOKEN_GENERICI.has(p));
  });
  return [...new Set([...base, ...daSinonimi])];
}

function risolviNumero(valore) {
  if (NUMERI_TESTUALI[valore] != null) return NUMERI_TESTUALI[valore];
  return normalizzaNumero(String(valore).replace(",", "."), NaN);
}

function punteggioMatch(fraseTarget, voceNome) {
  const targetTokens = tokenizza(fraseTarget);
  const nomeTokens = tokenizza(voceNome);
  if (!targetTokens.length || !nomeTokens.length) return 0;

  const distintivi = nomeTokens.filter(
    (nt) => !TOKEN_GENERICI.has(nt) && !TOKEN_GENERICI.has(radiceToken(nt))
  );
  const daValutare = distintivi.length ? distintivi : nomeTokens;

  let score = 0;
  let hit = 0;
  for (const nt of daValutare) {
    const cands = espandi(nt);
    const ok = targetTokens.some(
      (t) => cands.includes(t) || espandi(t).includes(nt) || t === nt
    );
    if (ok) {
      score += Math.max(nt.length, 3);
      hit += 1;
    }
  }

  if (hit === 0) return 0;
  if (hit < daValutare.length) {
    score -= 4 * (daValutare.length - hit);
  }

  const nomeNorm = normalizzaTesto(voceNome);
  const targetNorm = normalizzaTesto(fraseTarget);
  if (nomeNorm.length > 3 && targetNorm.includes(nomeNorm)) score += 10;

  if (daValutare.length >= 1 && hit === daValutare.length) {
    score += 6;
  }

  return score;
}

function trovaMigliorVoce(fraseTarget, candidati) {
  let best = null;
  let bestScore = 0;
  for (const voce of candidati) {
    const score = punteggioMatch(fraseTarget, voce.nome || "");
    if (score > bestScore) {
      bestScore = score;
      best = voce;
    }
  }
  return bestScore >= 5 ? best : null;
}

/**
 * Rileva comando incrementale.
 * @returns {{ azione: string, quantita: number, targetFrase: string }|null}
 */
export function rilevaComandoIncrementale(testo) {
  const n = normalizzaTesto(testo);
  if (!n) return null;

  const numeriAlt = Object.keys(NUMERI_TESTUALI).join("|");
  const qty = `(\\d+|${numeriAlt})`;

  const patterns = [
    {
      azione: AZIONE_INCREMENTALE.RIMUOVI,
      re: new RegExp(
        `^(?:togli|elimina|rimuovi|leva)\\s+${qty}\\s+(.+)$`
      ),
    },
    {
      azione: AZIONE_INCREMENTALE.IMPOSTA,
      re: new RegExp(
        `^(?:porta|imposta|modifica)\\s+(?:le\\s+|i\\s+|l[''])?(.+?)\\s+a\\s+${qty}$`
      ),
      quantitaGroup: 2,
      targetGroup: 1,
    },
    {
      azione: AZIONE_INCREMENTALE.IMPOSTA,
      re: new RegExp(`^metti\\s+${qty}\\s+(.+)$`),
    },
    {
      azione: AZIONE_INCREMENTALE.AGGIUNGI,
      re: new RegExp(
        `^(?:aggiungi|inserisci)\\s+${qty}\\s+(.+)$`
      ),
    },
  ];

  for (const p of patterns) {
    const m = n.match(p.re);
    if (!m) continue;
    const quantitaRaw = p.quantitaGroup ? m[p.quantitaGroup] : m[1];
    const targetFrase = p.targetGroup ? m[p.targetGroup] : m[2];
    const quantita = risolviNumero(quantitaRaw);
    if (!Number.isFinite(quantita) || quantita <= 0) continue;
    const target = String(targetFrase || "").trim();
    if (target.length < 2) continue;
    return { azione: p.azione, quantita, targetFrase: target };
  }

  return null;
}

function clonaLavorazioni(lavorazioni) {
  return (Array.isArray(lavorazioni) ? lavorazioni : []).map((l) => ({
    ...l,
  }));
}

function trovaIndiceCarrello(lavorazioni, voceNome) {
  let bestIdx = -1;
  let bestScore = 0;
  lavorazioni.forEach((lav, idx) => {
    const score = punteggioMatch(voceNome, lav.nome || "");
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });
  return bestScore >= 5 ? bestIdx : -1;
}

/**
 * Interpreta comando incrementale → preview (senza mutare stato UI).
 * @returns {null|{
 *   modalita: 'incrementale',
 *   azione: string,
 *   messaggio: string,
 *   lavorazioni: object[],
 *   diff: { nome: string, da: number, a: number, prezzo?: number }[],
 *   nonTrovate: object[],
 *   avvisi: string[],
 * }}
 */
export function interpretaComandoIncrementale({
  testo,
  lavorazioni = [],
  listino = [],
}) {
  const comando = rilevaComandoIncrementale(testo);
  if (!comando) return null;

  const carrello = clonaLavorazioni(lavorazioni);
  const listinoAttivo = Array.isArray(listino) ? listino : [];
  const nonTrovate = [];
  const diff = [];
  const avvisi = [];

  if (comando.azione === AZIONE_INCREMENTALE.AGGIUNGI) {
    const idx = trovaIndiceCarrello(carrello, comando.targetFrase);
    if (idx >= 0) {
      const da = normalizzaNumero(carrello[idx].quantita, 0);
      const a = da + comando.quantita;
      carrello[idx] = { ...carrello[idx], quantita: a };
      diff.push({ nome: carrello[idx].nome, da, a });
    } else {
      const voce = trovaMigliorVoce(comando.targetFrase, listinoAttivo);
      if (!voce) {
        nonTrovate.push({
          chiave: `inc|${comando.targetFrase}`,
          nome: comando.targetFrase,
          quantita: comando.quantita,
          messaggio: `Non ho trovato una corrispondenza nel tuo listino per «${comando.targetFrase}».`,
        });
      } else {
        carrello.push({
          id: `inc-${voce.id ?? voce.nome}-${Date.now()}`,
          listinoId: voce.id ?? null,
          nome: voce.nome,
          categoria: voce.categoria || "Lavorazioni",
          prezzo: normalizzaNumero(voce.prezzo),
          quantita: comando.quantita,
          unita: voce.unita || "cad",
          prezzoDalListino: true,
        });
        diff.push({
          nome: voce.nome,
          da: 0,
          a: comando.quantita,
          prezzo: normalizzaNumero(voce.prezzo),
        });
      }
    }
  } else if (comando.azione === AZIONE_INCREMENTALE.RIMUOVI) {
    const idx = trovaIndiceCarrello(carrello, comando.targetFrase);
    if (idx < 0) {
      avvisi.push(
        `Nel preventivo non c’è «${comando.targetFrase}» da togliere.`
      );
    } else {
      const da = normalizzaNumero(carrello[idx].quantita, 0);
      const a = Math.max(0, da - comando.quantita);
      const nome = carrello[idx].nome;
      if (a <= 0) {
        carrello.splice(idx, 1);
        diff.push({ nome, da, a: 0 });
      } else {
        carrello[idx] = { ...carrello[idx], quantita: a };
        diff.push({ nome, da, a });
      }
    }
  } else if (comando.azione === AZIONE_INCREMENTALE.IMPOSTA) {
    const idx = trovaIndiceCarrello(carrello, comando.targetFrase);
    if (idx >= 0) {
      const da = normalizzaNumero(carrello[idx].quantita, 0);
      carrello[idx] = { ...carrello[idx], quantita: comando.quantita };
      diff.push({ nome: carrello[idx].nome, da, a: comando.quantita });
    } else {
      const voce = trovaMigliorVoce(comando.targetFrase, listinoAttivo);
      if (!voce) {
        nonTrovate.push({
          chiave: `inc|${comando.targetFrase}`,
          nome: comando.targetFrase,
          quantita: comando.quantita,
          messaggio: `Non ho trovato una corrispondenza nel tuo listino per «${comando.targetFrase}».`,
        });
      } else {
        carrello.push({
          id: `inc-${voce.id ?? voce.nome}-${Date.now()}`,
          listinoId: voce.id ?? null,
          nome: voce.nome,
          categoria: voce.categoria || "Lavorazioni",
          prezzo: normalizzaNumero(voce.prezzo),
          quantita: comando.quantita,
          unita: voce.unita || "cad",
          prezzoDalListino: true,
        });
        diff.push({
          nome: voce.nome,
          da: 0,
          a: comando.quantita,
          prezzo: normalizzaNumero(voce.prezzo),
        });
      }
    }
  }

  const etichettaAzione =
    comando.azione === AZIONE_INCREMENTALE.AGGIUNGI
      ? "Aggiunta"
      : comando.azione === AZIONE_INCREMENTALE.RIMUOVI
        ? "Rimozione"
        : "Modifica quantità";

  return {
    modalita: "incrementale",
    azione: comando.azione,
    messaggio: `${etichettaAzione} proposta — conferma per applicare.`,
    lavorazioni: carrello,
    diff,
    nonTrovate,
    avvisi,
    fonte: "listino_locale",
  };
}
