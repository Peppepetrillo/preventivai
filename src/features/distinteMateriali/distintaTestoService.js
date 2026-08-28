/**
 * Testo professionale per condivisione Distinta Materiali.
 * Prezzi esclusi di default.
 */

import { apriUrlEsterno } from "../../utils/nativeExport";

/**
 * @param {import("../../domain/distinteMateriali/distintaMaterialiTypes").DistintaMateriali|null|undefined} distinta
 * @param {{ mostraPrezzi?: boolean }=} opzioni
 * @returns {string}
 */
export function generaTestoDistinta(distinta, { mostraPrezzi = false } = {}) {
  if (!distinta) return "";

  const cliente = String(distinta.clienteNome || "").trim();
  const titolo = String(distinta.titolo || "Distinta materiali").trim();
  const voci = Array.isArray(distinta.voci) ? distinta.voci : [];

  const saluto = cliente ? `Ciao ${cliente},` : "Ciao,";
  const intro = cliente
    ? "ti invio la lista dei materiali necessari per il lavoro:"
    : `ti invio la distinta «${titolo}»:`;

  const linee = [saluto, "", intro, ""];

  if (voci.length === 0) {
    linee.push("• (nessun materiale)");
  } else {
    for (const voce of voci) {
      linee.push(formattaRigaVoce(voce, mostraPrezzi));
    }
  }

  if (mostraPrezzi) {
    const totale = calcolaImportoTesto(voci);
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
export function formattaRigaVoce(voce, mostraPrezzi = false) {
  const nome = String(voce?.nome || "Materiale").trim();
  const quantita = Number(voce?.quantita);
  const q = Number.isFinite(quantita) ? quantita : 0;
  const unita = String(voce?.unita || "pz").trim();
  let riga = `• ${nome} — ${formattaQuantita(q)} ${unita}`;

  if (mostraPrezzi && voce?.prezzoUnitario != null) {
    const prezzo = Number(voce.prezzoUnitario);
    if (Number.isFinite(prezzo) && prezzo >= 0) {
      const rigaTotale = formattaEuro(prezzo * q);
      riga += ` (${formattaEuro(prezzo)} / ${unita} · ${rigaTotale})`;
    }
  }

  const note = String(voce?.note || "").trim();
  if (note) {
    return `${riga}\n  📝 ${note}`;
  }

  return riga;
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

function calcolaImportoTesto(voci) {
  let tot = 0;
  let ha = false;
  for (const voce of voci) {
    if (voce?.prezzoUnitario == null) continue;
    const p = Number(voce.prezzoUnitario);
    const q = Number(voce.quantita);
    if (!Number.isFinite(p) || !Number.isFinite(q)) continue;
    ha = true;
    tot += p * q;
  }
  return ha ? tot : null;
}

/**
 * Apre WhatsApp con testo (wa.me). Opzionale telefono.
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
    apriUrlEsterno(url);
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

/**
 * Web Share API testo, fallback copia.
 * @param {{ titolo?: string, testo: string }} input
 */
export async function condividiTestoDistinta({ titolo = "Distinta materiali", testo }) {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: titolo, text: testo });
      return { ok: true, metodo: "share" };
    } catch (errore) {
      if (errore?.name === "AbortError") {
        return { ok: false, metodo: "annullato" };
      }
    }
  }

  const copiato = await copiaTestoNegliAppunti(testo);
  return { ok: copiato, metodo: copiato ? "clipboard" : "fallito" };
}
