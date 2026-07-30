import { creaEventoCantiereCreato } from "../diario/events/cantiereCreato";
import {
  costruisciSchedulingDaForm,
  PRIORITA_LAVORO,
  STATO_PIANIFICAZIONE,
} from "./schedulingDomain";
import { TIPO_LAVORO, TIPI_LAVORO } from "./lavoriTypes";
import { etichettaTipoLavoro } from "./lavoriDomain";

/**
 * Crea un cantiere/lavoro già pianificato dall'Agenda.
 * @param {object} form
 */
export function creaLavoroPianificato(form = {}) {
  const scheduling = costruisciSchedulingDaForm(form);
  const tipoLavoro = TIPI_LAVORO.includes(form.tipoLavoro)
    ? form.tipoLavoro
    : TIPO_LAVORO.CANTIERE;
  const titolo = String(form.titolo || form.nome || "").trim();
  const cliente = String(form.cliente || "").trim();
  const oggi = new Date().toLocaleDateString("it-IT");

  const cantiere = {
    id: Date.now(),
    nome: titolo || etichettaTipoLavoro(tipoLavoro),
    cliente: cliente || titolo || "Cliente",
    indirizzo: String(form.indirizzo || "").trim(),
    stato:
      form.statoPianificazione === STATO_PIANIFICAZIONE.RIMANDATO
        ? "Rimandato"
        : "Da iniziare",
    statoPianificazione:
      form.statoPianificazione || STATO_PIANIFICAZIONE.PIANIFICATO,
    tipoLavoro,
    priorita: form.priorita || PRIORITA_LAVORO.MEDIA,
    note: String(form.note || "").trim(),
    checklist: [],
    materiali: [],
    foto: [],
    preventivoOriginaleTotale: 0,
    varianti: [],
    creatoIl: oggi,
    aggiornatoIl: oggi,
    origine: "agenda",
    ...scheduling,
  };

  return {
    ...cantiere,
    diario: [creaEventoCantiereCreato(cantiere)],
  };
}
