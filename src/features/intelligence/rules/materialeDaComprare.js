import { createSuggestion } from "../engine/createSuggestion";
import { PRIORITA } from "../engine/constants";
import { ROUTES, routeCantiere } from "../../../app/routes";

export const RULE_ID = "materiale-da-comprare";

function materialiAperti(cantiere) {
  return (cantiere?.materiali || []).filter((m) => m && !m.acquistato);
}

/**
 * Se Da comprare > 0 → avviso materiale.
 */
export function evaluate(context = {}) {
  const scope = context.scope || "home";

  if (scope === "cantiere" && context.cantiere) {
    const aperti = materialiAperti(context.cantiere);
    if (aperti.length === 0) return [];
    return [
      createSuggestion({
        id: `${RULE_ID}:${context.cantiere.id}`,
        ruleId: RULE_ID,
        priority: PRIORITA.MATERIALE,
        message: "⚠️ Hai ancora materiale da acquistare.",
        link: `#sezione-materiali`,
        meta: { cantiereId: context.cantiere.id, count: aperti.length },
      }),
    ];
  }

  const cantieri = (context.cantieri || []).filter(
    (c) => c && c.stato !== "Completato"
  );
  const conMateriale = cantieri.filter((c) => materialiAperti(c).length > 0);
  if (conMateriale.length === 0) return [];

  const primo = conMateriale[0];
  return [
    createSuggestion({
      id: `${RULE_ID}:home`,
      ruleId: RULE_ID,
      priority: PRIORITA.MATERIALE,
      message: "⚠️ Hai ancora materiale da acquistare.",
      link: primo?.id ? routeCantiere(primo.id) : ROUTES.cantieri,
      meta: { count: conMateriale.length },
    }),
  ];
}

export default { id: RULE_ID, evaluate };
