/**
 * @typedef {Object} Cliente
 * @property {number|string} id
 * @property {string} nome
 * @property {string=} telefono
 * @property {string=} email
 */

/**
 * @typedef {Object} VoceListino
 * @property {number|string} id
 * @property {string} categoria
 * @property {string} nome
 * @property {string=} descrizione
 * @property {number|string} prezzo
 * @property {string=} unita
 * @property {boolean=} attiva
 * @property {boolean=} preferita
 * @property {number=} ordinamento
 * // Futuri (non ancora usati): serieCompatibili, marca, iva, codiceArticolo, tempoMedioInstallazione
 */

/**
 * @typedef {Object} LavorazionePreventivo
 * @property {number|string} id
 * @property {string} nome
 * @property {string} categoria
 * @property {number} prezzo
 * @property {number} quantita
 * @property {string} unita
 * @property {string=} catalogoId — ID Catalogo Lavorazioni (fonte di verità)
 * @property {string=} listinoId — id voce listino (chiave prezzi)
 */

/**
 * @typedef {Object} Preventivo
 * @property {number|string} id
 * @property {string} numero
 * @property {string} cliente
 * @property {LavorazionePreventivo[]} lavorazioni
 * @property {number} sconto
 * @property {number} iva
 * @property {number} validita
 * @property {string} pagamento
 * @property {number} acconto
 * @property {number=} incassato
 * @property {string=} dataUltimoIncasso
 * @property {string=} noteIncasso
 * @property {string=} statoIncasso
 * @property {string} note
 * @property {string} stato Bozza | Inviato | Accettato | Convertito | Lavoro completato | Rifiutato
 * @property {string} data
 * @property {number|string=} cantiereId
 * @property {string=} dataAccettazione
 * @property {number=} convertitoAt
 * @property {string=} convertitoBy
 * @property {string=} indirizzo
 * @property {number|string=} clienteId
 * @property {"impianto"|"intervento"|"express"|string=} tipoLavoro Metadato UX per statistiche, non usato nei calcoli
 * @property {object=} extra
 * @property {string=} descrizione
 * @property {number} subtotale
 * @property {number} importoSconto
 * @property {number} imponibile
 * @property {number} importoIva
 * @property {number} totale
 */

/**
 * @typedef {Object} Cantiere
 * @property {number|string} id
 * @property {string} nome
 * @property {string} cliente
 * @property {string} indirizzo
 * @property {string} stato
 * @property {{id: number|string, testo: string, completata: boolean}[]} checklist
 * @property {{id: number|string, nome: string, quantita: number, unita: string}[]} materiali
 * @property {{id: number|string, nome: string, src: string, aggiuntaIl: string}[]} foto
 * @property {string} note
 * @property {string} creatoIl
 * @property {string} aggiornatoIl
 * @property {number|string=} preventivoId
 * @property {string=} preventivoNumero
 * @property {number=} preventivoImporto
 * @property {number|string=} clienteId
 * @property {string=} dataCreazione
 * @property {string=} dataAccettazione
 * @property {"preventivo"|string=} origine
 * @property {LavorazionePreventivo[]=} lavorazioniOrigine
 * @property {number=} preventivoOriginaleTotale Snapshot economico del preventivo iniziale
 * @property {string=} descrizione
 * @property {object=} extra
 * @property {VarianteCantiere[]=} varianti Extra in cantiere (non alterano il preventivo)
 * @property {"cantiere"|"intervento"|"sopralluogo"|"manutenzione"|string=} tipoLavoro Tipologia agenda
 * @property {string=} dataIntervento Data programmata (DD/MM/YYYY)
 * @property {string=} orario Orario programmato (HH:mm)
 * @property {number=} durataStimata Durata prevista in minuti
 */

/**
 * @typedef {Object} Lavoro
 * @property {number|string} id
 * @property {"cantiere"|"intervento"|"sopralluogo"|"manutenzione"} tipoLavoro
 * @property {string} titolo
 * @property {string} cliente
 * @property {string} indirizzo
 * @property {string} orario
 * @property {number|null} durataStimata
 * @property {"programmato"|"in-corso"|"completato"} stato
 * @property {string} link
 * @property {object} cantiere Record sorgente (retrocompatibile)
 */

/**
 * @typedef {Object} Insight
 * @property {string} id
 * @property {string} titolo
 * @property {string} problema
 * @property {string} soluzione
 * @property {"bassa"|"media"|"alta"} priorita
 * @property {"aperto"|"in-lavorazione"|"risolto"|"archiviato"} stato
 * @property {string} data
 * @property {string=} cantiereId
 * @property {string=} cliente
 */

/**
 * @typedef {Object} VarianteCantiere
 * @property {number|string} id
 * @property {string} data
 * @property {"aggiunta"|"rimozione"} tipo
 * @property {string} descrizione
 * @property {string=} categoria
 * @property {number} quantita
 * @property {number} prezzoUnitario
 * @property {number} totale
 * @property {string=} note
 */

export {};
