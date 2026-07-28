import { createSuggestion } from "../engine/createSuggestion";
import {
  GIORNI_PREVENTIVO_INVIATO,
  PRIORITA,
} from "../engine/constants";
import { routePreventivo } from "../../../app/routes";
import { STATI_PREVENTIVO } from "../../../domain/workflow";

export const RULE_ID = "preventivo-inviato-scaduto";

function parseTimestamp(valore) {
  if (typeof valore === "number" && Number.isFinite(valore)) return valore;
  const grezzo = String(valore || "").trim();
  if (!grezzo) return null;
  const iso = Date.parse(grezzo);
  if (Number.isFinite(iso)) return iso;
  const match = grezzo.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  return new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1])
  ).getTime();
}

function giorniDa(timestamp, nowMs) {
  if (!timestamp) return 0;
  return Math.floor((nowMs - timestamp) / (24 * 60 * 60 * 1000));
}

/**
 * Preventivo Inviato da più di X giorni → contatta il cliente.
 * Solo scope home (o globale).
 */
export function evaluate(context = {}) {
  if (context.scope === "cantiere") return [];

  const soglia =
    Number(context.giorniPreventivoInviato) > 0
      ? Number(context.giorniPreventivoInviato)
      : GIORNI_PREVENTIVO_INVIATO;
  const nowMs = context.now instanceof Date ? context.now.getTime() : Date.now();

  const scaduti = (context.preventivi || []).filter((p) => {
    if (!p || p.stato !== STATI_PREVENTIVO.INVIATO) return false;
    const ts =
      parseTimestamp(p.inviatoAt) ||
      parseTimestamp(p.aggiornatoIl) ||
      parseTimestamp(p.data);
    if (!ts) return false;
    return giorniDa(ts, nowMs) >= soglia;
  });

  if (scaduti.length === 0) return [];

  const primo = scaduti[0];
  return [
    createSuggestion({
      id: `${RULE_ID}:home`,
      ruleId: RULE_ID,
      priority: PRIORITA.PREVENTIVO_INVIATO,
      message: "Ricorda di contattare il cliente.",
      link: primo?.id ? routePreventivo(primo.id) : null,
      meta: { count: scaduti.length, giorni: soglia },
    }),
  ];
}

export default { id: RULE_ID, evaluate };
