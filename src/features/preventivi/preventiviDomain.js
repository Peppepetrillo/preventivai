import {
  calcolaTotali,
  creaProssimoNumeroPreventivo,
  normalizzaNumero,
} from "../../utils/preventivi";
import { normalizzaPreventivoIncasso } from "./incassiDomain";
import { CATALOGO_BY_CHIAVE_LISTINO } from "../../domain/catalogo";

export function creaLavorazioneDaVoce(voce) {
  const listinoId = voce.id != null ? String(voce.id) : null;
  const catalogoId = listinoId
    ? CATALOGO_BY_CHIAVE_LISTINO[listinoId] || null
    : null;

  return {
    id: `${voce.id ?? voce.nome}-${new Date().getTime()}`,
    nome: voce.nome,
    categoria: voce.categoria || "Lavorazioni",
    prezzo: normalizzaNumero(voce.prezzo),
    quantita: 1,
    unita: voce.unita || "cad",
    listinoId,
    catalogoId,
    origineVoce: "listino",
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

function applicaClienteId(obj, clienteId, fallbackId) {
  const id = clienteId != null && clienteId !== "" ? clienteId : fallbackId;
  if (id != null && id !== "") {
    return { ...obj, clienteId: id };
  }
  return obj;
}

export function preparaDatiPreventivo({
  preventivo = {},
  cliente,
  clienteId,
  stato = "Bozza",
  lavorazioni,
  sconto,
  iva,
  validita,
  pagamento,
  acconto = 0,
  note,
  tipoLavoro,
  tipologiaImpianto,
}) {
  return normalizzaPreventivoIncasso(
    applicaClienteId(
      {
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
        ...(tipologiaImpianto ? { tipologiaImpianto } : {}),
        ...calcolaTotali(lavorazioni, sconto, iva),
      },
      clienteId,
      preventivo.clienteId
    )
  );
}

export function creaPreventivo({
  archivio,
  cliente,
  clienteId,
  lavorazioni,
  sconto,
  iva,
  validita,
  pagamento,
  acconto = 0,
  note,
  tipoLavoro,
  tipologiaImpianto,
}) {
  const id = new Date().getTime();

  return normalizzaPreventivoIncasso(
    applicaClienteId(
      {
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
        ...(tipologiaImpianto ? { tipologiaImpianto } : {}),
        stato: "Bozza",
        data: new Date().toLocaleDateString("it-IT"),
        ...calcolaTotali(lavorazioni, sconto, iva),
      },
      clienteId
    )
  );
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
