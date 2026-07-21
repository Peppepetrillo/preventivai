import {
  calcolaTotali,
  creaProssimoNumeroPreventivo,
  normalizzaNumero,
} from "../../utils/preventivi";
import { normalizzaPreventivoIncasso } from "./incassiDomain";

export function creaLavorazioneDaVoce(voce) {
  return {
    id: `${voce.id ?? voce.nome}-${new Date().getTime()}`,
    nome: voce.nome,
    categoria: voce.categoria || "Lavorazioni",
    prezzo: normalizzaNumero(voce.prezzo),
    quantita: 1,
    unita: voce.unita || "cad",
  };
}

export function incrementaLavorazione(lavorazione) {
  return {
    ...lavorazione,
    quantita: normalizzaNumero(lavorazione.quantita) + 1,
  };
}

export function aggiornaCampoLavorazione(lavorazione, campo, valore) {
  return {
    ...lavorazione,
    [campo]:
      campo === "prezzo" || campo === "quantita"
        ? normalizzaNumero(valore)
        : valore,
  };
}

export function preparaDatiPreventivo({
  preventivo = {},
  cliente,
  stato = "Bozza",
  lavorazioni,
  sconto,
  iva,
  validita,
  pagamento,
  acconto = 0,
  note,
  tipoLavoro,
}) {
  return normalizzaPreventivoIncasso({
    ...preventivo,
    cliente,
    stato: stato || "Bozza",
    lavorazioni,
    sconto: normalizzaNumero(sconto),
    iva: normalizzaNumero(iva),
    validita: normalizzaNumero(validita, 30),
    pagamento: pagamento.trim(),
    acconto: normalizzaNumero(acconto),
    note,
    ...(tipoLavoro ? { tipoLavoro } : {}),
    ...calcolaTotali(lavorazioni, sconto, iva),
  });
}

export function creaPreventivo({
  archivio,
  cliente,
  lavorazioni,
  sconto,
  iva,
  validita,
  pagamento,
  acconto = 0,
  note,
  tipoLavoro,
}) {
  const id = new Date().getTime();

  return normalizzaPreventivoIncasso({
    id,
    numero: creaProssimoNumeroPreventivo(archivio),
    cliente,
    lavorazioni,
    sconto: normalizzaNumero(sconto),
    iva: normalizzaNumero(iva),
    validita: normalizzaNumero(validita, 30),
    pagamento: pagamento.trim(),
    acconto: normalizzaNumero(acconto),
    note,
    ...(tipoLavoro ? { tipoLavoro } : {}),
    stato: "Bozza",
    data: new Date().toLocaleDateString("it-IT"),
    ...calcolaTotali(lavorazioni, sconto, iva),
  });
}

export function duplicaPreventivo({
  archivio,
  datiPreventivo,
  cliente,
}) {
  return {
    ...datiPreventivo,
    id: new Date().getTime(),
    numero: creaProssimoNumeroPreventivo(archivio),
    cliente: `${cliente} - copia`,
    stato: "Bozza",
    data: new Date().toLocaleDateString("it-IT"),
  };
}
