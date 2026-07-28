import { createSuggestion } from "../engine/createSuggestion";
import { PRIORITA } from "../engine/constants";
import { routeCantiere, routePreventivo } from "../../../app/routes";

export const RULE_ID = "varianti-non-sincronizzate";

function isAttiva(variante) {
  const stato = String(variante?.stato || "").toLowerCase();
  return stato !== "annullata";
}

function isSincronizzata(variante, preventivo) {
  if (!preventivo) return true;
  const lavorazioni = Array.isArray(preventivo.lavorazioni)
    ? preventivo.lavorazioni
    : [];
  return lavorazioni.some(
    (l) =>
      String(l?.varianteId) === String(variante.id) ||
      (l?.daVariante &&
        String(l?.nome || "").trim().toLowerCase() ===
          String(variante.titolo || variante.descrizione || "")
            .trim()
            .toLowerCase())
  );
}

function variantiNonSync(cantiere, preventivo, variantiOverride) {
  const varianti = Array.isArray(variantiOverride)
    ? variantiOverride
    : Array.isArray(cantiere?.varianti)
      ? cantiere.varianti
      : [];
  if (!cantiere?.preventivoId || !preventivo) return [];
  return varianti.filter(
    (v) => v && isAttiva(v) && !isSincronizzata(v, preventivo)
  );
}

/**
 * Varianti cantiere non riportate sul preventivo.
 */
export function evaluate(context = {}) {
  const preventivi = context.preventivi || [];
  const scope = context.scope || "home";

  if (scope === "cantiere" && context.cantiere) {
    const preventivo = preventivi.find(
      (p) => String(p.id) === String(context.cantiere.preventivoId)
    );
    const aperte = variantiNonSync(
      context.cantiere,
      preventivo,
      context.varianti
    );
    if (aperte.length === 0) return [];
    return [
      createSuggestion({
        id: `${RULE_ID}:${context.cantiere.id}`,
        ruleId: RULE_ID,
        priority: PRIORITA.VARIANTI,
        message:
          "Hai aggiunto modifiche che non sono state riportate nel preventivo.",
        link: "#sezione-varianti",
        meta: {
          cantiereId: context.cantiere.id,
          preventivoId: context.cantiere.preventivoId,
          count: aperte.length,
        },
      }),
    ];
  }

  const cantieri = (context.cantieri || []).filter(
    (c) => c && c.stato !== "Completato" && c.preventivoId
  );
  for (const cantiere of cantieri) {
    const preventivo = preventivi.find(
      (p) => String(p.id) === String(cantiere.preventivoId)
    );
    const aperte = variantiNonSync(cantiere, preventivo, null);
    if (aperte.length > 0) {
      return [
        createSuggestion({
          id: `${RULE_ID}:home`,
          ruleId: RULE_ID,
          priority: PRIORITA.VARIANTI,
          message:
            "Hai aggiunto modifiche che non sono state riportate nel preventivo.",
          link: cantiere.id
            ? routeCantiere(cantiere.id)
            : routePreventivo(cantiere.preventivoId),
          meta: { cantiereId: cantiere.id, count: aperte.length },
        }),
      ];
    }
  }

  return [];
}

export default { id: RULE_ID, evaluate };
