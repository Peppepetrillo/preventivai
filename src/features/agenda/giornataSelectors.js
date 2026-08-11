import { formatEuro } from "../../utils/preventivi";
import {
  selezionaAttivitaGiorno,
  selezionaAttivitaUrgenti,
  selezionaTelefonateGiorno,
} from "../../domain/attivita/attivitaSelectors";
import { selezionaVociDaComprare } from "../../domain/listaSpesa/listaSpesaDomain";
import { calcolaOrePreviste } from "../lavori/lavoriDomain";
import {
  aggregaMaterialiGiorno,
  inizioGiornata,
  selezionaInterventiGiorno,
} from "./agendaSelectors";

/**
 * Unisce materiali da lavori del giorno + lista spesa dedicata.
 * Evita doppio conteggio quando la lista spesa è proiezione dello stesso
 * materiale già presente nei cantieri del giorno (stesso nome / ids).
 *
 * @param {ReturnType<typeof aggregaMaterialiGiorno>} materialiGiorno
 * @param {object[]} listaSpesa
 * @param {object[]} [lavoriGiorno]
 */
function unisciMaterialiDaComprare(
  materialiGiorno,
  listaSpesa = [],
  lavoriGiorno = []
) {
  const mappa = new Map();
  const lavoroIdsGiorno = new Set(
    (lavoriGiorno || []).map((l) => String(l.id))
  );

  const chiaviCoperte = new Set();

  for (const voce of materialiGiorno.mancanti || []) {
    const chiave = String(voce.nome).trim().toLowerCase();
    mappa.set(chiave, {
      nome: voce.nome,
      quantita: voce.quantita,
      unita: voce.unita || "cad",
      fonte: "lavoro",
    });
    chiaviCoperte.add(chiave);
    if (voce.varianteId) chiaviCoperte.add(`var:${voce.varianteId}`);
    if (voce.distintaVoceId) chiaviCoperte.add(`dv:${voce.distintaVoceId}`);
  }

  // Arricchisci chiavi dalle materiali grezze dei cantieri del giorno
  for (const lavoro of lavoriGiorno || []) {
    const materiali = lavoro.cantiere?.materiali || [];
    for (const mat of materiali) {
      if (!mat || mat.acquistato || !mat.nome) continue;
      if (mat.varianteId) chiaviCoperte.add(`var:${mat.varianteId}`);
      if (mat.distintaVoceId) chiaviCoperte.add(`dv:${mat.distintaVoceId}`);
      chiaviCoperte.add(String(mat.nome).trim().toLowerCase());
    }
  }

  for (const voce of selezionaVociDaComprare(listaSpesa)) {
    const nomeChiave = String(voce.nome).trim().toLowerCase();
    const giaNelGiorno =
      (voce.varianteId && chiaviCoperte.has(`var:${voce.varianteId}`)) ||
      (voce.distintaVoceId &&
        chiaviCoperte.has(`dv:${voce.distintaVoceId}`)) ||
      (lavoroIdsGiorno.has(String(voce.lavoroId || "")) &&
        chiaviCoperte.has(nomeChiave));

    // Proiezione già contata dai materiali cantiere del giorno → non sommare.
    if (giaNelGiorno && mappa.has(nomeChiave)) {
      continue;
    }

    if (mappa.has(nomeChiave)) {
      // Stesso nome ma non dalla stessa proiezione cantiere del giorno:
      // mantieni quantità già presente (preferisci lavoro) senza sommare cieco.
      if (mappa.get(nomeChiave).fonte === "lavoro") continue;
      const esistente = mappa.get(nomeChiave);
      esistente.quantita =
        (Number(esistente.quantita) || 0) + (Number(voce.quantita) || 0);
    } else {
      mappa.set(nomeChiave, {
        id: voce.id,
        nome: voce.nome,
        quantita: voce.quantita,
        unita: voce.unita || "cad",
        fonte: "lista",
      });
    }
  }

  return [...mappa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}

/**
 * Riepilogo operativo della giornata per Home e assistente agenda.
 * @param {object[]} cantieri
 * @param {Date} [oggi]
 * @param {{ attivita?: object[], listaSpesa?: object[] }} [extra]
 */
export function preparaRiepilogoGiornata(
  cantieri = [],
  oggi = new Date(),
  extra = {}
) {
  const giorno = inizioGiornata(oggi);
  const lavori = selezionaInterventiGiorno(cantieri, giorno, giorno);
  const materiali = aggregaMaterialiGiorno(lavori);
  const orePreviste = calcolaOrePreviste(lavori);
  const attivita = selezionaAttivitaGiorno(extra.attivita || [], giorno);
  const telefonate = selezionaTelefonateGiorno(extra.attivita || [], giorno);
  const attivitaUrgenti = selezionaAttivitaUrgenti(extra.attivita || [], giorno);
  const materialiDaComprare = unisciMaterialiDaComprare(
    materiali,
    extra.listaSpesa || [],
    lavori
  );

  const pagamentiPrevisti = lavori
    .filter((lavoro) => lavoro.saldo > 0)
    .map((lavoro) => ({
      id: lavoro.id,
      cliente: lavoro.cliente || lavoro.titolo,
      importo: lavoro.saldo,
      importoLabel: formatEuro(lavoro.saldo),
      link: lavoro.link,
    }));

  const lavoriUrgenti = lavori.filter(
    (lavoro) =>
      lavoro.urgente ||
      lavoro.stato === "in-corso" ||
      (lavoro.checklist.length > 0 &&
        lavoro.stato !== "completato" &&
        lavoro.stato !== "rimandato")
  );

  const urgenze = [
    ...lavoriUrgenti.map((l) => ({
      id: `lav-${l.id}`,
      titolo: l.cliente || l.titolo,
      tipo: "lavoro",
    })),
    ...attivitaUrgenti.map((a) => ({
      id: `att-${a.id}`,
      titolo: a.titolo,
      tipo: "attivita",
    })),
  ];

  return {
    giorno,
    lavori,
    attivita,
    totaleLavori: lavori.length,
    totaleAttivita: attivita.length,
    orePreviste,
    materialiDaComprare,
    materialiDaPortare: materiali.daPortare,
    telefonate,
    pagamentiPrevisti,
    totalePagamentiPrevisti: pagamentiPrevisti.reduce(
      (acc, voce) => acc + voce.importo,
      0
    ),
    lavoriUrgenti,
    urgenze,
    haContenuto:
      lavori.length > 0 ||
      attivita.length > 0 ||
      materialiDaComprare.length > 0 ||
      materiali.daPortare.length > 0 ||
      pagamentiPrevisti.length > 0 ||
      telefonate.length > 0,
  };
}

/**
 * Versione compatta per la card Home (limite lavori visibili).
 * @param {object[]} cantieri
 * @param {Date} [oggi]
 * @param {number} [limite]
 * @param {{ attivita?: object[], listaSpesa?: object[] }} [extra]
 */
export function preparaAnteprimaGiornata(
  cantieri = [],
  oggi = new Date(),
  limite = 5,
  extra = {}
) {
  const riepilogo = preparaRiepilogoGiornata(cantieri, oggi, extra);
  return {
    ...riepilogo,
    lavori: riepilogo.lavori.slice(0, limite),
    attivita: riepilogo.attivita.slice(0, limite),
  };
}
