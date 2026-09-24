/**
 * Utility testo Field Assistant — numeri italiani, unità, normalizzazione.
 */

export const NUMERI_TESTUALI = Object.freeze({
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
});

export function normalizzaTestoField(testo) {
  return String(testo || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/×/g, "x")
    .replace(/ø/g, "o")
    .replace(/[^\w\s%.,x/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeRegexField(valore) {
  return String(valore).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function risolviNumeroTestuale(valore) {
  const v = String(valore || "")
    .trim()
    .toLowerCase()
    .replace(",", ".");
  if (NUMERI_TESTUALI[v] != null) return NUMERI_TESTUALI[v];
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function patternNumeriField() {
  return `(\\d+(?:[.,]\\d+)?|${Object.keys(NUMERI_TESTUALI).join("|")})`;
}

/**
 * Converte "tre per due e mezzo" / "3x2,5" / "3 g 2.5" → forma normalizzata.
 */
export function normalizzaSezioneCavo(testo) {
  let t = normalizzaTestoField(testo);
  t = t.replace(
    /(\d+|uno|due|tre|quattro)\s*per\s*(due|tre|quattro|uno|\d+)\s*e\s*mezzo/g,
    (_, a, b) => {
      const n1 = risolviNumeroTestuale(a) ?? a;
      const n2 = risolviNumeroTestuale(b) ?? b;
      return `${n1}x${n2}.5`;
    }
  );
  t = t.replace(/(\d+)\s*[xg]\s*(\d+[.,]?\d*)/gi, (_, a, b) =>
    `${a}x${String(b).replace(",", ".")}`
  );
  return t;
}

export function tokenizzaField(testo) {
  return normalizzaTestoField(testo)
    .split(" ")
    .filter((token) => token.length > 1);
}

export function radiceTokenField(token) {
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
