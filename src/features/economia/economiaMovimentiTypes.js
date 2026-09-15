/**
 * Movimenti economici GENERALI (senza cantiere obbligatorio).
 * SoT separata da cantiere.pagamenti[] / cantiere.spese[].
 * Mai duplicare: se il movimento ha cantiere, scrivere sul cantiere, non qui.
 */

export const ORIGINE_MOVIMENTO_ECONOMIA = Object.freeze({
  generale: "generale",
  cantiere: "cantiere",
});

/** Categorie entrata (Economia attività). */
export const CATEGORIE_ENTRATA_ECONOMIA = Object.freeze({
  incasso_cantiere: "incasso_cantiere",
  acconto: "acconto",
  saldo: "saldo",
  altra_entrata: "altra_entrata",
});

export const ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA = Object.freeze({
  [CATEGORIE_ENTRATA_ECONOMIA.incasso_cantiere]: "Incasso",
  [CATEGORIE_ENTRATA_ECONOMIA.acconto]: "Acconto",
  [CATEGORIE_ENTRATA_ECONOMIA.saldo]: "Saldo",
  [CATEGORIE_ENTRATA_ECONOMIA.altra_entrata]: "Altro",
});

/**
 * Etichette uscite in Economia (allineate a CATEGORIE_SPESA).
 * manodopera → "Pagamento operai" per chiarezza operativa.
 */
export const ETICHETTE_CATEGORIA_USCITA_ECONOMIA = Object.freeze({
  manodopera: "Pagamento operai",
  materiali: "Materiale",
  subappalto: "Subappalto",
  carburante: "Carburante",
  trasferta: "Trasferta",
  attrezzatura: "Attrezzatura",
  altro: "Altro",
});

/** Chiavi riepilogo uscite nella UI Economia. */
export const RIEPILOGO_USCITE_ECONOMIA = Object.freeze([
  { key: "manodopera", label: "Operai" },
  { key: "materiali", label: "Materiale" },
  { key: "subappalto", label: "Subappalti" },
  { key: "carburante", label: "Carburante" },
  { key: "trasferta", label: "Trasferte" },
  { key: "attrezzatura", label: "Attrezzatura" },
  { key: "altro", label: "Altro" },
]);

export function creaIdMovimentoEconomia() {
  return `eco-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {object} grezzo
 * @returns {object|null}
 */
export function normalizzaMovimentoEconomiaGenerale(grezzo = {}) {
  if (!grezzo || typeof grezzo !== "object") return null;

  const tipo = grezzo.tipo === "entrata" || grezzo.tipo === "uscita"
    ? grezzo.tipo
    : null;
  const data = String(grezzo.data || "").trim();
  const importo = Number(grezzo.importo);
  const descrizione = String(grezzo.descrizione || "").trim();
  const categoria = String(grezzo.categoria || "").trim().toLowerCase();

  if (!tipo || !data || !(importo > 0)) return null;

  // Movimenti generali: cantiereId deve essere assente (SoT anti-duplicazione).
  const cantiereId = grezzo.cantiereId;
  if (cantiereId != null && String(cantiereId).trim() !== "") {
    return null;
  }

  return {
    id: String(grezzo.id || "").trim() || creaIdMovimentoEconomia(),
    tipo,
    data,
    importo,
    categoria: categoria || (tipo === "entrata" ? "altra_entrata" : "altro"),
    descrizione:
      descrizione ||
      (tipo === "entrata"
        ? ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA[categoria] || "Entrata"
        : ETICHETTE_CATEGORIA_USCITA_ECONOMIA[categoria] || "Uscita"),
    origine: ORIGINE_MOVIMENTO_ECONOMIA.generale,
    creatoIl: grezzo.creatoIl || new Date().toISOString(),
  };
}
