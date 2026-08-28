import { createSuggestion } from "../engine/createSuggestion";
import { PRIORITA } from "../engine/constants";
import { ROUTES, routeCantiere } from "../../../app/routes";
import { calcolaRimanenzaCantiere } from "../../cantieri/services/pagamentiCantiereService";

export const RULE_ID = "saldo-da-incassare";

function saldoResiduo(cantiere) {
  return calcolaRimanenzaCantiere(cantiere);
}

/**
 * Se Saldo > 0 → reminder incasso.
 */
export function evaluate(context = {}) {
  const scope = context.scope || "home";

  if (scope === "cantiere" && context.cantiere) {
    const residuo = saldoResiduo(context.cantiere);
    if (residuo <= 0) return [];
    return [
      createSuggestion({
        id: `${RULE_ID}:${context.cantiere.id}`,
        ruleId: RULE_ID,
        priority: PRIORITA.PAGAMENTI,
        message: "Hai ancora un saldo da incassare.",
        link: "#sezione-pagamenti",
        meta: { cantiereId: context.cantiere.id, residuo },
      }),
    ];
  }

  const conSaldo = (context.cantieri || []).filter(
    (c) => c && c.stato !== "Completato" && saldoResiduo(c) > 0
  );
  if (conSaldo.length === 0) return [];

  const primo = conSaldo[0];
  return [
    createSuggestion({
      id: `${RULE_ID}:home`,
      ruleId: RULE_ID,
      priority: PRIORITA.PAGAMENTI,
      message: "Hai ancora un saldo da incassare.",
      link: primo?.id ? routeCantiere(primo.id) : ROUTES.incassi,
      meta: { count: conSaldo.length },
    }),
  ];
}

export default { id: RULE_ID, evaluate };
