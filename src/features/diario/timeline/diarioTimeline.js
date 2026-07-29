import { DIARIO_EVENT_TYPES } from "../events/constants";

export function leggiDiarioCantiere(cantiere = {}) {
  return Array.isArray(cantiere.diario) ? cantiere.diario : [];
}

export function sortDiarioEvents(eventi = []) {
  return [...eventi].sort((a, b) => {
    const diff = Number(b?.timestamp || 0) - Number(a?.timestamp || 0);
    if (diff !== 0) return diff;
    return String(b?.id || "").localeCompare(String(a?.id || ""), "it");
  });
}

export function sortDiarioEventsChronologico(eventi = []) {
  return [...eventi].sort((a, b) => {
    const diff = Number(a?.timestamp || 0) - Number(b?.timestamp || 0);
    if (diff !== 0) return diff;
    return String(a?.id || "").localeCompare(String(b?.id || ""), "it");
  });
}

export function matchDiarioFilter(evento, filtro = "tutti") {
  if (filtro === "tutti") return true;
  if (filtro === DIARIO_EVENT_TYPES.NOTA) {
    return (
      evento?.type === DIARIO_EVENT_TYPES.NOTA ||
      evento?.type === DIARIO_EVENT_TYPES.NOTA_MANUALE
    );
  }
  return evento?.type === filtro;
}

export function filterDiarioEvents(eventi = [], filtro = "tutti") {
  return eventi.filter((evento) => matchDiarioFilter(evento, filtro));
}

export function searchDiarioEvents(eventi = [], query = "") {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return eventi;
  return eventi.filter((evento) => {
    const haystack = [
      evento?.title,
      evento?.description,
      evento?.meta?.azione,
      evento?.meta?.statoNuovo,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function formatDayKey(timestamp) {
  const data = new Date(Number(timestamp) || Date.now());
  data.setHours(0, 0, 0, 0);
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0"),
  ].join("-");
}

export function labelDayGroup(dayKey, now = new Date()) {
  const [year, month, day] = String(dayKey)
    .split("-")
    .map((value) => Number(value));
  const d = new Date(year, (month || 1) - 1, day || 1);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Oggi";
  if (diff === -1) return "Ieri";
  return d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function groupDiarioEventsByDay(eventi = [], now = new Date()) {
  const gruppi = [];
  const byKey = new Map();

  for (const evento of sortDiarioEvents(eventi)) {
    const key = formatDayKey(evento.timestamp);
    if (!byKey.has(key)) {
      const gruppo = { key, label: labelDayGroup(key, now), events: [] };
      byKey.set(key, gruppo);
      gruppi.push(gruppo);
    }
    byKey.get(key).events.push(evento);
  }

  return gruppi;
}

export function formatDiarioTime(timestamp) {
  return new Date(Number(timestamp) || Date.now()).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function serializeDiarioEvent(evento = {}) {
  return {
    id: evento.id || "",
    type: evento.type || "",
    icon: evento.icon || "",
    title: evento.title || "",
    description: evento.description || "",
    attachments: Array.isArray(evento.attachments) ? evento.attachments : [],
    meta: evento.meta && typeof evento.meta === "object" ? evento.meta : {},
    timestamp: Number(evento.timestamp) || 0,
  };
}
