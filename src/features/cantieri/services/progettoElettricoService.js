/**
 * Progetto elettrico del cantiere — logica di dominio (offline-first).
 *
 * Metadata su `cantiere.progettiElettrici` (array).
 * Retrocompat: `cantiere.progettoElettrico` (singolo) → migrato a lista.
 * Binario in IndexedDB (mai Base64 in LocalStorage).
 *
 * Cloud sync del binario: NON in 1.0 (vedi docs/PROGETTO-ELETTRICO.md).
 */

import {
  eliminaBlobProgetto,
  eliminaBlobProgettoPerCantiere,
  leggiBlobProgetto,
  salvaBlobProgetto,
} from "./progettoElettricoBlobStore";

export const TIPI_PROGETTO = Object.freeze({
  pdf: "pdf",
  image: "image",
});

export const LIMITI_PROGETTO = Object.freeze({
  maxPdfByte: 20 * 1024 * 1024,
  maxImageByte: 12 * 1024 * 1024,
});

const MIME_PDF = new Set(["application/pdf"]);
const MIME_IMAGE = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function nuovoId() {
  return `pe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Nome visualizzato: custom opzionale, altrimenti da file, altrimenti fallback.
 * @param {File|Blob|null} file
 * @param {'pdf'|'image'} tipo
 * @param {string|null|undefined} nomeInserito
 */
export function risolviNomeProgetto(file, tipo, nomeInserito) {
  const custom = String(nomeInserito || "").trim();
  if (custom) return custom.slice(0, 80);

  const grezzo = String(file?.name || "").trim();
  if (grezzo) {
    const senzaExt = grezzo.replace(/\.[^.]+$/, "").trim();
    if (senzaExt && !/^(image|img|photo|foto|scan|documento|document)$/i.test(senzaExt)) {
      return senzaExt.slice(0, 80);
    }
  }

  return tipo === TIPI_PROGETTO.pdf
    ? "Progetto elettrico"
    : "Schema fotografato";
}

/**
 * Format dimensione in italiano (es. 2,4 MB).
 * @param {number} bytes
 */
export function formatDimensioniProgetto(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) {
    const kb = n / 1024;
    return `${kb.toLocaleString("it-IT", { maximumFractionDigits: kb >= 10 ? 0 : 1 })} KB`;
  }
  const mb = n / (1024 * 1024);
  return `${mb.toLocaleString("it-IT", { maximumFractionDigits: 1 })} MB`;
}

/**
 * Prefill campo nome dopo selezione file.
 * @param {File|null} file
 * @param {'pdf'|'image'} tipo
 */
export function suggerisciNomeProgetto(file, tipo) {
  return risolviNomeProgetto(file, tipo, null);
}

/**
 * @param {File|Blob|null} file
 * @returns {{ ok: true, tipo: 'pdf'|'image', mimeType: string }|{ ok: false, errore: string }}
 */
export function validaFileProgetto(file) {
  if (!file || !(file instanceof Blob)) {
    return { ok: false, errore: "Seleziona un file valido." };
  }

  const mime = String(file.type || "").toLowerCase();
  const nome = String(file.name || "").toLowerCase();

  const isPdf = MIME_PDF.has(mime) || nome.endsWith(".pdf");
  const isImage =
    MIME_IMAGE.has(mime) || /\.(jpe?g|png|webp|gif)$/i.test(nome);

  if (!isPdf && !isImage) {
    return {
      ok: false,
      errore: "Formato non supportato. Usa un PDF o un'immagine.",
    };
  }

  const tipo = isPdf ? TIPI_PROGETTO.pdf : TIPI_PROGETTO.image;

  const max =
    tipo === TIPI_PROGETTO.pdf
      ? LIMITI_PROGETTO.maxPdfByte
      : LIMITI_PROGETTO.maxImageByte;
  if (Number(file.size) > max) {
    return {
      ok: false,
      errore:
        tipo === TIPI_PROGETTO.pdf
          ? "Il PDF è troppo grande (max 20 MB)."
          : "L'immagine è troppo grande (max 12 MB).",
    };
  }

  if (Number(file.size) <= 0) {
    return { ok: false, errore: "Il file è vuoto." };
  }

  return {
    ok: true,
    tipo,
    mimeType:
      mime ||
      (tipo === TIPI_PROGETTO.pdf ? "application/pdf" : "image/jpeg"),
  };
}

/**
 * @param {{
 *   id?: string,
 *   tipo: 'pdf'|'image',
 *   nome: string,
 *   mimeType: string,
 *   size: number,
 *   blobId: string,
 *   cantiereId: string|number,
 * }} input
 */
export function creaMetaProgettoElettrico(input) {
  const ora = new Date().toISOString();
  return {
    id: input.id || nuovoId(),
    tipo: input.tipo,
    nome: String(input.nome || "Progetto").trim() || "Progetto",
    mimeType: input.mimeType,
    size: Number(input.size) || 0,
    blobId: input.blobId,
    cantiereId: input.cantiereId,
    createdAt: input.createdAt || ora,
    updatedAt: ora,
  };
}

/**
 * Salva nuovo progetto (o sostituzione). Scrive il blob PRIMA di restituire meta.
 * Il caller aggiorna il cantiere; poi elimina il blob precedente.
 *
 * @param {string|number} cantiereId
 * @param {File} file
 * @param {{ nome?: string }=} opzioni
 * @returns {Promise<{ ok: true, progetto: object }|{ ok: false, errore: string }>}
 */
export async function preparaProgettoElettrico(cantiereId, file, opzioni = {}) {
  if (cantiereId == null || cantiereId === "") {
    return { ok: false, errore: "Cantiere non valido." };
  }

  const validazione = validaFileProgetto(file);
  if (!validazione.ok) return validazione;

  const blobId = nuovoId();
  try {
    await salvaBlobProgetto(cantiereId, blobId, file);
  } catch (errore) {
    console.error("progetto elettrico: salvataggio blob fallito", errore?.name);
    return {
      ok: false,
      errore: "Impossibile salvare il file sul dispositivo.",
    };
  }

  const progetto = creaMetaProgettoElettrico({
    tipo: validazione.tipo,
    nome: risolviNomeProgetto(file, validazione.tipo, opzioni.nome),
    mimeType: validazione.mimeType,
    size: file.size,
    blobId,
    cantiereId,
  });

  return { ok: true, progetto };
}

/**
 * Sostituisce: salva nuovo, poi rimuove vecchio blob (solo dopo successo).
 * @param {string|number} cantiereId
 * @param {File} file
 * @param {object|null} progettoPrecedente
 * @param {{ nome?: string }=} opzioni
 */
export async function sostituisciProgettoElettrico(
  cantiereId,
  file,
  progettoPrecedente,
  opzioni = {}
) {
  const nuovo = await preparaProgettoElettrico(cantiereId, file, opzioni);
  if (!nuovo.ok) return nuovo;

  if (
    progettoPrecedente?.blobId &&
    String(progettoPrecedente.cantiereId) === String(cantiereId)
  ) {
    try {
      await eliminaBlobProgetto(cantiereId, progettoPrecedente.blobId);
    } catch (errore) {
      console.error("progetto elettrico: cleanup vecchio blob", errore?.name);
    }
  }

  return nuovo;
}

/**
 * @param {object|null} progetto
 */
export async function eliminaProgettoElettricoStorage(progetto) {
  if (!progetto?.blobId) return { ok: true };
  try {
    await eliminaBlobProgetto(progetto.cantiereId, progetto.blobId);
    return { ok: true };
  } catch (errore) {
    console.error("progetto elettrico: delete blob", errore?.name);
    return { ok: false, errore: "Impossibile rimuovere il file." };
  }
}

/**
 * @param {object|null} progetto
 * @returns {Promise<{ ok: true, url: string, blob: Blob, revoke: () => void }|{ ok: false, errore: string }>}
 */
export async function risolviUrlProgettoElettrico(progetto) {
  if (!progetto?.blobId || progetto.cantiereId == null) {
    return { ok: false, errore: "Progetto non trovato." };
  }

  let blob;
  try {
    blob = await leggiBlobProgetto(progetto.cantiereId, progetto.blobId);
  } catch (errore) {
    console.error("progetto elettrico: lettura blob", errore?.name);
    return { ok: false, errore: "Impossibile aprire il progetto." };
  }

  if (!blob) {
    return {
      ok: false,
      errore: "File non disponibile sul dispositivo.",
    };
  }

  const url = URL.createObjectURL(blob);
  return {
    ok: true,
    url,
    blob,
    revoke: () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Assicura che il meta non contenga payload binari (no data URL).
 * @param {object|null} progetto
 */
export function sanitizzaMetaProgettoElettrico(progetto) {
  if (!progetto || typeof progetto !== "object") return null;
  const {
    id,
    tipo,
    nome,
    mimeType,
    size,
    blobId,
    cantiereId,
    createdAt,
    updatedAt,
  } = progetto;
  if (!blobId || !tipo) return null;
  return {
    id,
    tipo,
    nome,
    mimeType,
    size,
    blobId,
    cantiereId,
    createdAt,
    updatedAt,
  };
}

/**
 * Elenco progetti del cantiere (legge nuovo array o migra il singolo legacy).
 * Idempotente, non muta l'input.
 * @param {object|null} cantiere
 * @returns {object[]}
 */
export function elencaProgettiElettrici(cantiere) {
  if (!cantiere || typeof cantiere !== "object") return [];

  if (Array.isArray(cantiere.progettiElettrici)) {
    return cantiere.progettiElettrici
      .map((voce) => sanitizzaMetaProgettoElettrico(voce))
      .filter(Boolean);
  }

  if (
    cantiere.progettoElettrico &&
    typeof cantiere.progettoElettrico === "object"
  ) {
    const uno = sanitizzaMetaProgettoElettrico(cantiere.progettoElettrico);
    return uno ? [uno] : [];
  }

  return [];
}

/**
 * Migrazione: singolo `progettoElettrico` → `progettiElettrici[]`.
 * Idempotente: se già array e senza legacy, restituisce lo stesso riferimento.
 * @param {object} cantiere
 */
export function migraCantiereProgettiElettrici(cantiere) {
  if (!cantiere || typeof cantiere !== "object") return cantiere;

  const haLegacy =
    cantiere.progettoElettrico != null &&
    typeof cantiere.progettoElettrico === "object";
  const haArray = Array.isArray(cantiere.progettiElettrici);

  if (haArray && !haLegacy) {
    return cantiere;
  }

  const lista = elencaProgettiElettrici(cantiere);
  const prossimo = { ...cantiere, progettiElettrici: lista };
  delete prossimo.progettoElettrico;
  return prossimo;
}

/**
 * @param {object[]} lista
 * @param {object} progetto
 */
export function aggiungiProgettoInLista(lista, progetto) {
  const meta = sanitizzaMetaProgettoElettrico(progetto);
  if (!meta) return Array.isArray(lista) ? [...lista] : [];
  const base = Array.isArray(lista) ? lista : [];
  if (base.some((voce) => String(voce.id) === String(meta.id))) {
    return base.map((voce) =>
      String(voce.id) === String(meta.id) ? meta : voce
    );
  }
  return [...base, meta];
}

/**
 * @param {object[]} lista
 * @param {string|number} progettoId
 * @param {object} progettoNuovo
 */
export function sostituisciProgettoInLista(lista, progettoId, progettoNuovo) {
  const meta = sanitizzaMetaProgettoElettrico(progettoNuovo);
  const base = Array.isArray(lista) ? lista : [];
  if (!meta) return base;
  let trovato = false;
  const prossimo = base.map((voce) => {
    if (String(voce.id) !== String(progettoId)) return voce;
    trovato = true;
    return {
      ...meta,
      id: voce.id,
      createdAt: voce.createdAt || meta.createdAt,
    };
  });
  return trovato ? prossimo : [...base, meta];
}

/**
 * @param {object[]} lista
 * @param {string|number} progettoId
 */
export function rimuoviProgettoDaLista(lista, progettoId) {
  const base = Array.isArray(lista) ? lista : [];
  return base.filter((voce) => String(voce.id) !== String(progettoId));
}

/**
 * @param {object[]} lista
 * @param {string|number} progettoId
 * @param {string} nome
 */
export function rinominaProgettoInLista(lista, progettoId, nome) {
  const base = Array.isArray(lista) ? lista : [];
  const pulito = String(nome || "").trim().slice(0, 80);
  if (!pulito) return base;
  return base.map((voce) =>
    String(voce.id) === String(progettoId)
      ? { ...voce, nome: pulito, updatedAt: new Date().toISOString() }
      : voce
  );
}

/**
 * Hard delete cantiere: pulisce tutti i blob del cantiere.
 * @param {string|number} cantiereId
 * @param {object|object[]|null} [progetti]
 */
export async function pulisciProgettoElettricoCantiere(cantiereId, progetti) {
  try {
    const lista = Array.isArray(progetti)
      ? progetti
      : progetti
        ? [progetti]
        : [];
    for (const progetto of lista) {
      if (progetto?.blobId) {
        await eliminaBlobProgetto(cantiereId, progetto.blobId);
      }
    }
    await eliminaBlobProgettoPerCantiere(cantiereId);
    return { ok: true };
  } catch (errore) {
    console.error("progetto elettrico: cleanup cantiere", errore?.name);
    return { ok: false };
  }
}
