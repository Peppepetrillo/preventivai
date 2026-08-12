/**
 * Copy UI per errori workflow preventivo (nessuna logica dominio).
 * @param {string=} codice
 * @param {string=} fallback
 * @returns {string}
 */
export function messaggioErroreWorkflow(codice, fallback = "") {
  const mappa = {
    preventivo_non_trovato: "Preventivo non trovato.",
    preventivo_chiuso: "Questo preventivo è chiuso e non si può modificare.",
    stato_non_consentito: "Azione non disponibile in questo stato.",
    gia_convertito: "Il preventivo è già collegato a un cantiere.",
    solo_accettato_convertibile:
      "Accetta il preventivo prima di iniziare il cantiere.",
    non_annullabile_convertito:
      "Non puoi rifiutare un preventivo già in cantiere.",
    conversione_fallita: "Non è stato possibile creare il cantiere. Riprova.",
  };

  const chiave = String(codice || "").trim();
  if (chiave && mappa[chiave]) return mappa[chiave];
  if (fallback) return fallback;
  if (chiave && !chiave.includes("_")) return chiave;
  return "Operazione non riuscita. Riprova.";
}
