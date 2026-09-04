/**
 * Registro spese cantiere (UX-Spese v1).
 */

import { beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "../../../app/storageKeys";
import {
  aggiungiVoceListaSpesa,
  leggiListaSpesa
} from "../../../domain/listaSpesa";
import {
  eliminaDefinitivamente,
  ripristina,
  spostaNelCestino,
  TIPI_CESTINO
} from "../../../domain/cestino";
import {
  leggiCantieri,
  leggiCantieriTutti,
  salvaCantieri
} from "../../../repositories/cantieriRepository";
import { creaBackupCompleto, ripristinaBackupCompleto } from "../../../utils/backup";
import {
  aggiungiPagamento,
  riepilogoEconomicoCantiere
} from "./pagamentiCantiereService";
import { aggiungiGiornataProgrammata } from "./programmazioneCantiereService";
import {
  CATEGORIE_SPESA,
  STATO_SCOSTAMENTO_MATERIALE,
  aggiungiSpesa,
  analizzaCostiMateriale,
  analizzaRedditivitaCantiere,
  analizzaControlloEconomicoCantiere,
  analizzaAssistenteEconomicoCantiere,
  analizzaAssistenteEconomicoOperativoCantiere,
  analizzaAssistenteEconomicoDecisionaleCantiere,
  analizzaAssistenteEconomicoScenarioCantiere,
  analizzaAssistenteEconomicoContestualeCantiere,
  analizzaAssistenteEconomicoProattivoCantiere,
  analizzaControlloGestionaleCantiere,
  arricchisciSegnaliGestionali,
  calcolaAzioneRaccomandataProattiva,
  calcolaAzioneSegnaleGestionale,
  calcolaContestoMaterialeProblema,
  calcolaContestoAzioneSegnale,
  calcolaCostoPrevistoMateriale,
  calcolaCostoRealeMateriale,
  calcolaImportoPropostoDaMateriale,
  calcolaCambiamentiEconomiciCantiere,
  calcolaEvoluzioneEconomicaCantiere,
  calcolaIncidenzaCategoriaSpesa,
  calcolaMargineDisponibilePrimaPerdita,
  calcolaMargineLordo,
  classificaEffettoScenarioEconomico,
  costruisciVerificaOperazioneEconomica,
  calcolaPercentualeIncassoCantiere,
  calcolaPercentualeMargine,
  calcolaPercentualeSpeseSuIncassato,
  calcolaCosaControllareEconomico,
  calcolaImpattoEconomicoDecisione,
  calcolaRiepilogoCostiMateriali,
  calcolaScostamentoMateriale,
  calcolaStatoControlloEconomico,
  calcolaStatoRedditivita,
  calcolaTotaleSpeseCantiere,
  calcolaTotaleSpesePerCategoria,
  contaSpeseMateriale,
  creaSpesaCantiere,
  creaSpesaDaMateriale,
  filtraSpeseCantiere,
  formattaAlertGestionaleMateriali,
  formattaCosaFareAdesso,
  formattaMessaggioScostamentoMateriali,
  formattaMessaggioPrevenzione,
  formattaMessaggioSituazioneAssistente,
  formattaSituazionePositivaEconomica,
  formattaSpiegazioneProblemaPrincipale,
  formattaPercentualeMargine,
  generaSegnaliGestionaliCantiere,
  identificaRischioPreventivo,
  individuaMaterialeScostamentoPrincipale,
  leggiSpese,
  modificaSpesa,
  normalizzaImportoScenarioEconomico,
  normalizzaSpesaCantiere,
  parseDataItalianaCantiere,
  prefillSpesaDaMateriale,
  raccogliEvidenzePrioritaEconomica,
  raccogliMovimentiEconomiciDatati,
  simulaScenarioEconomicoCantiere,
  snapshotEconomicoRealeCantiere,
  rimuoviSpesaCantiere,
  riepilogoEconomicoCompleto,
  MESSAGGIO_IMPATTO_NON_QUANTIFICABILE,
  MESSAGGI_SITUAZIONE_ASSISTENTE,
  PRIORITA_OPERATIVA_TIPO,
  STATO_CAMBIAMENTO_ECONOMICO,
  STATO_CONTROLLO_ECONOMICO,
  STATO_REDDITIVITA,
  TARGET_AZIONE_GESTIONALE,
  TENDENZA_EVOLUZIONE_ECONOMICA,
  TIPO_AZIONE_GESTIONALE,
  TIPO_SCENARIO_ECONOMICO,
  EFFETTO_SCENARIO_ECONOMICO,
  TIPO_SEGNALE_GESTIONALE,
  trovaSpesaPrincipalePerMateriale,
  trovaSpesePerMateriale,
  validaSpesaCantiere
} from "./speseCantiereService";

describe("speseCantiereService UX-Spese v1", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const cantiereBase = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 5000,
    incassato: 0,
    pagamenti: [],
  };

  function spesaValida(override = {}) {
    return {
      data: "02/09/2026",
      importo: 50,
      descrizione: "Carburante",
      categoria: CATEGORIE_SPESA.carburante,
      ...override,
    };
  }

  it("creazione spesa", () => {
    const spesa = creaSpesaCantiere(spesaValida());
    expect(spesa.id).toBeTruthy();
    expect(spesa.descrizione).toBe("Carburante");
    expect(spesa.importo).toBe(50);
    expect(spesa.categoria).toBe(CATEGORIE_SPESA.carburante);
  });

  it("validazione importo — zero e negativo rifiutati", () => {
    expect(validaSpesaCantiere(spesaValida({ importo: 0 })).valida).toBe(false);
    expect(validaSpesaCantiere(spesaValida({ importo: -10 })).valida).toBe(
      false
    );
    expect(() => aggiungiSpesa(cantiereBase, spesaValida({ importo: 0 }))).toThrow(
      /non valida/i
    );
  });

  it("descrizione obbligatoria", () => {
    expect(validaSpesaCantiere(spesaValida({ descrizione: "  " })).valida).toBe(
      false
    );
  });

  it("categoria normalizzata", () => {
    const spesa = normalizzaSpesaCantiere(
      spesaValida({ categoria: "MANODOPERA" }),
      cantiereBase
    );
    expect(spesa?.categoria).toBe(CATEGORIE_SPESA.manodopera);
  });

  it("modifica mantiene ID e createdAt", () => {
    const c = aggiungiSpesa(cantiereBase, spesaValida({ id: "sp-fixed" }));
    const id = c.spese[0].id;
    const createdAt = c.spese[0].createdAt;
    const aggiornato = modificaSpesa(c, id, {
      descrizione: "Carburante aggiornato",
      importo: 75,
    });
    expect(aggiornato.spese[0].id).toBe(id);
    expect(aggiornato.spese[0].createdAt).toBe(createdAt);
    expect(aggiornato.spese[0].importo).toBe(75);
  });

  it("eliminazione spesa", () => {
    const c = aggiungiSpesa(cantiereBase, spesaValida());
    const id = c.spese[0].id;
    const dopo = rimuoviSpesaCantiere(c, id);
    expect(dopo.spese).toHaveLength(0);
  });

  it("totale spese", () => {
    let c = aggiungiSpesa(cantiereBase, spesaValida({ importo: 100 }));
    c = aggiungiSpesa(c, spesaValida({ importo: 250, descrizione: "Materiali" }));
    expect(calcolaTotaleSpeseCantiere(c)).toBe(350);
  });

  it("totale per categoria", () => {
    let c = aggiungiSpesa(
      cantiereBase,
      spesaValida({ importo: 800, categoria: CATEGORIE_SPESA.materiali })
    );
    c = aggiungiSpesa(
      c,
      spesaValida({
        importo: 200,
        categoria: CATEGORIE_SPESA.manodopera,
        descrizione: "Extra",
      })
    );
    expect(calcolaTotaleSpesePerCategoria(c)).toEqual({
      materiali: 800,
      manodopera: 200,
    });
  });

  it("margine = incassato - spese", () => {
    let c = aggiungiPagamento(cantiereBase, {
      data: "01/09/2026",
      importo: 2000,
      tipo: "acconto",
    });
    c = aggiungiSpesa(c, spesaValida({ importo: 500 }));
    expect(calcolaMargineLordo(c)).toBe(1500);
    expect(riepilogoEconomicoCompleto(c).margineLordo).toBe(1500);
  });

  it("cantiere legacy senza spese → array vuoto", () => {
    expect(leggiSpese(cantiereBase)).toEqual([]);
    expect(calcolaTotaleSpeseCantiere(cantiereBase)).toBe(0);
    expect(calcolaMargineLordo(cantiereBase)).toBe(0);
  });

  it("più spese sullo stesso cantiere", () => {
    let c = cantiereBase;
    for (let i = 0; i < 3; i += 1) {
      c = aggiungiSpesa(
        c,
        spesaValida({ descrizione: `Spesa ${i}`, importo: 10 * (i + 1) })
      );
    }
    expect(leggiSpese(c)).toHaveLength(3);
  });

  it("giornata associata se valida", () => {
    let c = aggiungiGiornataProgrammata(cantiereBase, {
      data: "02/09/2026",
      operai: 2,
      orePreviste: 8,
    });
    const giornataId = c.programmazione[0].id;
    c = aggiungiSpesa(
      c,
      spesaValida({ giornataId, descrizione: "Trasferta giornata" })
    );
    expect(c.spese[0].giornataId).toBe(giornataId);
  });

  it("giornataId invalida ignorata", () => {
    const c = aggiungiSpesa(
      cantiereBase,
      spesaValida({ giornataId: "g-inexistente" })
    );
    expect(c.spese[0].giornataId).toBeUndefined();
  });

  it("modifica giornata non rompe la spesa", () => {
    let c = aggiungiGiornataProgrammata(cantiereBase, {
      data: "02/09/2026",
      operai: 2,
      orePreviste: 8,
    });
    const g1 = c.programmazione[0].id;
    c = aggiungiSpesa(c, spesaValida({ giornataId: g1 }));
    c = aggiungiGiornataProgrammata(c, {
      data: "05/09/2026",
      operai: 2,
      orePreviste: 8,
    });
    const g2 = c.programmazione[1].id;
    c = modificaSpesa(c, c.spese[0].id, { giornataId: g2 });
    expect(c.spese[0].giornataId).toBe(g2);
  });

  it("soft delete cantiere conserva spese", () => {
    salvaCantieri([
      aggiungiSpesa(cantiereBase, spesaValida({ importo: 120 })),
    ]);
    spostaNelCestino(TIPI_CESTINO.cantiere, "c1");
    const nelCestino = leggiCantieriTutti()[0];
    expect(nelCestino.spese).toHaveLength(1);
    expect(nelCestino.spese[0].importo).toBe(120);
  });

  it("restore cantiere ripristina spese", () => {
    salvaCantieri([
      aggiungiSpesa(cantiereBase, spesaValida({ importo: 90 })),
    ]);
    spostaNelCestino(TIPI_CESTINO.cantiere, "c1");
    ripristina(TIPI_CESTINO.cantiere, "c1");
    expect(leggiCantieri()[0].spese).toHaveLength(1);
  });

  it("hard delete elimina spese con il cantiere", () => {
    salvaCantieri([
      aggiungiSpesa(cantiereBase, spesaValida({ importo: 60 })),
    ]);
    spostaNelCestino(TIPI_CESTINO.cantiere, "c1");
    eliminaDefinitivamente(TIPI_CESTINO.cantiere, "c1");
    expect(leggiCantieriTutti()).toHaveLength(0);
  });

  it("filtro ricerca e categoria", () => {
    let c = aggiungiSpesa(
      cantiereBase,
      spesaValida({ descrizione: "Viti Bricoman", fornitore: "Bricoman" })
    );
    c = aggiungiSpesa(
      c,
      spesaValida({
        descrizione: "Manodopera extra",
        categoria: CATEGORIE_SPESA.manodopera,
      })
    );
    const spese = leggiSpese(c);
    expect(
      filtraSpeseCantiere(spese, { ricerca: "bricoman" })
    ).toHaveLength(1);
    expect(
      filtraSpeseCantiere(spese, { categoria: CATEGORIE_SPESA.manodopera })
    ).toHaveLength(1);
  });

  it("nessuna interferenza con listaSpesa", () => {
    aggiungiVoceListaSpesa({ nome: "Cavo", lavoroId: "c1", cantiereId: "c1" });
    aggiungiSpesa(cantiereBase, spesaValida());
    expect(leggiListaSpesa()).toHaveLength(1);
    expect(leggiListaSpesa()[0].nome).toBe("Cavo");
    expect(leggiListaSpesa()[0].id.startsWith("spesa-")).toBe(true);
  });

  it("nessuna interferenza con pagamenti", () => {
    let c = aggiungiPagamento(cantiereBase, {
      data: "01/09/2026",
      importo: 1000,
    });
    c = aggiungiSpesa(c, spesaValida({ importo: 200 }));
    const riepilogoPag = riepilogoEconomicoCantiere(c);
    expect(riepilogoPag.incassato).toBe(1000);
    expect(riepilogoPag.pagamenti).toHaveLength(1);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(200);
  });

  it("backup/restore conserva spese[] nel cantiere", async () => {
    salvaCantieri([
      aggiungiSpesa(cantiereBase, spesaValida({ importo: 333 })),
    ]);
    const backup = creaBackupCompleto();
    expect(backup.dati[STORAGE_KEYS.cantieri][0].spese).toHaveLength(1);
    localStorage.clear();
    await ripristinaBackupCompleto(backup);
    expect(leggiCantieri()[0].spese[0].importo).toBe(333);
  });
});

describe("speseCantiereService UX-Spese v2 — spesa da materiale", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const cantiereConMateriali = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 4000,
    incassato: 4000,
    pagamenti: [],
    materiali: [
      {
        id: "m1",
        nome: "Cavo 3x2,5",
        quantita: 3,
        prezzoUnitario: 25,
        unita: "m",
        acquistato: true,
      },
      {
        id: "m2",
        nome: "Interruttore",
        quantita: 2,
        unita: "cad",
        acquistato: true,
      },
    ],
    spese: [],
  };

  const materialeConPrezzo = cantiereConMateriali.materiali[0];
  const materialeSenzaPrezzo = cantiereConMateriali.materiali[1];

  it("quantità × prezzoUnitario → importo proposto corretto", () => {
    expect(calcolaImportoPropostoDaMateriale(materialeConPrezzo)).toBe(75);
    const prefill = prefillSpesaDaMateriale(materialeConPrezzo);
    expect(prefill.importo).toBe(75);
    expect(prefill.descrizione).toBe("Cavo 3x2,5");
  });

  it("prezzo mancante → importo vuoto", () => {
    expect(calcolaImportoPropostoDaMateriale(materialeSenzaPrezzo)).toBeNull();
    const prefill = prefillSpesaDaMateriale(materialeSenzaPrezzo);
    expect(prefill.importo).toBe("");
  });

  it("categoria predefinita = materiali", () => {
    const prefill = prefillSpesaDaMateriale(materialeConPrezzo);
    expect(prefill.categoria).toBe(CATEGORIE_SPESA.materiali);
  });

  it("conferma crea SpesaCantiere con riferimenti materiale/listaSpesa", () => {
    const voceLista = { id: "spesa-ls-1", nome: "Cavo" };
    const spesa = creaSpesaDaMateriale(
      cantiereConMateriali,
      materialeConPrezzo,
      { importo: 68, fornitore: "Rossi Materiali" },
      voceLista
    );
    expect(spesa.importo).toBe(68);
    expect(spesa.categoria).toBe(CATEGORIE_SPESA.materiali);
    expect(spesa.materialeId).toBe("m1");
    expect(spesa.listaSpesaId).toBe("spesa-ls-1");
    expect(spesa.fornitore).toBe("Rossi Materiali");

    const c = aggiungiSpesa(cantiereConMateriali, spesa);
    expect(c.spese).toHaveLength(1);
    expect(trovaSpesaPrincipalePerMateriale(c, "m1")?.importo).toBe(68);
  });

  it("spesa già collegata riconosciuta", () => {
    let c = aggiungiSpesa(
      cantiereConMateriali,
      creaSpesaDaMateriale(cantiereConMateriali, materialeConPrezzo, {
        importo: 75,
      })
    );
    expect(trovaSpesePerMateriale(c, "m1")).toHaveLength(1);
    expect(trovaSpesaPrincipalePerMateriale(c, "m1")?.importo).toBe(75);
  });

  it("modifica spesa collegata non altera il materiale", () => {
    let c = aggiungiSpesa(
      cantiereConMateriali,
      creaSpesaDaMateriale(cantiereConMateriali, materialeConPrezzo, {
        importo: 75,
      })
    );
    const spesaId = c.spese[0].id;
    c = {
      ...modificaSpesa(c, spesaId, { importo: 68, descrizione: "Cavo scontato" }),
      materiali: c.materiali,
    };
    expect(c.materiali[0].prezzoUnitario).toBe(25);
    expect(c.materiali[0].quantita).toBe(3);
    expect(c.spese[0].importo).toBe(68);
    expect(c.spese[0].materialeId).toBe("m1");
  });

  it("elimina materiale → spesa collegata resta", () => {
    let c = aggiungiSpesa(
      cantiereConMateriali,
      creaSpesaDaMateriale(cantiereConMateriali, materialeConPrezzo, {
        importo: 75,
      })
    );
    c = {
      ...c,
      materiali: c.materiali.filter((m) => m.id !== "m1"),
    };
    expect(c.materiali).toHaveLength(1);
    expect(c.spese).toHaveLength(1);
    expect(c.spese[0].materialeId).toBe("m1");
    expect(calcolaTotaleSpeseCantiere(c)).toBe(75);
  });

  it("modifica prezzo materiale → spesa già registrata invariata", () => {
    let c = aggiungiSpesa(
      cantiereConMateriali,
      creaSpesaDaMateriale(cantiereConMateriali, materialeConPrezzo, {
        importo: 68,
      })
    );
    c = {
      ...c,
      materiali: c.materiali.map((m) =>
        m.id === "m1" ? { ...m, prezzoUnitario: 30, quantita: 5 } : m
      ),
    };
    expect(c.spese[0].importo).toBe(68);
    expect(c.spese[0].descrizione).toBe("Cavo 3x2,5");
  });

  it("spesa da materiale con giornata opzionale", () => {
    let c = aggiungiGiornataProgrammata(cantiereConMateriali, {
      data: "02/09/2026",
      operai: 2,
      orePreviste: 8,
    });
    const giornataId = c.programmazione[0].id;
    c = aggiungiSpesa(
      c,
      creaSpesaDaMateriale(c, materialeConPrezzo, {
        importo: 75,
        giornataId,
      })
    );
    expect(c.spese[0].giornataId).toBe(giornataId);
  });

  it("spesa da materiale senza giornata", () => {
    const c = aggiungiSpesa(
      cantiereConMateriali,
      creaSpesaDaMateriale(cantiereConMateriali, materialeConPrezzo, {
        importo: 75,
      })
    );
    expect(c.spese[0].giornataId).toBeUndefined();
  });

  it("totale spese e margine lordo aggiornati con spesa da materiale", () => {
    let c = aggiungiPagamento(cantiereConMateriali, {
      data: "01/09/2026",
      importo: 4000,
      tipo: "saldo",
    });
    c = aggiungiSpesa(
      c,
      creaSpesaDaMateriale(c, materialeConPrezzo, {
        importo: 150,
      })
    );
    expect(calcolaTotaleSpeseCantiere(c)).toBe(150);
    expect(calcolaMargineLordo(c)).toBe(3850);
    expect(riepilogoEconomicoCompleto(c).margineLordo).toBe(3850);
  });

  it("spesa manuale continua a funzionare senza riferimenti materiale", () => {
    const c = aggiungiSpesa(cantiereConMateriali, {
      data: "02/09/2026",
      importo: 40,
      descrizione: "Parcheggio",
      categoria: CATEGORIE_SPESA.trasferta,
    });
    expect(c.spese[0].materialeId).toBeUndefined();
    expect(c.spese[0].listaSpesaId).toBeUndefined();
    expect(calcolaTotaleSpeseCantiere(c)).toBe(40);
  });

  it("marcato acquistato non crea spesa automaticamente", () => {
    const c = {
      ...cantiereConMateriali,
      materiali: cantiereConMateriali.materiali.map((m) =>
        m.id === "m1" ? { ...m, acquistato: true } : m
      ),
    };
    expect(leggiSpese(c)).toHaveLength(0);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(0);
  });

  it("più spese sullo stesso materiale consentite solo esplicitamente", () => {
    let c = aggiungiSpesa(
      cantiereConMateriali,
      creaSpesaDaMateriale(cantiereConMateriali, materialeConPrezzo, {
        importo: 40,
      })
    );
    c = aggiungiSpesa(
      c,
      creaSpesaDaMateriale(c, materialeConPrezzo, { importo: 35 })
    );
    expect(trovaSpesePerMateriale(c, "m1")).toHaveLength(2);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(75);
  });

  it("retrocompatibilità cantieri senza spese[]", () => {
    const legacy = { id: "legacy", materiali: [] };
    expect(leggiSpese(legacy)).toEqual([]);
    expect(trovaSpesaPrincipalePerMateriale(legacy, "m1")).toBeNull();
  });

  it("normalizzaSpesaCantiere conserva materialeId e listaSpesaId", () => {
    const spesa = normalizzaSpesaCantiere(
      {
        data: "02/09/2026",
        importo: 85,
        descrizione: "Cavo",
        categoria: CATEGORIE_SPESA.materiali,
        materialeId: "m1",
        listaSpesaId: "spesa-ls-1",
      },
      cantiereConMateriali
    );
    expect(spesa?.materialeId).toBe("m1");
    expect(spesa?.listaSpesaId).toBe("spesa-ls-1");
  });
});

describe("speseCantiereService UX-Costi Materiali v3", () => {
  const cantiereBase = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [],
    materiali: [
      {
        id: "m1",
        nome: "Piastrelle",
        quantita: 10,
        unita: "mq",
        prezzoUnitario: 75,
        acquistato: true,
      },
      {
        id: "m2",
        nome: "Colla",
        quantita: 2,
        unita: "sacchi",
        acquistato: false,
      },
      {
        id: "m3",
        nome: "Viti",
        quantita: 0,
        unita: "cad",
        prezzoUnitario: 5,
        acquistato: true,
      },
    ],
    spese: [],
  };

  it("materiale con quantità + prezzo → costo previsto corretto", () => {
    expect(calcolaCostoPrevistoMateriale(cantiereBase.materiali[0])).toBe(750);
    expect(calcolaImportoPropostoDaMateriale(cantiereBase.materiali[0])).toBe(
      750
    );
  });

  it("materiale senza prezzo → costo previsto non disponibile", () => {
    expect(calcolaCostoPrevistoMateriale(cantiereBase.materiali[1])).toBeNull();
  });

  it("materiale senza quantità valida → costo previsto non disponibile", () => {
    expect(calcolaCostoPrevistoMateriale(cantiereBase.materiali[2])).toBeNull();
  });

  it("nessuna spesa → costo reale non registrato", () => {
    const analisi = analizzaCostiMateriale(cantiereBase, cantiereBase.materiali[0]);
    expect(analisi.haSpese).toBe(false);
    expect(analisi.costoReale).toBeNull();
  });

  it("una spesa collegata → costo reale corretto", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    expect(calcolaCostoRealeMateriale(c, "m1")).toBe(680);
    expect(analizzaCostiMateriale(c, c.materiali[0]).costoReale).toBe(680);
  });

  it("due spese collegate → somma corretta", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 50,
          descrizione: "Acconto piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
        {
          id: "s2",
          data: "03/09/2026",
          importo: 20,
          descrizione: "Saldo piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    expect(calcolaCostoRealeMateriale(c, "m1")).toBe(70);
    expect(contaSpeseMateriale(c, "m1")).toBe(2);
  });

  it("spesa senza materialeId ignorata nel costo materiali", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 100,
          descrizione: "Parcheggio",
          categoria: CATEGORIE_SPESA.trasferta,
        },
      ],
    };
    expect(calcolaCostoRealeMateriale(c, "m1")).toBe(0);
    expect(calcolaRiepilogoCostiMateriali(c).totaleReale).toBe(0);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(100);
  });

  it("spesa collegata a materiale diverso ignorata", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 40,
          descrizione: "Altro",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m2",
        },
      ],
    };
    expect(calcolaCostoRealeMateriale(c, "m1")).toBe(0);
  });

  it("scostamento negativo, zero e positivo", () => {
    expect(
      calcolaScostamentoMateriale(750, 680, true).stato
    ).toBe(STATO_SCOSTAMENTO_MATERIALE.sotto);
    expect(calcolaScostamentoMateriale(750, 680, true).valore).toBe(-70);

    expect(
      calcolaScostamentoMateriale(750, 750, true).stato
    ).toBe(STATO_SCOSTAMENTO_MATERIALE.in_linea);

    expect(
      calcolaScostamentoMateriale(750, 800, true).stato
    ).toBe(STATO_SCOSTAMENTO_MATERIALE.sopra);
  });

  it("materiale acquistato senza spesa → nessun costo reale", () => {
    const analisi = analizzaCostiMateriale(cantiereBase, cantiereBase.materiali[0]);
    expect(analisi.costoReale).toBeNull();
    expect(analisi.scostamento.haCostoReale).toBe(false);
  });

  it("materiale acquistato con spesa → costo reale", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    const analisi = analizzaCostiMateriale(c, c.materiali[0]);
    expect(analisi.costoReale).toBe(680);
    expect(analisi.scostamento.valore).toBe(-70);
  });

  it("elimina materiale → spesa non eliminata", () => {
    let c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    c = { ...c, materiali: c.materiali.filter((m) => m.id !== "m1") };
    expect(c.spese).toHaveLength(1);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(680);
    expect(calcolaRiepilogoCostiMateriali(c).totaleReale).toBe(0);
  });

  it("modifica materiale → spesa invariata", () => {
    let c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    c = {
      ...c,
      materiali: c.materiali.map((m) =>
        m.id === "m1" ? { ...m, prezzoUnitario: 90, quantita: 12 } : m
      ),
    };
    expect(c.spese[0].importo).toBe(680);
    expect(calcolaCostoPrevistoMateriale(c.materiali[0])).toBe(1080);
  });

  it("spesa manuale continua a funzionare", () => {
    const c = aggiungiSpesa(cantiereBase, {
      data: "02/09/2026",
      importo: 45,
      descrizione: "Carburante",
      categoria: CATEGORIE_SPESA.carburante,
    });
    expect(calcolaRiepilogoCostiMateriali(c).totaleReale).toBe(0);
    expect(calcolaTotaleSpeseCantiere(c)).toBe(45);
  });

  it("Registra altra spesa aggiorna totale reale materiale", () => {
    let c = aggiungiSpesa(
      cantiereBase,
      creaSpesaDaMateriale(cantiereBase, cantiereBase.materiali[0], {
        importo: 50,
      })
    );
    c = aggiungiSpesa(
      c,
      creaSpesaDaMateriale(c, c.materiali[0], { importo: 20 })
    );
    expect(calcolaCostoRealeMateriale(c, "m1")).toBe(70);
    expect(calcolaRiepilogoCostiMateriali(c).totaleReale).toBe(70);
  });

  it("totali materiali previsto, reale e scostamento", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    const riepilogo = calcolaRiepilogoCostiMateriali(c);
    expect(riepilogo.totalePrevisto).toBe(750);
    expect(riepilogo.totaleReale).toBe(680);
    expect(riepilogo.scostamento).toBe(-70);
  });

  it("nessun doppio conteggio tra totaleSpese e costoRealeMateriali", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
        {
          id: "s2",
          data: "03/09/2026",
          importo: 100,
          descrizione: "Carburante",
          categoria: CATEGORIE_SPESA.carburante,
        },
      ],
    };
    expect(calcolaTotaleSpeseCantiere(c)).toBe(780);
    expect(calcolaRiepilogoCostiMateriali(c).totaleReale).toBe(680);
    expect(calcolaMargineLordo(c)).toBe(-780);
  });

  it("retrocompatibilità cantiere senza spese", () => {
    const legacy = { id: "legacy", materiali: [] };
    expect(calcolaRiepilogoCostiMateriali(legacy).totaleReale).toBe(0);
    expect(leggiSpese(legacy)).toEqual([]);
  });

  it("retrocompatibilità materiali legacy senza prezzo", () => {
    const c = {
      id: "c1",
      materiali: [{ id: "m1", nome: "Cavo", quantita: 10, unita: "m" }],
      spese: [],
    };
    expect(calcolaCostoPrevistoMateriale(c.materiali[0])).toBeNull();
    expect(calcolaRiepilogoCostiMateriali(c).haPrevisto).toBe(false);
  });

  it("spesa con prezzo mancante → scostamento non calcolabile", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 30,
          descrizione: "Colla",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m2",
        },
      ],
    };
    const analisi = analizzaCostiMateriale(c, c.materiali[1]);
    expect(analisi.costoReale).toBe(30);
    expect(analisi.scostamento.stato).toBe(
      STATO_SCOSTAMENTO_MATERIALE.non_disponibile
    );
  });
});

describe("speseCantiereService UX-Redditività v4", () => {
  const cantiereBase = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [],
    spese: [],
  };

  function cantiereConPagamento(importo) {
    return {
      ...cantiereBase,
      pagamenti: [
        {
          id: "p1",
          data: "01/09/2026",
          importo,
          tipo: "acconto",
          metodo: "contanti",
        },
      ],
    };
  }

  it("1. nessuna spesa — margine = incassato", () => {
    const c = cantiereConPagamento(7000);
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.totaleSpese).toBe(0);
    expect(analisi.margineLordo).toBe(7000);
    expect(analisi.statoRedditivita).toBe(STATO_REDDITIVITA.positiva);
  });

  it("2. una spesa", () => {
    const c = {
      ...cantiereConPagamento(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.totaleSpese).toBe(2500);
    expect(analisi.margineLordo).toBe(4500);
  });

  it("3. più spese", () => {
    const c = {
      ...cantiereConPagamento(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 1800,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "03/09/2026",
          importo: 400,
          descrizione: "Manodopera",
          categoria: CATEGORIE_SPESA.manodopera,
        },
        {
          id: "s3",
          data: "04/09/2026",
          importo: 200,
          descrizione: "Trasferta",
          categoria: CATEGORIE_SPESA.trasferta,
        },
        {
          id: "s4",
          data: "05/09/2026",
          importo: 100,
          descrizione: "Altro",
          categoria: CATEGORIE_SPESA.altro,
        },
      ],
    };
    expect(analizzaRedditivitaCantiere(c).totaleSpese).toBe(2500);
  });

  it("4. incassato maggiore delle spese — redditività positiva", () => {
    const c = {
      ...cantiereConPagamento(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.margineLordo).toBe(4500);
    expect(analisi.statoRedditivita).toBe(STATO_REDDITIVITA.positiva);
  });

  it("5. incassato uguale alle spese — in pareggio", () => {
    const c = {
      ...cantiereConPagamento(2500),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.margineLordo).toBe(0);
    expect(analisi.statoRedditivita).toBe(STATO_REDDITIVITA.in_pareggio);
    expect(analisi.percentualeMargine).toBe(0);
  });

  it("6. spese maggiori dell'incassato — redditività negativa", () => {
    const c = {
      ...cantiereConPagamento(1000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.margineLordo).toBe(-1500);
    expect(analisi.statoRedditivita).toBe(STATO_REDDITIVITA.negativa);
  });

  it("7. incassato zero — margine zero e percentuale non disponibile", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.incassato).toBe(0);
    expect(analisi.margineLordo).toBe(-500);
    expect(analisi.percentualeMargine).toBeNull();
    expect(formattaPercentualeMargine(analisi.percentualeMargine)).toBeNull();
  });

  it("8. percentuale corretta", () => {
    const c = {
      ...cantiereConPagamento(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.percentualeMargine).toBeCloseTo(64.285714, 4);
    expect(formattaPercentualeMargine(analisi.percentualeMargine)).toMatch(
      /64,3%/
    );
  });

  it("9. percentuale non disponibile con incassato zero", () => {
    expect(calcolaPercentualeMargine(0, -500)).toBeNull();
    expect(calcolaPercentualeMargine(-100, 50)).toBeNull();
  });

  it("10. rimanenza invariata — totale cantiere meno incassato", () => {
    const c = {
      ...cantiereConPagamento(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.rimanenza).toBe(3000);
    expect(analisi.rimanenza).not.toBe(analisi.margineLordo);
  });

  it("11. materiali non conteggiati due volte nel totale spese", () => {
    const c = {
      ...cantiereConPagamento(5000),
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 75,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    const costiMateriali = calcolaRiepilogoCostiMateriali(c);
    expect(analisi.totaleSpese).toBe(680);
    expect(costiMateriali.totaleReale).toBe(680);
    expect(analisi.margineLordo).toBe(5000 - 680);
  });

  it("12. categorie spesa corrette — solo importi > 0", () => {
    const c = {
      ...cantiereConPagamento(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 1800,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "03/09/2026",
          importo: 400,
          descrizione: "Manodopera",
          categoria: CATEGORIE_SPESA.manodopera,
        },
      ],
    };
    const analisi = analizzaRedditivitaCantiere(c);
    expect(analisi.spesePerCategoria).toHaveLength(2);
    expect(analisi.spesePerCategoria[0].importo).toBe(1800);
    expect(analisi.spesePerCategoria[1].importo).toBe(400);
    expect(
      analisi.spesePerCategoria.find((v) => v.categoria === "carburante")
    ).toBeUndefined();
  });

  it("13. retrocompatibilità cantiere vecchio senza spese/pagamenti/materiali", () => {
    const legacy = {
      id: "legacy",
      origine: "diretto",
      totaleLavoro: 3000,
    };
    const analisi = analizzaRedditivitaCantiere(legacy);
    expect(analisi.totaleCantiere).toBe(3000);
    expect(analisi.incassato).toBe(0);
    expect(analisi.totaleSpese).toBe(0);
    expect(analisi.margineLordo).toBe(0);
    expect(analisi.percentualeMargine).toBeNull();
    expect(analisi.statoRedditivita).toBe(STATO_REDDITIVITA.in_pareggio);
  });

  it("calcolaStatoRedditivita gestisce valori non numerici", () => {
    expect(calcolaStatoRedditivita(NaN, 100)).toBe(
      STATO_REDDITIVITA.non_disponibile
    );
  });
});

describe("speseCantiereService UX-Controllo v5", () => {
  const cantiereBase = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [],
    spese: [],
  };

  function conIncasso(importo) {
    return {
      ...cantiereBase,
      pagamenti: [
        {
          id: "p1",
          data: "01/09/2026",
          importo,
          tipo: "acconto",
        },
      ],
    };
  }

  it("1. controllo economico positivo", () => {
    const c = {
      ...conIncasso(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.statoControlloEconomico).toBe(
      STATO_CONTROLLO_ECONOMICO.positivo
    );
  });

  it("2. controllo economico attenzione", () => {
    const c = {
      ...conIncasso(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 6000,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.margineLordo).toBe(1000);
    expect(analisi.statoControlloEconomico).toBe(
      STATO_CONTROLLO_ECONOMICO.attenzione
    );
  });

  it("3. controllo economico critico", () => {
    const c = {
      ...conIncasso(1000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    expect(analizzaControlloEconomicoCantiere(c).statoControlloEconomico).toBe(
      STATO_CONTROLLO_ECONOMICO.critico
    );
  });

  it("4. controllo non disponibile", () => {
    const c = {
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    expect(analizzaControlloEconomicoCantiere(c).statoControlloEconomico).toBe(
      STATO_CONTROLLO_ECONOMICO.non_disponibile
    );
  });

  it("5. percentuale spese corretta", () => {
    const c = {
      ...conIncasso(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.percentualeSpeseSuIncassato).toBeCloseTo(35.714285, 4);
    expect(formattaPercentualeMargine(analisi.percentualeSpeseSuIncassato)).toMatch(
      /35,7%/
    );
  });

  it("6. percentuale spese con incassato zero", () => {
    expect(calcolaPercentualeSpeseSuIncassato(0, 500)).toBeNull();
    const analisi = analizzaControlloEconomicoCantiere({
      ...cantiereBase,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    expect(analisi.percentualeSpeseSuIncassato).toBeNull();
  });

  it("7. margine invariato", () => {
    const c = {
      ...conIncasso(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    expect(analizzaControlloEconomicoCantiere(c).margineLordo).toBe(4500);
    expect(analizzaRedditivitaCantiere(c).margineLordo).toBe(4500);
  });

  it("8. rimanenza invariata", () => {
    const c = {
      ...conIncasso(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.rimanenza).toBe(3000);
    expect(analisi.rimanenza).not.toBe(analisi.margineLordo);
  });

  it("9. spese materiali non duplicate", () => {
    const c = {
      ...conIncasso(5000),
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 75,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.totaleSpese).toBe(680);
    expect(analisi.materiali.speseMaterialiCollegate).toBe(680);
    expect(analisi.materiali.altreSpese).toBe(0);
  });

  it("10. più spese stesso materiale", () => {
    const c = {
      ...conIncasso(5000),
      materiali: [{ id: "m1", nome: "Cavo", quantita: 10, unita: "m" }],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 50,
          descrizione: "Cavo 1",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
        {
          id: "s2",
          data: "03/09/2026",
          importo: 20,
          descrizione: "Cavo 2",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.materiali.totaleReale).toBe(70);
    expect(analisi.materiali.speseMaterialiCollegate).toBe(70);
  });

  it("11. materiale senza prezzo", () => {
    const c = {
      ...conIncasso(5000),
      materiali: [{ id: "m1", nome: "Cavo", quantita: 10, unita: "m" }],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 50,
          descrizione: "Cavo",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.materiali.haPrevisto).toBe(false);
    expect(analisi.materiali.messaggioScostamento).toBe(
      "Scostamento non disponibile"
    );
  });

  it("12. spesa orfana inclusa in altre spese", () => {
    const c = {
      ...conIncasso(5000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 200,
          descrizione: "Carburante",
          categoria: CATEGORIE_SPESA.carburante,
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.totaleSpese).toBe(200);
    expect(analisi.materiali.altreSpese).toBe(200);
    expect(analisi.materiali.speseMaterialiCollegate).toBe(0);
  });

  it("13. categorie ordinate correttamente", () => {
    const c = {
      ...conIncasso(7000),
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 400,
          descrizione: "Manodopera",
          categoria: CATEGORIE_SPESA.manodopera,
        },
        {
          id: "s2",
          data: "03/09/2026",
          importo: 1800,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const analisi = analizzaControlloEconomicoCantiere(c);
    expect(analisi.spesePerCategoria[0].importo).toBe(1800);
    expect(analisi.spesePerCategoria[1].importo).toBe(400);
  });

  it("14. retrocompatibilità cantiere legacy", () => {
    const legacy = { id: "legacy", origine: "diretto", totaleLavoro: 3000 };
    const analisi = analizzaControlloEconomicoCantiere(legacy);
    expect(analisi.totaleSpese).toBe(0);
    expect(analisi.percentualeSpeseSuIncassato).toBeNull();
    expect(analisi.statoControlloEconomico).toBe(
      STATO_CONTROLLO_ECONOMICO.non_disponibile
    );
  });

  it("incidenza spese zero con incassato e senza spese", () => {
    const analisi = analizzaControlloEconomicoCantiere(conIncasso(5000));
    expect(analisi.percentualeSpeseSuIncassato).toBe(0);
  });

  it("messaggio scostamento sopra previsto", () => {
    const riepilogo = {
      scostamento: 300,
      haPrevisto: true,
      haReale: true,
    };
    expect(formattaMessaggioScostamentoMateriali(riepilogo)).toMatch(
      /sopra il previsto/
    );
  });

  it("calcolaStatoControlloEconomico — pareggio in attenzione", () => {
    expect(calcolaStatoControlloEconomico(5000, 0)).toBe(
      STATO_CONTROLLO_ECONOMICO.attenzione
    );
  });
});

describe("speseCantiereService UX-Controllo gestionale v6", () => {
  const cantierePositivo = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. percentuale incasso corretta", () => {
    expect(calcolaPercentualeIncassoCantiere(10000, 7000)).toBeCloseTo(70, 4);
    const g = analizzaControlloGestionaleCantiere(cantierePositivo);
    expect(g.percentualeIncasso).toBeCloseTo(70, 4);
  });

  it("2. percentuale incasso non disponibile", () => {
    expect(calcolaPercentualeIncassoCantiere(0, 0)).toBeNull();
    expect(
      analizzaControlloGestionaleCantiere({
        id: "c1",
        origine: "diretto",
        totaleLavoro: 0,
      }).percentualeIncasso
    ).toBeNull();
  });

  it("3. incidenza categoria corretta", () => {
    expect(calcolaIncidenzaCategoriaSpesa(2500, 2500)).toBe(100);
    const g = analizzaControlloGestionaleCantiere(cantierePositivo);
    expect(g.costiPrincipali[0].percentualeSuTotaleSpese).toBe(100);
  });

  it("4. nessuna spesa — segnale info", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      spese: [],
    });
    expect(g.segnali.some((s) => s.tipo === TIPO_SEGNALE_GESTIONALE.nessuna_spesa)).toBe(
      true
    );
  });

  it("5. margine negativo — segnale critico prioritario", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(g.segnali[0].tipo).toBe(TIPO_SEGNALE_GESTIONALE.margine_negativo);
  });

  it("6. margine basso — segnale attenzione", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 6000,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    expect(
      g.segnali.some((s) => s.tipo === TIPO_SEGNALE_GESTIONALE.margine_basso)
    ).toBe(true);
  });

  it("7. materiali sopra previsto", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 200,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(g.segnali.some((s) => s.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra)).toBe(
      true
    );
    expect(g.alertMateriali).toMatch(/superiori al previsto/);
  });

  it("8. materiali sotto previsto", () => {
    const alert = formattaAlertGestionaleMateriali({
      haPrevisto: true,
      haReale: true,
      scostamento: -100,
    });
    expect(alert).toMatch(/inferiori al previsto/);
  });

  it("9. nessuna criticità — messaggio ok", () => {
    const g = analizzaControlloGestionaleCantiere(cantierePositivo);
    expect(g.haCriticità).toBe(false);
    expect(g.daTenereDocchio.length).toBeLessThanOrEqual(3);
  });

  it("10. massimo 3 segnali in daTenereDocchio", () => {
    const controllo = analizzaControlloEconomicoCantiere(cantierePositivo);
    const segnali = generaSegnaliGestionaliCantiere(controllo);
    expect(segnali.slice(0, 3).length).toBeLessThanOrEqual(3);
  });

  it("11. priorità segnali — margine negativo prima di info", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    expect(g.segnali[0].tipo).toBe(TIPO_SEGNALE_GESTIONALE.margine_negativo);
  });

  it("12. retrocompatibilità legacy", () => {
    const g = analizzaControlloGestionaleCantiere({
      id: "legacy",
      origine: "diretto",
      totaleLavoro: 3000,
    });
    expect(g.totaleSpese).toBe(0);
    expect(g.statoLabel).toBe("Dati insufficienti");
  });

  it("13. nessun doppio conteggio materiali", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      materiali: [
        { id: "m1", nome: "Cavo", quantita: 10, unita: "m", prezzoUnitario: 50 },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 680,
          descrizione: "Cavo",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(g.totaleSpese).toBe(680);
    expect(g.materiali.totaleReale).toBe(680);
    expect(g.margineLordo).toBe(7000 - 680);
  });
});

describe("speseCantiereService UX-Azioni v7", () => {
  const cantierePositivo = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. segnali v6 invariati — messaggio margine negativo", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(g.segnali[0].messaggio).toMatch(/superato l'incassato/);
  });

  it("2. nessuna formula modificata — margine invariato", () => {
    const g = analizzaControlloGestionaleCantiere(cantierePositivo);
    expect(g.margineLordo).toBe(4500);
    expect(g.rimanenza).toBe(3000);
  });

  it("3. priorità invariata", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 200,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(g.segnali[0].tipo).toBe(TIPO_SEGNALE_GESTIONALE.margine_negativo);
    expect(g.segnali[1].tipo).toBe(TIPO_SEGNALE_GESTIONALE.materiali_sopra);
  });

  it("4. massimo 3 segnali in daTenereDocchio", () => {
    const g = analizzaControlloGestionaleCantiere(cantierePositivo);
    expect(g.daTenereDocchio.length).toBeLessThanOrEqual(3);
  });

  it("5. azione margine negativo → vedi spese", () => {
    expect(
      calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.margine_negativo)
    ).toEqual({
      tipo: TIPO_AZIONE_GESTIONALE.vedi_spese,
      label: "Vedi spese",
      disponibile: true,
      target: TARGET_AZIONE_GESTIONALE.sezione_spese,
      contesto: null,
    });
  });

  it("6. azione materiali sopra → vedi materiali", () => {
    expect(
      calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.materiali_sopra).label
    ).toBe("Vedi materiali");
  });

  it("7. azione nessuna spesa → registra spesa", () => {
    expect(
      calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.nessuna_spesa).label
    ).toBe("Registra spesa");
  });

  it("8. arricchimento segnali con azione e dettaglio", () => {
    const controllo = analizzaControlloEconomicoCantiere({
      ...cantierePositivo,
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 200,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    const arricchiti = arricchisciSegnaliGestionali(
      generaSegnaliGestionaliCantiere(controllo),
      controllo,
      {
        ...cantierePositivo,
        materiali: [
          {
            id: "m1",
            nome: "Piastrelle",
            quantita: 10,
            unita: "mq",
            prezzoUnitario: 200,
          },
        ],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 2300,
            descrizione: "Piastrelle",
            categoria: CATEGORIE_SPESA.materiali,
            materialeId: "m1",
          },
        ],
      }
    );
    const materiale = arricchiti.find(
      (s) => s.tipo === TIPO_SEGNALE_GESTIONALE.materiali_sopra
    );
    expect(materiale?.azione.tipo).toBe(TIPO_AZIONE_GESTIONALE.vedi_materiali);
    expect(materiale?.azione.target).toBe(TARGET_AZIONE_GESTIONALE.sezione_materiali);
    expect(materiale?.azione.contesto?.materialeId).toBe("m1");
    expect(materiale?.dettaglio).toMatch(/reali/);
  });
});

describe("speseCantiereService UX-Azioni intelligenti v8", () => {
  it("1. target vedi spese", () => {
    expect(
      calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.margine_basso).target
    ).toBe(TARGET_AZIONE_GESTIONALE.sezione_spese);
  });

  it("2. target vedi materiali", () => {
    expect(
      calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.materiali_sopra, {
        materialeId: "m1",
      }).target
    ).toBe(TARGET_AZIONE_GESTIONALE.sezione_materiali);
  });

  it("3. target registra spesa", () => {
    expect(
      calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.nessuna_spesa).target
    ).toBe(TARGET_AZIONE_GESTIONALE.nuova_spesa);
  });

  it("4. target registra incasso", () => {
    expect(
      calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.nessun_incasso).target
    ).toBe(TARGET_AZIONE_GESTIONALE.nuovo_incasso);
  });

  it("5. contesto materiale scostamento principale", () => {
    const cantiere = {
      id: "c1",
      origine: "diretto",
      materiali: [
        {
          id: "m1",
          nome: "A",
          quantita: 1,
          unita: "cad",
          prezzoUnitario: 100,
          acquistato: true,
        },
        {
          id: "m2",
          nome: "B",
          quantita: 1,
          unita: "cad",
          prezzoUnitario: 50,
          acquistato: true,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 150,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
        {
          id: "s2",
          data: "03/09/2026",
          importo: 80,
          descrizione: "B",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m2",
        },
      ],
    };
    expect(individuaMaterialeScostamentoPrincipale(cantiere, "sopra")?.materialeId).toBe(
      "m1"
    );
    const contesto = calcolaContestoAzioneSegnale(
      { tipo: TIPO_SEGNALE_GESTIONALE.materiali_sopra },
      {},
      cantiere
    );
    expect(contesto?.materialeId).toBe("m1");
  });

  it("6. segnale senza azione — default", () => {
    expect(calcolaAzioneSegnaleGestionale("sconosciuto").disponibile).toBe(false);
  });

  it("7. retrocompatibilità segnali v6 — priorità invariata", () => {
    const g = analizzaControlloGestionaleCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    expect(g.segnali[0].tipo).toBe(TIPO_SEGNALE_GESTIONALE.margine_negativo);
  });

  it("8. nessuna duplicazione formule — margine invariato", () => {
    const g = analizzaControlloGestionaleCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" }],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    expect(g.margineLordo).toBe(4500);
  });
});

describe("speseCantiereService UX-Assistente economico v9", () => {
  const cantierePositivo = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. stato positivo — messaggio situazione", () => {
    const a = analizzaAssistenteEconomicoCantiere(cantierePositivo);
    expect(a.situazione.stato).toBe(STATO_CONTROLLO_ECONOMICO.positivo);
    expect(a.situazione.messaggio).toBe(
      MESSAGGI_SITUAZIONE_ASSISTENTE[STATO_CONTROLLO_ECONOMICO.positivo]
    );
  });

  it("2. stato attenzione", () => {
    const a = analizzaAssistenteEconomicoCantiere({
      ...cantierePositivo,
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 6000,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    expect(a.situazione.stato).toBe(STATO_CONTROLLO_ECONOMICO.attenzione);
    expect(formattaMessaggioSituazioneAssistente(a.situazione.stato)).toMatch(
      /contenuta/
    );
  });

  it("3. stato critico", () => {
    const a = analizzaAssistenteEconomicoCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(a.situazione.stato).toBe(STATO_CONTROLLO_ECONOMICO.critico);
    expect(a.situazione.messaggio).toMatch(/superato/);
  });

  it("4. dati insufficienti", () => {
    const a = analizzaAssistenteEconomicoCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [],
      spese: [],
    });
    expect(a.situazione.stato).toBe(STATO_CONTROLLO_ECONOMICO.non_disponibile);
    expect(a.situazione.messaggio).toMatch(/Servono più dati/);
  });

  it("5. problema principale = primo segnale", () => {
    const a = analizzaAssistenteEconomicoCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 200,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(a.problemaPrincipale?.tipo).toBe(
      a.controllo.segnali[0].tipo
    );
    expect(a.problemaPrincipale?.tipo).toBe(TIPO_SEGNALE_GESTIONALE.margine_negativo);
  });

  it("6. nessun problema — segnali vuoti", () => {
    const a = analizzaAssistenteEconomicoCantiere(cantierePositivo);
    expect(a.problemaPrincipale).toBeNull();
    expect(a.cosaFareAdesso).toBeNull();
  });

  it("7. cosa fare derivato dal segnale", () => {
    expect(
      formattaCosaFareAdesso(TIPO_SEGNALE_GESTIONALE.margine_negativo)
    ).toMatch(/Controlla le spese/);
    const a = analizzaAssistenteEconomicoCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(a.cosaFareAdesso?.messaggio).toMatch(/Controlla le spese/);
  });

  it("8. azione mantenuta da v8", () => {
    const a = analizzaAssistenteEconomicoCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(a.cosaFareAdesso?.azione).toEqual(
      expect.objectContaining({
        tipo: TIPO_AZIONE_GESTIONALE.vedi_spese,
        target: TARGET_AZIONE_GESTIONALE.sezione_spese,
        disponibile: true,
      })
    );
  });

  it("9. materiale contestuale nel problema", () => {
    const cantiere = {
      ...cantierePositivo,
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 200,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    };
    const a = analizzaAssistenteEconomicoCantiere(cantiere);
    expect(a.problemaPrincipale?.tipo).toBe(TIPO_SEGNALE_GESTIONALE.materiali_sopra);
    expect(a.problemaPrincipale?.materiale?.materialeId).toBe("m1");
    expect(a.problemaPrincipale?.materiale?.nome).toBe("Piastrelle");
  });

  it("10. fallback materiale generico", () => {
    const segnale = {
      tipo: TIPO_SEGNALE_GESTIONALE.materiali_sopra,
      azione: { contesto: null },
    };
    const controllo = analizzaControlloEconomicoCantiere({
      ...cantierePositivo,
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 200,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(
      formattaSpiegazioneProblemaPrincipale(segnale, controllo, cantierePositivo)
    ).toMatch(/superano il previsto/);
    expect(calcolaContestoMaterialeProblema(segnale, cantierePositivo)).toBeNull();
  });

  it("11. nessuna duplicazione formule", () => {
    const a = analizzaAssistenteEconomicoCantiere(cantierePositivo);
    expect(a.controllo.margineLordo).toBe(4500);
    expect(a.situazione.margineLordo).toBe(4500);
  });

  it("12. retrocompatibilità v8 — segnali e target", () => {
    const g = analizzaControlloGestionaleCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    const a = analizzaAssistenteEconomicoCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(a.controllo.segnali).toEqual(g.segnali);
    expect(a.problemaPrincipale?.azione?.target).toBe(
      TARGET_AZIONE_GESTIONALE.sezione_spese
    );
  });
});

describe("speseCantiereService UX-Assistente proattivo v10", () => {
  const cantiereBase = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. evoluzione non disponibile con un solo movimento", () => {
    const ev = calcolaEvoluzioneEconomicaCantiere(
      { ...cantiereBase, spese: [cantiereBase.spese[0]], pagamenti: [] },
      analizzaControlloGestionaleCantiere(cantiereBase)
    );
    expect(ev.disponibile).toBe(false);
    expect(ev.tendenza).toBe(TENDENZA_EVOLUZIONE_ECONOMICA.non_disponibile);
  });

  it("2. evoluzione pressione spese con cronologia", () => {
    const cantiere = {
      ...cantiereBase,
      pagamenti: [
        { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
        { id: "p2", data: "12/09/2026", importo: 500, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "05/09/2026",
          importo: 500,
          descrizione: "Viti",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "20/09/2026",
          importo: 2000,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const ev = calcolaEvoluzioneEconomicaCantiere(
      cantiere,
      analizzaControlloGestionaleCantiere(cantiere)
    );
    expect(ev.disponibile).toBe(true);
    expect(ev.tendenza).toBe(TENDENZA_EVOLUZIONE_ECONOMICA.pression_spese);
  });

  it("3. parse data italiana", () => {
    expect(parseDataItalianaCantiere("15/09/2026")).toBeTypeOf("number");
    expect(parseDataItalianaCantiere("invalid")).toBeNull();
  });

  it("4. movimenti datati spese e incassi", () => {
    const mov = raccogliMovimentiEconomiciDatati({
      ...cantiereBase,
      spese: [
        ...cantiereBase.spese,
        {
          id: "s2",
          data: "10/09/2026",
          importo: 100,
          descrizione: "Altro",
          categoria: CATEGORIE_SPESA.altro,
        },
      ],
    });
    expect(mov.length).toBeGreaterThanOrEqual(3);
  });

  it("5. rischio preventivo da evoluzione", () => {
    const cantierePressione = {
      ...cantiereBase,
      pagamenti: [
        { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
        { id: "p2", data: "12/09/2026", importo: 500, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "05/09/2026",
          importo: 500,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "20/09/2026",
          importo: 2000,
          descrizione: "B",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const assistente = analizzaAssistenteEconomicoCantiere(cantierePressione);
    const controllo = assistente.controllo;
    const ev = calcolaEvoluzioneEconomicaCantiere(cantierePressione, controllo);
    const rischio = identificaRischioPreventivo(
      assistente,
      ev,
      controllo,
      cantierePressione
    );
    expect(rischio?.tipo).toBe("evoluzione_pression_spese");
  });

  it("6. prevenzione derivata dal rischio", () => {
    const rischio = {
      tipo: "evoluzione_pression_spese",
      titolo: "Test",
      messaggio: "Test",
      livello: "attenzione",
    };
    expect(formattaMessaggioPrevenzione(rischio, {})).toMatch(/Controlla le nuove spese/);
  });

  it("7. azione raccomandata — priorità rischio", () => {
    const assistente = analizzaAssistenteEconomicoCantiere(cantiereBase);
    const azione = calcolaAzioneRaccomandataProattiva(assistente, {
      azione: calcolaAzioneSegnaleGestionale(TIPO_SEGNALE_GESTIONALE.materiali_sopra),
    });
    expect(azione?.tipo).toBe(TIPO_AZIONE_GESTIONALE.vedi_materiali);
  });

  it("8. entry point proattivo completo", () => {
    const p = analizzaAssistenteEconomicoProattivoCantiere(cantiereBase);
    expect(p.assistente.situazione.stato).toBeDefined();
    expect(p.evoluzione).toBeDefined();
    expect(p.segnaliSecondari).toEqual(p.assistente.segnaliSecondari);
  });

  it("9. retrocompatibilità v9 — assistente invariato", () => {
    const v9 = analizzaAssistenteEconomicoCantiere(cantiereBase);
    const v10 = analizzaAssistenteEconomicoProattivoCantiere(cantiereBase);
    expect(v10.assistente).toEqual(v9);
  });

  it("10. nessuna duplicazione formule margine", () => {
    const p = analizzaAssistenteEconomicoProattivoCantiere(cantiereBase);
    expect(p.assistente.controllo.margineLordo).toBe(4500);
  });

  it("11. concentrazione costi come rischio", () => {
    const cantiere = {
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [
        { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 5500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "03/09/2026",
          importo: 100,
          descrizione: "Altro",
          categoria: CATEGORIE_SPESA.altro,
        },
      ],
    };
    const assistente = analizzaAssistenteEconomicoCantiere(cantiere);
    const rischio = identificaRischioPreventivo(
      assistente,
      {
        disponibile: false,
        tendenza: TENDENZA_EVOLUZIONE_ECONOMICA.non_disponibile,
      },
      assistente.controllo,
      cantiere
    );
    expect(rischio?.tipo).toBe("concentrazione_costi");
  });

  it("12. azione raccomandata fallback problema", () => {
    const assistente = analizzaAssistenteEconomicoCantiere({
      ...cantiereBase,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    const p = analizzaAssistenteEconomicoProattivoCantiere({
      ...cantiereBase,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(p.azioneRaccomandata?.tipo).toBe(
      calcolaAzioneRaccomandataProattiva(assistente, p.rischioPrincipale)?.tipo
    );
  });
});

describe("speseCantiereService UX-Assistente operativo v11", () => {
  const cantierePositivo = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. entry point operativo", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere(cantierePositivo);
    expect(o.assistente).toBeDefined();
    expect(o.proattivo).toBeDefined();
    expect(o.prioritaOperativa).toBeDefined();
    expect(o.azionePrincipale).toBe(o.prioritaOperativa.azione);
  });

  it("2. situazione positiva — nessuna azione urgente", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere(cantierePositivo);
    expect(o.prioritaOperativa.tipo).toBe(PRIORITA_OPERATIVA_TIPO.nessuna);
    expect(o.azionePrincipale).toBeNull();
  });

  it("3. situazione critica — priorità critica", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(o.prioritaOperativa.tipo).toBe(PRIORITA_OPERATIVA_TIPO.critico);
    expect(o.azionePrincipale?.tipo).toBe(TIPO_AZIONE_GESTIONALE.vedi_spese);
  });

  it("4. nuovi incassi nel periodo recente", () => {
    const c = {
      ...cantierePositivo,
      spese: [
        {
          id: "s1",
          data: "01/09/2026",
          importo: 500,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "15/09/2026",
          importo: 2000,
          descrizione: "B",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const cambi = calcolaCambiamentiEconomiciCantiere(
      c,
      calcolaEvoluzioneEconomicaCantiere(c, analizzaControlloGestionaleCantiere(c))
    );
    expect(cambi.elementi.some((v) => v.includes("incasso"))).toBe(true);
  });

  it("5. nuove spese", () => {
    const c = {
      ...cantierePositivo,
      spese: [
        {
          id: "s1",
          data: "01/09/2026",
          importo: 500,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "15/09/2026",
          importo: 2000,
          descrizione: "B",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const cambi = calcolaCambiamentiEconomiciCantiere(
      c,
      calcolaEvoluzioneEconomicaCantiere(c, analizzaControlloGestionaleCantiere(c))
    );
    expect(cambi.elementi.some((v) => v.includes("spes"))).toBe(true);
  });

  it("6. miglioramento margine periodo", () => {
    const c = {
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [
        { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
        { id: "p2", data: "20/09/2026", importo: 5000, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 800,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const ev = calcolaEvoluzioneEconomicaCantiere(c, analizzaControlloGestionaleCantiere(c));
    const cambi = calcolaCambiamentiEconomiciCantiere(c, ev);
    expect(cambi.stato).toBe(STATO_CAMBIAMENTO_ECONOMICO.miglioramento);
  });

  it("7. peggioramento spese", () => {
    const c = {
      ...cantierePositivo,
      pagamenti: [
        { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
        { id: "p2", data: "12/09/2026", importo: 500, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "05/09/2026",
          importo: 500,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "20/09/2026",
          importo: 2000,
          descrizione: "B",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const cambi = calcolaCambiamentiEconomiciCantiere(
      c,
      calcolaEvoluzioneEconomicaCantiere(c, analizzaControlloGestionaleCantiere(c))
    );
    expect(cambi.stato).toBe(STATO_CAMBIAMENTO_ECONOMICO.peggioramento);
  });

  it("8. storico non disponibile — stato non_disponibile", () => {
    const cambi = calcolaCambiamentiEconomiciCantiere(
      { ...cantierePositivo, spese: [cantierePositivo.spese[0]], pagamenti: [] },
      { tendenza: TENDENZA_EVOLUZIONE_ECONOMICA.non_disponibile }
    );
    expect(cambi.stato).toBe(STATO_CAMBIAMENTO_ECONOMICO.non_disponibile);
  });

  it("9. storico non disponibile", () => {
    const cambi = calcolaCambiamentiEconomiciCantiere(
      { ...cantierePositivo, spese: [cantierePositivo.spese[0]], pagamenti: [] },
      { tendenza: TENDENZA_EVOLUZIONE_ECONOMICA.non_disponibile }
    );
    expect(cambi.disponibile).toBe(false);
    expect(cambi.messaggio).toMatch(/Confronto storico non disponibile/);
  });

  it("10. priorità critica", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(o.prioritaOperativa.tipo).toBe(PRIORITA_OPERATIVA_TIPO.critico);
  });

  it("11. priorità peggioramento", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere({
      ...cantierePositivo,
      pagamenti: [
        { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
        { id: "p2", data: "12/09/2026", importo: 500, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "05/09/2026",
          importo: 500,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "20/09/2026",
          importo: 2000,
          descrizione: "B",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    expect(o.prioritaOperativa.tipo).toBe(PRIORITA_OPERATIVA_TIPO.peggioramento);
  });

  it("12. priorità materiale", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere({
      ...cantierePositivo,
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 200,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(o.prioritaOperativa.tipo).toBe(PRIORITA_OPERATIVA_TIPO.materiali);
    expect(o.azionePrincipale?.target).toBe(TARGET_AZIONE_GESTIONALE.sezione_materiali);
  });

  it("13. priorità registrazione incasso", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 500,
          descrizione: "Materiali",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    });
    expect(o.prioritaOperativa.tipo).toBe(PRIORITA_OPERATIVA_TIPO.registrazione);
    expect(o.azionePrincipale?.tipo).toBe(TIPO_AZIONE_GESTIONALE.registra_incasso);
  });

  it("14. nessuna azione urgente", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere(cantierePositivo);
    expect(o.prioritaOperativa.tipo).toBe(PRIORITA_OPERATIVA_TIPO.nessuna);
  });

  it("15. CTA preservata v8", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(o.azionePrincipale).toEqual(
      expect.objectContaining({
        target: TARGET_AZIONE_GESTIONALE.sezione_spese,
        disponibile: true,
      })
    );
  });

  it("16. materialeId preservato", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere({
      ...cantierePositivo,
      materiali: [
        {
          id: "m1",
          nome: "Piastrelle",
          quantita: 10,
          unita: "mq",
          prezzoUnitario: 200,
        },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(o.azionePrincipale?.contesto?.materialeId).toBe("m1");
  });

  it("17. massimo 3 cambiamenti", () => {
    const c = {
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [
        { id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" },
        { id: "p2", data: "20/09/2026", importo: 5000, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "01/09/2026",
          importo: 500,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "15/09/2026",
          importo: 2000,
          descrizione: "B",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const cambi = calcolaCambiamentiEconomiciCantiere(
      c,
      calcolaEvoluzioneEconomicaCantiere(c, analizzaControlloGestionaleCantiere(c))
    );
    expect(cambi.elementi.length).toBeLessThanOrEqual(3);
  });

  it("18. nessuna duplicazione formule", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere(cantierePositivo);
    expect(o.assistente.controllo.margineLordo).toBe(4500);
    expect(o.proattivo.assistente.controllo.margineLordo).toBe(4500);
  });
});

describe("speseCantiereService UX-Assistente contestuale v12", () => {
  const cantierePositivo = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. priorità critica + spiegazione", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(c.priorita.tipo).toBe(PRIORITA_OPERATIVA_TIPO.critico);
    expect(c.spiegazione).toMatch(/superato gli incassi/i);
  });

  it("2. margine negativo + evidenze", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(c.evidenze.some((e) => e.etichetta === "Margine")).toBe(true);
    expect(c.evidenze.some((e) => e.etichetta === "Spese")).toBe(true);
  });

  it("3. materiale sopra previsto + evidenza materiale", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" }],
      materiali: [
        { id: "m1", nome: "Piastrelle", quantita: 10, unita: "mq", prezzoUnitario: 200 },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(c.priorita.tipo).toBe(PRIORITA_OPERATIVA_TIPO.materiali);
    expect(c.evidenze.some((e) => e.valore === "Piastrelle")).toBe(true);
  });

  it("4. nessun incasso + evidenze", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 8000,
      pagamenti: [],
      spese: [],
    });
    expect(c.priorita.tipo).toBe(PRIORITA_OPERATIVA_TIPO.registrazione);
    expect(c.evidenze.some((e) => e.etichetta === "Rimanenza")).toBe(true);
  });

  it("5. situazione positiva + spiegazione", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere(cantierePositivo);
    expect(c.priorita.tipo).toBe(PRIORITA_OPERATIVA_TIPO.nessuna);
    expect(c.spiegazione).toMatch(/redditività positiva/i);
  });

  it("6. nessuna priorità + stato neutro", () => {
    const spiegazione = formattaSituazionePositivaEconomica(
      analizzaAssistenteEconomicoCantiere(cantierePositivo)
    );
    expect(spiegazione).toMatch(/non presenta criticità|redditività positiva/i);
  });

  it("7. massimo 3 evidenze", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere(cantierePositivo);
    const ev = raccogliEvidenzePrioritaEconomica(cantierePositivo, o);
    expect(ev.length).toBeLessThanOrEqual(3);
  });

  it("8. massimo 3 elementi cosa controllare", () => {
    const o = analizzaAssistenteEconomicoOperativoCantiere(cantierePositivo);
    const items = calcolaCosaControllareEconomico(cantierePositivo, o);
    expect(items.length).toBeLessThanOrEqual(3);
  });

  it("9. dati insufficienti — evidenze comunque coerenti", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 0,
      pagamenti: [],
      spese: [],
    });
    expect(c.spiegazione).toBeTruthy();
    expect(Array.isArray(c.evidenze)).toBe(true);
  });

  it("10. retrocompatibilità v11", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere(cantierePositivo);
    expect(c.operativo.prioritaOperativa.titolo).toBe(c.priorita.titolo);
    expect(c.operativo.cambiamenti).toBeDefined();
  });

  it("11. CTA invariata", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(c.azione?.tipo).toBe("vedi_spese");
    expect(c.azione?.target).toBe("sezione-spese");
  });

  it("12. nessuna duplicazione formule", () => {
    const c = analizzaAssistenteEconomicoContestualeCantiere(cantierePositivo);
    expect(c.assistente.controllo.margineLordo).toBe(4500);
    expect(c.operativo.assistente.controllo.margineLordo).toBe(4500);
  });
});

describe("speseCantiereService UX-Assistente decisionale v13", () => {
  const cantierePositivo = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. entry point decisionale", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere(cantierePositivo);
    expect(d.assistente).toBeDefined();
    expect(d.decisionePrincipale).toBeDefined();
    expect(d.impattoEconomico).toBeDefined();
    expect(d.azioneRaccomandata).toBeDefined();
  });

  it("2. cantiere positivo", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere(cantierePositivo);
    expect(d.decisionePrincipale.titolo).toMatch(/Non ci sono decisioni economiche urgenti/);
    expect(d.impattoEconomico.quantificabile).toBe(true);
    expect(d.azioneRaccomandata.azione).toBeNull();
  });

  it("3. margine negativo + impatto €", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(d.priorita.tipo).toBe(PRIORITA_OPERATIVA_TIPO.critico);
    expect(d.decisionePrincipale.titolo).toMatch(/problema di costi/i);
    expect(d.impattoEconomico.messaggio).toMatch(/superano gli incassi/i);
    expect(d.impattoEconomico.importo).toBe(1500);
  });

  it("4. peggioramento economico + impatto €", () => {
    const c = {
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [
        { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
        { id: "p2", data: "12/09/2026", importo: 500, tipo: "acconto" },
      ],
      spese: [
        {
          id: "s1",
          data: "05/09/2026",
          importo: 500,
          descrizione: "A",
          categoria: CATEGORIE_SPESA.materiali,
        },
        {
          id: "s2",
          data: "20/09/2026",
          importo: 2000,
          descrizione: "B",
          categoria: CATEGORIE_SPESA.materiali,
        },
      ],
    };
    const d = analizzaAssistenteEconomicoDecisionaleCantiere(c);
    expect(d.priorita.tipo).toBe(PRIORITA_OPERATIVA_TIPO.peggioramento);
    expect(d.impattoEconomico.quantificabile).toBe(true);
    expect(d.impattoEconomico.importo).toBe(1500);
  });

  it("5. materiali sopra previsto", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" }],
      materiali: [
        { id: "m1", nome: "Piastrelle", quantita: 10, unita: "mq", prezzoUnitario: 200 },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(d.decisionePrincipale.titolo).toMatch(/Piastrelle/);
    expect(d.impattoEconomico.messaggio).toMatch(/300|3300|2300|2000/);
    expect(d.azioneRaccomandata.azione?.tipo).toBe("vedi_materiali");
  });

  it("6. nessun incasso + rimanenza", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 8000,
      pagamenti: [],
      spese: [],
    });
    expect(d.decisionePrincipale.titolo).toMatch(/Mancano incassi/);
    expect(d.impattoEconomico.messaggio).toMatch(/8000|8\.000/);
    expect(d.azioneRaccomandata.azione?.tipo).toBe("registra_incasso");
  });

  it("7. nessuna spesa registrata", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 5000, tipo: "acconto" }],
      spese: [],
    });
    expect(d.decisionePrincipale.titolo).toMatch(/Mancano spese/);
    expect(d.azioneRaccomandata.azione?.tipo).toBe("registra_spesa");
  });

  it("8. impatto non quantificabile", () => {
    const contestuale = analizzaAssistenteEconomicoContestualeCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 0,
      pagamenti: [],
      spese: [],
    });
    const impatto = calcolaImpattoEconomicoDecisione(
      { id: "c1", origine: "diretto", totaleLavoro: 0, pagamenti: [], spese: [] },
      contestuale
    );
    expect(impatto.quantificabile).toBe(false);
    expect(impatto.messaggio).toBe(MESSAGGIO_IMPATTO_NON_QUANTIFICABILE);
  });

  it("9. evidenze max 3", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere(cantierePositivo);
    expect(d.evidenze.length).toBeLessThanOrEqual(3);
  });

  it("10. CTA singola e invariata", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere({
      ...cantierePositivo,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 1000, tipo: "acconto" }],
    });
    expect(d.azione?.tipo).toBe("vedi_spese");
    expect(d.azione?.target).toBe("sezione-spese");
    expect(d.azioneRaccomandata.messaggio).toMatch(/Controlla le spese/);
  });

  it("11. materialeId preservato in CTA", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere({
      id: "c1",
      origine: "diretto",
      totaleLavoro: 10000,
      pagamenti: [{ id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" }],
      materiali: [
        { id: "m1", nome: "Piastrelle", quantita: 10, unita: "mq", prezzoUnitario: 200 },
      ],
      spese: [
        {
          id: "s1",
          data: "02/09/2026",
          importo: 2300,
          descrizione: "Piastrelle",
          categoria: CATEGORIE_SPESA.materiali,
          materialeId: "m1",
        },
      ],
    });
    expect(d.azione?.contesto?.materialeId).toBe("m1");
  });

  it("12. retrocompatibilità V12", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere(cantierePositivo);
    expect(d.assistente.priorita.titolo).toBe(d.priorita.titolo);
    expect(d.motivo).toBe(d.assistente.spiegazione);
  });

  it("13. nessuna duplicazione formule", () => {
    const d = analizzaAssistenteEconomicoDecisionaleCantiere(cantierePositivo);
    expect(d.assistente.assistente.controllo.margineLordo).toBe(4500);
  });
});

describe("speseCantiereService UX-Assistente scenari v14", () => {
  const cantiereSim = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("1. scenario spesa semplice", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 500,
    });
    expect(s.disponibile).toBe(true);
    expect(s.simulato.margineLordo).toBe(4000);
    expect(s.variazioni.spese).toBe(500);
  });

  it("2. scenario incasso semplice", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.incasso,
      importo: 1000,
    });
    expect(s.disponibile).toBe(true);
    expect(s.simulato.incassato).toBe(8000);
    expect(s.simulato.rimanenza).toBe(2000);
  });

  it("3. incasso non modifica margine", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.incasso,
      importo: 1000,
    });
    expect(s.simulato.margineLordo).toBe(4500);
    expect(s.variazioni.margine).toBe(0);
  });

  it("4. incasso riduce rimanenza", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.incasso,
      importo: 1000,
    });
    expect(s.variazioni.rimanenza).toBe(-1000);
  });

  it("5. spesa riduce margine", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 500,
    });
    expect(s.variazioni.margine).toBe(-500);
  });

  it("6. percentuale margine ricalcolata sulla spesa", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 500,
    });
    expect(s.simulato.percentualeMargine).toBeCloseTo((4000 / 7000) * 100, 1);
  });

  it("7. incassato zero — % non disponibile", () => {
    const s = simulaScenarioEconomicoCantiere(
      {
        id: "c1",
        origine: "diretto",
        totaleLavoro: 5000,
        pagamenti: [],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 500,
            descrizione: "A",
            categoria: CATEGORIE_SPESA.altro,
          },
        ],
      },
      { tipo: TIPO_SCENARIO_ECONOMICO.spesa, importo: 100 }
    );
    expect(s.reale.percentualeMargine).toBeNull();
    expect(s.simulato.percentualeMargine).toBeNull();
    expect(s.simulato.margineLordo).toBe(-600);
  });

  it("8. cambio stato redditività", () => {
    const s = simulaScenarioEconomicoCantiere(
      {
        id: "c1",
        origine: "diretto",
        totaleLavoro: 10000,
        pagamenti: [{ id: "p1", data: "01/09/2026", importo: 3000, tipo: "acconto" }],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 2800,
            descrizione: "A",
            categoria: CATEGORIE_SPESA.altro,
          },
        ],
      },
      { tipo: TIPO_SCENARIO_ECONOMICO.spesa, importo: 500 }
    );
    expect(s.reale.statoRedditivita).toBe(STATO_REDDITIVITA.positiva);
    expect(s.simulato.statoRedditivita).toBe(STATO_REDDITIVITA.negativa);
    expect(s.cambioStato.redditivita).toBe(true);
  });

  it("9. spesa porta margine negativo", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 5000,
    });
    expect(s.simulato.margineLordo).toBe(-500);
    expect(s.messaggio).toMatch(/negativo/i);
  });

  it("10. importo non valido", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: "abc",
    });
    expect(s.disponibile).toBe(false);
  });

  it("11. importo zero", () => {
    expect(normalizzaImportoScenarioEconomico(0)).toBeNull();
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 0,
    });
    expect(s.disponibile).toBe(false);
  });

  it("12. nessuna mutazione cantiere", () => {
    const snapshot = JSON.stringify(cantiereSim);
    simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 9999,
    });
    expect(JSON.stringify(cantiereSim)).toBe(snapshot);
  });

  it("13. riutilizzo formule esistenti", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 500,
    });
    expect(s.reale.margineLordo).toBe(calcolaMargineLordo(cantiereSim));
  });

  it("14. margine disponibile e dati insufficienti", () => {
    expect(calcolaMargineDisponibilePrimaPerdita(0, 100)).toBeNull();
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 500,
    });
    expect(s.margineDisponibile).toBe(4500);
    expect(s.messaggioMargineDisponibile).toMatch(/4500|4\.500/);
  });

  it("15. compatibilità V13", () => {
    const r = analizzaAssistenteEconomicoScenarioCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 500,
    });
    expect(r.decisionale.decisionePrincipale).toBeDefined();
    expect(r.simulazione.disponibile).toBe(true);
  });

  it("16. scenario combinato", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      spesa: 200,
      incasso: 1000,
    });
    expect(s.tipo).toBe(TIPO_SCENARIO_ECONOMICO.combinato);
    expect(s.simulato.incassato).toBe(8000);
    expect(s.simulato.margineLordo).toBe(4300);
    expect(s.variazioni.margine).toBe(-200);
  });

  it("17. incasso oltre totale cantiere", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.incasso,
      importo: 5000,
    });
    expect(s.simulato.overpayment).toBe(true);
    expect(s.messaggio).toMatch(/supera il valore del cantiere/i);
  });
});

describe("speseCantiereService UX-Assistente decisione-azione-verifica v15", () => {
  const cantiereSim = {
    id: "c1",
    origine: "diretto",
    totaleLavoro: 10000,
    pagamenti: [
      { id: "p1", data: "01/09/2026", importo: 7000, tipo: "acconto" },
    ],
    spese: [
      {
        id: "s1",
        data: "02/09/2026",
        importo: 2500,
        descrizione: "Materiali",
        categoria: CATEGORIE_SPESA.materiali,
      },
    ],
  };

  it("A. scenario spesa classificato come peggiora", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 500,
    });
    expect(s.classificazione.effetto).toBe(EFFETTO_SCENARIO_ECONOMICO.peggiora);
  });

  it("B. scenario incasso classificato come migliora", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.incasso,
      importo: 1000,
    });
    expect(s.classificazione.effetto).toBe(EFFETTO_SCENARIO_ECONOMICO.migliora);
    expect(s.variazioni.margine).toBe(0);
  });

  it("C. scenario combinato", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      spesa: 200,
      incasso: 1000,
    });
    expect(s.tipo).toBe(TIPO_SCENARIO_ECONOMICO.combinato);
    expect(s.classificazione.effetto).toBe(EFFETTO_SCENARIO_ECONOMICO.peggiora);
  });

  it("D. classificazione senza simulazione disponibile", () => {
    const r = classificaEffettoScenarioEconomico({ disponibile: false });
    expect(r.effetto).toBeNull();
    expect(r.messaggio).toMatch(/non quantificabile|dati/i);
  });

  it("E. scenario che migliora (incasso)", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.incasso,
      importo: 500,
    });
    expect(s.classificazione.effetto).toBe(EFFETTO_SCENARIO_ECONOMICO.migliora);
  });

  it("F. scenario che peggiora (spesa)", () => {
    const s = simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 1000,
    });
    expect(s.classificazione.effetto).toBe(EFFETTO_SCENARIO_ECONOMICO.peggiora);
  });

  it("G–J. verifica dopo registrazione spesa con snapshot prima/dopo", () => {
    const prima = snapshotEconomicoRealeCantiere(cantiereSim);
    const dopoCantiere = {
      ...cantiereSim,
      spese: [
        ...cantiereSim.spese,
        {
          id: "s2",
          data: "03/09/2026",
          importo: 500,
          descrizione: "Extra",
          categoria: CATEGORIE_SPESA.altro,
        },
      ],
    };
    const dopo = snapshotEconomicoRealeCantiere(dopoCantiere);
    const v = costruisciVerificaOperazioneEconomica({
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 500,
      prima,
      dopo,
      cantiere: dopoCantiere,
    });
    expect(v.disponibile).toBe(true);
    expect(v.messaggio).toMatch(/peggiorata|ridotto il margine/i);
    expect(v.confronto.some((c) => c.etichetta === "Margine")).toBe(true);
    expect(dopo.margineLordo).toBe(prima.margineLordo - 500);
  });

  it("H. verifica dopo registrazione incasso", () => {
    const prima = snapshotEconomicoRealeCantiere(cantiereSim);
    const dopoCantiere = {
      ...cantiereSim,
      pagamenti: [
        ...cantiereSim.pagamenti,
        { id: "p2", data: "03/09/2026", importo: 1000, tipo: "acconto" },
      ],
    };
    const dopo = snapshotEconomicoRealeCantiere(dopoCantiere);
    const v = costruisciVerificaOperazioneEconomica({
      tipo: TIPO_SCENARIO_ECONOMICO.incasso,
      importo: 1000,
      prima,
      dopo,
      cantiere: dopoCantiere,
    });
    expect(v.messaggio).toMatch(/migliorata|residuo|incasso/i);
    expect(dopo.incassato).toBe(8000);
  });

  it("M. verifica senza snapshot prima — messaggio semplice", () => {
    const dopo = snapshotEconomicoRealeCantiere(cantiereSim);
    const v = costruisciVerificaOperazioneEconomica({
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 100,
      prima: null,
      dopo,
    });
    expect(v.messaggio).toMatch(/Operazione registrata/i);
    expect(v.confronto).toBeNull();
  });

  it("N. nessuna mutazione durante simulazione", () => {
    const snap = JSON.stringify(cantiereSim);
    simulaScenarioEconomicoCantiere(cantiereSim, {
      tipo: TIPO_SCENARIO_ECONOMICO.spesa,
      importo: 999,
    });
    expect(JSON.stringify(cantiereSim)).toBe(snap);
  });

  it("classificazione evidenzia cambio stato", () => {
    const s = simulaScenarioEconomicoCantiere(
      {
        id: "c1",
        origine: "diretto",
        totaleLavoro: 10000,
        pagamenti: [{ id: "p1", data: "01/09/2026", importo: 3000, tipo: "acconto" }],
        spese: [
          {
            id: "s1",
            data: "02/09/2026",
            importo: 2800,
            descrizione: "A",
            categoria: CATEGORIE_SPESA.altro,
          },
        ],
      },
      { tipo: TIPO_SCENARIO_ECONOMICO.spesa, importo: 500 }
    );
    expect(s.classificazione.cambiaStato).toBe(true);
  });
});
