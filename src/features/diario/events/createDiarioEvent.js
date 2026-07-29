import { DIARIO_EVENT_TYPE_META } from "./constants";

export function createDiarioEvent({
  id,
  type,
  title,
  description = "",
  attachments = [],
  meta = {},
  timestamp = Date.now(),
}) {
  if (!type) {
    throw new Error("type obbligatorio per evento diario");
  }

  const info = DIARIO_EVENT_TYPE_META[type] || {};
  return {
    id: id || `${type}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    icon: info.icon || "•",
    title: title || info.label || "Evento",
    description: String(description || "").trim(),
    attachments: Array.isArray(attachments) ? attachments : [],
    meta,
    timestamp: Number(timestamp) || Date.now(),
  };
}
