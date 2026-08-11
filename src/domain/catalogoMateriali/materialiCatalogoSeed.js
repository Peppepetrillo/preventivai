/**
 * Seed Catalogo Materiali — famiglie + varianti professionali.
 * Senza marchi, senza prezzo obbligatorio.
 */

import {
  CATEGORIA_MATERIALE,
  UNITA_MATERIALE,
} from "./materialiTypes";

/**
 * @param {string} famigliaId
 * @param {string} slug
 * @param {string} etichetta
 * @param {Record<string, string|number>} attributi
 * @param {object=} extra
 */
function variante(famigliaId, slug, etichetta, attributi, extra = {}) {
  return Object.freeze({
    id: `${famigliaId}-${slug}`,
    famigliaId,
    etichetta,
    attributi: Object.freeze({ ...attributi }),
    unita: extra.unita,
    prezzoIndicativo: extra.prezzoIndicativo,
    attiva: extra.attiva !== false,
  });
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
}) {
  return Object.freeze({
    id,
    nome,
    categoria,
    unitaDefault,
    attributoChiave,
    descrizione,
    personalizzata: false,
    attiva: true,
    varianti: Object.freeze(varianti.map((v) => Object.freeze(v))),
  });
}

/** @type {ReadonlyArray<import("./materialiTypes").FamigliaMateriale>} */
export const CATALOGO_MATERIALI_SEED = Object.freeze([
  famiglia({
    id: "tubo-corrugato",
    nome: "Tubo corrugato",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "diametro",
    descrizione: "Tubo corrugato per posa cavi",
    varianti: [
      variante("tubo-corrugato", "16", "Ø16", { diametro: "16" }),
      variante("tubo-corrugato", "20", "Ø20", { diametro: "20" }),
      variante("tubo-corrugato", "25", "Ø25", { diametro: "25" }),
      variante("tubo-corrugato", "32", "Ø32", { diametro: "32" }),
      variante("tubo-corrugato", "40", "Ø40", { diametro: "40" }),
      variante("tubo-corrugato", "50", "Ø50", { diametro: "50" }),
    ],
  }),

  famiglia({
    id: "tubo-rigido",
    nome: "Tubo rigido",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "diametro",
    descrizione: "Tubo rigido PVC / metallico",
    varianti: [
      variante("tubo-rigido", "16", "Ø16", { diametro: "16" }),
      variante("tubo-rigido", "20", "Ø20", { diametro: "20" }),
      variante("tubo-rigido", "25", "Ø25", { diametro: "25" }),
      variante("tubo-rigido", "32", "Ø32", { diametro: "32" }),
    ],
  }),

  famiglia({
    id: "canalina",
    nome: "Canalina",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "dimensione",
    descrizione: "Canalina porta cavi",
    varianti: [
      variante("canalina", "20x10", "20×10", { dimensione: "20x10" }),
      variante("canalina", "25x16", "25×16", { dimensione: "25x16" }),
      variante("canalina", "40x20", "40×20", { dimensione: "40x20" }),
      variante("canalina", "60x40", "60×40", { dimensione: "60x40" }),
      variante("canalina", "80x60", "80×60", { dimensione: "80x60" }),
    ],
  }),

  famiglia({
    id: "cavo-unipolare",
    nome: "Cavo unipolare",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "sezione",
    descrizione: "Cavo unipolare N07V-K / equivalente",
    varianti: [
      variante("cavo-unipolare", "1-5-mm", "1,5 mm²", { sezione: "1.5" }),
      variante("cavo-unipolare", "2-5-mm", "2,5 mm²", { sezione: "2.5" }),
      variante("cavo-unipolare", "4-mm", "4 mm²", { sezione: "4" }),
      variante("cavo-unipolare", "6-mm", "6 mm²", { sezione: "6" }),
      variante("cavo-unipolare", "10-mm", "10 mm²", { sezione: "10" }),
      variante("cavo-unipolare", "16-mm", "16 mm²", { sezione: "16" }),
      variante("cavo-unipolare", "25-mm", "25 mm²", { sezione: "25" }),
    ],
  }),

  famiglia({
    id: "cavo-multipolare",
    nome: "Cavo multipolare",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "composizione",
    descrizione: "Cavo multipolare FG16 / equivalente",
    varianti: [
      variante("cavo-multipolare", "3x1-5", "3×1,5", { composizione: "3x1.5" }),
      variante("cavo-multipolare", "3x2-5", "3×2,5", { composizione: "3x2.5" }),
      variante("cavo-multipolare", "3x4", "3×4", { composizione: "3x4" }),
      variante("cavo-multipolare", "3x6", "3×6", { composizione: "3x6" }),
      variante("cavo-multipolare", "5x1-5", "5×1,5", { composizione: "5x1.5" }),
      variante("cavo-multipolare", "5x2-5", "5×2,5", { composizione: "5x2.5" }),
      variante("cavo-multipolare", "5x4", "5×4", { composizione: "5x4" }),
      variante("cavo-multipolare", "5x6", "5×6", { composizione: "5x6" }),
    ],
  }),

  famiglia({
    id: "cassetta",
    nome: "Cassetta",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    descrizione: "Cassetta da incasso / esterna / stagna",
    varianti: [
      variante("cassetta", "503", "503", { tipo: "503" }),
      variante("cassetta", "504", "504", { tipo: "504" }),
      variante("cassetta", "derivazione", "Derivazione", { tipo: "derivazione" }),
      variante("cassetta", "esterna", "Esterna", { tipo: "esterna" }),
      variante("cassetta", "stagna-ip55", "Stagna IP55", { tipo: "stagna" }),
    ],
  }),

  famiglia({
    id: "scatola-derivazione",
    nome: "Scatola di derivazione",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "dimensione",
    varianti: [
      variante("scatola-derivazione", "80x80", "80×80", { dimensione: "80x80" }),
      variante("scatola-derivazione", "100x100", "100×100", { dimensione: "100x100" }),
      variante("scatola-derivazione", "150x110", "150×110", { dimensione: "150x110" }),
      variante("scatola-derivazione", "190x140", "190×140", { dimensione: "190x140" }),
    ],
  }),

  famiglia({
    id: "magnetotermico",
    nome: "Magnetotermico",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "calibro",
    descrizione: "Interruttore magnetotermico",
    varianti: [
      variante("magnetotermico", "6a-1p", "6A 1P", { calibro: "6A", poli: "1P" }),
      variante("magnetotermico", "10a-1p", "10A 1P", { calibro: "10A", poli: "1P" }),
      variante("magnetotermico", "16a-1p", "16A 1P", { calibro: "16A", poli: "1P" }),
      variante("magnetotermico", "20a-1p", "20A 1P", { calibro: "20A", poli: "1P" }),
      variante("magnetotermico", "25a-1p", "25A 1P", { calibro: "25A", poli: "1P" }),
      variante("magnetotermico", "16a-2p", "16A 2P", { calibro: "16A", poli: "2P" }),
      variante("magnetotermico", "25a-2p", "25A 2P", { calibro: "25A", poli: "2P" }),
      variante("magnetotermico", "32a-2p", "32A 2P", { calibro: "32A", poli: "2P" }),
      variante("magnetotermico", "32a-3p", "32A 3P", { calibro: "32A", poli: "3P" }),
      variante("magnetotermico", "40a-3p", "40A 3P", { calibro: "40A", poli: "3P" }),
    ],
  }),

  famiglia({
    id: "differenziale",
    nome: "Differenziale",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    descrizione: "Interruttore differenziale puro / magnetotermico",
    varianti: [
      variante("differenziale", "25a-30ma-2p", "25A 30mA 2P", { tipo: "puro", calibro: "25A", sensibilita: "30mA", poli: "2P" }),
      variante("differenziale", "40a-30ma-2p", "40A 30mA 2P", { tipo: "puro", calibro: "40A", sensibilita: "30mA", poli: "2P" }),
      variante("differenziale", "63a-30ma-4p", "63A 30mA 4P", { tipo: "puro", calibro: "63A", sensibilita: "30mA", poli: "4P" }),
      variante("differenziale", "mt-16a-30ma", "MT 16A 30mA", { tipo: "magnetotermico", calibro: "16A", sensibilita: "30mA" }),
      variante("differenziale", "mt-25a-30ma", "MT 25A 30mA", { tipo: "magnetotermico", calibro: "25A", sensibilita: "30mA" }),
    ],
  }),

  famiglia({
    id: "contattore",
    nome: "Contattore",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "calibro",
    varianti: [
      variante("contattore", "25a", "25A", { calibro: "25A" }),
      variante("contattore", "40a", "40A", { calibro: "40A" }),
      variante("contattore", "63a", "63A", { calibro: "63A" }),
    ],
  }),

  famiglia({
    id: "quadro-elettrico",
    nome: "Quadro elettrico",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "moduli",
    varianti: [
      variante("quadro-elettrico", "8-moduli", "8 moduli", { moduli: 8 }),
      variante("quadro-elettrico", "12-moduli", "12 moduli", { moduli: 12 }),
      variante("quadro-elettrico", "24-moduli", "24 moduli", { moduli: 24 }),
      variante("quadro-elettrico", "36-moduli", "36 moduli", { moduli: 36 }),
      variante("quadro-elettrico", "54-moduli", "54 moduli", { moduli: 54 }),
    ],
  }),

  famiglia({
    id: "presa-civile",
    nome: "Presa civile",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    descrizione: "Presa senza vincolo di marca/serie",
    varianti: [
      variante("presa-civile", "bipasso", "Bipasso", { tipo: "bipasso" }),
      variante("presa-civile", "schuko", "Schuko", { tipo: "schuko" }),
      variante("presa-civile", "10a", "10A", { tipo: "10A" }),
      variante("presa-civile", "16a", "16A", { tipo: "16A" }),
      variante("presa-civile", "con-usb", "Con USB", { tipo: "usb" }),
    ],
  }),

  famiglia({
    id: "interruttore-comando",
    nome: "Interruttore / comando",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("interruttore-comando", "unipolare", "Unipolare", { tipo: "unipolare" }),
      variante("interruttore-comando", "deviatore", "Deviatore", { tipo: "deviatore" }),
      variante("interruttore-comando", "invertitore", "Invertitore", { tipo: "invertitore" }),
      variante("interruttore-comando", "pulsante", "Pulsante", { tipo: "pulsante" }),
      variante("interruttore-comando", "dimmer", "Dimmer", { tipo: "dimmer" }),
    ],
  }),

  famiglia({
    id: "morsetti",
    nome: "Morsetti",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "tipo",
    varianti: [
      variante("morsetti", "a-leva-2-poli", "A leva 2 poli", { tipo: "leva-2" }),
      variante("morsetti", "a-leva-3-poli", "A leva 3 poli", { tipo: "leva-3" }),
      variante("morsetti", "a-leva-5-poli", "A leva 5 poli", { tipo: "leva-5" }),
      variante("morsetti", "a-vite", "A vite", { tipo: "vite" }),
    ],
  }),

  famiglia({
    id: "fascette",
    nome: "Fascette",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "dimensione",
    varianti: [
      variante("fascette", "100-mm", "100 mm", { dimensione: "100mm" }),
      variante("fascette", "200-mm", "200 mm", { dimensione: "200mm" }),
      variante("fascette", "300-mm", "300 mm", { dimensione: "300mm" }),
    ],
  }),

  famiglia({
    id: "presa-industriale",
    nome: "Presa industriale",
    categoria: CATEGORIA_MATERIALE.ELETTRICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("presa-industriale", "16a-3p-n-t", "16A 3P+N+T", { tipo: "16A-3P+N+T" }),
      variante("presa-industriale", "32a-3p-n-t", "32A 3P+N+T", { tipo: "32A-3P+N+T" }),
      variante("presa-industriale", "63a-3p-n-t", "63A 3P+N+T", { tipo: "63A-3P+N+T" }),
    ],
  }),

  famiglia({
    id: "centrale-allarme",
    nome: "Centrale allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("centrale-allarme", "filare", "Filare", { tipo: "filare" }),
      variante("centrale-allarme", "wireless", "Wireless", { tipo: "wireless" }),
      variante("centrale-allarme", "ibrida", "Ibrida", { tipo: "ibrida" }),
    ],
  }),

  famiglia({
    id: "sensore-allarme",
    nome: "Sensore allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("sensore-allarme", "pir-volumetrico", "PIR volumetrico", { tipo: "pir" }),
      variante("sensore-allarme", "contatto-magnetico", "Contatto magnetico", { tipo: "contatto" }),
      variante("sensore-allarme", "rivelatore-fumo", "Rivelatore fumo", { tipo: "fumata" }),
      variante("sensore-allarme", "rottura-vetro", "Rottura vetro", { tipo: "vetro" }),
      variante("sensore-allarme", "inondazione", "Inondazione", { tipo: "inondazione" }),
    ],
  }),

  famiglia({
    id: "sirena-allarme",
    nome: "Sirena allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("sirena-allarme", "interna", "Interna", { tipo: "interna" }),
      variante("sirena-allarme", "esterna", "Esterna", { tipo: "esterna" }),
    ],
  }),

  famiglia({
    id: "tastiera-allarme",
    nome: "Tastiera / telecomando allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("tastiera-allarme", "tastiera-lcd", "Tastiera LCD", { tipo: "lcd" }),
      variante("tastiera-allarme", "tastiera-touch", "Tastiera touch", { tipo: "touch" }),
      variante("tastiera-allarme", "telecomando", "Telecomando", { tipo: "telecomando" }),
    ],
  }),

  famiglia({
    id: "cavo-allarme",
    nome: "Cavo allarme",
    categoria: CATEGORIA_MATERIALE.ALLARME,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "composizione",
    varianti: [
      variante("cavo-allarme", "2x0-22", "2×0,22", { composizione: "2x0.22" }),
      variante("cavo-allarme", "4x0-22", "4×0,22", { composizione: "4x0.22" }),
      variante("cavo-allarme", "6x0-22", "6×0,22", { composizione: "6x0.22" }),
      variante("cavo-allarme", "8x0-22", "8×0,22", { composizione: "8x0.22" }),
    ],
  }),

  famiglia({
    id: "telecamera",
    nome: "Telecamera",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("telecamera", "dome-ip", "Dome IP", { tipo: "dome-ip" }),
      variante("telecamera", "bullet-ip", "Bullet IP", { tipo: "bullet-ip" }),
      variante("telecamera", "ptz", "PTZ", { tipo: "ptz" }),
      variante("telecamera", "wi-fi", "Wi-Fi", { tipo: "wifi" }),
    ],
  }),

  famiglia({
    id: "nvr-dvr",
    nome: "NVR / DVR",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "canali",
    varianti: [
      variante("nvr-dvr", "4-canali", "4 canali", { canali: 4 }),
      variante("nvr-dvr", "8-canali", "8 canali", { canali: 8 }),
      variante("nvr-dvr", "16-canali", "16 canali", { canali: 16 }),
    ],
  }),

  famiglia({
    id: "hdd-videosorveglianza",
    nome: "Hard disk videosorveglianza",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "capacita",
    varianti: [
      variante("hdd-videosorveglianza", "1-tb", "1 TB", { capacita: "1TB" }),
      variante("hdd-videosorveglianza", "2-tb", "2 TB", { capacita: "2TB" }),
      variante("hdd-videosorveglianza", "4-tb", "4 TB", { capacita: "4TB" }),
    ],
  }),

  famiglia({
    id: "cavo-rete-poe",
    nome: "Cavo rete / PoE",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "categoria",
    varianti: [
      variante("cavo-rete-poe", "cat-5e", "Cat.5e", { categoria: "cat5e" }),
      variante("cavo-rete-poe", "cat-6", "Cat.6", { categoria: "cat6" }),
      variante("cavo-rete-poe", "cat-6a", "Cat.6A", { categoria: "cat6a" }),
    ],
  }),

  famiglia({
    id: "switch-poe",
    nome: "Switch PoE",
    categoria: CATEGORIA_MATERIALE.VIDEOSORVEGLIANZA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "porte",
    varianti: [
      variante("switch-poe", "4-porte", "4 porte", { porte: 4 }),
      variante("switch-poe", "8-porte", "8 porte", { porte: 8 }),
      variante("switch-poe", "16-porte", "16 porte", { porte: 16 }),
    ],
  }),

  famiglia({
    id: "cavo-dati",
    nome: "Cavo dati",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "categoria",
    varianti: [
      variante("cavo-dati", "cat-5e-utp", "Cat.5e UTP", { categoria: "cat5e" }),
      variante("cavo-dati", "cat-6-utp", "Cat.6 UTP", { categoria: "cat6" }),
      variante("cavo-dati", "cat-6a", "Cat.6A", { categoria: "cat6a" }),
      variante("cavo-dati", "fibra-ottica", "Fibra ottica", { categoria: "fibra" }),
    ],
  }),

  famiglia({
    id: "keystone-frutto",
    nome: "Keystone / frutto dati",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("keystone-frutto", "rj45-cat-6", "RJ45 Cat.6", { tipo: "rj45-cat6" }),
      variante("keystone-frutto", "rj45-cat-6a", "RJ45 Cat.6A", { tipo: "rj45-cat6a" }),
      variante("keystone-frutto", "rj11", "RJ11", { tipo: "rj11" }),
      variante("keystone-frutto", "tv-sat", "TV/SAT", { tipo: "tv-sat" }),
    ],
  }),

  famiglia({
    id: "patch-panel",
    nome: "Patch panel",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "porte",
    varianti: [
      variante("patch-panel", "12-porte", "12 porte", { porte: 12 }),
      variante("patch-panel", "24-porte", "24 porte", { porte: 24 }),
      variante("patch-panel", "48-porte", "48 porte", { porte: 48 }),
    ],
  }),

  famiglia({
    id: "patch-cord",
    nome: "Patch cord",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "lunghezza",
    varianti: [
      variante("patch-cord", "0-5-m", "0,5 m", { lunghezza: "0.5m" }),
      variante("patch-cord", "1-m", "1 m", { lunghezza: "1m" }),
      variante("patch-cord", "2-m", "2 m", { lunghezza: "2m" }),
      variante("patch-cord", "5-m", "5 m", { lunghezza: "5m" }),
    ],
  }),

  famiglia({
    id: "armadio-rack",
    nome: "Armadio rack",
    categoria: CATEGORIA_MATERIALE.RETE_DATI,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "unita",
    varianti: [
      variante("armadio-rack", "6u", "6U", { unita: "6U" }),
      variante("armadio-rack", "9u", "9U", { unita: "9U" }),
      variante("armadio-rack", "12u", "12U", { unita: "12U" }),
      variante("armadio-rack", "22u", "22U", { unita: "22U" }),
    ],
  }),

  famiglia({
    id: "faretto-led",
    nome: "Faretto LED",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "potenza",
    varianti: [
      variante("faretto-led", "5-w", "5 W", { potenza: "5W" }),
      variante("faretto-led", "7-w", "7 W", { potenza: "7W" }),
      variante("faretto-led", "10-w", "10 W", { potenza: "10W" }),
      variante("faretto-led", "15-w", "15 W", { potenza: "15W" }),
    ],
  }),

  famiglia({
    id: "plafoniera",
    nome: "Plafoniera",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("plafoniera", "led-rotonda", "LED rotonda", { tipo: "led-rotonda" }),
      variante("plafoniera", "led-quadrata", "LED quadrata", { tipo: "led-quadra" }),
      variante("plafoniera", "stagna-ip65", "Stagna IP65", { tipo: "stagna" }),
      variante("plafoniera", "emergenza", "Emergenza", { tipo: "emergenza" }),
    ],
  }),

  famiglia({
    id: "striscia-led",
    nome: "Striscia LED",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "tipo",
    varianti: [
      variante("striscia-led", "24v-monocromatica", "24V monocromatica", { tipo: "24v-mono" }),
      variante("striscia-led", "24v-rgb", "24V RGB", { tipo: "24v-rgb" }),
      variante("striscia-led", "12v-monocromatica", "12V monocromatica", { tipo: "12v-mono" }),
    ],
  }),

  famiglia({
    id: "alimentatore-led",
    nome: "Alimentatore LED",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "potenza",
    varianti: [
      variante("alimentatore-led", "30-w", "30 W", { potenza: "30W" }),
      variante("alimentatore-led", "60-w", "60 W", { potenza: "60W" }),
      variante("alimentatore-led", "100-w", "100 W", { potenza: "100W" }),
      variante("alimentatore-led", "150-w", "150 W", { potenza: "150W" }),
    ],
  }),

  famiglia({
    id: "lampada-emergenza",
    nome: "Lampada di emergenza",
    categoria: CATEGORIA_MATERIALE.ILLUMINAZIONE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("lampada-emergenza", "se-sempre-accesa", "SE (sempre accesa)", { tipo: "sa" }),
      variante("lampada-emergenza", "nm-non-permanente", "NM (non permanente)", { tipo: "nm" }),
      variante("lampada-emergenza", "ip65", "IP65", { tipo: "ip65" }),
    ],
  }),

  famiglia({
    id: "attuatore-domotico",
    nome: "Attuatore domotico",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("attuatore-domotico", "rel-1-canale", "Relè 1 canale", { tipo: "rele-1ch" }),
      variante("attuatore-domotico", "rel-2-canali", "Relè 2 canali", { tipo: "rele-2ch" }),
      variante("attuatore-domotico", "tapparella", "Tapparella", { tipo: "tapparella" }),
      variante("attuatore-domotico", "dimmer", "Dimmer", { tipo: "dimmer" }),
    ],
  }),

  famiglia({
    id: "gateway-domotico",
    nome: "Gateway / hub domotico",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("gateway-domotico", "bus", "Bus", { tipo: "bus" }),
      variante("gateway-domotico", "wi-fi", "Wi-Fi", { tipo: "wifi" }),
      variante("gateway-domotico", "zigbee", "Zigbee", { tipo: "zigbee" }),
    ],
  }),

  famiglia({
    id: "termostato",
    nome: "Termostato / cronotermostato",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("termostato", "ambiente", "Ambiente", { tipo: "ambiente" }),
      variante("termostato", "wi-fi", "Wi-Fi", { tipo: "wifi" }),
      variante("termostato", "bus", "Bus", { tipo: "bus" }),
    ],
  }),

  famiglia({
    id: "cavo-bus",
    nome: "Cavo bus",
    categoria: CATEGORIA_MATERIALE.DOMOTICA,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "tipo",
    varianti: [
      variante("cavo-bus", "2x0-8", "2×0,8", { tipo: "2x0.8" }),
      variante("cavo-bus", "2x2x0-8-schermato", "2×2×0,8 schermato", { tipo: "2x2x0.8" }),
    ],
  }),

  famiglia({
    id: "cavo-solare",
    nome: "Cavo solare",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "sezione",
    varianti: [
      variante("cavo-solare", "4-mm", "4 mm²", { sezione: "4" }),
      variante("cavo-solare", "6-mm", "6 mm²", { sezione: "6" }),
      variante("cavo-solare", "10-mm", "10 mm²", { sezione: "10" }),
    ],
  }),

  famiglia({
    id: "connettore-mc4",
    nome: "Connettore MC4",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("connettore-mc4", "maschio", "Maschio", { tipo: "maschio" }),
      variante("connettore-mc4", "femmina", "Femmina", { tipo: "femmina" }),
      variante("connettore-mc4", "coppia-m-f", "Coppia M+F", { tipo: "coppia" }),
    ],
  }),

  famiglia({
    id: "quadro-stringa",
    nome: "Quadro di stringa",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "stringhe",
    varianti: [
      variante("quadro-stringa", "1-stringa", "1 stringa", { stringhe: 1 }),
      variante("quadro-stringa", "2-stringhe", "2 stringhe", { stringhe: 2 }),
      variante("quadro-stringa", "3-stringhe", "3 stringhe", { stringhe: 3 }),
    ],
  }),

  famiglia({
    id: "scaricatore-fotovoltaico",
    nome: "Scaricatore fotovoltaico",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("scaricatore-fotovoltaico", "dc", "DC", { tipo: "dc" }),
      variante("scaricatore-fotovoltaico", "ac", "AC", { tipo: "ac" }),
    ],
  }),

  famiglia({
    id: "interruttore-sezionatore-dc",
    nome: "Sezionatore DC",
    categoria: CATEGORIA_MATERIALE.FOTOVOLTAICO,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "calibro",
    varianti: [
      variante("interruttore-sezionatore-dc", "16a", "16A", { calibro: "16A" }),
      variante("interruttore-sezionatore-dc", "25a", "25A", { calibro: "25A" }),
      variante("interruttore-sezionatore-dc", "32a", "32A", { calibro: "32A" }),
    ],
  }),

  famiglia({
    id: "tasselli",
    nome: "Tasselli",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "dimensione",
    varianti: [
      variante("tasselli", "6", "Ø6", { dimensione: "6mm" }),
      variante("tasselli", "8", "Ø8", { dimensione: "8mm" }),
      variante("tasselli", "10", "Ø10", { dimensione: "10mm" }),
    ],
  }),

  famiglia({
    id: "viti",
    nome: "Viti",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.CONFEZIONE,
    attributoChiave: "tipo",
    varianti: [
      variante("viti", "autofilettanti", "Autofilettanti", { tipo: "autofilettanti" }),
      variante("viti", "truciolari", "Truciolari", { tipo: "truciolari" }),
      variante("viti", "metriche", "Metriche", { tipo: "metriche" }),
    ],
  }),

  famiglia({
    id: "nastro-isolante",
    nome: "Nastro isolante",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.ROTOLO,
    attributoChiave: "tipo",
    varianti: [
      variante("nastro-isolante", "pvc-nero", "PVC nero", { tipo: "pvc-nero" }),
      variante("nastro-isolante", "pvc-colori", "PVC colori", { tipo: "pvc-colori" }),
      variante("nastro-isolante", "autoagglomerante", "Autoagglomerante", { tipo: "autoagglomerante" }),
    ],
  }),

  famiglia({
    id: "guaina-termorestringente",
    nome: "Guaina termorestringente",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "diametro",
    varianti: [
      variante("guaina-termorestringente", "3", "Ø3", { diametro: "3" }),
      variante("guaina-termorestringente", "6", "Ø6", { diametro: "6" }),
      variante("guaina-termorestringente", "12", "Ø12", { diametro: "12" }),
    ],
  }),

  famiglia({
    id: "silicone-sigillante",
    nome: "Silicone / sigillante",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "tipo",
    varianti: [
      variante("silicone-sigillante", "neutro", "Neutro", { tipo: "neutro" }),
      variante("silicone-sigillante", "acetico", "Acetico", { tipo: "acetico" }),
      variante("silicone-sigillante", "resistente-al-fuoco", "Resistente al fuoco", { tipo: "fuoco" }),
    ],
  }),

  famiglia({
    id: "canalina-pavimento",
    nome: "Canalina a pavimento",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.M,
    attributoChiave: "dimensione",
    varianti: [
      variante("canalina-pavimento", "50-mm", "50 mm", { dimensione: "50" }),
      variante("canalina-pavimento", "75-mm", "75 mm", { dimensione: "75" }),
      variante("canalina-pavimento", "100-mm", "100 mm", { dimensione: "100" }),
    ],
  }),

  famiglia({
    id: "kit-fissaggio",
    nome: "Kit di fissaggio",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.KIT,
    attributoChiave: "tipo",
    varianti: [
      variante("kit-fissaggio", "per-quadro", "Per quadro", { tipo: "quadro" }),
      variante("kit-fissaggio", "per-canalina", "Per canalina", { tipo: "canalina" }),
      variante("kit-fissaggio", "per-telecamera", "Per telecamera", { tipo: "telecamera" }),
    ],
  }),

  famiglia({
    id: "pressacavo",
    nome: "Pressacavo",
    categoria: CATEGORIA_MATERIALE.GENERALE,
    unitaDefault: UNITA_MATERIALE.PZ,
    attributoChiave: "diametro",
    descrizione: "Pressacavo per quadri e cassette",
    varianti: [
      variante("pressacavo", "pg9", "PG9", { diametro: "PG9" }),
      variante("pressacavo", "pg11", "PG11", { diametro: "PG11" }),
      variante("pressacavo", "pg13-5", "PG13.5", { diametro: "PG13.5" }),
      variante("pressacavo", "pg16", "PG16", { diametro: "PG16" }),
    ],
  }),

]);
