/**
 * @param {number} score
 * @returns {"verde"|"arancione"|"rosso"}
 */
export function fasciaScoreQualita(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n >= 90) return "verde";
  if (n >= 70) return "arancione";
  return "rosso";
}
