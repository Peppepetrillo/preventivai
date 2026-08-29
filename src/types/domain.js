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
 * @property {"listino"|"catalogo-materiale"|"manuale"=} origineVoce
 * @property {string=} famigliaId — riferimento storico catalogo materiali
 * @property {string=} varianteId — riferimento storico catalogo materiali
 * @property {number=} prezzoCatalogoOriginale — snapshot prezzo catalogo al momento inserimento
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
 * @property {"impianto"|"intervento"|"express"|string=} tipoLavoro Modalità wizard legacy, non tipologia commerciale
 * @property {"elettrico"|"allarme"|"videosorveglianza"|"rete-dati"|"tv-sat"|"domotica"|"fotovoltaico"|"illuminazione"|"altro"|string=} tipologiaImpianto Tipologia commerciale impianto/lavoro
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
 * @property {"preventivo"|"diretto"|string=} origine
 * @property {LavorazionePreventivo[]=} lavorazioniOrigine
 * @property {number=} preventivoOriginaleTotale Snapshot economico del preventivo iniziale
 * @property {string=} descrizione
 * @property {string=} tipoIntervento Tipologia intervento (lavoro diretto UX-6.5)
 * @property {string=} descrizioneIntervento Descrizione lavoro diretto
 * @property {number=} totaleLavoro Prezzo lavoro diretto (solo origine diretto)
 * @property {number=} incassato Cache totale incassato (sincronizzata da pagamenti[])
 * @property {number=} acconto Alias legacy di incassato (retrocompatibilità)
 * @property {PagamentoCantiere[]=} pagamenti Registro pagamenti (UX-7.5, source of truth)
 * @property {SpesaCantiere[]=} spese Registro spese/uscite (UX-Spese v1)
 * @property {object=} extra
 * @property {VarianteCantiere[]=} varianti Extra in cantiere (non alterano il preventivo)
 * @property {"cantiere"|"intervento"|"sopralluogo"|"manutenzione"|string=} tipoLavoro Tipologia agenda
 * @property {string=} dataIntervento Data programmata (DD/MM/YYYY)
 * @property {string=} orario Orario programmato (HH:mm)
 * @property {number=} durataStimata Durata prevista in minuti
 * @property {GiornataProgrammata[]=} programmazione Giornate programmate (UX-7.3)
 * @property {GiornataLavorativa[]=} registroGiornate Consuntivo ore reali (UX-7.4)
 */

/**
 * @typedef {Object} PagamentoCantiere
 * @property {string} id
 * @property {string} data DD/MM/YYYY
 * @property {number} importo > 0
 * @property {"acconto"|"saldo"|"altro"|string} tipo
 * @property {"contanti"|"bonifico"|"pos"|"altro"|string} metodo
 * @property {string=} note
 */

/**
 * @typedef {Object} SpesaCantiere
 * @property {string} id
 * @property {string} data DD/MM/YYYY
 * @property {number} importo > 0
 * @property {string} descrizione
 * @property {"materiali"|"manodopera"|"subappalto"|"trasferta"|"carburante"|"attrezzatura"|"altro"|string} categoria
 * @property {string=} fornitore
 * @property {"contanti"|"carta"|"bonifico"|"altro"|string=} metodoPagamento
 * @property {string=} note
 * @property {string=} giornataId
 * @property {string=} createdAt
 * @property {string=} updatedAt
 */

/**
 * @typedef {Object} GiornataProgrammata
 * @property {string} id
 * @property {string} data DD/MM/YYYY
 * @property {number} operai Numero operai (v1, senza anagrafica)
 * @property {number} orePreviste Ore di presenza previste
 * @property {string=} attivita Descrizione attività della giornata
 * @property {string=} note
 * @property {"programmata"|"in-corso"|"completata"|"annullata"|string} stato
 * @property {string=} oraInizio HH:mm opzionale
 */

/**
 * @typedef {Object} GiornataLavorativa
 * @property {string} id
 * @property {string} data DD/MM/YYYY
 * @property {string=} cantiereId
 * @property {string[]} operai Nomi liberi (non anagrafica)
 * @property {number} oreLavorate Ore effettivamente lavorate
 * @property {string=} attivita Lavoro svolto
 * @property {string=} note
 * @property {string=} giornataProgrammataId Link opzionale a programmazione
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
