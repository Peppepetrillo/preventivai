import { useMemo, useState } from "react";
import {
  calcolaAvanzamentoChecklist,
  creaCantiere,
  creaMateriale,
  creaVoceChecklist,
  aggiornaCantiere,
} from "../cantieriDomain";
import { useDatiLocaliSincronizzati } from "../../../hooks/useDatiLocaliSincronizzati";
import { leggiCantieri, salvaCantieri } from "../../../repositories/cantieriRepository";
import {
  apriFotoCantiere,
  eliminaStorageFotoCantiere,
  eliminaStorageFotoCantieri,
  fileFotoValido,
  preparaFotoCantiere,
} from "../services/cantieriFotoService";
import { registraEsperienzaCompletamento } from "../../../services/experienceService";
import {
  annullaVariante as annullaVarianteDomain,
  approvaVariante as approvaVarianteDomain,
  creaVariante as creaVarianteDomain,
  eseguiVariante as eseguiVarianteDomain,
} from "../../../domain/varianti";

const FORM_CANTIERE_INIZIALE = {
  nome: "",
  cliente: "",
  indirizzo: "",
};

const FORM_MATERIALE_INIZIALE = {
  nome: "",
  quantita: "",
  unita: "cad",
};

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

  const [cantieri, setCantieri] = useDatiLocaliSincronizzati(leggiCantieri);
  const [cantiereSelezionatoIdInterno, setCantiereSelezionatoIdInterno] =
    useState(() => idEsterno || cantieri[0]?.id || "");
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
    return trovato || cantieri[0] || null;
  }, [cantieri, cantiereSelezionatoId, idEsterno]);

  const avanzamento = cantiereSelezionato
    ? calcolaAvanzamentoChecklist(cantiereSelezionato.checklist || [])
    : 0;

  function salvaListaCantieri(cantieriAggiornati) {
    setCantieri(cantieriAggiornati);
    salvaCantieri(cantieriAggiornati);
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

    const idTarget = cantiereSelezionato.id;

    salvaListaCantieri(
      cantieri.map((cantiere) =>
        String(cantiere.id) === String(idTarget)
          ? aggiornaCantiere(cantiere, modifiche)
          : cantiere
      )
    );
  }

  function iniziaLavoro() {
    if (!cantiereSelezionato) return;
    aggiornaSelezionato({ stato: "In corso" });
    setMessaggio("Lavoro avviato.");
  }

  function eliminaCantiere() {
    if (!cantiereSelezionato) return false;

    const conferma = window.confirm(
      `Eliminare il cantiere ${cantiereSelezionato.nome}?`
    );

    if (!conferma) return false;

    eliminaStorageFotoCantieri(cantiereSelezionato.foto || []);

    const cantieriAggiornati = cantieri.filter(
      (cantiere) => String(cantiere.id) !== String(cantiereSelezionato.id)
    );

    salvaListaCantieri(cantieriAggiornati);
    setCantiereSelezionatoId(cantieriAggiornati[0]?.id || "");
    setMessaggio("Cantiere eliminato.");
    return true;
  }

  function aggiungiChecklist() {
    if (!cantiereSelezionato || !nuovaChecklist.trim()) return;

    aggiornaSelezionato({
      checklist: [
        ...(cantiereSelezionato.checklist || []),
        creaVoceChecklist(nuovaChecklist),
      ],
    });
    setNuovaChecklist("");
  }

  function aggiornaChecklist(voceId, modifiche) {
    if (!cantiereSelezionato) return;

    aggiornaSelezionato({
      checklist: (cantiereSelezionato.checklist || []).map((voce) =>
        String(voce.id) === String(voceId)
          ? {
              ...voce,
              ...modifiche,
            }
          : voce
      ),
    });
  }

  function eliminaChecklist(voceId) {
    if (!cantiereSelezionato) return;

    aggiornaSelezionato({
      checklist: (cantiereSelezionato.checklist || []).filter(
        (voce) => String(voce.id) !== String(voceId)
      ),
    });
  }

  function aggiornaCampoMateriale(campo, valore) {
    setNuovoMateriale((precedente) => ({
      ...precedente,
      [campo]: valore,
    }));
  }

  function aggiungiMateriale() {
    if (!cantiereSelezionato || !nuovoMateriale.nome.trim()) return;

    aggiornaSelezionato({
      materiali: [
        ...(cantiereSelezionato.materiali || []),
        creaMateriale(nuovoMateriale),
      ],
    });
    setNuovoMateriale(FORM_MATERIALE_INIZIALE);
  }

  function eliminaMateriale(materialeId) {
    if (!cantiereSelezionato) return;

    aggiornaSelezionato({
      materiali: (cantiereSelezionato.materiali || []).filter(
        (materiale) => String(materiale.id) !== String(materialeId)
      ),
    });
  }

  function creaVariante(dati = {}) {
    if (!cantiereSelezionato) {
      return { success: false, error: "cantiere_non_selezionato" };
    }
    const risultato = creaVarianteDomain({
      ...dati,
      cantiereId: cantiereSelezionato.id,
    });
    if (risultato.success) {
      setVariantiTick((n) => n + 1);
      setMessaggio(
        risultato.duplicato
          ? "Variante già presente come proposta."
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
    if (!cantiereSelezionato) return;

    const cantiereCompletato = aggiornaCantiere(cantiereSelezionato, {
      stato: "Completato",
    });

    salvaListaCantieri(
      cantieri.map((cantiere) =>
        String(cantiere.id) === String(cantiereSelezionato.id)
          ? cantiereCompletato
          : cantiere
      )
    );

    registraEsperienzaCompletamento(cantiereCompletato);
    setMessaggio("Lavoro completato.");
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
            ? aggiornaCantiere(cantiere, {
                foto: [...(cantiere.foto || []), nuovaFoto],
              })
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
    try {
      await apriFotoCantiere(foto);
    } catch (errore) {
      console.error("Errore apertura foto:", errore);
      setMessaggio("Non riesco ad aprire la foto completa.");
    }
  }

  return {
    cantieri,
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
    eliminaMateriale,
    aggiungiVariante,
    eliminaVariante,
    creaVariante,
    approvaVariante,
    eseguiVariante,
    annullaVariante,
    variantiTick,
    completaLavoro,
    aggiungiFoto,
    eliminaFoto,
    apriFoto,
  };
}
