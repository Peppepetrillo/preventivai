/**
 * Seed Catalogo Materiali — famiglie + varianti professionali (UX-6.2).
 * Senza marchi, senza prezzo di vendita, senza prezzoIndicativo valorizzato.
 *
 * REGOLA ID: non rinominare / eliminare / rigenerare gli ID seed già esistenti.
 */

import {
  CATEGORIA_MATERIALE,
  UNITA_MATERIALE,
} from "./materialiTypes";

/**
 * @param {object} input
 * @returns {import("./materialiTypes").AccessorioSuggerito}
 */
function accessorio({
  varianteId,
  famigliaId,
  quantitaPerUnita = 1,
  obbligatorio = false,
  nota,
}) {
  /** @type {import("./materialiTypes").AccessorioSuggerito} */
  const item = {
    quantitaPerUnita,
    obbligatorio: Boolean(obbligatorio),
  };
  if (varianteId) item.varianteId = varianteId;
  if (famigliaId) item.famigliaId = famigliaId;
  if (nota) item.nota = nota;
  return Object.freeze(item);
}

/**
 * @param {string} famigliaId
 * @param {string} slug
 * @param {string} etichetta
 * @param {Record<string, string|number>} attributi
 * @param {object=} extra
 */
function variante(famigliaId, slug, etichetta, attributi, extra = {}) {
  /** @type {import("./materialiTypes").VarianteMateriale} */
  const item = {
    id: `${famigliaId}-${slug}`,
    famigliaId,
    etichetta,
    attributi: Object.freeze({ ...attributi }),
    attiva: extra.attiva !== false,
  };
  if (extra.unita) item.unita = extra.unita;
  if (Array.isArray(extra.accessoriSuggeriti) && extra.accessoriSuggeriti.length) {
    item.accessoriSuggeriti = Object.freeze([...extra.accessoriSuggeriti]);
  }
  return Object.freeze(item);
}

/**
 * @param {string} famigliaId
 * @param {Array<[string, string, Record<string, string|number>, object?]>} righe
 */
function variantiDa(famigliaId, righe) {
  return righe.map(([slug, etichetta, attributi, extra]) =>
    variante(famigliaId, slug, etichetta, attributi, extra)
  );
}

/**
 * @param {object} input
 */
function famiglia({
  id,
  nome,
  categoria,
  unitaDefault,
  attributoChiave,
  descrizione = "",
  varianti = [],
  accessoriSuggeriti = [],
}) {
  /** @type {import("./materialiTypes").FamigliaMateriale} */
  const item = {
    id,
    nome,
    categoria,
    unitaDefault,
    attributoChiave,
    descrizione,
    personalizzata: false,
    attiva: true,
    varianti: Object.freeze(varianti.map((v) => Object.freeze(v))),
  };
  if (Array.isArray(accessoriSuggeriti) && accessoriSuggeriti.length) {
    item.accessoriSuggeriti = Object.freeze([...accessoriSuggeriti]);
  }
  return Object.freeze(item);
}

const ACC_PRESSACAVO_16 = [
  accessorio({
    varianteId: "pressacavo-pg9",
    famigliaId: "pressacavo",
    quantitaPerUnita: 1,
    nota: "Terminazione tipica Ø16",
  }),
];
const ACC_PRESSACAVO_20 = [
  accessorio({
    varianteId: "pressacavo-pg11",
    famigliaId: "pressacavo",
    quantitaPerUnita: 1,
    nota: "Terminazione tipica Ø20",
  }),
];
const ACC_PRESSACAVO_25 = [
  accessorio({
    varianteId: "pressacavo-pg16",
    famigliaId: "pressacavo",
    quantitaPerUnita: 1,
    nota: "Terminazione tipica Ø25",
  }),
];

const ACC_SERIE_CIVILE = [
  accessorio({
    famigliaId: "supporto-civile",
    quantitaPerUnita: 1,
    nota: "Supporto da incasso",
  }),
  accessorio({
    famigliaId: "placca-civile",
    quantitaPerUnita: 1,
    nota: "Placca di finitura",
  }),
  accessorio({
    varianteId: "cassetta-503",
    famigliaId: "cassetta",
    quantitaPerUnita: 1,
  }),
];

/** @type {ReadonlyArray<import("./materialiTypes").FamigliaMateriale>} */
export const CATALOGO_MATERIALI_SEED = Object.freeze([
  // —— Famiglie pre-6.2 (ID invariati) ——
  famiglia({
    id: "tubo-corrugato",
    nome: "Tubo corrugato",
    categoria: CATEGORIA_MATERIALE.TUBI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "diametro",
    descrizione: "Tubo corrugato per posa cavi",
    varianti: [
      variante("tubo-corrugato", "16", "Ø16", { diametro: "16" }, {
        accessoriSuggeriti: ACC_PRESSACAVO_16,
      }),
      variante("tubo-corrugato", "20", "Ø20", { diametro: "20" }, {
        accessoriSuggeriti: ACC_PRESSACAVO_20,
      }),
      variante("tubo-corrugato", "25", "Ø25", { diametro: "25" }, {
        accessoriSuggeriti: ACC_PRESSACAVO_25,
      }),
      variante("tubo-corrugato", "32", "Ø32", { diametro: "32" }),
      variante("tubo-corrugato", "40", "Ø40", { diametro: "40" }),
      variante("tubo-corrugato", "50", "Ø50", { diametro: "50" }),
      variante("tubo-corrugato", "63", "Ø63", { diametro: "63" }),
    ],
  }),

  famiglia({
    id: "tubo-rigido",
    nome: "Tubo rigido",
    categoria: CATEGORIA_MATERIALE.TUBI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "diametro",
    descrizione: "Tubo rigido PVC / metallico",
    varianti: variantiDa("tubo-rigido", [
      ["16", "Ø16", { diametro: "16" }],
      ["20", "Ø20", { diametro: "20" }],
      ["25", "Ø25", { diametro: "25" }],
      ["32", "Ø32", { diametro: "32" }],
      ["40", "Ø40", { diametro: "40" }],
      ["50", "Ø50", { diametro: "50" }],
    ]),
  }),

  famiglia({
    id: "canalina",
    nome: "Canalina",
    categoria: CATEGORIA_MATERIALE.CANALIZZAZIONI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "dimensione",
    descrizione: "Canalina porta cavi",
    varianti: variantiDa("canalina", [
      ["20x10", "20×10", { dimensione: "20x10" }],
      ["25x16", "25×16", { dimensione: "25x16" }],
      ["40x20", "40×20", { dimensione: "40x20" }],
      ["60x40", "60×40", { dimensione: "60x40" }],
      ["80x60", "80×60", { dimensione: "80x60" }],
      ["100x60", "100×60", { dimensione: "100x60" }],
    ]),
  }),

  famiglia({
    id: "cavo-unipolare",
    nome: "Cavo unipolare",
    categoria: CATEGORIA_MATERIALE.CAVI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "sezione",
    descrizione: "Cavo unipolare N07V-K / equivalente",
    varianti: variantiDa("cavo-unipolare", [
      ["0-75-mm", "0,75 mm²", { sezione: "0.75" }],
      ["1-5-mm", "1,5 mm²", { sezione: "1.5" }],
      ["2-5-mm", "2,5 mm²", { sezione: "2.5" }],
      ["4-mm", "4 mm²", { sezione: "4" }],
      ["6-mm", "6 mm²", { sezione: "6" }],
      ["10-mm", "10 mm²", { sezione: "10" }],
      ["16-mm", "16 mm²", { sezione: "16" }],
      ["25-mm", "25 mm²", { sezione: "25" }],
      ["35-mm", "35 mm²", { sezione: "35" }],
    ]),
  }),

  famiglia({
    id: "cavo-multipolare",
    nome: "Cavo multipolare",
    categoria: CATEGORIA_MATERIALE.CAVI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "composizione",
    descrizione: "Cavo multipolare FG16 / equivalente",
    varianti: variantiDa("cavo-multipolare", [
      ["3x1-5", "3×1,5", { composizione: "3x1.5" }],
      ["3x2-5", "3×2,5", { composizione: "3x2.5" }],
      ["3x4", "3×4", { composizione: "3x4" }],
      ["3x6", "3×6", { composizione: "3x6" }],
      ["5x1-5", "5×1,5", { composizione: "5x1.5" }],
      ["5x2-5", "5×2,5", { composizione: "5x2.5" }],
      ["5x4", "5×4", { composizione: "5x4" }],
      ["5x6", "5×6", { composizione: "5x6" }],
    ]),
  }),

  famiglia({
    id: "cassetta",
    nome: "Cassetta",
    categoria: CATEGORIA_MATERIALE.CASSETTE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    descrizione: "Cassetta da incasso / esterna / stagna",
    varianti: variantiDa("cassetta", [
      ["503", "503", { tipo: "503" }],
      ["504", "504", { tipo: "504" }],
      ["506", "506", { tipo: "506" }],
      ["derivazione", "Derivazione", { tipo: "derivazione" }],
      ["esterna", "Esterna", { tipo: "esterna" }],
      ["stagna-ip55", "Stagna IP55", { tipo: "stagna" }],
    ]),
  }),

  famiglia({
    id: "scatola-derivazione",
    nome: "Scatola di derivazione",
    categoria: CATEGORIA_MATERIALE.CASSETTE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "dimensione",
    varianti: variantiDa("scatola-derivazione", [
      ["80x80", "80×80", { dimensione: "80x80" }],
      ["100x100", "100×100", { dimensione: "100x100" }],
      ["150x110", "150×110", { dimensione: "150x110" }],
      ["190x140", "190×140", { dimensione: "190x140" }],
      ["300x220", "300×220", { dimensione: "300x220" }],
    ]),
  }),

  famiglia({
    id: "magnetotermico",
    nome: "Magnetotermico",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "calibro",
    descrizione: "Interruttore magnetotermico",
    varianti: variantiDa("magnetotermico", [
      ["6a-1p", "6A 1P", { calibro: "6A", poli: "1P" }],
      ["10a-1p", "10A 1P", { calibro: "10A", poli: "1P" }],
      ["16a-1p", "16A 1P", { calibro: "16A", poli: "1P" }],
      ["20a-1p", "20A 1P", { calibro: "20A", poli: "1P" }],
      ["25a-1p", "25A 1P", { calibro: "25A", poli: "1P" }],
      ["16a-2p", "16A 2P", { calibro: "16A", poli: "2P" }],
      ["25a-2p", "25A 2P", { calibro: "25A", poli: "2P" }],
      ["32a-2p", "32A 2P", { calibro: "32A", poli: "2P" }],
      ["32a-3p", "32A 3P", { calibro: "32A", poli: "3P" }],
      ["40a-3p", "40A 3P", { calibro: "40A", poli: "3P" }],
      ["10a-2p", "10A 2P", { calibro: "10A", poli: "2P" }],
      ["16a-3p", "16A 3P", { calibro: "16A", poli: "3P" }],
      ["50a-3p", "50A 3P", { calibro: "50A", poli: "3P" }],
      ["63a-3p", "63A 3P", { calibro: "63A", poli: "3P" }],
    ]),
  }),

  famiglia({
    id: "differenziale",
    nome: "Differenziale",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    descrizione: "Interruttore differenziale puro / magnetotermico",
    varianti: variantiDa("differenziale", [
      ["25a-30ma-2p", "25A 30mA 2P", { tipo: "puro", calibro: "25A", sensibilita: "30mA", poli: "2P" }],
      ["40a-30ma-2p", "40A 30mA 2P", { tipo: "puro", calibro: "40A", sensibilita: "30mA", poli: "2P" }],
      ["63a-30ma-4p", "63A 30mA 4P", { tipo: "puro", calibro: "63A", sensibilita: "30mA", poli: "4P" }],
      ["mt-16a-30ma", "MT 16A 30mA", { tipo: "magnetotermico", calibro: "16A", sensibilita: "30mA" }],
      ["mt-25a-30ma", "MT 25A 30mA", { tipo: "magnetotermico", calibro: "25A", sensibilita: "30mA" }],
      ["25a-30ma-4p", "25A 30mA 4P", { tipo: "puro", calibro: "25A", sensibilita: "30mA", poli: "4P" }],
      ["40a-30ma-4p", "40A 30mA 4P", { tipo: "puro", calibro: "40A", sensibilita: "30mA", poli: "4P" }],
      ["63a-300ma-4p", "63A 300mA 4P", { tipo: "puro", calibro: "63A", sensibilita: "300mA", poli: "4P" }],
    ]),
  }),

  famiglia({
    id: "contattore",
    nome: "Contattore",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "calibro",
    varianti: variantiDa("contattore", [
      ["25a", "25A", { calibro: "25A" }],
      ["40a", "40A", { calibro: "40A" }],
      ["63a", "63A", { calibro: "63A" }],
      ["25a-230v", "25A 230V", { calibro: "25A", bobina: "230V" }],
      ["40a-230v", "40A 230V", { calibro: "40A", bobina: "230V" }],
    ]),
  }),

  famiglia({
    id: "quadro-elettrico",
    nome: "Quadro elettrico",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "moduli",
    accessoriSuggeriti: [
      accessorio({
        famigliaId: "pressacavo",
        quantitaPerUnita: 4,
        nota: "Pressacavi tipici per quadro",
      }),
      accessorio({
        varianteId: "morsetti-a-leva-3-poli",
        famigliaId: "morsetti",
        quantitaPerUnita: 1,
        nota: "Confezione morsetti",
      }),
      accessorio({
        famigliaId: "guida-din",
        quantitaPerUnita: 1,
        nota: "Guida DIN per moduli",
      }),
    ],
    varianti: variantiDa("quadro-elettrico", [
      ["8-moduli", "8 moduli", { moduli: 8 }],
      ["12-moduli", "12 moduli", { moduli: 12 }],
      ["24-moduli", "24 moduli", { moduli: 24 }],
      ["36-moduli", "36 moduli", { moduli: 36 }],
      ["54-moduli", "54 moduli", { moduli: 54 }],
    ]),
  }),

  famiglia({
    id: "presa-civile",
    nome: "Presa civile",
    categoria: CATEGORIA_MATERIALE.SERIE_CIVILE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    descrizione: "Presa senza vincolo di marca/serie",
    accessoriSuggeriti: ACC_SERIE_CIVILE,
    varianti: variantiDa("presa-civile", [
      ["bipasso", "Bipasso", { tipo: "bipasso" }],
      ["schuko", "Schuko", { tipo: "schuko" }],
      ["10a", "10A", { tipo: "10A" }],
      ["16a", "16A", { tipo: "16A" }],
      ["con-usb", "Con USB", { tipo: "usb" }],
    ]),
  }),

  famiglia({
    id: "interruttore-comando",
    nome: "Interruttore / comando",
    categoria: CATEGORIA_MATERIALE.SERIE_CIVILE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    accessoriSuggeriti: ACC_SERIE_CIVILE,
    varianti: variantiDa("interruttore-comando", [
      ["unipolare", "Unipolare", { tipo: "unipolare" }],
      ["deviatore", "Deviatore", { tipo: "deviatore" }],
      ["invertitore", "Invertitore", { tipo: "invertitore" }],
      ["pulsante", "Pulsante", { tipo: "pulsante" }],
      ["dimmer", "Dimmer", { tipo: "dimmer" }],
    ]),
  }),

  famiglia({
    id: "morsetti",
    nome: "Morsetti",
    categoria: CATEGORIA_MATERIALE.MORSETTI,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "tipo",
    varianti: variantiDa("morsetti", [
      ["a-leva-2-poli", "A leva 2 poli", { tipo: "leva-2" }],
      ["a-leva-3-poli", "A leva 3 poli", { tipo: "leva-3" }],
      ["a-leva-5-poli", "A leva 5 poli", { tipo: "leva-5" }],
      ["a-vite", "A vite", { tipo: "vite" }],
      ["a-leva-4-poli", "A leva 4 poli", { tipo: "leva-4" }],
    ]),
  }),

  famiglia({
    id: "fascette",
    nome: "Fascette",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "dimensione",
    varianti: variantiDa("fascette", [
      ["100-mm", "100 mm", { dimensione: "100mm" }],
      ["200-mm", "200 mm", { dimensione: "200mm" }],
      ["300-mm", "300 mm", { dimensione: "300mm" }],
      ["150-mm", "150 mm", { dimensione: "150mm" }],
      ["370-mm", "370 mm", { dimensione: "370mm" }],
    ]),
  }),

  famiglia({
    id: "presa-industriale",
    nome: "Presa industriale",
    categoria: CATEGORIA_MATERIALE.INDUSTRIALE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("presa-industriale", [
      ["16a-3p-n-t", "16A 3P+N+T", { tipo: "16A-3P+N+T" }],
      ["32a-3p-n-t", "32A 3P+N+T", { tipo: "32A-3P+N+T" }],
      ["63a-3p-n-t", "63A 3P+N+T", { tipo: "63A-3P+N+T" }],
      ["16a-2p-t", "16A 2P+T", { tipo: "16A-2P+T" }],
      ["32a-2p-t", "32A 2P+T", { tipo: "32A-2P+T" }],
    ]),
  }),

  famiglia({
    id: "centrale-allarme",
    nome: "Centrale allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("centrale-allarme", [
      ["filare", "Filare", { tipo: "filare" }],
      ["wireless", "Wireless", { tipo: "wireless" }],
      ["ibrida", "Ibrida", { tipo: "ibrida" }],
    ]),
  }),

  famiglia({
    id: "sensore-allarme",
    nome: "Sensore allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("sensore-allarme", [
      ["pir-volumetrico", "PIR volumetrico", { tipo: "pir" }],
      ["contatto-magnetico", "Contatto magnetico", { tipo: "contatto" }],
      ["rivelatore-fumo", "Rivelatore fumo", { tipo: "fumata" }],
      ["rottura-vetro", "Rottura vetro", { tipo: "vetro" }],
      ["inondazione", "Inondazione", { tipo: "inondazione" }],
      ["tapparella", "Tapparella", { tipo: "tapparella" }],
    ]),
  }),

  famiglia({
    id: "sirena-allarme",
    nome: "Sirena allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("sirena-allarme", [
      ["interna", "Interna", { tipo: "interna" }],
      ["esterna", "Esterna", { tipo: "esterna" }],
      ["autoalimentata", "Autoalimentata", { tipo: "autoalimentata" }],
    ]),
  }),

  famiglia({
    id: "tastiera-allarme",
    nome: "Tastiera / telecomando allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("tastiera-allarme", [
      ["tastiera-lcd", "Tastiera LCD", { tipo: "lcd" }],
      ["tastiera-touch", "Tastiera touch", { tipo: "touch" }],
      ["telecomando", "Telecomando", { tipo: "telecomando" }],
    ]),
  }),

  famiglia({
    id: "cavo-allarme",
    nome: "Cavo allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "composizione",
    varianti: variantiDa("cavo-allarme", [
      ["2x0-22", "2×0,22", { composizione: "2x0.22" }],
      ["4x0-22", "4×0,22", { composizione: "4x0.22" }],
      ["6x0-22", "6×0,22", { composizione: "6x0.22" }],
      ["8x0-22", "8×0,22", { composizione: "8x0.22" }],
    ]),
  }),

  famiglia({
    id: "telecamera",
    nome: "Telecamera",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    accessoriSuggeriti: [
      accessorio({
        varianteId: "kit-fissaggio-per-telecamera",
        famigliaId: "kit-fissaggio",
        quantitaPerUnita: 1,
      }),
      accessorio({
        famigliaId: "cavo-rete-poe",
        quantitaPerUnita: 1,
        nota: "Cavo rete / PoE",
      }),
    ],
    varianti: variantiDa("telecamera", [
      ["dome-ip", "Dome IP", { tipo: "dome-ip" }],
      ["bullet-ip", "Bullet IP", { tipo: "bullet-ip" }],
      ["ptz", "PTZ", { tipo: "ptz" }],
      ["wi-fi", "Wi-Fi", { tipo: "wifi" }],
      ["turret-ip", "Turret IP", { tipo: "turret-ip" }],
    ]),
  }),

  famiglia({
    id: "nvr-dvr",
    nome: "NVR / DVR",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "canali",
    accessoriSuggeriti: [
      accessorio({
        famigliaId: "hdd-videosorveglianza",
        quantitaPerUnita: 1,
        nota: "Hard disk dedicato",
      }),
    ],
    varianti: variantiDa("nvr-dvr", [
      ["4-canali", "4 canali", { canali: 4 }],
      ["8-canali", "8 canali", { canali: 8 }],
      ["16-canali", "16 canali", { canali: 16 }],
      ["32-canali", "32 canali", { canali: 32 }],
    ]),
  }),

  famiglia({
    id: "hdd-videosorveglianza",
    nome: "Hard disk videosorveglianza",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "capacita",
    varianti: variantiDa("hdd-videosorveglianza", [
      ["1-tb", "1 TB", { capacita: "1TB" }],
      ["2-tb", "2 TB", { capacita: "2TB" }],
      ["4-tb", "4 TB", { capacita: "4TB" }],
      ["8-tb", "8 TB", { capacita: "8TB" }],
    ]),
  }),

  famiglia({
    id: "cavo-rete-poe",
    nome: "Cavo rete / PoE",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "categoria",
    varianti: variantiDa("cavo-rete-poe", [
      ["cat-5e", "Cat.5e", { categoria: "cat5e" }],
      ["cat-6", "Cat.6", { categoria: "cat6" }],
      ["cat-6a", "Cat.6A", { categoria: "cat6a" }],
    ]),
  }),

  famiglia({
    id: "switch-poe",
    nome: "Switch PoE",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "porte",
    varianti: variantiDa("switch-poe", [
      ["4-porte", "4 porte", { porte: 4 }],
      ["8-porte", "8 porte", { porte: 8 }],
      ["16-porte", "16 porte", { porte: 16 }],
      ["24-porte", "24 porte", { porte: 24 }],
    ]),
  }),

  famiglia({
    id: "cavo-dati",
    nome: "Cavo dati",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "categoria",
    varianti: variantiDa("cavo-dati", [
      ["cat-5e-utp", "Cat.5e UTP", { categoria: "cat5e" }],
      ["cat-6-utp", "Cat.6 UTP", { categoria: "cat6" }],
      ["cat-6a", "Cat.6A", { categoria: "cat6a" }],
      ["fibra-ottica", "Fibra ottica", { categoria: "fibra" }],
    ]),
  }),

  famiglia({
    id: "keystone-frutto",
    nome: "Keystone / frutto dati",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("keystone-frutto", [
      ["rj45-cat-6", "RJ45 Cat.6", { tipo: "rj45-cat6" }],
      ["rj45-cat-6a", "RJ45 Cat.6A", { tipo: "rj45-cat6a" }],
      ["rj11", "RJ11", { tipo: "rj11" }],
      ["tv-sat", "TV/SAT", { tipo: "tv-sat" }],
    ]),
  }),

  famiglia({
    id: "patch-panel",
    nome: "Patch panel",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "porte",
    varianti: variantiDa("patch-panel", [
      ["12-porte", "12 porte", { porte: 12 }],
      ["24-porte", "24 porte", { porte: 24 }],
      ["48-porte", "48 porte", { porte: 48 }],
    ]),
  }),

  famiglia({
    id: "patch-cord",
    nome: "Patch cord",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "lunghezza",
    varianti: variantiDa("patch-cord", [
      ["0-5-m", "0,5 m", { lunghezza: "0.5m" }],
      ["1-m", "1 m", { lunghezza: "1m" }],
      ["2-m", "2 m", { lunghezza: "2m" }],
      ["5-m", "5 m", { lunghezza: "5m" }],
    ]),
  }),

  famiglia({
    id: "armadio-rack",
    nome: "Armadio rack",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "unita",
    varianti: variantiDa("armadio-rack", [
      ["6u", "6U", { unita: "6U" }],
      ["9u", "9U", { unita: "9U" }],
      ["12u", "12U", { unita: "12U" }],
      ["22u", "22U", { unita: "22U" }],
    ]),
  }),

  famiglia({
    id: "faretto-led",
    nome: "Faretto LED",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "potenza",
    accessoriSuggeriti: [
      accessorio({
        famigliaId: "driver-led",
        quantitaPerUnita: 1,
        obbligatorio: false,
        nota: "Driver se il faretto non è 230V",
      }),
    ],
    varianti: variantiDa("faretto-led", [
      ["5-w", "5 W", { potenza: "5W" }],
      ["7-w", "7 W", { potenza: "7W" }],
      ["10-w", "10 W", { potenza: "10W" }],
      ["15-w", "15 W", { potenza: "15W" }],
    ]),
  }),

  famiglia({
    id: "plafoniera",
    nome: "Plafoniera",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("plafoniera", [
      ["led-rotonda", "LED rotonda", { tipo: "led-rotonda" }],
      ["led-quadrata", "LED quadrata", { tipo: "led-quadra" }],
      ["stagna-ip65", "Stagna IP65", { tipo: "stagna" }],
      ["emergenza", "Emergenza", { tipo: "emergenza" }],
    ]),
  }),

  famiglia({
    id: "striscia-led",
    nome: "Striscia LED",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "tipo",
    accessoriSuggeriti: [
      accessorio({
        famigliaId: "alimentatore-led",
        quantitaPerUnita: 1,
        nota: "Alimentatore dedicato",
      }),
    ],
    varianti: variantiDa("striscia-led", [
      ["24v-monocromatica", "24V monocromatica", { tipo: "24v-mono" }],
      ["24v-rgb", "24V RGB", { tipo: "24v-rgb" }],
      ["12v-monocromatica", "12V monocromatica", { tipo: "12v-mono" }],
    ]),
  }),

  famiglia({
    id: "alimentatore-led",
    nome: "Alimentatore LED",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "potenza",
    varianti: variantiDa("alimentatore-led", [
      ["30-w", "30 W", { potenza: "30W" }],
      ["60-w", "60 W", { potenza: "60W" }],
      ["100-w", "100 W", { potenza: "100W" }],
      ["150-w", "150 W", { potenza: "150W" }],
    ]),
  }),

  famiglia({
    id: "lampada-emergenza",
    nome: "Lampada di emergenza",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("lampada-emergenza", [
      ["se-sempre-accesa", "SE (sempre accesa)", { tipo: "sa" }],
      ["nm-non-permanente", "NM (non permanente)", { tipo: "nm" }],
      ["ip65", "IP65", { tipo: "ip65" }],
    ]),
  }),

  famiglia({
    id: "attuatore-domotico",
    nome: "Attuatore domotico",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("attuatore-domotico", [
      ["rel-1-canale", "Relè 1 canale", { tipo: "rele-1ch" }],
      ["rel-2-canali", "Relè 2 canali", { tipo: "rele-2ch" }],
      ["tapparella", "Tapparella", { tipo: "tapparella" }],
      ["dimmer", "Dimmer", { tipo: "dimmer" }],
    ]),
  }),

  famiglia({
    id: "gateway-domotico",
    nome: "Gateway / hub domotico",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("gateway-domotico", [
      ["bus", "Bus", { tipo: "bus" }],
      ["wi-fi", "Wi-Fi", { tipo: "wifi" }],
      ["zigbee", "Zigbee", { tipo: "zigbee" }],
    ]),
  }),

  famiglia({
    id: "termostato",
    nome: "Termostato / cronotermostato",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("termostato", [
      ["ambiente", "Ambiente", { tipo: "ambiente" }],
      ["wi-fi", "Wi-Fi", { tipo: "wifi" }],
      ["bus", "Bus", { tipo: "bus" }],
    ]),
  }),

  famiglia({
    id: "cavo-bus",
    nome: "Cavo bus",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "tipo",
    varianti: variantiDa("cavo-bus", [
      ["2x0-8", "2×0,8", { tipo: "2x0.8" }],
      ["2x2x0-8-schermato", "2×2×0,8 schermato", { tipo: "2x2x0.8" }],
    ]),
  }),

  famiglia({
    id: "cavo-solare",
    nome: "Cavo solare",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "sezione",
    varianti: variantiDa("cavo-solare", [
      ["4-mm", "4 mm²", { sezione: "4" }],
      ["6-mm", "6 mm²", { sezione: "6" }],
      ["10-mm", "10 mm²", { sezione: "10" }],
    ]),
  }),

  famiglia({
    id: "connettore-mc4",
    nome: "Connettore MC4",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("connettore-mc4", [
      ["maschio", "Maschio", { tipo: "maschio" }],
      ["femmina", "Femmina", { tipo: "femmina" }],
      ["coppia-m-f", "Coppia M+F", { tipo: "coppia" }],
    ]),
  }),

  famiglia({
    id: "quadro-stringa",
    nome: "Quadro di stringa",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "stringhe",
    varianti: variantiDa("quadro-stringa", [
      ["1-stringa", "1 stringa", { stringhe: 1 }],
      ["2-stringhe", "2 stringhe", { stringhe: 2 }],
      ["3-stringhe", "3 stringhe", { stringhe: 3 }],
    ]),
  }),

  famiglia({
    id: "scaricatore-fotovoltaico",
    nome: "Scaricatore fotovoltaico",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("scaricatore-fotovoltaico", [
      ["dc", "DC", { tipo: "dc" }],
      ["ac", "AC", { tipo: "ac" }],
    ]),
  }),

  famiglia({
    id: "interruttore-sezionatore-dc",
    nome: "Sezionatore DC",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "calibro",
    varianti: variantiDa("interruttore-sezionatore-dc", [
      ["16a", "16A", { calibro: "16A" }],
      ["25a", "25A", { calibro: "25A" }],
      ["32a", "32A", { calibro: "32A" }],
    ]),
  }),

  famiglia({
    id: "tasselli",
    nome: "Tasselli",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "dimensione",
    varianti: variantiDa("tasselli", [
      ["6", "Ø6", { dimensione: "6mm" }],
      ["8", "Ø8", { dimensione: "8mm" }],
      ["10", "Ø10", { dimensione: "10mm" }],
    ]),
  }),

  famiglia({
    id: "viti",
    nome: "Viti",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "tipo",
    varianti: variantiDa("viti", [
      ["autofilettanti", "Autofilettanti", { tipo: "autofilettanti" }],
      ["truciolari", "Truciolari", { tipo: "truciolari" }],
      ["metriche", "Metriche", { tipo: "metriche" }],
    ]),
  }),

  famiglia({
    id: "nastro-isolante",
    nome: "Nastro isolante",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.ROTOLO,
    attributoChiave: "tipo",
    varianti: variantiDa("nastro-isolante", [
      ["pvc-nero", "PVC nero", { tipo: "pvc-nero" }],
      ["pvc-colori", "PVC colori", { tipo: "pvc-colori" }],
      ["autoagglomerante", "Autoagglomerante", { tipo: "autoagglomerante" }],
    ]),
  }),

  famiglia({
    id: "guaina-termorestringente",
    nome: "Guaina termorestringente",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "diametro",
    varianti: variantiDa("guaina-termorestringente", [
      ["3", "Ø3", { diametro: "3" }],
      ["6", "Ø6", { diametro: "6" }],
      ["12", "Ø12", { diametro: "12" }],
      ["19", "Ø19", { diametro: "19" }],
    ]),
  }),

  famiglia({
    id: "silicone-sigillante",
    nome: "Silicone / sigillante",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("silicone-sigillante", [
      ["neutro", "Neutro", { tipo: "neutro" }],
      ["acetico", "Acetico", { tipo: "acetico" }],
      ["resistente-al-fuoco", "Resistente al fuoco", { tipo: "fuoco" }],
    ]),
  }),

  famiglia({
    id: "canalina-pavimento",
    nome: "Canalina a pavimento",
    categoria: CATEGORIA_MATERIALE.CANALIZZAZIONI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "dimensione",
    varianti: variantiDa("canalina-pavimento", [
      ["50-mm", "50 mm", { dimensione: "50" }],
      ["75-mm", "75 mm", { dimensione: "75" }],
      ["100-mm", "100 mm", { dimensione: "100" }],
    ]),
  }),

  famiglia({
    id: "kit-fissaggio",
    nome: "Kit di fissaggio",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.KIT,
    attributoChiave: "tipo",
    varianti: variantiDa("kit-fissaggio", [
      ["per-quadro", "Per quadro", { tipo: "quadro" }],
      ["per-canalina", "Per canalina", { tipo: "canalina" }],
      ["per-telecamera", "Per telecamera", { tipo: "telecamera" }],
    ]),
  }),

  famiglia({
    id: "pressacavo",
    nome: "Pressacavo",
    categoria: CATEGORIA_MATERIALE.MORSETTI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "diametro",
    descrizione: "Pressacavo per quadri e cassette",
    varianti: variantiDa("pressacavo", [
      ["pg9", "PG9", { diametro: "PG9" }],
      ["pg11", "PG11", { diametro: "PG11" }],
      ["pg13-5", "PG13.5", { diametro: "PG13.5" }],
      ["pg16", "PG16", { diametro: "PG16" }],
      ["pg21", "PG21", { diametro: "PG21" }],
    ]),
  }),

  // —— Nuove famiglie UX-6.2 (ID stabili) ——
  famiglia({
    id: "cavo-fg16or16",
    nome: "Cavo FG16OR16",
    categoria: CATEGORIA_MATERIALE.CAVI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "composizione",
    descrizione: "Cavo FG16OR16 / equivalente, posa fissa",
    varianti: variantiDa("cavo-fg16or16", [
      ["3g1-5", "3G1,5", { composizione: "3G1,5" }],
      ["3g2-5", "3G2,5", { composizione: "3G2,5" }],
      ["3g4", "3G4", { composizione: "3G4" }],
      ["3g6", "3G6", { composizione: "3G6" }],
      ["5g1-5", "5G1,5", { composizione: "5G1,5" }],
      ["5g2-5", "5G2,5", { composizione: "5G2,5" }],
      ["5g4", "5G4", { composizione: "5G4" }],
      ["5g6", "5G6", { composizione: "5G6" }],
    ]),
  }),

  famiglia({
    id: "cavo-fs17",
    nome: "Cavo FS17",
    categoria: CATEGORIA_MATERIALE.CAVI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "sezione",
    descrizione: "Cavo FS17 unipolare / equivalente",
    varianti: variantiDa("cavo-fs17", [
      ["1-5-mm", "1,5 mm²", { sezione: "1.5" }],
      ["2-5-mm", "2,5 mm²", { sezione: "2.5" }],
      ["4-mm", "4 mm²", { sezione: "4" }],
      ["6-mm", "6 mm²", { sezione: "6" }],
      ["10-mm", "10 mm²", { sezione: "10" }],
      ["16-mm", "16 mm²", { sezione: "16" }],
    ]),
  }),

  famiglia({
    id: "cavo-fg17",
    nome: "Cavo FG17",
    categoria: CATEGORIA_MATERIALE.CAVI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "sezione",
    descrizione: "Cavo FG17 unipolare / equivalente",
    varianti: variantiDa("cavo-fg17", [
      ["1-5-mm", "1,5 mm²", { sezione: "1.5" }],
      ["2-5-mm", "2,5 mm²", { sezione: "2.5" }],
      ["4-mm", "4 mm²", { sezione: "4" }],
      ["6-mm", "6 mm²", { sezione: "6" }],
      ["10-mm", "10 mm²", { sezione: "10" }],
    ]),
  }),

  famiglia({
    id: "cavo-h07rnf",
    nome: "Cavo H07RN-F",
    categoria: CATEGORIA_MATERIALE.CAVI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "composizione",
    descrizione: "Cavo gomma H07RN-F / equivalente",
    varianti: variantiDa("cavo-h07rnf", [
      ["3g1-5", "3G1,5", { composizione: "3G1,5" }],
      ["3g2-5", "3G2,5", { composizione: "3G2,5" }],
      ["3g4", "3G4", { composizione: "3G4" }],
      ["5g2-5", "5G2,5", { composizione: "5G2,5" }],
      ["5g4", "5G4", { composizione: "5G4" }],
    ]),
  }),

  famiglia({
    id: "cavo-citofonico",
    nome: "Cavo citofonico",
    categoria: CATEGORIA_MATERIALE.CAVI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "composizione",
    varianti: variantiDa("cavo-citofonico", [
      ["2x1", "2×1", { composizione: "2x1" }],
      ["4x1", "4×1", { composizione: "4x1" }],
      ["6x0-5", "6×0,5", { composizione: "6x0.5" }],
      ["8x0-5", "8×0,5", { composizione: "8x0.5" }],
    ]),
  }),

  famiglia({
    id: "cavo-terra-nudo",
    nome: "Cavo di terra nudo",
    categoria: CATEGORIA_MATERIALE.CAVI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "sezione",
    varianti: variantiDa("cavo-terra-nudo", [
      ["16-mm", "16 mm²", { sezione: "16" }],
      ["25-mm", "25 mm²", { sezione: "25" }],
      ["35-mm", "35 mm²", { sezione: "35" }],
      ["50-mm", "50 mm²", { sezione: "50" }],
    ]),
  }),

  famiglia({
    id: "tubo-doppia-parete",
    nome: "Tubo doppia parete",
    categoria: CATEGORIA_MATERIALE.TUBI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "diametro",
    varianti: variantiDa("tubo-doppia-parete", [
      ["40", "Ø40", { diametro: "40" }],
      ["50", "Ø50", { diametro: "50" }],
      ["63", "Ø63", { diametro: "63" }],
      ["75", "Ø75", { diametro: "75" }],
      ["90", "Ø90", { diametro: "90" }],
      ["110", "Ø110", { diametro: "110" }],
    ]),
  }),

  famiglia({
    id: "tubo-flessibile",
    nome: "Tubo flessibile",
    categoria: CATEGORIA_MATERIALE.TUBI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "diametro",
    varianti: variantiDa("tubo-flessibile", [
      ["16", "Ø16", { diametro: "16" }],
      ["20", "Ø20", { diametro: "20" }],
      ["25", "Ø25", { diametro: "25" }],
      ["32", "Ø32", { diametro: "32" }],
    ]),
  }),

  famiglia({
    id: "raccordo-tubo",
    nome: "Raccordo / manicotto tubo",
    categoria: CATEGORIA_MATERIALE.TUBI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "diametro",
    varianti: variantiDa("raccordo-tubo", [
      ["16", "Ø16", { diametro: "16" }],
      ["20", "Ø20", { diametro: "20" }],
      ["25", "Ø25", { diametro: "25" }],
      ["32", "Ø32", { diametro: "32" }],
    ]),
  }),

  famiglia({
    id: "minicanale",
    nome: "Minicanale",
    categoria: CATEGORIA_MATERIALE.CANALIZZAZIONI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "dimensione",
    varianti: variantiDa("minicanale", [
      ["10x10", "10×10", { dimensione: "10x10" }],
      ["16x16", "16×16", { dimensione: "16x16" }],
      ["20x10", "20×10", { dimensione: "20x10" }],
      ["30x10", "30×10", { dimensione: "30x10" }],
    ]),
  }),

  famiglia({
    id: "supporto-civile",
    nome: "Supporto civile",
    categoria: CATEGORIA_MATERIALE.SERIE_CIVILE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "moduli",
    varianti: variantiDa("supporto-civile", [
      ["2-moduli", "2 moduli", { moduli: 2 }],
      ["3-moduli", "3 moduli", { moduli: 3 }],
      ["4-moduli", "4 moduli", { moduli: 4 }],
      ["7-moduli", "7 moduli", { moduli: 7 }],
    ]),
  }),

  famiglia({
    id: "placca-civile",
    nome: "Placca civile",
    categoria: CATEGORIA_MATERIALE.SERIE_CIVILE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "moduli",
    varianti: variantiDa("placca-civile", [
      ["3-moduli", "3 moduli", { moduli: 3 }],
      ["4-moduli", "4 moduli", { moduli: 4 }],
      ["7-moduli", "7 moduli", { moduli: 7 }],
    ]),
  }),

  famiglia({
    id: "frutto-tv-civile",
    nome: "Frutto TV civile",
    categoria: CATEGORIA_MATERIALE.SERIE_CIVILE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("frutto-tv-civile", [
      ["tv", "TV", { tipo: "tv" }],
      ["sat", "SAT", { tipo: "sat" }],
      ["tv-sat", "TV/SAT", { tipo: "tv-sat" }],
    ]),
  }),

  famiglia({
    id: "guida-din",
    nome: "Guida DIN",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "lunghezza",
    varianti: variantiDa("guida-din", [
      ["12-moduli", "12 moduli", { lunghezza: "12" }],
      ["18-moduli", "18 moduli", { lunghezza: "18" }],
      ["24-moduli", "24 moduli", { lunghezza: "24" }],
      ["36-moduli", "36 moduli", { lunghezza: "36" }],
    ]),
  }),

  famiglia({
    id: "magnetotermico-differenziale",
    nome: "Magnetotermico differenziale",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    descrizione: "Interruttore magnetotermico differenziale (MT+diff)",
    varianti: variantiDa("magnetotermico-differenziale", [
      ["16a-30ma-2p", "16A 30mA 2P", { calibro: "16A", sensibilita: "30mA", poli: "2P" }],
      ["20a-30ma-2p", "20A 30mA 2P", { calibro: "20A", sensibilita: "30mA", poli: "2P" }],
      ["25a-30ma-2p", "25A 30mA 2P", { calibro: "25A", sensibilita: "30mA", poli: "2P" }],
      ["32a-30ma-2p", "32A 30mA 2P", { calibro: "32A", sensibilita: "30mA", poli: "2P" }],
      ["32a-30ma-4p", "32A 30mA 4P", { calibro: "32A", sensibilita: "30mA", poli: "4P" }],
    ]),
  }),

  famiglia({
    id: "sezionatore-ac",
    nome: "Sezionatore AC",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "calibro",
    varianti: variantiDa("sezionatore-ac", [
      ["32a-2p", "32A 2P", { calibro: "32A", poli: "2P" }],
      ["40a-2p", "40A 2P", { calibro: "40A", poli: "2P" }],
      ["63a-4p", "63A 4P", { calibro: "63A", poli: "4P" }],
      ["100a-4p", "100A 4P", { calibro: "100A", poli: "4P" }],
    ]),
  }),

  famiglia({
    id: "scaricatore-spd",
    nome: "Scaricatore SPD",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("scaricatore-spd", [
      ["tipo-1", "Tipo 1", { tipo: "T1" }],
      ["tipo-2", "Tipo 2", { tipo: "T2" }],
      ["tipo-1-2", "Tipo 1+2", { tipo: "T1+T2" }],
      ["tipo-2-2p", "Tipo 2 2P", { tipo: "T2-2P" }],
    ]),
  }),

  famiglia({
    id: "morsettiera-din",
    nome: "Morsettiera DIN",
    categoria: CATEGORIA_MATERIALE.QUADRI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "sezione",
    varianti: variantiDa("morsettiera-din", [
      ["2-5-mm", "2,5 mm²", { sezione: "2.5" }],
      ["4-mm", "4 mm²", { sezione: "4" }],
      ["6-mm", "6 mm²", { sezione: "6" }],
      ["10-mm", "10 mm²", { sezione: "10" }],
    ]),
  }),

  famiglia({
    id: "capicorda",
    nome: "Capicorda",
    categoria: CATEGORIA_MATERIALE.MORSETTI,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "sezione",
    varianti: variantiDa("capicorda", [
      ["1-5-mm", "1,5 mm²", { sezione: "1.5" }],
      ["2-5-mm", "2,5 mm²", { sezione: "2.5" }],
      ["4-mm", "4 mm²", { sezione: "4" }],
      ["6-mm", "6 mm²", { sezione: "6" }],
      ["10-mm", "10 mm²", { sezione: "10" }],
      ["16-mm", "16 mm²", { sezione: "16" }],
    ]),
  }),

  famiglia({
    id: "capicorda-preisolato",
    nome: "Capicorda preisolato",
    categoria: CATEGORIA_MATERIALE.MORSETTI,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "colore",
    varianti: variantiDa("capicorda-preisolato", [
      ["rosso-1-5", "Rosso 1,5 mm²", { colore: "rosso", sezione: "1.5" }],
      ["blu-2-5", "Blu 2,5 mm²", { colore: "blu", sezione: "2.5" }],
      ["giallo-6", "Giallo 4–6 mm²", { colore: "giallo", sezione: "6" }],
    ]),
  }),

  famiglia({
    id: "pannello-led",
    nome: "Pannello LED",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "dimensione",
    varianti: variantiDa("pannello-led", [
      ["60x60", "60×60", { dimensione: "60x60" }],
      ["30x120", "30×120", { dimensione: "30x120" }],
      ["60x120", "60×120", { dimensione: "60x120" }],
    ]),
  }),

  famiglia({
    id: "driver-led",
    nome: "Driver LED",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "potenza",
    varianti: variantiDa("driver-led", [
      ["10-w", "10 W", { potenza: "10W" }],
      ["20-w", "20 W", { potenza: "20W" }],
      ["40-w", "40 W", { potenza: "40W" }],
      ["60-w", "60 W", { potenza: "60W" }],
    ]),
  }),

  famiglia({
    id: "faretto-ip65",
    nome: "Faretto IP65",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "potenza",
    varianti: variantiDa("faretto-ip65", [
      ["10-w", "10 W", { potenza: "10W" }],
      ["20-w", "20 W", { potenza: "20W" }],
      ["30-w", "30 W", { potenza: "30W" }],
      ["50-w", "50 W", { potenza: "50W" }],
    ]),
  }),

  famiglia({
    id: "presa-rj45",
    nome: "Presa RJ45",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "categoria",
    varianti: variantiDa("presa-rj45", [
      ["cat-6", "Cat.6", { categoria: "cat6" }],
      ["cat-6a", "Cat.6A", { categoria: "cat6a" }],
    ]),
  }),

  famiglia({
    id: "connettore-rj45",
    nome: "Connettore RJ45",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "categoria",
    varianti: variantiDa("connettore-rj45", [
      ["cat-5e", "Cat.5e", { categoria: "cat5e" }],
      ["cat-6", "Cat.6", { categoria: "cat6" }],
      ["cat-6a", "Cat.6A", { categoria: "cat6a" }],
    ]),
  }),

  famiglia({
    id: "injector-poe",
    nome: "Injector PoE",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("injector-poe", [
      ["15w", "15 W", { tipo: "15W" }],
      ["30w", "30 W", { tipo: "30W" }],
      ["60w", "60 W", { tipo: "60W" }],
    ]),
  }),

  famiglia({
    id: "cavo-coassiale",
    nome: "Cavo coassiale",
    categoria: CATEGORIA_MATERIALE.TV_SAT,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "tipo",
    varianti: variantiDa("cavo-coassiale", [
      ["rg6", "RG6", { tipo: "RG6" }],
      ["rg11", "RG11", { tipo: "RG11" }],
      ["sat-5-mm", "SAT 5 mm", { tipo: "sat5" }],
    ]),
  }),

  famiglia({
    id: "presa-tv",
    nome: "Presa TV",
    categoria: CATEGORIA_MATERIALE.TV_SAT,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("presa-tv", [
      ["passante", "Passante", { tipo: "passante" }],
      ["terminale", "Terminale", { tipo: "terminale" }],
      ["sat", "SAT", { tipo: "sat" }],
    ]),
  }),

  famiglia({
    id: "connettore-f",
    nome: "Connettore F",
    categoria: CATEGORIA_MATERIALE.TV_SAT,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "tipo",
    varianti: variantiDa("connettore-f", [
      ["a-compressione", "A compressione", { tipo: "compressione" }],
      ["a-vite", "A vite", { tipo: "vite" }],
      ["maschio-femmina", "Adattatore M/F", { tipo: "adattatore" }],
    ]),
  }),

  famiglia({
    id: "derivatore-tv",
    nome: "Derivatore TV",
    categoria: CATEGORIA_MATERIALE.TV_SAT,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "uscite",
    varianti: variantiDa("derivatore-tv", [
      ["1-uscita", "1 uscita", { uscite: 1 }],
      ["2-uscite", "2 uscite", { uscite: 2 }],
      ["4-uscite", "4 uscite", { uscite: 4 }],
    ]),
  }),

  famiglia({
    id: "partitore-tv",
    nome: "Partitore TV",
    categoria: CATEGORIA_MATERIALE.TV_SAT,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "uscite",
    varianti: variantiDa("partitore-tv", [
      ["2-uscite", "2 uscite", { uscite: 2 }],
      ["3-uscite", "3 uscite", { uscite: 3 }],
      ["4-uscite", "4 uscite", { uscite: 4 }],
    ]),
  }),

  famiglia({
    id: "alimentatore-cctv",
    nome: "Alimentatore CCTV",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("alimentatore-cctv", [
      ["12v-2a", "12V 2A", { tipo: "12V-2A" }],
      ["12v-5a", "12V 5A", { tipo: "12V-5A" }],
      ["12v-10a", "12V 10A", { tipo: "12V-10A" }],
    ]),
  }),

  famiglia({
    id: "batteria-allarme",
    nome: "Batteria allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "capacita",
    varianti: variantiDa("batteria-allarme", [
      ["12v-2ah", "12V 2Ah", { capacita: "2Ah" }],
      ["12v-7ah", "12V 7Ah", { capacita: "7Ah" }],
      ["12v-18ah", "12V 18Ah", { capacita: "18Ah" }],
    ]),
  }),

  famiglia({
    id: "modulo-din-domotico",
    nome: "Modulo DIN domotico",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("modulo-din-domotico", [
      ["attuatore-4ch", "Attuatore 4 canali", { tipo: "4ch" }],
      ["attuatore-8ch", "Attuatore 8 canali", { tipo: "8ch" }],
      ["alimentatore-bus", "Alimentatore bus", { tipo: "alim-bus" }],
    ]),
  }),

  famiglia({
    id: "sensore-domotico",
    nome: "Sensore domotico",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("sensore-domotico", [
      ["movimento", "Movimento", { tipo: "movimento" }],
      ["apertura", "Apertura", { tipo: "apertura" }],
      ["temperatura", "Temperatura", { tipo: "temperatura" }],
      ["luminosita", "Luminosità", { tipo: "luminosita" }],
    ]),
  }),

  famiglia({
    id: "fusibile-dc",
    nome: "Fusibile DC",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "calibro",
    varianti: variantiDa("fusibile-dc", [
      ["10a", "10A", { calibro: "10A" }],
      ["15a", "15A", { calibro: "15A" }],
      ["20a", "20A", { calibro: "20A" }],
      ["30a", "30A", { calibro: "30A" }],
    ]),
  }),

  famiglia({
    id: "wallbox",
    nome: "Wallbox",
    categoria: CATEGORIA_MATERIALE.EV,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "potenza",
    accessoriSuggeriti: [
      accessorio({
        famigliaId: "protezione-differenziale-ev",
        quantitaPerUnita: 1,
        nota: "Protezione dedicata ricarica EV",
      }),
    ],
    varianti: variantiDa("wallbox", [
      ["7-4-kw", "7,4 kW", { potenza: "7.4kW" }],
      ["11-kw", "11 kW", { potenza: "11kW" }],
      ["22-kw", "22 kW", { potenza: "22kW" }],
    ]),
  }),

  famiglia({
    id: "cavo-tipo2",
    nome: "Cavo Tipo 2",
    categoria: CATEGORIA_MATERIALE.EV,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "lunghezza",
    varianti: variantiDa("cavo-tipo2", [
      ["5-m", "5 m", { lunghezza: "5m" }],
      ["7-m", "7 m", { lunghezza: "7m" }],
      ["10-m", "10 m", { lunghezza: "10m" }],
    ]),
  }),

  famiglia({
    id: "protezione-differenziale-ev",
    nome: "Protezione differenziale EV",
    categoria: CATEGORIA_MATERIALE.EV,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("protezione-differenziale-ev", [
      ["tipo-a-30ma", "Tipo A 30mA", { tipo: "A-30mA" }],
      ["tipo-f", "Tipo F", { tipo: "F" }],
      ["tipo-b", "Tipo B", { tipo: "B" }],
    ]),
  }),

  famiglia({
    id: "spina-industriale",
    nome: "Spina industriale",
    categoria: CATEGORIA_MATERIALE.INDUSTRIALE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("spina-industriale", [
      ["16a-3p-n-t", "16A 3P+N+T", { tipo: "16A-3P+N+T" }],
      ["32a-3p-n-t", "32A 3P+N+T", { tipo: "32A-3P+N+T" }],
      ["16a-2p-t", "16A 2P+T", { tipo: "16A-2P+T" }],
      ["32a-2p-t", "32A 2P+T", { tipo: "32A-2P+T" }],
    ]),
  }),

  famiglia({
    id: "centralina-cancello",
    nome: "Centralina cancello",
    categoria: CATEGORIA_MATERIALE.AUTOMAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("centralina-cancello", [
      ["230v", "230V", { tipo: "230V" }],
      ["24v", "24V", { tipo: "24V" }],
    ]),
  }),

  famiglia({
    id: "fotocellula-cancello",
    nome: "Fotocellula cancello",
    categoria: CATEGORIA_MATERIALE.AUTOMAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("fotocellula-cancello", [
      ["coppia", "Coppia TX/RX", { tipo: "coppia" }],
      ["a-specchio", "A specchio", { tipo: "specchio" }],
    ]),
  }),

  famiglia({
    id: "lampeggiante-cancello",
    nome: "Lampeggiante cancello",
    categoria: CATEGORIA_MATERIALE.AUTOMAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: variantiDa("lampeggiante-cancello", [
      ["230v", "230V", { tipo: "230V" }],
      ["24v", "24V", { tipo: "24V" }],
    ]),
  }),

  famiglia({
    id: "motore-tapparella",
    nome: "Motore tapparella",
    categoria: CATEGORIA_MATERIALE.AUTOMAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "coppia",
    varianti: variantiDa("motore-tapparella", [
      ["10-nm", "10 Nm", { coppia: "10Nm" }],
      ["20-nm", "20 Nm", { coppia: "20Nm" }],
      ["30-nm", "30 Nm", { coppia: "30Nm" }],
      ["50-nm", "50 Nm", { coppia: "50Nm" }],
    ]),
  }),

  famiglia({
    id: "etichette-identificazione",
    nome: "Etichette identificazione",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "tipo",
    varianti: variantiDa("etichette-identificazione", [
      ["cavi", "Per cavi", { tipo: "cavi" }],
      ["quadro", "Per quadro", { tipo: "quadro" }],
      ["tubi", "Per tubi", { tipo: "tubi" }],
    ]),
  }),

  famiglia({
    id: "collare-tubo",
    nome: "Collare per tubo",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "diametro",
    varianti: variantiDa("collare-tubo", [
      ["16", "Ø16", { diametro: "16" }],
      ["20", "Ø20", { diametro: "20" }],
      ["25", "Ø25", { diametro: "25" }],
      ["32", "Ø32", { diametro: "32" }],
    ]),
  }),
]);
