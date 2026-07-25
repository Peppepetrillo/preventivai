/**
 * Base Tecnica PreventivAI — schede di conoscenza spiegabili.
 *
 * Solo conoscenza tecnica. Nessun prezzo. Nessuna quantità.
 */

import {
  BASE_TECNICA_AFFIDABILITA,
  BASE_TECNICA_CATEGORIE,
  BASE_TECNICA_ORIGINE_TIPO,
  BASE_TECNICA_PRIORITA,
  creaSchedaTecnica,
} from "./baseTecnicaTypes";

const { ALTA, MEDIA } = BASE_TECNICA_PRIORITA;
const { NORMATIVA, BUONA_PRATICA, ESPERIENZA_PREVENTIVAI } =
  BASE_TECNICA_ORIGINE_TIPO;
const { ALTO, MEDIO } = BASE_TECNICA_AFFIDABILITA;
const CAT = BASE_TECNICA_CATEGORIE;

// ═══════════════════════════════════════════════════════════════════════════
// 1. CUCINA
// ═══════════════════════════════════════════════════════════════════════════

const CUCINA = [
  creaSchedaTecnica({
    id: "BT_CUCINA_INDUZIONE",
    categoria: CAT.CUCINA,
    titolo: "Linea dedicata induzione",
    descrizione:
      "Una cucina con piano a induzione richiede una linea dedicata dimensionata al carico continuo del piano.",
    condizioni: { cucina: "induzione" },
    catalogoIds: ["LINEA_INDUZIONE"],
    priorita: ALTA,
    noteTecniche:
      "Verificare potenza nominale del piano (tipicamente 7–11 kW). " +
      "Predisporre magnetotermico dedicato e sezione cavo adeguata.",
    origine: {
      tipo: NORMATIVA,
      riferimento: "CEI 64-8 — dimensionamento circuiti e protezione carichi",
    },
    motivazione:
      "Il piano a induzione è un carico elevato e continuo: senza linea dedicata si rischiano cadute di tensione, interventi intempestivi delle protezioni e non conformità.",
    verificheProfessionista: [
      "Potenza nominale del piano cottura (kW)",
      "Sezione cavo e tipo di protezione dedicata",
      "Disponibilità moduli nel quadro per il circuito induzione",
      "Eventuale necessità di trifase",
    ],
    livelloAffidabilita: ALTO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 0. PUNTI IMPIANTO (stima tipologica)
// ═══════════════════════════════════════════════════════════════════════════

const PUNTI_IMPIANTO = [
  creaSchedaTecnica({
    id: "BT_PUNTO_IMPIANTO",
    categoria: CAT.PUNTI_IMPIANTO,
    titolo: "Stima punti impianto da superficie",
    descrizione:
      "La stima iniziale dei punti impianto parte dalla superficie in mq come ordine di grandezza tipologico.",
    condizioni: { mqMin: 0 },
    catalogoIds: ["PUNTO_IMPIANTO"],
    priorita: MEDIA,
    noteTecniche:
      "È una stima di partenza: il professionista deve adattare in base a locali, livello impianto e richieste del cliente.",
    origine: {
      tipo: ESPERIENZA_PREVENTIVAI,
      riferimento: "Knowledge Engine — RULE_001 (1 punto ≈ 1 mq)",
    },
    motivazione:
      "In fase di preventivo rapido la superficie è il dato più stabile per stimare il numero di punti: fornisce un ordine di grandezza prima del rilievo dettagliato.",
    verificheProfessionista: [
      "Coerenza tra mq dichiarati e rilievo / planimetria",
      "Adeguamento punti per cucina, bagni e zone speciali",
      "Allineamento al livello impianto (base / standard / premium)",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. CLIMATIZZAZIONE
// ═══════════════════════════════════════════════════════════════════════════

const CLIMATIZZAZIONE = [
  creaSchedaTecnica({
    id: "BT_CLIMA_PREDISPOSIZIONE",
    categoria: CAT.CLIMATIZZAZIONE,
    titolo: "Predisposizione climatizzazione",
    descrizione:
      "Se è richiesta climatizzazione, l'impianto elettrico deve predisporre alimentazione e punti di comando/termostato.",
    condizioni: { climatizzazione: true },
    catalogoIds: ["CLIMA"],
    priorita: MEDIA,
    noteTecniche:
      "Coordinare con l'impiantista meccanico posizioni unità interne/esterne.",
    origine: {
      tipo: BUONA_PRATICA,
      riferimento: "Coordinamento impianto elettrico / termoidraulico",
    },
    motivazione:
      "Senza predisposizione elettrica il clima non può essere installato in modo ordinato: servono alimentazione, comando e percorsi cavo già previsti in fase di cantiere.",
    verificheProfessionista: [
      "Posizione unità interna/esterna concordata",
      "Necessità di linea dedicata per unità esterna",
      "Punto termostato / comando ambiente",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. CITOFONIA
// ═══════════════════════════════════════════════════════════════════════════

const CITOFONIA = [
  creaSchedaTecnica({
    id: "BT_CITOFONO",
    categoria: CAT.CITOFONIA,
    titolo: "Predisposizione citofono",
    descrizione:
      "Impianto citofonico audio: richiede predisposizione cavi e alimentazione postazione interna/esterna.",
    condizioni: { citofono: true },
    catalogoIds: ["CITOFONO"],
    priorita: MEDIA,
    noteTecniche:
      "Verificare tipologia bus/2 fili del sistema scelto. In condominio coordinare con centralino esistente.",
    origine: {
      tipo: BUONA_PRATICA,
    },
    motivazione:
      "Il citofono è un requisito di accesso: se richiesto in preventivo va predisposto il cablaggio, altrimenti si interviene a posteriori con opere murarie aggiuntive.",
    verificheProfessionista: [
      "Sistema citofonico previsto (marca/bus)",
      "Postazione interna e pulsantiera esterna",
      "Eventuale integrazione con cancello",
    ],
    livelloAffidabilita: MEDIO,
  }),
  creaSchedaTecnica({
    id: "BT_VIDEOCITOFONO",
    categoria: CAT.CITOFONIA,
    titolo: "Predisposizione videocitofono",
    descrizione:
      "Il videocitofono richiede predisposizione dedicata (segnale video + alimentazione), distinta dal solo citofono audio.",
    condizioni: { videocitofono: true },
    catalogoIds: ["VIDEOCITOFONO"],
    priorita: MEDIA,
    noteTecniche:
      "Preferire cablaggio strutturato o kit del produttore.",
    origine: {
      tipo: BUONA_PRATICA,
      riferimento: "Manuali produttori videocitofonia",
    },
    motivazione:
      "Il video richiede cablaggio e alimentazione specifici: trattarlo come citofono audio porta a mancanze di segnale o rifacimenti.",
    verificheProfessionista: [
      "Compatibilità con eventuale citofono esistente",
      "Percorso cavo video / PoE",
      "Alimentazione monitor interni",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 4. TV
// ═══════════════════════════════════════════════════════════════════════════

const TV = [
  creaSchedaTecnica({
    id: "BT_IMPIANTO_TV",
    categoria: CAT.TV,
    titolo: "Impianto TV",
    descrizione:
      "Se è richiesto impianto TV, prevedere punti presa TV e percorso verso antenna/centrale.",
    condizioni: { impiantoTv: true },
    catalogoIds: ["PUNTO_TV"],
    priorita: MEDIA,
    noteTecniche:
      "In multi-presa valutare partitore/amplificatore.",
    origine: {
      tipo: BUONA_PRATICA,
    },
    motivazione:
      "I punti TV vanno previsti in fase di tracciato: aggiungerli dopo l'intonaco costa e degrada la qualità del segnale.",
    verificheProfessionista: [
      "Numero e posizione dei punti TV",
      "Tipo di distribuzione (centrale, partitore, multiswitch)",
      "Necessità di montaggio antenna",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 5. RETE DATI
// ═══════════════════════════════════════════════════════════════════════════

const RETE_DATI = [
  creaSchedaTecnica({
    id: "BT_RETE_DATI_LAN",
    categoria: CAT.RETE_DATI,
    titolo: "Rete dati / LAN",
    descrizione:
      "Rete dati richiesta: predisporre punti Ethernet (e preferibilmente arrivo a rack/quadro dati).",
    condizioni: { reteDati: true },
    catalogoIds: ["PUNTO_DATI"],
    priorita: MEDIA,
    noteTecniche: "Cavo Cat.6 consigliato. Lasciare scorta in scatola.",
    origine: {
      tipo: BUONA_PRATICA,
      riferimento: "ISO/IEC 11801 — cablaggio strutturato (riferimento di buona pratica)",
    },
    motivazione:
      "La LAN cablata è infrastruttura: senza punti Ethernet predisposti si ricorre al Wi‑Fi o a canaline a vista, peggiorando affidabilità e aspetto.",
    verificheProfessionista: [
      "Numero punti dati per ambiente / postazione",
      "Arrivo a patch panel / router",
      "Categoria cavo (Cat.6 o superiore)",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 6. ALLARME
// ═══════════════════════════════════════════════════════════════════════════

const ALLARME = [
  creaSchedaTecnica({
    id: "BT_ALLARME",
    categoria: CAT.ALLARME,
    titolo: "Predisposizione impianto allarme",
    descrizione:
      "Allarme richiesto: predisporre cablaggi e alimentazione per centrale e periferici.",
    condizioni: { allarme: true },
    catalogoIds: ["ALLARME"],
    priorita: ALTA,
    noteTecniche:
      "Rispettare percorsi protetti e zone sensori.",
    origine: {
      tipo: BUONA_PRATICA,
      riferimento: "Linee guida predisposizione antifurto residenziale",
    },
    motivazione:
      "L'antifurto richiede percorsi cavo protetti e alimentazione dedicata: se non predisposti in cantiere, l'installazione successiva è invasiva e meno affidabile.",
    verificheProfessionista: [
      "Posizione centrale e sirena",
      "Zone sensori / contatti magnetici",
      "Linea dedicata e batteria tampone",
    ],
    livelloAffidabilita: ALTO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 7. VIDEOSORVEGLIANZA
// ═══════════════════════════════════════════════════════════════════════════

const VIDEOSORVEGLIANZA = [
  creaSchedaTecnica({
    id: "BT_VIDEOSORVEGLIANZA",
    categoria: CAT.VIDEOSORVEGLIANZA,
    titolo: "Videosorveglianza",
    descrizione:
      "Videosorveglianza richiesta: predisporre alimentazione e/o PoE e percorsi dati verso NVR/cloud.",
    condizioni: { videosorveglianza: true },
    catalogoIds: ["VIDEOSORVEGLIANZA"],
    priorita: MEDIA,
    noteTecniche: "Preferire PoE dove possibile. Documentare privacy.",
    origine: {
      tipo: BUONA_PRATICA,
      riferimento: "Privacy / cartellonistica videosorveglianza",
    },
    motivazione:
      "Le telecamere richiedono alimentazione o PoE e percorsi dati: senza predisposizione si finisce con cavi a vista o copertura incompleta.",
    verificheProfessionista: [
      "Numero e angoli di ripresa",
      "PoE vs alimentazione separata",
      "Posizione NVR / switch",
      "Obblighi informativi privacy",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 8. CANCELLO
// ═══════════════════════════════════════════════════════════════════════════

const CANCELLO = [
  creaSchedaTecnica({
    id: "BT_CANCELLO_AUTOMATICO",
    categoria: CAT.CANCELLO,
    titolo: "Cancello automatico",
    descrizione:
      "Automazione cancello: richiede predisposizione elettrica dedicata (alimentazione motore + eventuali fotocellule/pulsanti).",
    condizioni: { cancelloAutomatico: true },
    catalogoIds: ["CANCELLO"],
    priorita: MEDIA,
    noteTecniche:
      "Verificare potenza motore e presenza linea esterna protetta.",
    origine: {
      tipo: BUONA_PRATICA,
    },
    motivazione:
      "Il motore cancello e le sicurezze (fotocellule) necessitano di linea e tubazioni esterne: senza predisposizione l'automazione non è installabile in sicurezza.",
    verificheProfessionista: [
      "Tipo di cancello e potenza motore",
      "Percorso tubazioni verso pilastri",
      "Integrazione con citofono/apertura remota",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 9. FOTOVOLTAICO
// ═══════════════════════════════════════════════════════════════════════════

const FOTOVOLTAICO = [
  creaSchedaTecnica({
    id: "BT_FOTOVOLTAICO",
    categoria: CAT.FOTOVOLTAICO,
    titolo: "Predisposizione fotovoltaico",
    descrizione:
      "Predisposizione FV: tubazioni, canalizzazioni e spazi quadro per inverter/stringhe future.",
    condizioni: { predisposizioneFotovoltaico: true },
    catalogoIds: ["FOTOVOLTAICO"],
    priorita: MEDIA,
    noteTecniche: "Non sostituisce il progetto FV.",
    origine: {
      tipo: BUONA_PRATICA,
      riferimento: "Predisposizione civile per impianti FV residenziali",
    },
    motivazione:
      "Lasciare tubazioni e spazio quadro in fase di costruzione evita opere successive costose quando si installa il fotovoltaico.",
    verificheProfessionista: [
      "Percorso tetto → locale tecnico",
      "Spazio quadro per inverter / protezioni",
      "Eventuale contatore / scambio sul posto",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 10. COLONNINA RICARICA
// ═══════════════════════════════════════════════════════════════════════════

const COLONNINA = [
  creaSchedaTecnica({
    id: "BT_COLONNINA_RICARICA",
    categoria: CAT.COLONNINA_RICARICA,
    titolo: "Predisposizione colonnina ricarica",
    descrizione:
      "Colonnina EV: richiede linea dedicata e protezione adeguata dal quadro generale/garage.",
    condizioni: { predisposizioneColonnina: true },
    catalogoIds: ["RICARICA_AUTO"],
    priorita: ALTA,
    noteTecniche:
      "Dimensionare per almeno 7,4 kW monofase (o trifase se richiesto).",
    origine: {
      tipo: NORMATIVA,
      riferimento: "CEI / buone pratiche wallbox — linea dedicata e protezione",
    },
    motivazione:
      "La ricarica auto è un carico importante: richiede circuito dedicato e protezioni corrette; senza predisposizione non si può installare una wallbox a norma.",
    verificheProfessionista: [
      "Potenza wallbox desiderata (kW)",
      "Disponibilità potenza contrattuale",
      "Sezione cavo e differenziale dedicato",
      "Posizione di installazione (garage / posto auto)",
    ],
    livelloAffidabilita: ALTO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 11. DOMOTICA
// ═══════════════════════════════════════════════════════════════════════════

const DOMOTICA = [
  creaSchedaTecnica({
    id: "BT_DOMOTICA_BASE",
    categoria: CAT.DOMOTICA,
    titolo: "Impianto domotico base",
    descrizione:
      "Domotica: richiede almeno gateway, infrastruttura bus e alimentatore dedicati.",
    condizioni: { domotica: true },
    catalogoIds: ["GATEWAY", "BUS", "ALIMENTATORE"],
    priorita: ALTA,
    noteTecniche:
      "Seguire topologia del sistema (Living Now, KNX, ecc.).",
    origine: {
      tipo: ESPERIENZA_PREVENTIVAI,
      riferimento: "Pattern impianti domotici residenziali PreventivAI",
    },
    motivazione:
      "Senza gateway, bus e alimentatore l'impianto domotico non è avviabile: sono il nucleo minimo da predisporre quando si sceglie la domotica.",
    verificheProfessionista: [
      "Famiglia sistema (Living Now, KNX, altro)",
      "Topologia bus e alimentazione",
      "Posizione gateway e accesso rete",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// 12. QUADRI ELETTRICI
// ═══════════════════════════════════════════════════════════════════════════

const QUADRI = [
  creaSchedaTecnica({
    id: "BT_QUADRO_12_APPARTAMENTO",
    categoria: CAT.QUADRI_ELETTRICI,
    titolo: "Quadro 12 moduli — appartamento fino a 100 mq",
    descrizione:
      "Per appartamenti fino a 100 mq (compresi) è tipicamente adeguato un quadro 12 moduli, salvo extras ad alto carico.",
    condizioni: {
      tipoImmobile: "appartamento",
      mqMin: 0,
      mqMax: 100,
    },
    catalogoIds: ["QUADRO_12_MODULI"],
    priorita: ALTA,
    noteTecniche:
      "Con induzione, FV, colonnina o domotica estesa rivalutare moduli e spazi di riserva.",
    origine: {
      tipo: ESPERIENZA_PREVENTIVAI,
      riferimento: "Knowledge Engine — RULE_008 / esperienza di cantiere",
    },
    motivazione:
      "In appartamenti contenuti un quadro 12 moduli copre i circuiti tipici lasciando margine; sovradimensionare senza motivo aumenta costo senza beneficio.",
    verificheProfessionista: [
      "Elenco circuiti previsti",
      "Extras ad alto carico (induzione, wallbox, FV)",
      "Riserva moduli ≥ 20%",
    ],
    livelloAffidabilita: MEDIO,
  }),
  creaSchedaTecnica({
    id: "BT_QUADRO_24",
    categoria: CAT.QUADRI_ELETTRICI,
    titolo: "Quadro 24 moduli — oltre 100 mq",
    descrizione:
      "Oltre 100 mq si suggerisce un quadro elettrico 24 moduli per ospitare protezioni e circuiti aggiuntivi.",
    condizioni: { mqMin: 101, mqMax: 150 },
    catalogoIds: ["QUADRO_ELETTRICO"],
    priorita: ALTA,
    noteTecniche:
      "Lasciare almeno il 20% di moduli liberi. Meta tecnica: 24 moduli.",
    origine: {
      tipo: ESPERIENZA_PREVENTIVAI,
      riferimento: "Knowledge Engine — RULE_002",
    },
    motivazione:
      "Con superficie maggiore crescono i circuiti: un quadro 24 moduli riduce il rischio di saturazione e di rifacimenti del quadro.",
    verificheProfessionista: [
      "Conteggio protezioni necessarie",
      "Spazio per eventuali future linee",
      "Posizione quadro e accessibilità",
    ],
    livelloAffidabilita: MEDIO,
  }),
  creaSchedaTecnica({
    id: "BT_QUADRO_36",
    categoria: CAT.QUADRI_ELETTRICI,
    titolo: "Quadro 36 moduli — oltre 150 mq",
    descrizione:
      "Oltre 150 mq (ville, multi-livello, carico elevato) si suggerisce quadro 36 moduli.",
    condizioni: { mqMin: 151 },
    catalogoIds: ["QUADRO_ELETTRICO"],
    priorita: ALTA,
    noteTecniche:
      "In presenza di più livelli valutare distribuzione linee per piano. Meta: 36 moduli.",
    origine: {
      tipo: ESPERIENZA_PREVENTIVAI,
      riferimento: "Knowledge Engine — RULE_003",
    },
    motivazione:
      "Superfici ampie e impianti articolati richiedono più moduli: il 36 moduli è la stima tipica per evitare saturazione precoce del quadro.",
    verificheProfessionista: [
      "Numero livelli e circuiti per piano",
      "Carichi speciali (FV, EV, domotica)",
      "Eventuale quadro secondario",
    ],
    livelloAffidabilita: MEDIO,
  }),
  creaSchedaTecnica({
    id: "BT_QUADRO_DISTRIBUZIONE_LIVELLI",
    categoria: CAT.QUADRI_ELETTRICI,
    titolo: "Distribuzione su più livelli",
    descrizione:
      "Con due o più livelli è buona pratica prevedere distribuzione linee per piano / montanti dedicati.",
    condizioni: { livelliMin: 2 },
    catalogoIds: ["DISTRIBUZIONE_LINEE_PIANO"],
    priorita: MEDIA,
    noteTecniche:
      "Separare circuiti per piano facilita manutenzione e sezionamento.",
    origine: {
      tipo: BUONA_PRATICA,
      riferimento: "Knowledge Engine — RULE_006",
    },
    motivazione:
      "Su più piani la distribuzione dedicata migliora sezionamento, sicurezza e manutenzione rispetto a un unico fascio non strutturato.",
    verificheProfessionista: [
      "Numero piani e montanti",
      "Posizione quadri di piano (se previsti)",
      "Sezionamento e identificazione circuiti",
    ],
    livelloAffidabilita: MEDIO,
  }),
];

/** Registro completo Base Tecnica. */
export const BASE_TECNICA_SCHEDE = Object.freeze([
  ...PUNTI_IMPIANTO,
  ...CUCINA,
  ...CLIMATIZZAZIONE,
  ...CITOFONIA,
  ...TV,
  ...RETE_DATI,
  ...ALLARME,
  ...VIDEOSORVEGLIANZA,
  ...CANCELLO,
  ...FOTOVOLTAICO,
  ...COLONNINA,
  ...DOMOTICA,
  ...QUADRI,
]);

export const BASE_TECNICA_BY_ID = Object.freeze(
  Object.fromEntries(BASE_TECNICA_SCHEDE.map((s) => [s.id, s]))
);

export const BASE_TECNICA_SEZIONI = Object.freeze([
  {
    id: CAT.PUNTI_IMPIANTO,
    titolo: "Punti impianto",
    descrizione: "Stima tipologica dei punti a partire dalla superficie.",
  },
  {
    id: CAT.CUCINA,
    titolo: "Cucina",
    descrizione:
      "Carichi piano cottura e necessità di linee dedicate (induzione).",
  },
  {
    id: CAT.CLIMATIZZAZIONE,
    titolo: "Climatizzazione",
    descrizione: "Predisposizioni elettriche per clima e termostati.",
  },
  {
    id: CAT.CITOFONIA,
    titolo: "Citofonia",
    descrizione: "Citofono audio e videocitofono.",
  },
  {
    id: CAT.TV,
    titolo: "TV",
    descrizione: "Punti TV e percorsi antenna.",
  },
  {
    id: CAT.RETE_DATI,
    titolo: "Rete dati",
    descrizione: "LAN / Ethernet e cablaggio strutturato.",
  },
  {
    id: CAT.ALLARME,
    titolo: "Allarme",
    descrizione: "Predisposizione antifurto e centrale.",
  },
  {
    id: CAT.VIDEOSORVEGLIANZA,
    titolo: "Videosorveglianza",
    descrizione: "CCTV / IP cam e PoE.",
  },
  {
    id: CAT.CANCELLO,
    titolo: "Cancello",
    descrizione: "Automazione accessi e motore cancello.",
  },
  {
    id: CAT.FOTOVOLTAICO,
    titolo: "Fotovoltaico",
    descrizione: "Predisposizione impianto FV e spazi quadro.",
  },
  {
    id: CAT.COLONNINA_RICARICA,
    titolo: "Colonnina ricarica",
    descrizione: "Linea dedicata wallbox / EV charging.",
  },
  {
    id: CAT.DOMOTICA,
    titolo: "Domotica",
    descrizione: "Gateway, bus e alimentatori.",
  },
  {
    id: CAT.QUADRI_ELETTRICI,
    titolo: "Quadri elettrici",
    descrizione: "Dimensionamento moduli e distribuzione multi-livello.",
  },
]);
