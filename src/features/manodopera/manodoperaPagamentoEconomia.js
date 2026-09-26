/**
 * Sincronizzazione pagamento manodopera → uscita Economia (spese[]).
 *
 * Regole:
 * - giornata.pagato è la fonte dello stato PAGATO
 * - una giornata PAGATA → al più UNA spesa collegata (giornataManodoperaId)
 * - giornata NON pagata → nessuna uscita
 * - idempotenza su doppio tap / ri-applica
 */

import {
  CATEGORIE_SPESA,
  aggiungiSpesa,
  leggiSpese,
  modificaSpesa,
  rimuoviSpesaCantiere,
} from "../cantieri/services/speseCantiereService";
import {
  aggiornaGiornataManodopera,
  eliminaGiornataManodopera,
  leggiGiornateManodopera,
  normalizzaGiornataManodopera,
} from "./giornateManodoperaService";
import { nomeCompletoOperaio } from "./operaiDomain";

export const ORIGINE_SPESA_MANODOPERA = "manodopera";

/**
 * @param {Date=} now
 * @returns {string} DD/MM/YYYY
 */
export function dataItalianaDaDate(now = new Date()) {
  const d = now instanceof Date ? now : new Date();
  if (!Number.isFinite(d.getTime())) return "";
  const gg = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${gg}/${mm}/${d.getFullYear()}`;
}

/**
 * @param {object} cantiere
 * @param {string|number} giornataId
 * @returns {object|null}
 */
export function trovaSpesaManodoperaPerGiornata(cantiere, giornataId) {
  const id = String(giornataId || "").trim();
  if (!id) return null;
  return (
    leggiSpese(cantiere).find(
      (s) =>
        String(s.giornataManodoperaId || "") === id &&
        (s.origine === ORIGINE_SPESA_MANODOPERA ||
          s.categoria === CATEGORIE_SPESA.manodopera)
    ) || null
  );
}

/**
 * @param {object} cantiere
 * @param {string|number} giornataId
 * @returns {object}
 */
export function rimuoviSpeseCollegateGiornataManodopera(cantiere, giornataId) {
  const id = String(giornataId || "").trim();
  if (!id) return cantiere;
  let next = cantiere;
  for (const spesa of leggiSpese(next)) {
    if (String(spesa.giornataManodoperaId || "") === id) {
      next = rimuoviSpesaCantiere(next, spesa.id);
    }
  }
  return next;
}

/**
 * @param {object} giornata
 * @param {{ operaioNome?: string, operaio?: object }=} ctx
 */
export function descrizioneSpesaManodopera(giornata, ctx = {}) {
  const nome =
    String(ctx.operaioNome || "").trim() ||
    nomeCompletoOperaio(ctx.operaio) ||
    "Operaio";
  return `Manodopera — ${nome}`;
}

/**
 * Upsert / remove spesa in base a giornata.pagato.
 * @param {object} cantiere
 * @param {object} giornata — già normalizzata
 * @param {{ operaioNome?: string, operaio?: object, now?: Date }=} ctx
 */
export function sincronizzaSpesaDaGiornataManodopera(
  cantiere,
  giornata,
  ctx = {}
) {
  if (!giornata?.id) return cantiere;
  const esistente = trovaSpesaManodoperaPerGiornata(cantiere, giornata.id);

  if (!giornata.pagato) {
    return esistente
      ? rimuoviSpeseCollegateGiornataManodopera(cantiere, giornata.id)
      : cantiere;
  }

  const importo = Number(giornata.costo) || 0;
  if (!(importo > 0)) {
    // Pagato ma costo 0 → niente uscita, rimuovi eventuale spesa stale
    return esistente
      ? rimuoviSpeseCollegateGiornataManodopera(cantiere, giornata.id)
      : cantiere;
  }

  const dataPagamento =
    String(giornata.pagatoIl || "").trim() ||
    dataItalianaDaDate(ctx.now) ||
    String(giornata.data || "").trim();

  const descrizione = descrizioneSpesaManodopera(giornata, ctx);
  const payload = {
    data: dataPagamento,
    importo,
    descrizione,
    categoria: CATEGORIE_SPESA.manodopera,
    origine: ORIGINE_SPESA_MANODOPERA,
    giornataManodoperaId: String(giornata.id),
    operaioId: String(giornata.operaioId || "").trim() || undefined,
    note: `Giornata ${giornata.data || ""}`.trim(),
  };

  if (esistente) {
    // Idempotente: aggiorna importo/descrizione se cambiati, non crea seconda uscita
    const stesso =
      Number(esistente.importo) === importo &&
      String(esistente.descrizione) === descrizione &&
      String(esistente.data) === dataPagamento &&
      esistente.origine === ORIGINE_SPESA_MANODOPERA;
    if (stesso) return cantiere;
    return modificaSpesa(cantiere, esistente.id, payload);
  }

  return aggiungiSpesa(cantiere, payload);
}

/**
 * Imposta pagato e sincronizza l'uscita economica (una sola).
 * @param {object} cantiere
 * @param {string|number} giornataId
 * @param {boolean} pagato
 * @param {{ operaioNome?: string, operaio?: object, now?: Date }=} ctx
 */
export function registraPagamentoGiornataManodopera(
  cantiere,
  giornataId,
  pagato,
  ctx = {}
) {
  const lista = leggiGiornateManodopera(cantiere);
  const precedente = lista.find((g) => String(g.id) === String(giornataId));
  if (!precedente) return cantiere;

  const vuolePagato = Boolean(pagato);
  // Idempotenza: già nello stato richiesto e spesa coerente
  if (Boolean(precedente.pagato) === vuolePagato) {
    const sync = sincronizzaSpesaDaGiornataManodopera(
      cantiere,
      precedente,
      ctx
    );
    return sync;
  }

  const pagatoIl = vuolePagato
    ? String(precedente.pagatoIl || "").trim() ||
      dataItalianaDaDate(ctx.now) ||
      precedente.data
    : "";

  let next = aggiornaGiornataManodopera(cantiere, giornataId, {
    pagato: vuolePagato,
    pagatoIl: vuolePagato ? pagatoIl : "",
  });

  const aggiornata = leggiGiornateManodopera(next).find(
    (g) => String(g.id) === String(giornataId)
  );
  if (!aggiornata) return next;

  return sincronizzaSpesaDaGiornataManodopera(next, aggiornata, ctx);
}

/**
 * Elimina giornata e eventuali uscite collegate.
 * @param {object} cantiere
 * @param {string|number} giornataId
 */
export function eliminaGiornataManodoperaConEconomia(cantiere, giornataId) {
  const senzaSpesa = rimuoviSpeseCollegateGiornataManodopera(
    cantiere,
    giornataId
  );
  return eliminaGiornataManodopera(senzaSpesa, giornataId);
}

/**
 * Dopo create/update giornata: allinea spesa se pagato.
 * @param {object} cantiere — già con la giornata aggiornata
 * @param {string|number} giornataId
 * @param {{ operaioNome?: string, operaio?: object, now?: Date }=} ctx
 */
export function allineaEconomiaDopoGiornataManodopera(
  cantiere,
  giornataId,
  ctx = {}
) {
  const giornata = leggiGiornateManodopera(cantiere).find(
    (g) => String(g.id) === String(giornataId)
  );
  if (!giornata) return cantiere;
  // Se pagato ma manca pagatoIl (vecchi dati / sheet), usa data giornata
  const conData =
    giornata.pagato && !giornata.pagatoIl
      ? {
          ...giornata,
          pagatoIl: giornata.data,
        }
      : giornata;
  let next = cantiere;
  if (giornata.pagato && !giornata.pagatoIl) {
    next = aggiornaGiornataManodopera(cantiere, giornataId, {
      pagatoIl: giornata.data,
    });
  }
  return sincronizzaSpesaDaGiornataManodopera(
    next,
    leggiGiornateManodopera(next).find(
      (g) => String(g.id) === String(giornataId)
    ) || conData,
    ctx
  );
}

/**
 * Preserva pagatoIl in normalizzazione esterna (test helper / migrazione soft).
 * @param {unknown} grezzo
 * @param {string|number=} cantiereId
 */
export function conPagatoIlSePresente(grezzo, cantiereId) {
  const base = normalizzaGiornataManodopera(grezzo, cantiereId);
  if (!base) return null;
  const pagatoIl = String(grezzo?.pagatoIl || "").trim();
  return pagatoIl ? { ...base, pagatoIl } : base;
}
