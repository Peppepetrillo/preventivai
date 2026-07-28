import { createSuggestion } from "../engine/createSuggestion";
import { PRIORITA } from "../engine/constants";
import { routeCantiere } from "../../../app/routes";

export const RULE_ID = "foto-mancanti";

function senzaFoto(cantiere) {
  return !Array.isArray(cantiere?.foto) || cantiere.foto.length === 0;
}

/**
 * Cantiere aperto senza foto.
 */
export function evaluate(context = {}) {
  const scope = context.scope || "home";

  if (scope === "cantiere" && context.cantiere) {
    const c = context.cantiere;
    if (c.stato === "Completato") return [];
    if (!senzaFoto(c)) return [];
    return [
      createSuggestion({
        id: `${RULE_ID}:${c.id}`,
        ruleId: RULE_ID,
        priority: PRIORITA.FOTO,
        message: "Scatta almeno una foto del lavoro.",
        link: "#sezione-foto",
        severity: "info",
        meta: { cantiereId: c.id },
      }),
    ];
  }

  const senza = (context.cantieri || []).filter(
    (c) =>
      c &&
      (c.stato === "In corso" || c.stato === "Da iniziare") &&
      senzaFoto(c)
  );
  if (senza.length === 0) return [];

  const primo = senza[0];
  return [
    createSuggestion({
      id: `${RULE_ID}:home`,
      ruleId: RULE_ID,
      priority: PRIORITA.FOTO,
      message: "Scatta almeno una foto del lavoro.",
      link: primo?.id ? routeCantiere(primo.id) : null,
      severity: "info",
      meta: { count: senza.length },
    }),
  ];
}

export default { id: RULE_ID, evaluate };
