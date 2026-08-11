import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEYS } from "../../app/storageKeys";
import { creaCantiere } from "../../features/cantieri/cantieriDomain";
import { leggiCantieri, salvaCantieri } from "../../repositories/cantieriRepository";
import { leggiListaSpesa } from "../listaSpesa";
import { convertiInCantiere, STATI_PREVENTIVO } from "../workflow";
import {
  creaDistintaMateriali,
  collegaDistintaAPreventivo,
  trovaDistintaPerId,
} from "./distintaMaterialiService";
import {
  collegaDistintaAPreventivoSenzaDuplicati,
  elencaDistintePerCollegamentoPreventivo,
  preventivoHaDistintaCollegata,
  scollegaDistintaDalPreventivo,
  trovaDistintaCollegataAlPreventivo,
  usaDistintaDopoConversioneCantiere,
} from "./distintaPreventivoService";

vi.mock("../../services/cloudSyncService", () => ({
  salvaDatoCloud: vi.fn(),
}));

const preventivoBase = {
  id: "prev-7",
  numero: "PREV-7",
  cliente: "Mario",
  stato: STATI_PREVENTIVO.ACCETTATO,
  indirizzo: "Via Test 1",
  totale: 100,
  lavorazioni: [
    { id: "l1", nome: "Punto luce", quantita: 1, prezzo: 100, unita: "cad" },
  ],
};

describe("distintaPreventivoService", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      STORAGE_KEYS.preventivi,
      JSON.stringify([preventivoBase])
    );
    localStorage.setItem(STORAGE_KEYS.cantieri, JSON.stringify([]));
  });

  it("collega e scollega distinta → preventivo", () => {
    const distinta = creaDistintaMateriali({
      titolo: "BOM Prev",
      voci: [{ nome: "Tubo", quantita: 10, unita: "m" }],
    });

    const collegata = collegaDistintaAPreventivoSenzaDuplicati(
      distinta.id,
      "prev-7"
    );
    expect(collegata.ok).toBe(true);
    expect(trovaDistintaCollegataAlPreventivo("prev-7")?.id).toBe(distinta.id);
    expect(preventivoHaDistintaCollegata("prev-7")).toBe(true);

    const out = scollegaDistintaDalPreventivo(distinta.id);
    expect(out.ok).toBe(true);
    expect(trovaDistintaCollegataAlPreventivo("prev-7")).toBeNull();
  });

  it("ricerca distinte per collegamento", () => {
    creaDistintaMateriali({ titolo: "Quadro civile", clienteNome: "Rossi" });
    creaDistintaMateriali({ titolo: "Allarme villa", clienteNome: "Bianchi" });

    const risultati = elencaDistintePerCollegamentoPreventivo("quadro", {
      preventivoId: "prev-7",
    });
    expect(risultati).toHaveLength(1);
    expect(risultati[0].titolo).toBe("Quadro civile");
    expect(risultati[0].nVoci).toBe(0);
  });

  it("non crea duplicati se distinta già collegata ad altro preventivo", () => {
    const distinta = creaDistintaMateriali({ titolo: "Unica" });
    collegaDistintaAPreventivo(distinta.id, "prev-altro");

    const r = collegaDistintaAPreventivoSenzaDuplicati(distinta.id, "prev-7");
    expect(r.ok).toBe(true);

    const aggiornata = trovaDistintaPerId(distinta.id);
    expect(aggiornata.collegamenti.preventivoId).toBe("prev-7");
    // ancora una sola distinta in storage
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.distinteMateriali) || "[]")
    ).toHaveLength(1);
  });

  it("sostituisce distinta precedente sullo stesso preventivo", () => {
    const a = creaDistintaMateriali({ titolo: "A" });
    const b = creaDistintaMateriali({ titolo: "B" });
    collegaDistintaAPreventivoSenzaDuplicati(a.id, "prev-7");
    collegaDistintaAPreventivoSenzaDuplicati(b.id, "prev-7");

    expect(trovaDistintaCollegataAlPreventivo("prev-7")?.id).toBe(b.id);
    expect(trovaDistintaPerId(a.id).collegamenti.preventivoId).toBeUndefined();
  });

  it("conversione senza distinta: cantiere senza materiali proiettati", () => {
    const risultato = convertiInCantiere("prev-7");
    expect(risultato.success).toBe(true);
    expect(risultato.cantiere.materiali || []).toEqual([]);
    expect(leggiListaSpesa()).toEqual([]);
  });

  it('conversione con "Usa distinta" proietta materiali e lista spesa', () => {
    const distinta = creaDistintaMateriali({
      titolo: "BOM",
      voci: [
        {
          nome: "Tubo Ø25",
          quantita: 50,
          unita: "m",
          varianteId: "var-1",
          famigliaId: "fam-1",
        },
      ],
    });
    collegaDistintaAPreventivoSenzaDuplicati(distinta.id, "prev-7");

    const risultato = convertiInCantiere("prev-7");
    expect(risultato.success).toBe(true);
    // senza consenso: ancora vuoto
    expect(risultato.cantiere.materiali || []).toEqual([]);

    const sync = usaDistintaDopoConversioneCantiere(
      "prev-7",
      risultato.cantiere.id
    );
    expect(sync.ok).toBe(true);
    expect(sync.applicata).toBe(true);

    const cantiere = leggiCantieri().find(
      (c) => String(c.id) === String(risultato.cantiere.id)
    );
    expect(cantiere.materiali).toHaveLength(1);
    expect(cantiere.materiali[0].varianteId).toBe("var-1");
    expect(cantiere.materiali[0].distintaVoceId).toBeTruthy();

    const lista = leggiListaSpesa();
    expect(lista).toHaveLength(1);
    expect(lista[0].distintaVoceId).toBeTruthy();

    // idempotenza: seconda applicazione non duplica
    usaDistintaDopoConversioneCantiere("prev-7", risultato.cantiere.id);
    expect(leggiCantieri().find((c) => String(c.id) === String(cantiere.id)).materiali)
      .toHaveLength(1);
    expect(leggiListaSpesa()).toHaveLength(1);
  });

  it('conversione con "Continua senza" non proietta', () => {
    const distinta = creaDistintaMateriali({
      titolo: "BOM",
      voci: [{ nome: "Cavo", quantita: 10, unita: "m" }],
    });
    collegaDistintaAPreventivoSenzaDuplicati(distinta.id, "prev-7");

    const risultato = convertiInCantiere("prev-7");
    expect(risultato.success).toBe(true);
    // Continua senza → non chiamare usaDistintaDopoConversioneCantiere
    expect(risultato.cantiere.materiali || []).toEqual([]);
    expect(leggiListaSpesa()).toEqual([]);
    expect(trovaDistintaCollegataAlPreventivo("prev-7")?.id).toBe(distinta.id);
  });

  it("preventivo legacy senza distinta resta invariato", () => {
    expect(preventivoHaDistintaCollegata("prev-7")).toBe(false);
    const cantiere = {
      ...creaCantiere({
        nome: "Manuale",
        cliente: "X",
        indirizzo: "Y",
      }),
      materiali: [{ id: "m1", nome: "Legacy", quantita: 1, unita: "cad" }],
    };
    salvaCantieri([cantiere]);
    expect(leggiCantieri()[0].materiali).toHaveLength(1);
  });
});
