import { createSuggestion } from "../engine/createSuggestion";
import { PRIORITA } from "../engine/constants";
import { routeCantiere } from "../../../app/routes";

export const RULE_ID = "checklist-incompleta";

function checklistIncompleta(cantiere) {
  const lista = cantiere?.checklist || [];
  if (lista.length === 0) return false;
  return lista.some((voce) => !voce.completata);
}

/**
 * Cantiere aperto + checklist incompleta.
 */
export function evaluate(context = {}) {
  const scope = context.scope || "home";

  if (scope === "cantiere" && context.cantiere) {
    const c = context.cantiere;
    if (c.stato === "Completato") return [];
    if (!checklistIncompleta(c)) return [];
    return [
      createSuggestion({
        id: `${RULE_ID}:${c.id}`,
        ruleId: RULE_ID,
        priority: PRIORITA.CHECKLIST,
        message: "Mancano ancora alcune attività.",
        link: "#sezione-checklist",
        meta: { cantiereId: c.id },
      }),
    ];
  }

  const aperti = (context.cantieri || []).filter(
    (c) => c && c.stato !== "Completato" && checklistIncompleta(c)
  );
  if (aperti.length === 0) return [];

  const primo = aperti[0];
  return [
    createSuggestion({
      id: `${RULE_ID}:home`,
      ruleId: RULE_ID,
      priority: PRIORITA.CHECKLIST,
      message: "Mancano ancora alcune attività.",
      link: primo?.id ? routeCantiere(primo.id) : null,
      meta: { count: aperti.length },
    }),
  ];
}

export default { id: RULE_ID, evaluate };
