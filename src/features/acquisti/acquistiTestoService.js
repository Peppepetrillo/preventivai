/**
 * Testo condivisione Acquisti (WhatsApp / copia).
 * Fonte: listaSpesa + selectors Step 8.1. Prezzi esclusi di default.
 */

import {
  aggregaVociAcquisto,
  raggruppaAcquistiPerLavoro,
} from "../../domain/listaSpesa";
import { unitaAcquistoInLettura } from "../../domain/listaSpesa/listaSpesaDomain";

export const MODALITA_CONDIVIDI_ACQUISTI = {
  perLavoro: "per-lavoro",
  perFornitore: "per-fornitore",
};

/**
 * @param {import("../../domain/listaSpesa/listaSpesaDomain").VoceListaSpesa[]} voci
 * @param {{
 *   modalita?: string,
 *   mostraPrezzi?: boolean,
 *   includiAcquistati?: boolean,
 *   cantieri?: object[],
 * }=} opzioni
 * @returns {string}
 */
export function generaTestoAcquisti(
  voci = [],
  {
    modalita = MODALITA_CONDIVIDI_ACQUISTI.perLavoro,
    mostraPrezzi = false,
    includiAcquistati = false,
    cantieri = [],
  } = {}
) {
  const elenco = Array.isArray(voci) ? voci : [];
  const soloDaComprare = !includiAcquistati;

  if (modalita === MODALITA_CONDIVIDI_ACQUISTI.perFornitore) {
    return generaTestoPerFornitore(elenco, { mostraPrezzi, soloDaComprare });
  }

  return generaTestoPerLavoro(elenco, {
    mostraPrezzi,
    soloDaComprare,
    cantieri,
  });
}

function generaTestoPerLavoro(
  voci,
  { mostraPrezzi, soloDaComprare, cantieri }
) {
  const gruppi = raggruppaAcquistiPerLavoro(voci, {
    cantieri,
    soloDaComprare,
  });
  const linee = ["Lista materiali", ""];

  if (gruppi.length === 0) {
    linee.push("• (nessun materiale)");
    return linee.join("\n").trim();
  }

  for (const gruppo of gruppi) {
    const titolo = [gruppo.cliente, gruppo.titoloLavoro]
      .filter(Boolean)
      .join(" — ");
    linee.push(titolo || "Lavoro");
    for (const voce of gruppo.voci || []) {
      linee.push(formattaRigaAcquisto(voce, mostraPrezzi));
    }
    linee.push("");
  }

  if (mostraPrezzi) {
    const totale = calcolaImportoVoci(
      gruppi.flatMap((g) => g.voci || [])
    );
    if (totale != null) {
      linee.push(`Totale indicativo: ${formattaEuro(totale)}`);
    }
  }

  return linee.join("\n").trim();
}

function generaTestoPerFornitore(voci, { mostraPrezzi, soloDaComprare }) {
  const aggregati = aggregaVociAcquisto(voci, { soloDaComprare });
  const linee = ["Lista materiali da acquistare", ""];

  if (aggregati.length === 0) {
    linee.push("• (nessun materiale)");
    return linee.join("\n").trim();
  }

  for (const agg of aggregati) {
    linee.push(formattaRigaAggregato(agg, mostraPrezzi));
  }

  if (mostraPrezzi) {
    const totale = calcolaImportoAggregati(aggregati);
    if (totale != null) {
      linee.push("");
      linee.push(`Totale indicativo: ${formattaEuro(totale)}`);
    }
  }

  return linee.join("\n").trim();
}

/**
 * @param {object} voce
 * @param {boolean} mostraPrezzi
 */
export function formattaRigaAcquisto(voce, mostraPrezzi = false) {
  const nome = String(voce?.nome || "Materiale").trim();
  const quantita = Number(voce?.quantita);
  const q = Number.isFinite(quantita) ? quantita : 0;
  const unita =
    unitaAcquistoInLettura(voce?.unita) || String(voce?.unita || "pz").trim();
  let riga = `• ${nome} — ${formattaQuantita(q)} ${unita}`;

  if (mostraPrezzi && voce?.prezzoUnitario != null) {
    const prezzo = Number(voce.prezzoUnitario);
    if (Number.isFinite(prezzo) && prezzo >= 0) {
      riga += ` (${formattaEuro(prezzo)} / ${unita} · ${formattaEuro(prezzo * q)})`;
    }
  }

  return riga;
}

/**
 * @param {object} aggregato
 * @param {boolean} mostraPrezzi
 */
export function formattaRigaAggregato(aggregato, mostraPrezzi = false) {
  const nome = String(aggregato?.nome || "Materiale").trim();
  const q = Number(aggregato?.quantitaTotale);
  const quantita = Number.isFinite(q) ? q : 0;
  const unita = String(aggregato?.unita || "pz").trim();
  let riga = `• ${nome} — ${formattaQuantita(quantita)} ${unita}`;

  if (!mostraPrezzi) return riga;

  const prezzo = risolviPrezzoAggregato(aggregato);
  if (!prezzo) return riga;

  if (prezzo.prezzoUnitario != null) {
    riga += ` (${formattaEuro(prezzo.prezzoUnitario)} / ${unita} · ${formattaEuro(prezzo.totale)})`;
  } else if (prezzo.totale != null) {
    riga += ` (totale ${formattaEuro(prezzo.totale)})`;
  }

  return riga;
}

function risolviPrezzoAggregato(aggregato) {
  const voci = Array.isArray(aggregato?.voci) ? aggregato.voci : [];
  const conPrezzo = voci.filter((v) => v?.prezzoUnitario != null);
  if (!conPrezzo.length) return null;

  const prezzi = conPrezzo.map((v) => Number(v.prezzoUnitario));
  if (prezzi.some((p) => !Number.isFinite(p) || p < 0)) return null;

  const totale = conPrezzo.reduce((sum, v) => {
    const q = Number(v.quantita);
    return sum + Number(v.prezzoUnitario) * (Number.isFinite(q) ? q : 0);
  }, 0);

  const stesso = prezzi.every((p) => p === prezzi[0]);
  return {
    prezzoUnitario: stesso ? prezzi[0] : null,
    totale,
  };
}

function calcolaImportoVoci(voci) {
  let tot = 0;
  let ha = false;
  for (const voce of voci || []) {
    if (voce?.prezzoUnitario == null) continue;
    const p = Number(voce.prezzoUnitario);
    const q = Number(voce.quantita);
    if (!Number.isFinite(p) || !Number.isFinite(q)) continue;
    ha = true;
    tot += p * q;
  }
  return ha ? tot : null;
}

function calcolaImportoAggregati(aggregati) {
  let tot = 0;
  let ha = false;
  for (const agg of aggregati || []) {
    const prezzo = risolviPrezzoAggregato(agg);
    if (!prezzo || prezzo.totale == null) continue;
    ha = true;
    tot += prezzo.totale;
  }
  return ha ? tot : null;
}

function formattaQuantita(n) {
  return Number.isInteger(n)
    ? String(n)
    : n.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}

function formattaEuro(n) {
  return Number(n).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}

/**
 * Apre WhatsApp con testo (wa.me). Pattern Distinta.
 * @param {string} testo
 * @param {string=} telefono
 */
export function apriWhatsAppConTesto(testo, telefono = "") {
  const phone = String(telefono || "").replace(/\D/g, "");
  const text = encodeURIComponent(String(testo || ""));
  const url = phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}

/**
 * Copia testo negli appunti (con fallback).
 * @param {string} testo
 * @returns {Promise<boolean>}
 */
export async function copiaTestoNegliAppunti(testo) {
  const valore = String(testo || "");
  if (!valore) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(valore);
      return true;
    } catch {
      // fallback sotto
    }
  }

  if (typeof document === "undefined") return false;
  try {
    const area = document.createElement("textarea");
    area.value = valore;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return Boolean(ok);
  } catch {
    return false;
  }
}
