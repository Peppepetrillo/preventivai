/**
 * Listino PreventivAI Base — catalogo professionale (Sprint 12B).
 *
 * Fonte: Preventivo Luigi.pdf (solo estrazione lavorazioni, non import preventivo).
 * Descrizioni commerciali omesse. Preferiti lasciati all'utente.
 *
 * Anomalie prezzo (vedi audit sprint):
 * - Quadro elettrico: riga "N. 2 … 700 €" → unitario 350 (700/2)
 * - Predisposizione termostato: riga "N. 2 … 100 €" → unitario 50 (100/2)
 * - Predisposizione citofono: riga "n. 2 cornette 200 €" → unitario 100 (200/2)
 * - Gateway Living Now: nel PDF aggregato con tapparelle connesse a 1000 € → prezzo 0 (non inventato)
 */

export const listinoBase = [
  // —— Illuminazione ——
  {
    id: "punto-luce",
    categoria: "Illuminazione",
    nome: "Punto luce",
    descrizione: "",
    prezzo: 40,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 10,
  },
  {
    id: "lampada-emergenza",
    categoria: "Illuminazione",
    nome: "Lampada emergenza",
    descrizione: "",
    prezzo: 70,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 20,
  },
  {
    id: "faretto",
    categoria: "Illuminazione",
    nome: "Faretto",
    descrizione: "",
    prezzo: 7,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 30,
  },

  // —— Prese ——
  {
    id: "punto-presa",
    categoria: "Prese",
    nome: "Punto presa",
    descrizione: "",
    prezzo: 40,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 40,
  },
  {
    id: "presa-usb-a-c",
    categoria: "Prese",
    nome: "Presa USB A+C",
    descrizione: "",
    prezzo: 50,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 50,
  },

  // —— Comandi ——
  {
    id: "punto-interruttore",
    categoria: "Comandi",
    nome: "Punto interruttore",
    descrizione: "",
    prezzo: 40,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 60,
  },
  {
    id: "punto-deviatore",
    categoria: "Comandi",
    nome: "Punto deviatore",
    descrizione: "",
    prezzo: 40,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 70,
  },
  {
    id: "punto-invertitore",
    categoria: "Comandi",
    nome: "Punto invertitore",
    descrizione: "",
    prezzo: 40,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 80,
  },
  {
    id: "punto-pulsante",
    categoria: "Comandi",
    nome: "Punto pulsante",
    descrizione: "",
    prezzo: 40,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 90,
  },
  {
    id: "doppio-pulsante-tapparella",
    categoria: "Comandi",
    nome: "Doppio pulsante tapparella",
    descrizione: "",
    prezzo: 60,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 100,
  },

  // —— TV / Dati ——
  {
    id: "punto-tv",
    categoria: "TV / Dati",
    nome: "Punto TV",
    descrizione: "",
    prezzo: 50,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 110,
  },
  {
    id: "punto-ethernet",
    categoria: "TV / Dati",
    nome: "Punto Ethernet",
    descrizione: "",
    prezzo: 60,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 120,
  },

  // —— LED ——
  {
    id: "strip-led",
    categoria: "LED",
    nome: "Strip LED",
    descrizione: "",
    prezzo: 15,
    unita: "m",
    attiva: true,
    preferita: false,
    ordinamento: 130,
  },

  // —— Quadri ——
  {
    id: "quadro-elettrico",
    categoria: "Quadri",
    nome: "Quadro elettrico",
    descrizione: "",
    prezzo: 350,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 140,
  },

  // —— Domotica ——
  {
    id: "gateway-living-now",
    categoria: "Domotica",
    nome: "Gateway Living Now",
    descrizione: "",
    prezzo: 0,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 150,
  },

  // —— Citofonia ——
  {
    id: "predisposizione-citofono",
    categoria: "Citofonia",
    nome: "Predisposizione citofono",
    descrizione: "",
    prezzo: 100,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 160,
  },
  {
    id: "predisposizione-videocitofono",
    categoria: "Citofonia",
    nome: "Predisposizione videocitofono",
    descrizione: "",
    prezzo: 180,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 165,
  },

  // —— Cucina ——
  {
    id: "linea-induzione",
    categoria: "Cucina",
    nome: "Linea dedicata induzione",
    descrizione: "",
    prezzo: 120,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 168,
  },

  // —— Sicurezza ——
  {
    id: "predisposizione-rivelatore-gpl",
    categoria: "Sicurezza",
    nome: "Predisposizione rivelatore GPL",
    descrizione: "",
    prezzo: 50,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 170,
  },
  {
    id: "predisposizione-impianto-allarme",
    categoria: "Sicurezza",
    nome: "Predisposizione impianto allarme",
    descrizione: "",
    prezzo: 700,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 180,
  },

  // —— Clima ——
  {
    id: "predisposizione-termostato",
    categoria: "Clima",
    nome: "Predisposizione termostato",
    descrizione: "",
    prezzo: 50,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 190,
  },

  // —— Antenna ——
  {
    id: "montaggio-antenna",
    categoria: "Antenna",
    nome: "Montaggio antenna",
    descrizione: "",
    prezzo: 250,
    unita: "cad",
    attiva: true,
    preferita: false,
    ordinamento: 200,
  },
];
