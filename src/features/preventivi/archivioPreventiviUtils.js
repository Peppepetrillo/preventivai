/**
 * Utility pure per l'Archivio Preventivi (filtro / presentation).
 * Nessuna dipendenza da React o storage.
 */

/**
 * Filtra per nome cliente (case-insensitive). Stringa vuota → elenco invariato.
 * @param {object[]} preventivi
 * @param {string} ricerca
 * @returns {object[]}
 */
export function filtraPreventiviPerCliente(preventivi, ricerca) {
  const elenco = Array.isArray(preventivi) ? preventivi : [];
  const query = String(ricerca || "")
    .trim()
    .toLowerCase();

  if (!query) return elenco;

  return elenco.filter((preventivo) =>
    String(preventivo?.cliente || "")
      .toLowerCase()
      .includes(query)
  );
}

/**
 * Classe Tailwind del badge stato preventivo.
 * @param {string=} stato
 * @returns {string}
 */
export function classeColoreStatoPreventivo(stato) {
  switch (stato) {
    case "Bozza":
      return "bg-yellow-500";
    case "Inviato":
      return "bg-blue-500";
    case "Accettato":
      return "bg-green-500";
    case "Convertito":
      return "bg-emerald-600";
    case "Annullato":
      return "bg-red-500";
    case "Completato":
      return "bg-slate-500";
    default:
      return "bg-slate-500";
  }
}
