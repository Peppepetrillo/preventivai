/**
 * Anagrafica operai — dominio puro (no payroll / contributi).
 */

function nuovoId() {
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {unknown} n
 * @returns {number|null}
 */
export function normalizzaImportoOpzionale(n) {
  if (n === null || n === undefined || n === "") return null;
  const v = Number(String(n).replace(",", "."));
  if (!Number.isFinite(v) || v < 0) return null;
  return v;
}

/**
 * @param {object} input
 * @returns {{ ok: true, operaio: object }|{ ok: false, errore: string }}
 */
export function validaECreaOperaio(input = {}) {
  const nome = String(input.nome || "").trim();
  const cognome = String(input.cognome || "").trim();
  const ruolo = String(input.ruolo || "").trim();
  const costoGiornata = normalizzaImportoOpzionale(input.costoGiornata);
  const costoOra = normalizzaImportoOpzionale(input.costoOra);

  if (!nome) return { ok: false, errore: "Inserisci il nome." };
  if (!cognome) return { ok: false, errore: "Inserisci il cognome." };
  if (costoGiornata == null && costoOra == null) {
    return {
      ok: false,
      errore: "Indica almeno un costo: giornata oppure ora.",
    };
  }
  if (input.costoGiornata !== "" && input.costoGiornata != null) {
    const grezzo = Number(String(input.costoGiornata).replace(",", "."));
    if (!Number.isFinite(grezzo) || grezzo < 0) {
      return { ok: false, errore: "Costo giornata non valido." };
    }
  }
  if (input.costoOra !== "" && input.costoOra != null) {
    const grezzo = Number(String(input.costoOra).replace(",", "."));
    if (!Number.isFinite(grezzo) || grezzo < 0) {
      return { ok: false, errore: "Costo ora non valido." };
    }
  }

  const ora = new Date().toISOString();
  return {
    ok: true,
    operaio: {
      id: input.id || nuovoId(),
      nome,
      cognome,
      ruolo: ruolo || "Elettricista",
      costoGiornata,
      costoOra,
      attivo: input.attivo !== false,
      createdAt: input.createdAt || ora,
      updatedAt: ora,
    },
  };
}

/**
 * @param {object} esistente
 * @param {object} patch
 */
export function aggiornaOperaio(esistente, patch = {}) {
  if (!esistente || typeof esistente !== "object") {
    return { ok: false, errore: "Operaio non trovato." };
  }
  return validaECreaOperaio({
    ...esistente,
    ...patch,
    id: esistente.id,
    createdAt: esistente.createdAt,
    attivo:
      patch.attivo !== undefined ? patch.attivo !== false : esistente.attivo !== false,
  });
}

/**
 * Soft-delete: attivo = false (mantiene storico giornate).
 * @param {object} operaio
 */
export function disattivaOperaio(operaio) {
  if (!operaio) return { ok: false, errore: "Operaio non trovato." };
  return {
    ok: true,
    operaio: {
      ...operaio,
      attivo: false,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * @param {object} operaio
 */
export function riattivaOperaio(operaio) {
  if (!operaio) return { ok: false, errore: "Operaio non trovato." };
  return {
    ok: true,
    operaio: {
      ...operaio,
      attivo: true,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * @param {object|null} operaio
 */
export function nomeCompletoOperaio(operaio) {
  if (!operaio) return "Operaio";
  return `${String(operaio.nome || "").trim()} ${String(operaio.cognome || "").trim()}`.trim() || "Operaio";
}

/**
 * Etichetta costo standard per lista.
 * @param {object|null} operaio
 */
export function etichettaCostoOperaio(operaio) {
  if (!operaio) return "";
  if (operaio.costoGiornata != null) {
    return `€${formatEuroBreve(operaio.costoGiornata)}/giornata`;
  }
  if (operaio.costoOra != null) {
    return `€${formatEuroBreve(operaio.costoOra)}/ora`;
  }
  return "Costo non impostato";
}

function formatEuroBreve(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("it-IT", {
    maximumFractionDigits: v % 1 === 0 ? 0 : 2,
  });
}

/**
 * Suggerisce costo per una registrazione giornata/ore.
 * Non inventa: se manca il dato necessario restituisce null + motivo.
 *
 * @param {object|null} operaio
 * @param {{ tipo: 'giornata'|'ore', ore?: number }} input
 * @returns {{ ok: true, costo: number }|{ ok: false, errore: string }}
 */
export function suggerisciCostoGiornata(operaio, input = {}) {
  const tipo = input.tipo === "ore" ? "ore" : "giornata";
  const ore = Number(input.ore);

  if (tipo === "giornata") {
    if (operaio?.costoGiornata != null) {
      return { ok: true, costo: Number(operaio.costoGiornata) };
    }
    if (operaio?.costoOra != null && Number.isFinite(ore) && ore > 0) {
      return { ok: true, costo: Number(operaio.costoOra) * ore };
    }
    if (operaio?.costoOra != null) {
      return {
        ok: false,
        errore: "Indica le ore oppure imposta un costo giornata sull'operaio.",
      };
    }
    return { ok: false, errore: "Imposta un costo sull'operaio." };
  }

  if (!Number.isFinite(ore) || ore <= 0) {
    return { ok: false, errore: "Indica le ore lavorate." };
  }
  if (operaio?.costoOra != null) {
    return { ok: true, costo: Number(operaio.costoOra) * ore };
  }
  if (operaio?.costoGiornata != null && ore >= 8) {
    return { ok: true, costo: Number(operaio.costoGiornata) };
  }
  if (operaio?.costoGiornata != null) {
    return {
      ok: false,
      errore: "Per le ore serve un costo orario sull'operaio, oppure inserisci il costo a mano.",
    };
  }
  return { ok: false, errore: "Imposta un costo sull'operaio." };
}
