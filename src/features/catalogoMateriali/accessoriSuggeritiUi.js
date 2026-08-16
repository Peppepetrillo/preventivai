/**
 * Helper UI per accessoriSuggeriti — solo presentation / validazione ref.
 */

import {
  nomeMaterialeDaCatalogo,
  normalizzaAccessoriSuggeriti,
} from "../../domain/catalogoMateriali";

/**
 * @param {import("../../domain/catalogoMateriali/materialiTypes").AccessorioSuggerito|object} accessorio
 * @returns {string}
 */
export function chiaveAccessorioSuggerito(accessorio) {
  return `${accessorio?.varianteId || ""}|${accessorio?.famigliaId || ""}`;
}

/**
 * Risolve solo accessori con riferimento valido nel catalogo corrente.
 *
 * @param {unknown} accessori
 * @param {import("../../domain/catalogoMateriali/materialiTypes").FamigliaMateriale[]} catalogo
 * @param {{ escludiFamigliaId?: string, escludiVarianteId?: string }=} opzioni
 * @returns {Array<{
 *   accessorio: import("../../domain/catalogoMateriali/materialiTypes").AccessorioSuggerito,
 *   titolo: string,
 *   sottotitolo: string,
 *   famiglia: object|null,
 *   variante: object|null,
 * }>}
 */
export function risolviAccessoriSuggeritiValidi(
  accessori,
  catalogo = [],
  { escludiFamigliaId = "", escludiVarianteId = "" } = {}
) {
  const elenco = Array.isArray(catalogo) ? catalogo : [];
  /** @type {Map<string, object>} */
  const famiglieById = new Map(elenco.map((f) => [f.id, f]));
  /** @type {Map<string, { famiglia: object, variante: object }>} */
  const variantiById = new Map();
  for (const famiglia of elenco) {
    for (const variante of famiglia.varianti || []) {
      variantiById.set(variante.id, { famiglia, variante });
    }
  }

  const normalizzati = normalizzaAccessoriSuggeriti(accessori);
  /** @type {ReturnType<typeof risolviAccessoriSuggeritiValidi>} */
  const risultato = [];

  for (const accessorio of normalizzati) {
    if (
      escludiVarianteId &&
      accessorio.varianteId &&
      String(accessorio.varianteId) === String(escludiVarianteId)
    ) {
      continue;
    }
    if (
      escludiFamigliaId &&
      !accessorio.varianteId &&
      accessorio.famigliaId &&
      String(accessorio.famigliaId) === String(escludiFamigliaId)
    ) {
      continue;
    }

    let famiglia;
    let variante = null;

    if (accessorio.varianteId) {
      const hit = variantiById.get(accessorio.varianteId);
      if (!hit) continue;
      if (
        accessorio.famigliaId &&
        String(hit.famiglia.id) !== String(accessorio.famigliaId)
      ) {
        continue;
      }
      famiglia = hit.famiglia;
      variante = hit.variante;
    } else if (accessorio.famigliaId) {
      famiglia = famiglieById.get(accessorio.famigliaId) || null;
      if (!famiglia) continue;
    } else {
      continue;
    }

    if (famiglia?.attiva === false) continue;
    if (variante?.attiva === false) continue;

    const titolo = variante
      ? nomeMaterialeDaCatalogo(famiglia, variante)
      : famiglia.nome;
    const sottotitolo = [
      accessorio.quantitaPerUnita === 1
        ? "×1"
        : `×${accessorio.quantitaPerUnita}`,
      accessorio.obbligatorio ? "obbligatorio" : null,
      accessorio.nota || null,
    ]
      .filter(Boolean)
      .join(" · ");

    risultato.push({
      accessorio,
      titolo,
      sottotitolo,
      famiglia,
      variante,
    });
  }

  return risultato;
}
