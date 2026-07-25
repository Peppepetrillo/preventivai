/**
 * Catalogo Lavorazioni — fonte unica di verità.
 * Gli ID sono stabili (SCREAMING_SNAKE). I prezzi vivono nel Listino
 * e si risolvono solo tramite `chiaveListino` (mai per descrizione).
 */

/** @typedef {Object} CatalogoLavorazione
 * @property {string} id
 * @property {string} nome
 * @property {string} categoria
 * @property {string} unita
 * @property {string|null} chiaveListino — id voce listino, o null se non configurata
 * @property {string[]=} aliasLegacy — solo migrazione retrocompatibile (testi KE/Brain vecchi)
 */

/** @type {ReadonlyArray<CatalogoLavorazione>} */
export const CATALOGO_LAVORAZIONI = Object.freeze([
  // —— Punti / impianto ——
  {
    id: "PUNTO_IMPIANTO",
    nome: "Punto impianto",
    categoria: "Punti impianto",
    unita: "cad",
    chiaveListino: "punto-luce",
    aliasLegacy: ["punto impianto", "punti impianto"],
  },
  {
    id: "PUNTO_LUCE",
    nome: "Punto luce",
    categoria: "Illuminazione",
    unita: "cad",
    chiaveListino: "punto-luce",
    aliasLegacy: ["punto luce"],
  },
  {
    id: "LAMPADA_EMERGENZA",
    nome: "Lampada emergenza",
    categoria: "Illuminazione",
    unita: "cad",
    chiaveListino: "lampada-emergenza",
  },
  {
    id: "FARETTO",
    nome: "Faretto",
    categoria: "Illuminazione",
    unita: "cad",
    chiaveListino: "faretto",
  },
  {
    id: "ILLUMINAZIONE_ESTERNA",
    nome: "Illuminazione esterna",
    categoria: "Illuminazione",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: ["illuminazione esterna"],
  },

  // —— Prese / comandi ——
  {
    id: "PUNTO_PRESA",
    nome: "Punto presa",
    categoria: "Prese",
    unita: "cad",
    chiaveListino: "punto-presa",
  },
  {
    id: "PRESA_USB",
    nome: "Presa USB A+C",
    categoria: "Prese",
    unita: "cad",
    chiaveListino: "presa-usb-a-c",
  },
  {
    id: "PUNTO_INTERRUTTORE",
    nome: "Punto interruttore",
    categoria: "Comandi",
    unita: "cad",
    chiaveListino: "punto-interruttore",
  },
  {
    id: "PUNTO_DEVIATORE",
    nome: "Punto deviatore",
    categoria: "Comandi",
    unita: "cad",
    chiaveListino: "punto-deviatore",
  },
  {
    id: "PUNTO_INVERTITORE",
    nome: "Punto invertitore",
    categoria: "Comandi",
    unita: "cad",
    chiaveListino: "punto-invertitore",
  },
  {
    id: "PUNTO_PULSANTE",
    nome: "Punto pulsante",
    categoria: "Comandi",
    unita: "cad",
    chiaveListino: "punto-pulsante",
  },
  {
    id: "DOPPIO_PULSANTE_TAPPARELLA",
    nome: "Doppio pulsante tapparella",
    categoria: "Comandi",
    unita: "cad",
    chiaveListino: "doppio-pulsante-tapparella",
  },

  // —— TV / Dati ——
  {
    id: "PUNTO_TV",
    nome: "Punto TV",
    categoria: "TV / Dati",
    unita: "cad",
    chiaveListino: "punto-tv",
    aliasLegacy: ["punto tv"],
  },
  {
    id: "PUNTO_DATI",
    nome: "Punto dati / Ethernet",
    categoria: "TV / Dati",
    unita: "cad",
    chiaveListino: "punto-ethernet",
    aliasLegacy: ["punto ethernet", "punto dati"],
  },
  {
    id: "STRIP_LED",
    nome: "Strip LED",
    categoria: "LED",
    unita: "m",
    chiaveListino: "strip-led",
  },

  // —— Cucina ——
  {
    id: "LINEA_INDUZIONE",
    nome: "Linea dedicata induzione",
    categoria: "Cucina",
    unita: "cad",
    chiaveListino: "linea-induzione",
    aliasLegacy: [
      "linea induzione",
      "linea dedicata induzione",
      "piano induzione",
    ],
  },

  // —— Quadri ——
  // QUADRO_12 prima di QUADRO_ELETTRICO: stessa chiaveListino → reverse map resta QUADRO_ELETTRICO
  {
    id: "QUADRO_12_MODULI",
    nome: "Quadro 12 moduli",
    categoria: "Quadri",
    unita: "cad",
    chiaveListino: "quadro-elettrico",
    aliasLegacy: ["quadro 12 moduli"],
  },
  {
    id: "QUADRO_ELETTRICO",
    nome: "Quadro elettrico",
    categoria: "Quadri",
    unita: "cad",
    chiaveListino: "quadro-elettrico",
    aliasLegacy: [
      "quadro elettrico",
      "quadro 24 moduli",
      "quadro 36 moduli",
    ],
  },

  // —— Domotica ——
  {
    id: "GATEWAY",
    nome: "Gateway",
    categoria: "Domotica",
    unita: "cad",
    chiaveListino: "gateway-living-now",
    aliasLegacy: ["gateway", "gateway living now"],
  },
  {
    id: "BUS",
    nome: "Bus",
    categoria: "Domotica",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: ["bus"],
  },
  {
    id: "ALIMENTATORE",
    nome: "Alimentatore",
    categoria: "Domotica",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: ["alimentatore"],
  },

  // —— Citofonia / accesso ——
  {
    id: "CITOFONO",
    nome: "Predisposizione citofono",
    categoria: "Citofonia",
    unita: "cad",
    chiaveListino: "predisposizione-citofono",
    aliasLegacy: [
      "citofono",
      "citofono/videocitofono",
      "predisposizione citofono",
    ],
  },
  {
    id: "VIDEOCITOFONO",
    nome: "Predisposizione videocitofono",
    categoria: "Citofonia",
    unita: "cad",
    chiaveListino: "predisposizione-videocitofono",
    aliasLegacy: ["videocitofono", "predisposizione videocitofono"],
  },
  {
    id: "CANCELLO",
    nome: "Predisposizione cancello",
    categoria: "Immobile",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: [
      "predisposizione cancello",
      "predisposizione cancello / automazione",
      "automazione cancello",
    ],
  },

  // —— Sicurezza ——
  {
    id: "ALLARME",
    nome: "Predisposizione impianto allarme",
    categoria: "Sicurezza",
    unita: "cad",
    chiaveListino: "predisposizione-impianto-allarme",
    aliasLegacy: [
      "allarme",
      "predisposizione impianto allarme",
      "predisposizione allarme",
    ],
  },
  {
    id: "VIDEOSORVEGLIANZA",
    nome: "Videosorveglianza",
    categoria: "Sicurezza",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: [
      "videosorveglianza",
      "predisposizione videosorveglianza",
    ],
  },
  {
    id: "RIVELATORE_GPL",
    nome: "Predisposizione rivelatore GPL",
    categoria: "Sicurezza",
    unita: "cad",
    chiaveListino: "predisposizione-rivelatore-gpl",
  },

  // —— Clima / energia ——
  {
    id: "CLIMA",
    nome: "Predisposizione climatizzazione",
    categoria: "Clima",
    unita: "cad",
    chiaveListino: "predisposizione-termostato",
    aliasLegacy: [
      "clima",
      "predisposizione climatizzazione",
      "predisposizione termostato",
      "predisposizione clima",
    ],
  },
  {
    id: "FOTOVOLTAICO",
    nome: "Predisposizione fotovoltaico",
    categoria: "Fotovoltaico",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: ["fotovoltaico", "predisposizione fotovoltaico"],
  },
  {
    id: "RICARICA_AUTO",
    nome: "Predisposizione ricarica auto",
    categoria: "Ricarica Auto",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: ["ricarica auto", "predisposizione ricarica auto"],
  },

  // —— Distribuzione / antenna ——
  {
    id: "DISTRIBUZIONE_LINEE_PIANO",
    nome: "Distribuzione linee per piano",
    categoria: "Distribuzione",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: ["distribuzione linee per piano", "montante"],
  },
  {
    id: "ANTENNA",
    nome: "Montaggio antenna",
    categoria: "Antenna",
    unita: "cad",
    chiaveListino: "montaggio-antenna",
  },
  {
    id: "IRRIGAZIONE",
    nome: "Predisposizione irrigazione",
    categoria: "Immobile",
    unita: "cad",
    chiaveListino: null,
    aliasLegacy: [
      "predisposizione irrigazione",
      "predisposizione irrigazione giardino",
      "irrigazione",
    ],
  },
]);

/** Indice id → voce */
export const CATALOGO_BY_ID = Object.freeze(
  Object.fromEntries(CATALOGO_LAVORAZIONI.map((v) => [v.id, v]))
);

/** Indice chiaveListino → id catalogo (prima occorrenza) */
export const CATALOGO_BY_CHIAVE_LISTINO = Object.freeze(
  Object.fromEntries(
    CATALOGO_LAVORAZIONI.filter((v) => v.chiaveListino).map((v) => [
      v.chiaveListino,
      v.id,
    ])
  )
);
