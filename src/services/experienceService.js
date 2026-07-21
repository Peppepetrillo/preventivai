import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../app/storageKeys";
import { creaRepositoryLocale } from "../repositories/localStorageRepository";

const repository = creaRepositoryLocale(
  STORAGE_KEYS.esperienze,
  STORAGE_FALLBACKS[STORAGE_KEYS.esperienze]
);

/**
 * Crea un record esperienza a partire da un cantiere completato.
 */
export function creaEsperienzaDaCantiere(cantiere) {
  if (!cantiere) return null;

  const checklist = cantiere.checklist || [];
  const checklistOriginale = (cantiere.lavorazioniOrigine || []).map(
    (_, i) => `${cantiere.preventivoId || cantiere.id}-check-${i}`
  );
  const idSetOriginali = new Set(checklistOriginale);

  const attivitaAggiunte = checklist
    .filter((voce) => !idSetOriginali.has(String(voce.id)))
    .map((voce) => voce.testo);

  const dataCreazione = cantiere.dataCreazione || cantiere.creatoIl;
  const dataCompletamento = cantiere.aggiornatoIl;
  const durataGiorni = calcolaDurataGiorni(dataCreazione, dataCompletamento);

  return {
    id: new Date().getTime(),
    cantiereId: cantiere.id,
    preventivoId: cantiere.preventivoId || null,
    cliente: cantiere.cliente || "",
    tipoLavoro: cantiere.tipoLavoro || cantiere.origine || "",
    checklistCompletata: checklist.map((voce) => ({
      testo: voce.testo,
      completata: voce.completata,
    })),
    attivitaAggiunte,
    materiali: (cantiere.materiali || []).map((m) => ({
      nome: m.nome,
      quantita: m.quantita,
      unita: m.unita,
    })),
    durataGiorni,
    note: String(cantiere.note || "").trim(),
    dataCreazione,
    dataCompletamento,
    creatoIl: new Date().toLocaleDateString("it-IT"),
  };
}

function calcolaDurataGiorni(dataInizio, dataFine) {
  if (!dataInizio || !dataFine) return null;

  const parse = (str) => {
    const parti = String(str).split("/");
    if (parti.length !== 3) return null;
    const [giorno, mese, anno] = parti.map(Number);
    return new Date(anno, mese - 1, giorno);
  };

  const inizio = parse(dataInizio);
  const fine = parse(dataFine);

  if (!inizio || !fine || isNaN(inizio) || isNaN(fine)) return null;

  const diff = Math.abs(fine - inizio);
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Salva una nuova esperienza nel registro locale.
 */
export function salvaEsperienza(esperienza) {
  if (!esperienza) return;
  const elenco = repository.leggi();
  repository.salva([esperienza, ...elenco]);
}

/**
 * Recupera tutte le esperienze salvate.
 */
export function recuperaEsperienze() {
  return repository.leggi();
}

/**
 * Registra automaticamente un'esperienza dalla chiusura di un cantiere.
 * Restituisce il record creato o null se non valido.
 */
export function registraEsperienzaCompletamento(cantiere) {
  const esperienza = creaEsperienzaDaCantiere(cantiere);
  if (!esperienza) return null;
  salvaEsperienza(esperienza);
  return esperienza;
}
