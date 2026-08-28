import { useMemo, useState } from "react";
import {
  calcolaAvanzamentoChecklist,
  creaCantiere,
  creaMateriale,
  creaVoceChecklist,
  aggiornaCantiere,
} from "../cantieriDomain";
import { useDatiLocaliSincronizzati } from "../../../hooks/useDatiLocaliSincronizzati";
import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../../repositories/cantieriRepository";
import { filtraRecordAttivi } from "../../../domain/cestino";
import {
  spostaNelCestino,
  TIPI_CESTINO,
} from "../../../domain/cestino";
import {
  eliminaStorageFotoCantiere,
  fileFotoValido,
  preparaFotoCantiere,
  risolviSrcFotoCantiere,
} from "../services/cantieriFotoService";
import { registraEsperienzaCompletamento } from "../../../services/experienceService";
import { sincronizzaListaSpesaDaCantiere } from "../../../domain/listaSpesa";
import {
  sincronizzaAcquistatoMaterialeSuLista,
  sincronizzaEliminazioneMaterialeSuLista,
} from "../../../domain/listaSpesa/listaSpesaRepository";
import {
  completaLavoroDaCantiere,
  sincronizzaVarianteSuPreventivo,
} from "../../../domain/workflow";
import {
  annullaVariante as annullaVarianteDomain,
  approvaVariante as approvaVarianteDomain,
  creaVariante as creaVarianteDomain,
  eseguiVariante as eseguiVarianteDomain,
} from "../../../domain/varianti";
import { creaEventoCantiereAvviato } from "../../diario/events/cantiereAvviato";
import { creaEventoCantiereCompletato } from "../../diario/events/cantiereCompletato";
import { creaEventoChecklistAggiornata } from "../../diario/events/checklistAggiornata";
import { creaEventoFotoAggiunta } from "../../diario/events/fotoAggiunta";
import { creaEventoMaterialeAggiunto } from "../../diario/events/materialeAggiunto";
import { creaEventoNotaAggiunta } from "../../diario/events/notaAggiunta";
import { creaEventoPagamentoRegistrato } from "../../diario/events/pagamentoRegistrato";
import { creaEventoStatoCambiato } from "../../diario/events/statoCambiato";
import { creaEventoVariante } from "../../diario/events/varianteAggiunta";
import {
  aggiungiGiornataProgrammata,
  aggiornaGiornataProgrammata,
  eliminaGiornataProgrammata,
} from "../services/programmazioneCantiereService";
import {
  aggiungiGiornataLavorativa,
  aggiornaGiornataLavorativa,
  eliminaGiornataLavorativa,
} from "../services/registroGiornateService";
import {
  aggiungiPagamento as aggiungiPagamentoDomain,
  aggiornaPagamento as aggiornaPagamentoDomain,
  creaIdPagamento,
  eliminaPagamento as eliminaPagamentoDomain,
  leggiTotaleIncassato,
} from "../services/pagamentiCantiereService";

const FORM_CANTIERE_INIZIALE = {
  nome: "",
  cliente: "",
  indirizzo: "",
  tipoIntervento: "Riparazione",
  descrizioneIntervento: "",
  totaleLavoro: "",
};

const FORM_MATERIALE_INIZIALE = {
  nome: "",
  quantita: "",
  unita: "cad",
};

function listaDiario(cantiere = {}) {
  return Array.isArray(cantiere.diario) ? cantiere.diario : [];
}

function appendDiarioEvents(cantiere, eventi = []) {
  const validi = eventi.filter(Boolean);
  if (!validi.length) return cantiere;
  return {
    ...cantiere,
    diario: [...listaDiario(cantiere), ...validi],
  };
}

function valoreIncassato(cantiere = {}) {
  return leggiTotaleIncassato(cantiere);
}

/**
 * @param {{ cantiereId?: string|number, cantiereInizialeId?: string|number }} [opzioni]
 * `cantiereId` è la selezione vincolata dall'URL (route canonica /cantiere/:id).
 * `cantiereInizialeId` resta supportato per compatibilità test legacy
 * (non usare location.state in produzione).
 */
export function useCantieri({
  cantiereId = "",
  cantiereInizialeId = "",
} = {}) {
  const idEsterno = cantiereId || cantiereInizialeId || "";

  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieriTutti);
  const cantieriAttivi = useMemo(
    () => filtraRecordAttivi(cantieri),
    [cantieri]
  );
  const [cantiereSelezionatoIdInterno, setCantiereSelezionatoIdInterno] =
    useState(() => idEsterno || cantieriAttivi[0]?.id || "");
  const [nuovoCantiere, setNuovoCantiere] = useState(FORM_CANTIERE_INIZIALE);
  const [nuovaChecklist, setNuovaChecklist] = useState("");
  const [nuovoMateriale, setNuovoMateriale] = useState(FORM_MATERIALE_INIZIALE);
  const [messaggio, setMessaggio] = useState("");
  const [variantiTick, setVariantiTick] = useState(0);

  // Con id URL/esterno la selezione è derivata; altrimenti stato locale (lista/test).
  const cantiereSelezionatoId = idEsterno || cantiereSelezionatoIdInterno;

  function setCantiereSelezionatoId(prossimoId) {
    setCantiereSelezionatoIdInterno(prossimoId);
  }

  const cantiereSelezionato = useMemo(() => {
    const trovato = cantieri.find(
      (cantiere) => String(cantiere.id) === String(cantiereSelezionatoId)
    );
    if (idEsterno) return trovato || null;
    return trovato || cantieriAttivi[0] || null;
  }, [cantieri, cantieriAttivi, cantiereSelezionatoId, idEsterno]);

  const avanzamento = cantiereSelezionato
    ? calcolaAvanzamentoChecklist(cantiereSelezionato.checklist || [])
    : 0;

  function salvaListaCantieri(cantieriAggiornati) {
    setCantieri(cantieriAggiornati);
    salvaCantieri(cantieriAggiornati);
  }

  function aggiornaCantiereConEventi(idTarget, aggiornatore) {
    let aggiornato = null;
    salvaListaCantieri(
      cantieri.map((cantiere) => {
        if (String(cantiere.id) !== String(idTarget)) return cantiere;
        aggiornato = aggiornatore(cantiere);
        return aggiornato;
      })
    );
    return aggiornato;
  }

  function creaEventiAutomatici(prev, next, opzioni = {}) {
    const eventi = [];
    const notePrev = String(prev?.note || "").trim();
    const noteNext = String(next?.note || "").trim();
    if (!opzioni.skipNoteEvent && notePrev !== noteNext && noteNext) {
      eventi.push(creaEventoNotaAggiunta(noteNext));
    }

    const incassatoPrev = valoreIncassato(prev);
    const incassatoNext = valoreIncassato(next);
    if (!opzioni.skipPagamentoEvent && incassatoPrev !== incassatoNext) {
      eventi.push(
        creaEventoPagamentoRegistrato(incassatoNext - incassatoPrev, incassatoNext)
      );
    }

    if (
      !opzioni.skipStateEvent &&
      prev?.stato !== next?.stato &&
      next?.stato !== "In corso" &&
      next?.stato !== "Completato"
    ) {
      eventi.push(creaEventoStatoCambiato(prev?.stato, next?.stato));
    }

    return eventi;
  }

  function aggiornaCampoNuovoCantiere(campo, valore) {
    setNuovoCantiere((precedente) => ({
      ...precedente,
      [campo]: valore,
    }));
  }

  function aggiungiCantiere() {
    if (!nuovoCantiere.nome.trim()) {
      setMessaggio("Inserisci il nome del cantiere.");
      return null;
    }

    const cantiere = creaCantiere(nuovoCantiere);
    const cantieriAggiornati = [cantiere, ...cantieri];

    salvaListaCantieri(cantieriAggiornati);
    setCantiereSelezionatoId(cantiere.id);
    setNuovoCantiere(FORM_CANTIERE_INIZIALE);
    setMessaggio("Cantiere creato sul dispositivo.");
    return cantiere;
  }

  function aggiornaSelezionato(modifiche) {
    if (!cantiereSelezionato) return;
    return aggiornaSelezionatoConOpzioni(modifiche);
  }

  function aggiornaSelezionatoConOpzioni(modifiche, opzioni = {}) {
    if (!cantiereSelezionato) return null;
    const idTarget = cantiereSelezionato.id;
    return aggiornaCantiereConEventi(idTarget, (precedente) => {
      let prossimo = aggiornaCantiere(precedente, modifiche);
      prossimo = appendDiarioEvents(
        prossimo,
        [...creaEventiAutomatici(precedente, prossimo, opzioni), ...(opzioni.eventi || [])]
      );
      return prossimo;
    });
  }

  function iniziaLavoro() {
    if (!cantiereSelezionato) return;
    aggiornaSelezionatoConOpzioni(
      { stato: "In corso" },
      {
        skipStateEvent: true,
        eventi: [creaEventoCantiereAvviato(cantiereSelezionato)],
      }
    );
    setMessaggio("Lavoro avviato.");
  }

  function eliminaCantiere() {
    if (!cantiereSelezionato) return false;

    const esito = spostaNelCestino(
      TIPI_CESTINO.cantiere,
      cantiereSelezionato.id
    );
    if (!esito.success) return false;

    const cantieriAggiornati = leggiCantieriTutti();
    setCantieri(cantieriAggiornati);
    const ancoraAttivi = filtraRecordAttivi(cantieriAggiornati);
    setCantiereSelezionatoId(ancoraAttivi[0]?.id || "");
    setMessaggio("Elemento spostato nel Cestino.");
    return true;
  }

  function aggiungiChecklist() {
    if (!cantiereSelezionato || !nuovaChecklist.trim()) return;
    const nuovaVoce = creaVoceChecklist(nuovaChecklist);

    aggiornaSelezionatoConOpzioni({
      checklist: [
        ...(cantiereSelezionato.checklist || []),
        nuovaVoce,
      ],
    }, {
      skipNoteEvent: true,
      eventi: [
        creaEventoChecklistAggiornata({
          azione: "aggiunta",
          testo: nuovaVoce.testo,
        }),
      ],
    });
    setNuovaChecklist("");
  }

  function aggiornaChecklist(voceId, modifiche) {
    if (!cantiereSelezionato) return;
    const precedente = (cantiereSelezionato.checklist || []).find(
      (voce) => String(voce.id) === String(voceId)
    );
    if (!precedente) return;
    const prossimo = { ...precedente, ...modifiche };
    let evento = null;
    if (precedente.completata !== prossimo.completata) {
      evento = creaEventoChecklistAggiornata({
        azione: prossimo.completata ? "completata" : "riaperta",
        testo: prossimo.testo,
        completata: prossimo.completata,
      });
    } else if (precedente.testo !== prossimo.testo) {
      evento = creaEventoChecklistAggiornata({
        azione: "aggiornata",
        testo: prossimo.testo,
      });
    }

    aggiornaSelezionatoConOpzioni({
      checklist: (cantiereSelezionato.checklist || []).map((voce) =>
        String(voce.id) === String(voceId)
          ? {
              ...voce,
              ...modifiche,
            }
          : voce
      ),
    }, { eventi: evento ? [evento] : [] });
  }

  function eliminaChecklist(voceId) {
    if (!cantiereSelezionato) return;
    const precedente = (cantiereSelezionato.checklist || []).find(
      (voce) => String(voce.id) === String(voceId)
    );

    aggiornaSelezionatoConOpzioni({
      checklist: (cantiereSelezionato.checklist || []).filter(
        (voce) => String(voce.id) !== String(voceId)
      ),
    }, {
      eventi: precedente
        ? [
            creaEventoChecklistAggiornata({
              azione: "rimossa",
              testo: precedente.testo,
            }),
          ]
        : [],
    });
  }

  function aggiornaCampoMateriale(campo, valore) {
    setNuovoMateriale((precedente) => ({
      ...precedente,
      [campo]: valore,
    }));
  }

  function aggiungiMaterialeDaPayload(input = {}) {
    if (!cantiereSelezionato) return null;
    const nome = String(input.nome || "").trim();
    if (!nome) return null;

    const materiale = creaMateriale({
      nome,
      quantita: input.quantita,
      unita: input.unita || "cad",
      famigliaId: input.famigliaId,
      varianteId: input.varianteId,
      distintaId: input.distintaId,
      distintaVoceId: input.distintaVoceId,
      note: input.note,
      prezzoUnitario: input.prezzoUnitario,
      origine:
        input.origine ||
        (input.famigliaId || input.varianteId ? "catalogo" : "manuale"),
    });

    const materiali = [
      ...(cantiereSelezionato.materiali || []),
      materiale,
    ];

    aggiornaSelezionatoConOpzioni(
      { materiali },
      { eventi: [creaEventoMaterialeAggiunto(materiale)] }
    );

    sincronizzaListaSpesaDaCantiere({
      ...cantiereSelezionato,
      materiali,
    });
    setNuovoMateriale(FORM_MATERIALE_INIZIALE);
    return materiale;
  }

  function aggiungiMateriale() {
    if (!cantiereSelezionato || !nuovoMateriale.nome.trim()) return;
    aggiungiMaterialeDaPayload({
      nome: nuovoMateriale.nome,
      quantita: nuovoMateriale.quantita,
      unita: nuovoMateriale.unita,
      origine: "manuale",
    });
  }

  function eliminaMateriale(materialeId) {
    if (!cantiereSelezionato) return;
    const materialeEliminato = (cantiereSelezionato.materiali || []).find(
      (materiale) => String(materiale.id) === String(materialeId)
    );
    const materiali = (cantiereSelezionato.materiali || []).filter(
      (materiale) => String(materiale.id) !== String(materialeId)
    );

    aggiornaSelezionato({ materiali });

    if (materialeEliminato) {
      sincronizzaEliminazioneMaterialeSuLista(
        { ...cantiereSelezionato, materiali },
        materialeEliminato
      );
    }
  }

  function toggleMaterialeAcquistato(materialeId) {
    if (!cantiereSelezionato) return;
    let materialeAggiornato = null;
    const materiali = (cantiereSelezionato.materiali || []).map((item) => {
      if (String(item.id) !== String(materialeId)) return item;
      materialeAggiornato = { ...item, acquistato: !item.acquistato };
      return materialeAggiornato;
    });
    if (!materialeAggiornato) return;

    aggiornaSelezionato({ materiali });
    sincronizzaAcquistatoMaterialeSuLista(
      { ...cantiereSelezionato, materiali },
      materialeAggiornato
    );
  }

  function sincronizzaVariantePreventivo(variante) {
    if (!cantiereSelezionato?.preventivoId || !variante) {
      return { success: false, error: "preventivo_non_collegato" };
    }
    const risultato = sincronizzaVarianteSuPreventivo(
      cantiereSelezionato.preventivoId,
      variante
    );
    if (risultato.success) {
      setMessaggio("Preventivo aggiornato con la variante.");
    } else {
      setMessaggio(risultato.error || "Aggiornamento preventivo non riuscito.");
    }
    return risultato;
  }

  function creaVariante(dati = {}, opzioni = {}) {
    if (!cantiereSelezionato) {
      return { success: false, error: "cantiere_non_selezionato" };
    }
    const risultato = creaVarianteDomain({
      ...dati,
      cantiereId: cantiereSelezionato.id,
    });
    if (risultato.success) {
      if (
        opzioni.aggiornaPreventivo &&
        cantiereSelezionato.preventivoId &&
        risultato.variante
      ) {
        sincronizzaVarianteSuPreventivo(
          cantiereSelezionato.preventivoId,
          risultato.variante
        );
      }
      setVariantiTick((n) => n + 1);
      if (risultato.variante) {
        aggiornaSelezionatoConOpzioni({}, {
          skipNoteEvent: true,
          skipPagamentoEvent: true,
          skipStateEvent: true,
          eventi: [creaEventoVariante(risultato.variante, "creata")],
        });
      }
      setMessaggio(
        risultato.duplicato
          ? "Variante già presente come proposta."
          : opzioni.aggiornaPreventivo
            ? "Variante registrata e preventivo aggiornato."
            : "Variante proposta registrata."
      );
    } else {
      setMessaggio(risultato.error || "Impossibile creare la variante.");
    }
    return risultato;
  }

  function approvaVariante(varianteId) {
    const risultato = approvaVarianteDomain(varianteId);
    if (risultato.success) {
      if (risultato.variante) {
        aggiornaSelezionatoConOpzioni({}, {
          skipNoteEvent: true,
          skipPagamentoEvent: true,
          skipStateEvent: true,
          eventi: [creaEventoVariante(risultato.variante, "approvata")],
        });
      }
      setVariantiTick((n) => n + 1);
      setMessaggio("Variante approvata.");
    } else {
      setMessaggio(risultato.error || "Approvazione non riuscita.");
    }
    return risultato;
  }

  function eseguiVariante(varianteId) {
    const risultato = eseguiVarianteDomain(varianteId);
    if (risultato.success) {
      if (risultato.variante) {
        aggiornaSelezionatoConOpzioni({}, {
          skipNoteEvent: true,
          skipPagamentoEvent: true,
          skipStateEvent: true,
          eventi: [creaEventoVariante(risultato.variante, "eseguita")],
        });
      }
      setVariantiTick((n) => n + 1);
      setMessaggio("Variante eseguita.");
    } else {
      setMessaggio(risultato.error || "Esecuzione non riuscita.");
    }
    return risultato;
  }

  function annullaVariante(varianteId) {
    const risultato = annullaVarianteDomain(varianteId);
    if (risultato.success) {
      if (risultato.variante) {
        aggiornaSelezionatoConOpzioni({}, {
          skipNoteEvent: true,
          skipPagamentoEvent: true,
          skipStateEvent: true,
          eventi: [creaEventoVariante(risultato.variante, "annullata")],
        });
      }
      setVariantiTick((n) => n + 1);
      setMessaggio("Variante annullata.");
    } else {
      setMessaggio(risultato.error || "Annullamento non riuscito.");
    }
    return risultato;
  }

  /** @deprecated Usa creaVariante */
  function aggiungiVariante(variante) {
    return creaVariante({
      ...variante,
      titolo: variante?.titolo || variante?.descrizione,
      descrizione: variante?.descrizione || variante?.titolo,
      importo: variante?.importo ?? variante?.totale,
    });
  }

  /** @deprecated Preferire annullaVariante */
  function eliminaVariante(varianteId) {
    return annullaVariante(varianteId);
  }

  function completaLavoro() {
    if (!cantiereSelezionato) return { success: false };
    if (cantiereSelezionato.stato === "Completato") {
      return { success: true, cantiere: cantiereSelezionato, giaCompletato: true };
    }

    const cantiereCompletatoBase = aggiornaCantiere(cantiereSelezionato, {
      stato: "Completato",
    });
    const cantiereCompletato = appendDiarioEvents(cantiereCompletatoBase, [
      creaEventoCantiereCompletato(cantiereSelezionato),
    ]);

    salvaListaCantieri(
      cantieri.map((cantiere) =>
        String(cantiere.id) === String(cantiereSelezionato.id)
          ? cantiereCompletato
          : cantiere
      )
    );

    if (cantiereCompletato.preventivoId) {
      completaLavoroDaCantiere(cantiereCompletato.preventivoId, {
        cantiereId: cantiereCompletato.id,
      });
    }

    registraEsperienzaCompletamento(cantiereCompletato);
    setMessaggio("Lavoro finito.");
    return { success: true, cantiere: cantiereCompletato };
  }

  async function aggiungiFoto(event) {
    const file = event.target.files?.[0];
    const idTarget = cantiereSelezionato?.id;

    if (!file || !idTarget) return;

    if (!fileFotoValido(file)) {
      setMessaggio("Seleziona una foto valida.");
      event.target.value = "";
      return;
    }

    try {
      setMessaggio("Elaborazione immagine...");
      const nuovaFoto = await preparaFotoCantiere(file);

      setCantieri((precedenti) => {
        const aggiornati = precedenti.map((cantiere) =>
          String(cantiere.id) === String(idTarget)
            ? appendDiarioEvents(
                aggiornaCantiere(cantiere, {
                  foto: [...(cantiere.foto || []), nuovaFoto],
                }),
                [creaEventoFotoAggiunta(nuovaFoto)]
              )
            : cantiere
        );
        salvaCantieri(aggiornati);
        return aggiornati;
      });
      setMessaggio("Foto aggiunta con successo.");
    } catch (e) {
      console.error("Errore elaborazione foto:", e);
      setMessaggio("Impossibile elaborare l'immagine.");
    } finally {
      event.target.value = "";
    }
  }

  function eliminaFoto(fotoId) {
    if (!cantiereSelezionato) return;

    const fotoDaEliminare = (cantiereSelezionato.foto || []).find(
      (foto) => String(foto.id) === String(fotoId)
    );

    eliminaStorageFotoCantiere(fotoDaEliminare);

    aggiornaSelezionato({
      foto: (cantiereSelezionato.foto || []).filter(
        (foto) => String(foto.id) !== String(fotoId)
      ),
    });
  }

  async function apriFoto(foto) {
    return risolviSrcFotoCantiere(foto);
  }

  function aggiungiNotaDiario(testo) {
    if (!cantiereSelezionato) return null;
    const evento = creaEventoNotaAggiunta(testo, { manuale: true });
    if (!evento) return null;
    return aggiornaSelezionatoConOpzioni(
      {},
      {
        skipNoteEvent: true,
        skipPagamentoEvent: true,
        skipStateEvent: true,
        eventi: [evento],
      }
    );
  }

  function aggiungiGiornata(input) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    try {
      const aggiornato = aggiornaCantiereConEventi(
        cantiereSelezionato.id,
        (precedente) =>
          aggiornaCantiere(aggiungiGiornataProgrammata(precedente, input), {})
      );
      return { success: true, cantiere: aggiornato };
    } catch (errore) {
      return { success: false, error: errore?.message || "giornata_non_valida" };
    }
  }

  function aggiornaGiornata(giornataId, modifiche) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    const aggiornato = aggiornaCantiereConEventi(
      cantiereSelezionato.id,
      (precedente) =>
        aggiornaCantiere(
          aggiornaGiornataProgrammata(precedente, giornataId, modifiche),
          {}
        )
    );
    return { success: true, cantiere: aggiornato };
  }

  function eliminaGiornata(giornataId) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    const aggiornato = aggiornaCantiereConEventi(
      cantiereSelezionato.id,
      (precedente) =>
        aggiornaCantiere(eliminaGiornataProgrammata(precedente, giornataId), {})
    );
    return { success: true, cantiere: aggiornato };
  }

  function aggiungiGiornataRegistro(input) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    try {
      const aggiornato = aggiornaCantiereConEventi(
        cantiereSelezionato.id,
        (precedente) =>
          aggiornaCantiere(aggiungiGiornataLavorativa(precedente, input), {})
      );
      return { success: true, cantiere: aggiornato };
    } catch (errore) {
      return { success: false, error: errore?.message || "giornata_non_valida" };
    }
  }

  function aggiornaGiornataRegistro(giornataId, modifiche) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    const aggiornato = aggiornaCantiereConEventi(
      cantiereSelezionato.id,
      (precedente) =>
        aggiornaCantiere(
          aggiornaGiornataLavorativa(precedente, giornataId, modifiche),
          {}
        )
    );
    return { success: true, cantiere: aggiornato };
  }

  function eliminaGiornataRegistro(giornataId) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    const aggiornato = aggiornaCantiereConEventi(
      cantiereSelezionato.id,
      (precedente) =>
        aggiornaCantiere(eliminaGiornataLavorativa(precedente, giornataId), {})
    );
    return { success: true, cantiere: aggiornato };
  }

  function aggiungiPagamento(input) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    try {
      const pagamentoId = String(input?.id || creaIdPagamento());
      let pagamentoSalvato = null;
      const aggiornato = aggiornaCantiereConEventi(
        cantiereSelezionato.id,
        (precedente) => {
          const next = aggiungiPagamentoDomain(precedente, {
            ...input,
            id: pagamentoId,
          });
          pagamentoSalvato =
            next.pagamenti.find((p) => String(p.id) === pagamentoId) || null;
          const evento = pagamentoSalvato
            ? creaEventoPagamentoRegistrato(
                {
                  pagamentoId: pagamentoSalvato.id,
                  importo: pagamentoSalvato.importo,
                  tipo: pagamentoSalvato.tipo,
                  metodo: pagamentoSalvato.metodo,
                },
                next.incassato
              )
            : null;
          return appendDiarioEvents(aggiornaCantiere(next, {}), [evento]);
        }
      );
      return { success: true, cantiere: aggiornato, pagamento: pagamentoSalvato };
    } catch (errore) {
      return { success: false, error: errore?.message || "pagamento_non_valido" };
    }
  }

  function aggiornaPagamento(pagamentoId, modifiche) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    try {
      let pagamentoSalvato = null;
      const aggiornato = aggiornaCantiereConEventi(
        cantiereSelezionato.id,
        (precedente) => {
          const next = aggiornaPagamentoDomain(precedente, pagamentoId, modifiche);
          pagamentoSalvato =
            next.pagamenti.find((p) => String(p.id) === String(pagamentoId)) ||
            null;
          const evento = pagamentoSalvato
            ? creaEventoPagamentoRegistrato(
                {
                  pagamentoId: pagamentoSalvato.id,
                  importo: pagamentoSalvato.importo,
                  tipo: pagamentoSalvato.tipo,
                  metodo: pagamentoSalvato.metodo,
                },
                next.incassato
              )
            : null;
          return appendDiarioEvents(aggiornaCantiere(next, {}), [evento]);
        }
      );
      return { success: true, cantiere: aggiornato, pagamento: pagamentoSalvato };
    } catch (errore) {
      return { success: false, error: errore?.message || "pagamento_non_valido" };
    }
  }

  function eliminaPagamento(pagamentoId) {
    if (!cantiereSelezionato) return { success: false, error: "nessun_cantiere" };
    const aggiornato = aggiornaCantiereConEventi(
      cantiereSelezionato.id,
      (precedente) =>
        aggiornaCantiere(eliminaPagamentoDomain(precedente, pagamentoId), {})
    );
    return { success: true, cantiere: aggiornato };
  }

  return {
    cantieri,
    cantieriAttivi,
    cantiereSelezionato,
    nuovoCantiere,
    nuovaChecklist,
    nuovoMateriale,
    messaggio,
    avanzamento,
    setCantiereSelezionatoId,
    setNuovaChecklist,
    aggiornaCampoNuovoCantiere,
    aggiungiCantiere,
    aggiornaSelezionato,
    iniziaLavoro,
    eliminaCantiere,
    aggiungiChecklist,
    aggiornaChecklist,
    eliminaChecklist,
    aggiornaCampoMateriale,
    aggiungiMateriale,
    aggiungiMaterialeDaPayload,
    eliminaMateriale,
    toggleMaterialeAcquistato,
    aggiungiVariante,
    eliminaVariante,
    creaVariante,
    sincronizzaVariantePreventivo,
    approvaVariante,
    eseguiVariante,
    annullaVariante,
    variantiTick,
    completaLavoro,
    aggiungiFoto,
    eliminaFoto,
    apriFoto,
    aggiungiNotaDiario,
    aggiungiGiornata,
    aggiornaGiornata,
    eliminaGiornata,
    aggiungiGiornataRegistro,
    aggiornaGiornataRegistro,
    eliminaGiornataRegistro,
    aggiungiPagamento,
    aggiornaPagamento,
    eliminaPagamento,
  };
}
