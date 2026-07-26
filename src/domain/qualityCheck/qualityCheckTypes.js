/**
 * Quality Check Engine — tipi e factory.
 * Solo lettura / report. Nessuna modifica a preventivo o prezzi.
 */

/** Tipi esito. */
export const QC_TYPE = Object.freeze({
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
});

/** Severità. */
export const QC_SEVERITY = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
});

/** Penalità score. */
export const QC_PENALITA = Object.freeze({
  [QC_TYPE.ERROR]: 25,
  [QC_TYPE.WARNING]: 8,
  [QC_TYPE.INFO]: 0,
});

/**
 * @typedef {Object} QualityCheckItem
 * @property {string} id
 * @property {"INFO"|"WARNING"|"ERROR"} type
 * @property {"LOW"|"MEDIUM"|"HIGH"} severity
 * @property {string} title
 * @property {string} message
 * @property {string|null} relatedItem
 * @property {string} source
 * @property {boolean} autoFix
 */

/**
 * @typedef {Object} QualityCheckReport
 * @property {QualityCheckItem[]} errors
 * @property {QualityCheckItem[]} warnings
 * @property {QualityCheckItem[]} infos
 * @property {number} score
 */

/**
 * @param {Partial<QualityCheckItem>} grezzo
 * @returns {QualityCheckItem}
 */
export function creaQualityCheckItem(grezzo = {}) {
  const id = String(grezzo.id || "").trim();
  if (!id) throw new Error("Quality check senza id.");

  const type = String(grezzo.type || "");
  if (!Object.values(QC_TYPE).includes(type)) {
    throw new Error(`Quality check ${id}: type non valido.`);
  }

  const severity = String(grezzo.severity || QC_SEVERITY.MEDIUM);
  if (!Object.values(QC_SEVERITY).includes(severity)) {
    throw new Error(`Quality check ${id}: severity non valida.`);
  }

  const title = String(grezzo.title || "").trim();
  if (!title) throw new Error(`Quality check ${id}: title obbligatorio.`);

  const message = String(grezzo.message || "").trim();
  if (!message) throw new Error(`Quality check ${id}: message obbligatorio.`);

  return Object.freeze({
    id,
    type,
    severity,
    title,
    message,
    relatedItem:
      grezzo.relatedItem == null || grezzo.relatedItem === ""
        ? null
        : String(grezzo.relatedItem),
    source: String(grezzo.source || "Quality Check").trim() || "Quality Check",
    autoFix: Boolean(grezzo.autoFix),
  });
}

/**
 * @param {QualityCheckItem[]} findings
 * @returns {number}
 */
export function calcolaScoreQuality(findings = []) {
  let score = 100;
  for (const item of findings) {
    const pena = QC_PENALITA[item.type] ?? 0;
    score -= pena;
  }
  return Math.max(0, Math.min(100, score));
}

/**
 * @param {QualityCheckItem[]} findings
 * @returns {QualityCheckReport}
 */
export function creaQualityCheckReport(findings = []) {
  const errors = findings.filter((f) => f.type === QC_TYPE.ERROR);
  const warnings = findings.filter((f) => f.type === QC_TYPE.WARNING);
  const infos = findings.filter((f) => f.type === QC_TYPE.INFO);

  return Object.freeze({
    errors: Object.freeze([...errors]),
    warnings: Object.freeze([...warnings]),
    infos: Object.freeze([...infos]),
    score: calcolaScoreQuality(findings),
  });
}
