/**
 * Copy UI per errori workflow preventivo (nessuna logica dominio).
 * @param {string=} codice
 * @param {string=} fallback
 * @returns {string}
 */
export function messaggioErroreWorkflow(codice, fallback = "") {
  const mappa = {
    preventivo_cestinato:
      "Questo preventivo è nel Cestino. Ripristinalo per continuare.",
    preventivo_non_trovato: "Preventivo non trovato.",
    preventivo_chiuso: "Questo preventivo è chiuso e non si può modificare.",
    stato_non_consentito: "Azione non disponibile in questo stato.",
    gia_convertito: "Il preventivo è già collegato a un cantiere.",
    solo_accettato_convertibile:
      "Accetta il preventivo prima di iniziare il cantiere.",
    non_annullabile_convertito:
      "Non puoi rifiutare un preventivo già in cantiere.",
    conversione_fallita: "Non è stato possibile creare il cantiere. Riprova.",
    preventivo_non_collegato:
      "Questo cantiere non ha un preventivo collegato.",
    cantiere_non_selezionato: "Seleziona un cantiere prima di continuare.",
    variante_non_trovata: "Variante non trovata.",
    richiede_approvazione: "La variante va approvata prima di eseguirla.",
    titolo_obbligatorio: "Inserisci un titolo.",
    variante_annullata: "Questa variante è già annullata.",
    pagamento_non_valido: "Pagamento non valido. Controlla importo e data.",
    spesa_non_valida: "Spesa non valida. Controlla descrizione e importo.",
    nessun_cantiere: "Nessun cantiere selezionato.",
    cantiere_obbligatorio: "Seleziona un cantiere.",
    cantiere_non_trovato: "Cantiere non trovato.",
    salvataggio_non_riuscito:
      "Salvataggio non riuscito. Controlla lo spazio sul dispositivo e riprova.",
  };

  const chiave = String(codice || "").trim();
  if (chiave && mappa[chiave]) return mappa[chiave];
  if (fallback) return fallback;
  if (chiave && !chiave.includes("_")) return chiave;
  return "Operazione non riuscita. Riprova.";
}
