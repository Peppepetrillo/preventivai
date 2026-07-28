/**
 * Factory suggerimento — forma stabile per engine e UI.
 * @param {object} dati
 * @returns {object}
 */
export function createSuggestion({
  id,
  ruleId,
  priority,
  message,
  link = null,
  severity = "warning",
  meta = {},
}) {
  if (!id || !ruleId || !message) {
    throw new Error("Suggestion: id, ruleId e message obbligatori.");
  }
  return {
    id: String(id),
    ruleId: String(ruleId),
    priority: Number(priority) || 100,
    message: String(message).trim(),
    link: link || null,
    severity: severity === "info" ? "info" : "warning",
    meta: meta && typeof meta === "object" ? meta : {},
  };
}
