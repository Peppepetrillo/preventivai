import { calcolaAvanzamentoChecklist } from "../cantieri/cantieriDomain";
import { ROUTES, routeCantiere, routePreventivo } from "../../app/routes";
import { preparaAnteprimaGiornata } from "../agenda/giornataSelectors";

export function selezionaCantieriAperti(cantieri = []) {
  return cantieri.filter((cantiere) => cantiere.stato !== "Completato");
}

export function selezionaPreventiviInAttesa(preventivi = []) {
  return preventivi.filter((preventivo) => preventivo.stato === "Inviato");
}

export function preparaCantieriOperativi(cantieri = []) {
  return selezionaCantieriAperti(cantieri).map((cantiere) => ({
    ...cantiere,
    avanzamento: calcolaAvanzamentoChecklist(cantiere.checklist || []),
  }));
}

/** @deprecated Preferisci creaFraseGiornata — mantenuto per compat test/UI legacy. */
export function creaMessaggioOperativo({ nome, cantieriAperti, preventiviInAttesa }) {
  const destinatario = nome ? ` ${nome}` : "";
  const cantieri =
    cantieriAperti === 1 ? "1 cantiere aperto" : `${cantieriAperti} cantieri aperti`;
  const preventivi =
    preventiviInAttesa === 1
      ? "1 preventivo in attesa"
      : `${preventiviInAttesa} preventivi in attesa`;

  return `Buongiorno${destinatario}. Hai ${cantieri} e ${preventivi}.`;
}

/**
 * Nome breve per saluto (prima parola di ditta / operatore).
 * Solo presentazione Home.
 */
export function nomeSalutoDaAzienda(datiAzienda = {}) {
  const grezzo = String(
    datiAzienda.nomeOperatore ||
      datiAzienda.referente ||
      datiAzienda.nomeDitta ||
      ""
  ).trim();
  if (!grezzo) return "";
  return grezzo.split(/\s+/)[0];
}

export function formattaDataGiornata(data = new Date()) {
  const testo = data.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return testo.charAt(0).toUpperCase() + testo.slice(1);
}

export function salutoOrario(data = new Date()) {
  const ora = data.getHours();
  if (ora < 12) return "Buongiorno";
  if (ora < 18) return "Buon pomeriggio";
  return "Buonasera";
}

/**
 * Interventi della giornata — delega alla logica agenda unificata.
 * @deprecated Preferisci preparaAnteprimaGiornata / preparaRiepilogoGiornata.
 */
export function selezionaInterventiOggi(cantieri = [], limite = 5) {
  return preparaAnteprimaGiornata(cantieri, new Date(), limite).lavori.map(
    (lavoro) => ({
      id: lavoro.id,
      cliente: lavoro.cliente || lavoro.titolo || "Cliente non indicato",
      indirizzo: lavoro.indirizzo || "",
      nome: lavoro.titolo || "",
      orario: lavoro.orario || "",
      tipoLavoro: lavoro.tipoLavoro,
      link: lavoro.link,
    })
  );
}

function haMaterialeDaComprare(cantieri = []) {
  return cantieri.some((cantiere) =>
    (cantiere.materiali || []).some((m) => m && !m.acquistato)
  );
}

function primoCantiereConMateriale(cantieri = []) {
  return cantieri.find((cantiere) =>
    (cantiere.materiali || []).some((m) => m && !m.acquistato)
  );
}

function preventiviDaInviare(preventivi = []) {
  return preventivi.filter((p) => p.stato === "Bozza");
}

function haPagamentoDaRegistrare(cantieri = []) {
  return cantieri.some((cantiere) => {
    if (cantiere.stato === "Completato") return false;
    const totale = Number(
      cantiere.preventivoOriginaleTotale ??
        cantiere.totale ??
        cantiere.extra?.totale ??
        0
    );
    const incassato = Number(
      cantiere.incassato ??
        cantiere.extra?.incassato ??
        cantiere.acconto ??
        cantiere.extra?.acconto ??
        0
    );
    return totale > 0 && totale - incassato > 0;
  });
}

/**
 * Alert operativi — massimo 3, solo utilità immediata.
 */
export function selezionaAttenzioni({
  cantieri = [],
  preventivi = [],
  massimo = 3,
} = {}) {
  const aperti = selezionaCantieriAperti(cantieri);
  const bozze = preventiviDaInviare(preventivi);
  const items = [];

  if (haMaterialeDaComprare(aperti)) {
    const target = primoCantiereConMateriale(aperti);
    items.push({
      id: "materiale",
      testo: "Materiale da comprare",
      link: target?.id ? routeCantiere(target.id) : ROUTES.cantieri,
    });
  }

  if (bozze.length > 0) {
    items.push({
      id: "preventivi-inviare",
      testo:
        bozze.length === 1
          ? "Preventivo da inviare"
          : `${bozze.length} preventivi da inviare`,
      link: bozze[0]?.id ? routePreventivo(bozze[0].id) : ROUTES.preventivi,
    });
  }

  if (haPagamentoDaRegistrare(aperti)) {
    items.push({
      id: "pagamenti",
      testo: "Pagamenti da registrare",
      link: ROUTES.incassi,
    });
  }

  if (aperti.length > 0) {
    items.push({
      id: "cantieri-aperti",
      testo:
        aperti.length === 1
          ? "Cantiere non completato"
          : `${aperti.length} cantieri non completati`,
      link: ROUTES.cantieri,
    });
  }

  return items.slice(0, massimo);
}

function timestampRecord(record = {}) {
  const grezzo =
    record.aggiornatoIl ||
    record.aggiornato ||
    record.data ||
    record.dataCreazione ||
    record.creatoIl ||
    "";
  const match = String(grezzo).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1])
    ).getTime();
  }
  const iso = Date.parse(String(grezzo));
  return Number.isFinite(iso) ? iso : 0;
}

/**
 * Ultimo lavoro toccato (preventivo o cantiere) per ripresa rapida.
 */
export function selezionaContinuaDoveHaiLasciato({
  cantieri = [],
  preventivi = [],
} = {}) {
  const candidati = [
    ...cantieri.map((item) => ({
      tipo: "cantiere",
      item,
      t: timestampRecord(item),
      etichetta: "Cantiere",
      titolo: item.cliente || item.nome || "Cantiere",
      dettaglio: item.nome || item.indirizzo || "",
      link: routeCantiere(item.id),
    })),
    ...preventivi.map((item) => ({
      tipo: "preventivo",
      item,
      t: timestampRecord(item),
      etichetta: "Preventivo",
      titolo: item.cliente || item.numero || "Preventivo",
      dettaglio: item.numero || item.stato || "",
      link: routePreventivo(item.id),
    })),
  ];

  if (candidati.length === 0) return null;

  candidati.sort((a, b) => {
    if (b.t !== a.t) return b.t - a.t;
    return String(b.item.id).localeCompare(String(a.item.id), "it");
  });

  const top = candidati[0];
  return {
    tipo: top.tipo,
    etichetta: top.etichetta,
    titolo: top.titolo,
    dettaglio: top.dettaglio,
    link: top.link,
  };
}

/**
 * Frase dinamica sotto la data — una sola, priorità operativa.
 */
export function creaFraseGiornata({
  interventiOggi = 0,
  preventiviInAttesa = 0,
  haSaldoDaIncassare = false,
} = {}) {
  if (interventiOggi > 0) {
    return interventiOggi === 1
      ? "Hai 1 intervento oggi."
      : `Hai ${interventiOggi} interventi oggi.`;
  }
  if (haSaldoDaIncassare) {
    return "Oggi hai un saldo da incassare.";
  }
  if (preventiviInAttesa > 0) {
    return preventiviInAttesa === 1
      ? "Ti aspetta 1 preventivo."
      : `Ti aspettano ${preventiviInAttesa} preventivi.`;
  }
  return "Giornata libera.";
}
