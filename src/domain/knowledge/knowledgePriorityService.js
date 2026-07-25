/**
 * Priorità Knowledge — layer stabili.
 * Base > Personali > Community (futuro).
 * Il motore usa solo la priorità effettiva sulla lista finale.
 */

export const KNOWLEDGE_LAYER = Object.freeze({
  BASE: "BASE",
  PERSONALI: "PERSONALI",
  COMMUNITY: "COMMUNITY",
});

/** Peso di layer (sommato alla priority relativa della regola). */
export const KNOWLEDGE_LAYER_WEIGHT = Object.freeze({
  [KNOWLEDGE_LAYER.BASE]: 1_000_000,
  [KNOWLEDGE_LAYER.PERSONALI]: 10_000,
  [KNOWLEDGE_LAYER.COMMUNITY]: 100,
});

export const KNOWLEDGE_ORIGINE = Object.freeze({
  BASE: "BASE",
  BRAIN: "BRAIN",
});

export const KNOWLEDGE_ORIGINE_LABEL = Object.freeze({
  [KNOWLEDGE_ORIGINE.BASE]: "Conoscenza Base",
  [KNOWLEDGE_ORIGINE.BRAIN]: "Basato sul tuo metodo di lavoro",
});

/**
 * @param {object} regola
 * @returns {number}
 */
export function prioritaEffettiva(regola = {}) {
  const layer = regola.layer || KNOWLEDGE_LAYER.BASE;
  const pesoLayer = KNOWLEDGE_LAYER_WEIGHT[layer] ?? 0;
  const relativa = Number(regola.priority) || 0;
  return pesoLayer + relativa;
}

/**
 * Ordina regole: layer più alto prima, poi priority relativa.
 * @param {object[]} regole
 * @returns {object[]}
 */
export function ordinaPerPrioritaKnowledge(regole = []) {
  return [...(regole || [])].sort(
    (a, b) => prioritaEffettiva(b) - prioritaEffettiva(a)
  );
}

/**
 * Confronta due layer: negativo se a vince su b.
 * @param {string} a
 * @param {string} b
 */
export function confrontaLayer(a, b) {
  const wa = KNOWLEDGE_LAYER_WEIGHT[a] ?? 0;
  const wb = KNOWLEDGE_LAYER_WEIGHT[b] ?? 0;
  return wb - wa;
}
