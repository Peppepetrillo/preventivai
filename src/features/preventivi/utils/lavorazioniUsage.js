import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../../../app/storageKeys";
import { PIU_USATI_LIMIT } from "../wizard/wizardConfig";

function leggiUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.lavorazioniUsage);
    if (!raw) {
      return { ...STORAGE_FALLBACKS[STORAGE_KEYS.lavorazioniUsage] };
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function salvaUsage(usage) {
  localStorage.setItem(STORAGE_KEYS.lavorazioniUsage, JSON.stringify(usage));
}

export function registraUsoLavorazione(voceId, quantita = 1) {
  if (!voceId) return;

  const usage = leggiUsage();
  const precedente = usage[voceId] || { count: 0, ultimoUso: 0 };
  const incremento = Number.isFinite(Number(quantita)) ? Number(quantita) : 1;

  usage[voceId] = {
    count: precedente.count + incremento,
    ultimoUso: Date.now(),
  };

  salvaUsage(usage);
}

/**
 * Restituisce le voci listino più usate dall'utente.
 * @param {import("../../../types/domain").VoceListino[]} listino
 * @param {number} limit
 */
export function leggiLavorazioniPiuUsate(listino = [], limit = PIU_USATI_LIMIT) {
  const usage = leggiUsage();

  return [...listino]
    .map((voce) => {
      const chiave = voce.id ?? voce.nome;
      const stat = usage[chiave];

      return {
        voce,
        count: stat?.count || 0,
        ultimoUso: stat?.ultimoUso || 0,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.ultimoUso - a.ultimoUso;
    })
    .slice(0, limit)
    .map((item) => item.voce);
}

export function leggiStatisticheUso() {
  return leggiUsage();
}

export function chiaveUsoDaLavorazione(lavorazione = {}) {
  const id = String(lavorazione.id || "");

  if (id.startsWith("kit-")) {
    return id.slice(4);
  }

  const match = id.match(/^(.+)-\d{10,}$/);
  if (match) {
    return match[1];
  }

  return lavorazione.nome;
}
