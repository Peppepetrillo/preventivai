import { normalizzaNumero } from "../../utils/preventivi";

export const KIT_LISTINO = [
  {
    id: "camera-standard",
    nome: "Camera standard",
    voci: [
      { voceId: "punto-luce", quantita: 2 },
      { voceId: "punto-presa", quantita: 4 },
      { voceId: "plafoniera", quantita: 1 },
    ],
  },
  {
    id: "bagno-standard",
    nome: "Bagno standard",
    voci: [
      { voceId: "punto-luce", quantita: 2 },
      { voceId: "punto-presa", quantita: 2 },
      { voceId: "linea-dedicata", quantita: 1 },
    ],
  },
  {
    id: "cucina-standard",
    nome: "Cucina standard",
    voci: [
      { voceId: "punto-luce", quantita: 2 },
      { voceId: "punto-presa", quantita: 6 },
      { voceId: "linea-dedicata", quantita: 3 },
    ],
  },
  {
    id: "quadro-elettrico",
    nome: "Quadro elettrico",
    voci: [
      { voceId: "quadro-elettrico", quantita: 1 },
      { voceId: "salvavita", quantita: 1 },
    ],
  },
  {
    id: "predisposizione-climatizzatore",
    nome: "Predisposizione climatizzatore",
    voci: [
      { voceId: "linea-dedicata", quantita: 1 },
      { voceId: "punto-presa", quantita: 1 },
      { voceId: "manodopera", quantita: 2 },
    ],
  },
];

function creaLavorazioneDaKit(voce, quantita) {
  return {
    id: `kit-${voce.id ?? voce.nome}`,
    nome: voce.nome,
    categoria: voce.categoria || "Lavorazioni",
    prezzo: normalizzaNumero(voce.prezzo),
    quantita: normalizzaNumero(quantita, 1),
    unita: voce.unita || "cad",
  };
}

export function trovaKitListino(kitId) {
  return KIT_LISTINO.find((kit) => kit.id === kitId) || null;
}

export function creaLavorazioniDaKit(kit, listino = []) {
  return kit.voci
    .map((voceKit) => {
      const voce = listino.find((item) => item.id === voceKit.voceId);
      return voce ? creaLavorazioneDaKit(voce, voceKit.quantita) : null;
    })
    .filter(Boolean);
}

export function aggiungiKitALavorazioni(lavorazioni = [], listino = [], kitId) {
  const kit = trovaKitListino(kitId);
  if (!kit) return lavorazioni;

  const lavorazioniKit = creaLavorazioniDaKit(kit, listino);

  return lavorazioniKit.reduce((lavorazioniAggiornate, lavorazioneKit) => {
    const esistente = lavorazioniAggiornate.find(
      (lavorazione) => lavorazione.nome === lavorazioneKit.nome
    );

    if (!esistente) {
      return [...lavorazioniAggiornate, lavorazioneKit];
    }

    return lavorazioniAggiornate.map((lavorazione) =>
      lavorazione.nome === lavorazioneKit.nome
        ? {
            ...lavorazione,
            quantita:
              normalizzaNumero(lavorazione.quantita) +
              normalizzaNumero(lavorazioneKit.quantita),
          }
        : lavorazione
    );
  }, lavorazioni);
}
