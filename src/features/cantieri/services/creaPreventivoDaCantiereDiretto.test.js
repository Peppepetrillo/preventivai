import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import { STATI_PREVENTIVO } from "../../../domain/workflow";
import { spostaNelCestino, TIPI_CESTINO } from "../../../domain/cestino";
import { creaCantiere, ORIGINE_CANTIERE } from "../cantieriDomain";
import { creaPreventivoDaCantiereDiretto } from "./creaPreventivoDaCantiereDiretto";
import { leggiCantieri, salvaCantieri } from "../../../repositories/cantieriRepository";
import {
  leggiPreventivi,
  leggiPreventiviTutti,
  salvaNuovoPreventivo,
} from "../../../repositories/preventiviRepository";

describe("creaPreventivoDaCantiereDiretto", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea preventivo collegato allo stesso cantiere senza duplicarlo", () => {
    const cantiere = creaCantiere({
      nome: "Quadro Rossi",
      cliente: "Rossi",
      descrizioneIntervento: "Sostituzione quadro",
      totaleLavoro: 400,
    });
    salvaCantieri([cantiere]);

    const esito = creaPreventivoDaCantiereDiretto(cantiere.id);
    expect(esito.ok).toBe(true);
    expect(esito.creato).toBe(true);
    expect(esito.preventivo.cantiereId).toBe(cantiere.id);
    expect(esito.preventivo.stato).toBe(STATI_PREVENTIVO.CONVERTITO);
    expect(esito.preventivo.cliente).toBe("Rossi");
    expect(esito.preventivo.note).toMatch(/quadro/i);

    const cantieri = leggiCantieri();
    expect(cantieri).toHaveLength(1);
    expect(cantieri[0].id).toBe(cantiere.id);
    expect(cantieri[0].preventivoId).toBe(esito.preventivo.id);
    expect(cantieri[0].origine).toBe(ORIGINE_CANTIERE.DIRETTO);
    expect(leggiPreventivi()).toHaveLength(1);
  });

  it("è idempotente se il cantiere ha già un preventivo", () => {
    const cantiere = creaCantiere({ nome: "Lavoro", cliente: "Bianchi" });
    salvaCantieri([cantiere]);
    const primo = creaPreventivoDaCantiereDiretto(cantiere.id);
    const secondo = creaPreventivoDaCantiereDiretto(cantiere.id);

    expect(secondo.ok).toBe(true);
    expect(secondo.creato).toBe(false);
    expect(secondo.preventivo.id).toBe(primo.preventivo.id);
    expect(leggiPreventivi()).toHaveLength(1);
    expect(leggiCantieri()).toHaveLength(1);
  });

  it("rifiuta cantiere nel cestino", () => {
    const cantiere = creaCantiere({ nome: "X", cliente: "Y" });
    salvaCantieri([cantiere]);
    spostaNelCestino(TIPI_CESTINO.cantiere, cantiere.id);

    const esito = creaPreventivoDaCantiereDiretto(cantiere.id);
    expect(esito.ok).toBe(false);
    expect(esito.errore).toBe("cantiere_cestinato");
    expect(localStorage.getItem(STORAGE_KEYS.preventivi)).toBeNull();
  });

  it("non ricrea un preventivo se quello collegato è nel Cestino", () => {
    const cantiere = creaCantiere({
      nome: "Diretto",
      cliente: "Rossi",
    });
    salvaCantieri([cantiere]);
    const creato = creaPreventivoDaCantiereDiretto(cantiere.id);
    expect(creato.ok).toBe(true);
    spostaNelCestino(TIPI_CESTINO.preventivo, creato.preventivo.id);

    const esito = creaPreventivoDaCantiereDiretto(cantiere.id);
    expect(esito.ok).toBe(false);
    expect(esito.errore).toBe("preventivo_cestinato");
    expect(leggiPreventiviTutti()).toHaveLength(1);
    expect(String(leggiCantieri()[0]?.preventivoId || creato.cantiere.preventivoId)).toBe(
      String(creato.preventivo.id)
    );
  });
});
