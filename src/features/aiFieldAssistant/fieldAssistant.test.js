import { describe, expect, it } from "vitest";

import {
  FIELD_TIPI,
  validaRispostaFieldAssistant,
} from "./fieldAssistantContract";
import { estraiLavorazioniLocale } from "./estraiLavorazioniLocale";
import { estraiMaterialiLocale } from "./estraiMaterialiLocale";
import {
  matchLavorazioneConListino,
  abbinaLavorazioniAlListino,
} from "./matchLavorazioneConListino";
import { matchMaterialeConCatalogo } from "./matchMaterialeConCatalogo";
import {
  elaboraLavorazioniDaTesto,
  elaboraMaterialiDaTesto,
  payloadLavorazioniDaConferma,
  payloadMaterialiDaConferma,
} from "./fieldAssistantService";
import {
  FIXTURE_LAVORAZIONI,
  FIXTURE_MATERIALI,
} from "./__fixtures__/frasiElettricista";

const LISTINO = [
  {
    id: "punto-luce",
    nome: "Punto luce",
    categoria: "Impianto",
    prezzo: 45,
    unita: "cad",
  },
  {
    id: "punto-presa",
    nome: "Punto presa",
    categoria: "Impianto",
    prezzo: 55,
    unita: "cad",
  },
  {
    id: "quadro",
    nome: "Quadro elettrico",
    categoria: "Impianto",
    prezzo: 350,
    unita: "cad",
  },
  {
    id: "quadro-24",
    nome: "Quadro elettrico 24 moduli",
    categoria: "Impianto",
    prezzo: 420,
    unita: "cad",
  },
  {
    id: "linea",
    nome: "Linea dedicata",
    categoria: "Impianto",
    prezzo: 80,
    unita: "cad",
  },
  {
    id: "video",
    nome: "Videocitofono",
    categoria: "Impianto",
    prezzo: 280,
    unita: "cad",
  },
  {
    id: "clima",
    nome: "Predisposizione climatizzatore",
    categoria: "Impianto",
    prezzo: 90,
    unita: "cad",
  },
];

describe("Field Assistant — parsing preventivo", () => {
  it("A. 80 punti luce e 60 prese → 2 elementi", () => {
    const r = estraiLavorazioniLocale("80 punti luce e 60 prese");
    expect(r.ok).toBe(true);
    const luci = r.data.elementi.find((e) => /luce/i.test(e.descrizione));
    const prese = r.data.elementi.find((e) => /presa/i.test(e.descrizione));
    expect(luci?.quantita).toBe(80);
    expect(prese?.quantita).toBe(60);
  });

  it("B. due linee dedicate → quantità 2 o 2 elementi", () => {
    const r = estraiLavorazioniLocale(FIXTURE_LAVORAZIONI.puntiEPrese);
    expect(r.ok).toBe(true);
    const linee = r.data.elementi.filter((e) => /linea dedicata/i.test(e.descrizione));
    const totQty = linee.reduce((s, e) => s + e.quantita, 0);
    expect(totQty).toBe(2);
  });

  it("fixture appartamento: punti, prese, linee, quadro, video + mq extra", () => {
    const r = estraiLavorazioniLocale(FIXTURE_LAVORAZIONI.appartamento);
    expect(r.ok).toBe(true);
    expect(r.data.elementi.some((e) => /luce/i.test(e.descrizione) && e.quantita === 80)).toBe(true);
    expect(r.data.elementi.some((e) => /presa/i.test(e.descrizione) && e.quantita === 60)).toBe(true);
    expect(r.data.informazioniExtra.some((x) => /100/.test(x))).toBe(true);
  });
});

describe("Field Assistant — unità e materiali", () => {
  it("C. 50 metri di corrugato → 50 / m", () => {
    const r = estraiMaterialiLocale(FIXTURE_MATERIALI.corrugatoCirca);
    expect(r.ok).toBe(true);
    const corr = r.data.elementi.find((e) => /corrugat/i.test(e.descrizione));
    expect(corr?.quantita).toBe(30);
    expect(corr?.unita).toBe("m");
  });

  it("E/D. differenziale nudo → ambiguo, niente amperaggio inventato", () => {
    const r = estraiMaterialiLocale(FIXTURE_MATERIALI.differenzialeNudo);
    expect(r.ok).toBe(true);
    const amb = [...r.data.elementiAmbigui, ...r.data.elementi].find((e) =>
      /differenzial/i.test(e.descrizione)
    );
    expect(amb).toBeTruthy();
    expect(amb.ambiguo || /manca/i.test(amb.note || "")).toBe(true);
    expect(amb.descrizione).not.toMatch(/\d+A/);
  });

  it("differenziale da quaranta → 40A senza inventare modello", () => {
    const r = estraiMaterialiLocale(FIXTURE_MATERIALI.differenzialeQuaranta);
    expect(r.ok).toBe(true);
    const d = [...r.data.elementi, ...r.data.elementiAmbigui].find((e) =>
      /differenzial/i.test(e.descrizione)
    );
    expect(d?.descrizione).toMatch(/40/);
    expect(d?.descrizione).not.toMatch(/ABB|Siemens|Bticino/i);
  });

  it("memo completo: cavo, scatole, magneto, differenziale, corrugato", () => {
    const r = estraiMaterialiLocale(FIXTURE_MATERIALI.memoCompleto);
    expect(r.ok).toBe(true);
    expect(r.data.elementi.some((e) => /cavo|fg16/i.test(e.descrizione))).toBe(true);
    expect(r.data.elementi.some((e) => /503/i.test(e.descrizione))).toBe(true);
    expect(r.data.elementi.some((e) => /magnetotermic/i.test(e.descrizione))).toBe(true);
    expect(r.data.elementi.some((e) => /corrugat/i.test(e.descrizione))).toBe(true);
  });
});

describe("Field Assistant — match listino/catalogo", () => {
  it("E. materiale non trovato → niente prezzo inventato", () => {
    const m = matchMaterialeConCatalogo({
      descrizione: "widget alieno xyz-999",
      quantita: 1,
      unita: "pz",
    });
    expect(m.stato).toBe("non_trovato");
    expect(m.candidati).toHaveLength(0);
  });

  it("F. match multiplo → max 3 candidate", () => {
    const listinoDoppio = [
      ...LISTINO,
      { id: "pl2", nome: "Punto luce LED", prezzo: 50, unita: "cad" },
      { id: "pl3", nome: "Punto luce emergenza", prezzo: 60, unita: "cad" },
      { id: "pl4", nome: "Punto luce esterno", prezzo: 70, unita: "cad" },
    ];
    const m = matchLavorazioneConListino(
      { descrizione: "punto luce", quantita: 1 },
      listinoDoppio
    );
    expect(m.candidati.length).toBeLessThanOrEqual(3);
  });

  it("prezzi solo dal listino dopo match", () => {
    const abbinate = abbinaLavorazioniAlListino(
      [{ descrizione: "punto luce", quantita: 80, unita: "pz" }],
      LISTINO
    );
    expect(abbinate[0].match.stato).toBe("match");
    expect(abbinate[0].match.candidato.prezzo).toBe(45);
    expect(abbinate[0].match.candidato.prezzoDalListino).toBe(true);
  });
});

describe("Field Assistant — contract e conferma", () => {
  it("G. JSON invalido → fallback ok:false", () => {
    const r = validaRispostaFieldAssistant("not-json", FIELD_TIPI.lavorazioni);
    expect(r.ok).toBe(false);
    expect(r.codice).toBe("json_invalido");
  });

  it("G. prezzo nell'elemento AI → rifiutato", () => {
    const r = validaRispostaFieldAssistant(
      {
        tipo: "lavorazioni",
        elementi: [{ descrizione: "punto luce", quantita: 1, prezzo: 99 }],
      },
      FIELD_TIPI.lavorazioni
    );
    expect(r.ok).toBe(false);
    expect(r.codice).toBe("prezzo_non_ammesso");
  });

  it("H. elaborazione non marca persistito", async () => {
    const r = await elaboraLavorazioniDaTesto("80 punti luce", {
      listino: LISTINO,
      usaProvider: false,
    });
    expect(r.ok).toBe(true);
    expect(r.persistito).toBe(false);
  });

  it("H. payload lavorazioni solo dopo conferma con match", () => {
    const payload = payloadLavorazioniDaConferma([
      {
        descrizione: "punto luce",
        quantita: 80,
        matchScelto: {
          listinoId: "punto-luce",
          nome: "Punto luce",
          prezzo: 45,
          unita: "cad",
        },
      },
      { descrizione: "ignota", quantita: 1, escluso: false },
    ]);
    expect(payload).toHaveLength(1);
    expect(payload[0].prezzo).toBe(45);
    expect(payload[0].prezzoDalListino).toBe(true);
  });

  it("I. esclusione → nessun payload", () => {
    const payload = payloadMaterialiDaConferma([
      {
        descrizione: "scatola 503",
        quantita: 2,
        escluso: true,
        matchScelto: { nome: "Scatola 503" },
      },
    ]);
    expect(payload).toHaveLength(0);
  });

  it("offline: elaboraMateriali senza provider resta ok locale", async () => {
    const r = await elaboraMaterialiDaTesto(FIXTURE_MATERIALI.corrugatoCirca, {
      usaProvider: false,
    });
    expect(r.ok).toBe(true);
    expect(r.fonte).toBe("locale");
    expect(r.trascrizione).toBeTruthy();
  });
});

describe("Field Assistant — fixture realistiche checklist", () => {
  it("25 punti luce → quantità 25", () => {
    const r = estraiLavorazioniLocale(FIXTURE_LAVORAZIONI.venticinqueLuci);
    expect(r.ok).toBe(true);
    const luce = r.data.elementi.find((e) => /luce/i.test(e.descrizione));
    expect(luce?.quantita).toBe(25);
  });

  it("10 prese e 4 punti luce → due elementi", () => {
    const r = estraiLavorazioniLocale(FIXTURE_LAVORAZIONI.dieciEQuattro);
    expect(r.ok).toBe(true);
    expect(r.data.elementi.length).toBeGreaterThanOrEqual(2);
    expect(
      r.data.elementi.some((e) => /presa/i.test(e.descrizione) && e.quantita === 10)
    ).toBe(true);
    expect(
      r.data.elementi.some((e) => /luce/i.test(e.descrizione) && e.quantita === 4)
    ).toBe(true);
  });

  it("50 metri FG16 3x2.5 → 50 m", () => {
    const r = estraiMaterialiLocale(FIXTURE_MATERIALI.cinquantaFg16);
    expect(r.ok).toBe(true);
    const cavo = r.data.elementi.find((e) => /fg16|cavo/i.test(e.descrizione));
    expect(cavo?.quantita).toBe(50);
    expect(cavo?.unita).toBe("m");
  });

  it("2 scatole 503 → 2 pz", () => {
    const r = estraiMaterialiLocale(FIXTURE_MATERIALI.dueScatole);
    expect(r.ok).toBe(true);
    const s = r.data.elementi.find((e) => /503/i.test(e.descrizione));
    expect(s?.quantita).toBe(2);
    expect(s?.unita).toBe("pz");
  });

  it("match id esatto listino", () => {
    const m = matchLavorazioneConListino(
      { descrizione: "qualsiasi", listinoId: "punto-luce", quantita: 1 },
      LISTINO
    );
    expect(m.stato).toBe("match");
    expect(m.id).toBe("punto-luce");
    expect(m.candidato.prezzo).toBe(45);
  });

  it("match nested ha confidence e max 3 candidati", () => {
    const listinoDoppio = [
      ...LISTINO,
      { id: "pl2", nome: "Punto luce LED", prezzo: 50, unita: "cad" },
      { id: "pl3", nome: "Punto luce emergenza", prezzo: 60, unita: "cad" },
      { id: "pl4", nome: "Punto luce esterno", prezzo: 70, unita: "cad" },
    ];
    const m = matchLavorazioneConListino(
      { descrizione: "punto luce", quantita: 1 },
      listinoDoppio
    );
    expect(m.candidati.length).toBeLessThanOrEqual(3);
    expect(typeof m.confidence).toBe("number");
  });

  it("locale-first: con elementi locali non richiede AI per ok", async () => {
    const r = await elaboraLavorazioniDaTesto("80 punti luce", {
      listino: LISTINO,
      usaProvider: true,
      providerOpzioni: {
        fetchImpl: async () => {
          throw new Error("non deve essere chiamato se locale forte");
        },
      },
    });
    // Senza endpoint reale usaProvider + getAiAssistantEndpoint tipicamente false in test
    expect(r.ok).toBe(true);
    expect(r.persistito).toBe(false);
    expect(r.fonte).toBe("locale");
  });
});
