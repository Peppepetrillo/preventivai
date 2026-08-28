/**
 * Cestino centralizzato UX-7.1 — soft delete su clienti / cantieri / preventivi.
 * Soft: solo deletedAt. Hard cantiere: eliminaCantiereConPulizia (UX-6.3).
 */

import {
  leggiClientiTutti,
  salvaClienti,
  trovaCliente,
} from "../../repositories/clientiRepository";
import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../repositories/cantieriRepository";
import {
  eliminaPreventivo as eliminaPreventivoHard,
  leggiPreventiviTutti,
  salvaPreventivi,
  trovaPreventivo,
} from "../../repositories/preventiviRepository";
import { eliminaCantiereConPulizia } from "../../features/cantieri/services/eliminaCantiereService";
import { APP_EVENTS, notificaEventoApp } from "../../app/events";
import {
  TIPI_CESTINO,
  FILTRI_CESTINO,
  creaDeletedAtIso,
  filtraRecordAttivi,
  filtraRecordCestinati,
  isRecordCestinato,
  senzaDeletedAt,
} from "./cestinoTypes";

function stessoId(a, b) {
  return String(a) === String(b);
}

function trovaInElenco(elenco, id) {
  return (elenco || []).find((item) => stessoId(item?.id, id)) || null;
}

function notificaAggiornamentoCestino() {
  notificaEventoApp(APP_EVENTS.cloudSyncAggiornata);
  notificaEventoApp(APP_EVENTS.preventiviAggiornati);
}

/**
 * @param {string} tipo
 * @param {string|number} id
 * @returns {{ success: boolean, record?: object, alreadyTrashed?: boolean, error?: string }}
 */
export function spostaNelCestino(tipo, id) {
  if (id == null || id === "") {
    return { success: false, error: "id_mancante" };
  }

  const deletedAt = creaDeletedAtIso();

  if (tipo === TIPI_CESTINO.cliente) {
    const tutti = leggiClientiTutti();
    const esistente = trovaInElenco(tutti, id);
    if (!esistente) return { success: false, error: "non_trovato" };
    if (isRecordCestinato(esistente)) {
      return { success: true, record: esistente, alreadyTrashed: true };
    }
    const prossimo = tutti.map((item) =>
      stessoId(item.id, id) ? { ...item, deletedAt } : item
    );
    salvaClienti(prossimo);
    notificaAggiornamentoCestino();
    return { success: true, record: trovaInElenco(prossimo, id) };
  }

  if (tipo === TIPI_CESTINO.cantiere) {
    const tutti = leggiCantieriTutti();
    const esistente = trovaInElenco(tutti, id);
    if (!esistente) return { success: false, error: "non_trovato" };
    if (isRecordCestinato(esistente)) {
      return { success: true, record: esistente, alreadyTrashed: true };
    }
    const prossimo = tutti.map((item) =>
      stessoId(item.id, id) ? { ...item, deletedAt } : item
    );
    salvaCantieri(prossimo);
    notificaAggiornamentoCestino();
    return { success: true, record: trovaInElenco(prossimo, id) };
  }

  if (tipo === TIPI_CESTINO.preventivo) {
    const tutti = leggiPreventiviTutti();
    const esistente = trovaInElenco(tutti, id);
    if (!esistente) return { success: false, error: "non_trovato" };
    if (isRecordCestinato(esistente)) {
      return { success: true, record: esistente, alreadyTrashed: true };
    }
    const prossimo = tutti.map((item) =>
      stessoId(item.id, id) ? { ...item, deletedAt } : item
    );
    salvaPreventivi(prossimo);
    notificaAggiornamentoCestino();
    return { success: true, record: trovaInElenco(prossimo, id) };
  }

  return { success: false, error: "tipo_non_supportato" };
}

/**
 * @param {string} tipo
 * @param {string|number} id
 * @returns {{ success: boolean, record?: object, alreadyActive?: boolean, error?: string }}
 */
export function ripristina(tipo, id) {
  if (id == null || id === "") {
    return { success: false, error: "id_mancante" };
  }

  if (tipo === TIPI_CESTINO.cliente) {
    const tutti = leggiClientiTutti();
    const esistente = trovaInElenco(tutti, id);
    if (!esistente) return { success: false, error: "non_trovato" };
    if (!isRecordCestinato(esistente)) {
      return { success: true, record: esistente, alreadyActive: true };
    }
    const prossimo = tutti.map((item) =>
      stessoId(item.id, id) ? senzaDeletedAt(item) : item
    );
    salvaClienti(prossimo);
    notificaAggiornamentoCestino();
    return { success: true, record: trovaInElenco(prossimo, id) };
  }

  if (tipo === TIPI_CESTINO.cantiere) {
    const tutti = leggiCantieriTutti();
    const esistente = trovaInElenco(tutti, id);
    if (!esistente) return { success: false, error: "non_trovato" };
    if (!isRecordCestinato(esistente)) {
      return { success: true, record: esistente, alreadyActive: true };
    }
    const prossimo = tutti.map((item) =>
      stessoId(item.id, id) ? senzaDeletedAt(item) : item
    );
    salvaCantieri(prossimo);
    notificaAggiornamentoCestino();
    return { success: true, record: trovaInElenco(prossimo, id) };
  }

  if (tipo === TIPI_CESTINO.preventivo) {
    const tutti = leggiPreventiviTutti();
    const esistente = trovaInElenco(tutti, id);
    if (!esistente) return { success: false, error: "non_trovato" };
    if (!isRecordCestinato(esistente)) {
      return { success: true, record: esistente, alreadyActive: true };
    }
    const prossimo = tutti.map((item) =>
      stessoId(item.id, id) ? senzaDeletedAt(item) : item
    );
    salvaPreventivi(prossimo);
    notificaAggiornamentoCestino();
    return { success: true, record: trovaInElenco(prossimo, id) };
  }

  return { success: false, error: "tipo_non_supportato" };
}

/**
 * @param {string} tipo
 * @param {string|number} id
 * @returns {{ success: boolean, alreadyAbsent?: boolean, error?: string }}
 */
export function eliminaDefinitivamente(tipo, id) {
  if (id == null || id === "") {
    return { success: false, error: "id_mancante" };
  }

  if (tipo === TIPI_CESTINO.cliente) {
    const tutti = leggiClientiTutti();
    const esistente = trovaInElenco(tutti, id);
    if (!esistente) return { success: true, alreadyAbsent: true };
    salvaClienti(tutti.filter((item) => !stessoId(item.id, id)));
    notificaAggiornamentoCestino();
    return { success: true };
  }

  if (tipo === TIPI_CESTINO.cantiere) {
    const tutti = leggiCantieriTutti();
    const esistente = trovaInElenco(tutti, id);
    if (!esistente) return { success: true, alreadyAbsent: true };
    const esito = eliminaCantiereConPulizia(esistente);
    if (esito?.success) notificaAggiornamentoCestino();
    return { success: Boolean(esito?.success), error: esito?.success ? undefined : "pulizia_fallita" };
  }

  if (tipo === TIPI_CESTINO.preventivo) {
    const esistente = trovaPreventivo(id, { includiCestinati: true });
    if (!esistente) return { success: true, alreadyAbsent: true };
    eliminaPreventivoHard(id);
    notificaAggiornamentoCestino();
    return { success: true };
  }

  return { success: false, error: "tipo_non_supportato" };
}

/**
 * @param {{ filtro?: string }=} opzioni
 * @returns {Array<{ tipo: string, id: string|number, nome: string, cliente: string, deletedAt: string, record: object }>}
 */
export function ottieniElementiCestinati(opzioni = {}) {
  const filtro = opzioni.filtro || FILTRI_CESTINO.tutti;
  /** @type {Array<{ tipo: string, id: string|number, nome: string, cliente: string, deletedAt: string, record: object }>} */
  const elementi = [];

  if (filtro === FILTRI_CESTINO.tutti || filtro === FILTRI_CESTINO.clienti) {
    for (const record of filtraRecordCestinati(leggiClientiTutti())) {
      elementi.push({
        tipo: TIPI_CESTINO.cliente,
        id: record.id,
        nome: String(record.nome || "Cliente").trim() || "Cliente",
        cliente: String(record.nome || "").trim(),
        deletedAt: String(record.deletedAt),
        record,
      });
    }
  }

  if (filtro === FILTRI_CESTINO.tutti || filtro === FILTRI_CESTINO.cantieri) {
    for (const record of filtraRecordCestinati(leggiCantieriTutti())) {
      elementi.push({
        tipo: TIPI_CESTINO.cantiere,
        id: record.id,
        nome: String(record.nome || "Cantiere").trim() || "Cantiere",
        cliente: String(record.cliente || "").trim(),
        deletedAt: String(record.deletedAt),
        record,
      });
    }
  }

  if (filtro === FILTRI_CESTINO.tutti || filtro === FILTRI_CESTINO.preventivi) {
    for (const record of filtraRecordCestinati(leggiPreventiviTutti())) {
      const numero = String(record.numero || "").trim();
      elementi.push({
        tipo: TIPI_CESTINO.preventivo,
        id: record.id,
        nome: numero || `Preventivo ${record.id}`,
        cliente: String(record.cliente || "").trim(),
        deletedAt: String(record.deletedAt),
        record,
      });
    }
  }

  return elementi.sort((a, b) => {
    const ta = Date.parse(a.deletedAt) || 0;
    const tb = Date.parse(b.deletedAt) || 0;
    return tb - ta;
  });
}

/**
 * @param {string|number} id
 * @returns {boolean}
 */
export function isClienteCestinato(id) {
  return isRecordCestinato(trovaCliente(id, { includiCestinati: true }));
}

/**
 * @param {string|number} id
 * @returns {boolean}
 */
export function isPreventivoCestinato(id) {
  return isRecordCestinato(trovaPreventivo(id, { includiCestinati: true }));
}

/**
 * @param {string|number} id
 * @returns {boolean}
 */
export function isCantiereCestinato(id) {
  const cantiere = trovaInElenco(leggiCantieriTutti(), id);
  return isRecordCestinato(cantiere);
}

export {
  TIPI_CESTINO,
  FILTRI_CESTINO,
  isRecordCestinato,
  filtraRecordAttivi,
  filtraRecordCestinati,
};
