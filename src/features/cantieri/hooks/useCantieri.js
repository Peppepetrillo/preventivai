import { useMemo, useState } from "react";
import {
  calcolaAvanzamentoChecklist,
  creaCantiere,
  creaMateriale,
  creaVoceChecklist,
  aggiornaCantiere,
} from "../cantieriDomain";
import { leggiCantieri, salvaCantieri } from "../../../repositories/cantieriRepository";
import {
  apriFotoCantiere,
  eliminaStorageFotoCantiere,
  eliminaStorageFotoCantieri,
  fileFotoValido,
  preparaFotoCantiere,
} from "../services/cantieriFotoService";
import { registraEsperienzaCompletamento } from "../../../services/experienceService";

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

export function useCantieri({ cantiereInizialeId = "" } = {}) {
  const [cantieri, setCantieri] = useState(() => leggiCantieri());
  const [cantiereSelezionatoId, setCantiereSelezionatoId] = useState(
    () => cantiereInizialeId || cantieri[0]?.id || ""
  );
  const [nuovoCantiere, setNuovoCantiere] = useState(FORM_CANTIERE_INIZIALE);
  const [nuovaChecklist, setNuovaChecklist] = useState("");
  const [nuovoMateriale, setNuovoMateriale] = useState(FORM_MATERIALE_INIZIALE);
  const [messaggio, setMessaggio] = useState("");

  const cantiereSelezionato = useMemo(
    () =>
      cantieri.find(
        (cantiere) => String(cantiere.id) === String(cantiereSelezionatoId)
      ) || cantieri[0],
    [cantieri, cantiereSelezionatoId]
  );

  const avanzamento = cantiereSelezionato
    ? calcolaAvanzamentoChecklist(cantiereSelezionato.checklist || [])
    : 0;

  function salvaListaCantieri(cantieriAggiornati) {
    setCantieri(cantieriAggiornati);
    salvaCantieri(cantieriAggiornati);
  }

  function aggiornaCampoNuovoCantiere(campo, valore) {
    setNuovoCantiere({
      ...nuovoCantiere,
      [campo]: valore,
    });
  }

  function aggiungiCantiere() {
    if (!nuovoCantiere.nome.trim()) {
      setMessaggio("Inserisci il nome del cantiere.");
      return;
    }

    const cantiere = creaCantiere(nuovoCantiere);
    const cantieriAggiornati = [cantiere, ...cantieri];

    salvaListaCantieri(cantieriAggiornati);
    setCantiereSelezionatoId(cantiere.id);
    setNuovoCantiere(FORM_CANTIERE_INIZIALE);
    setMessaggio("Cantiere creato sul dispositivo.");
  }

  function aggiornaSelezionato(modifiche) {
    if (!cantiereSelezionato) return;

    salvaListaCantieri(
      cantieri.map((cantiere) =>
        String(cantiere.id) === String(cantiereSelezionato.id)
          ? aggiornaCantiere(cantiere, modifiche)
          : cantiere
      )
    );
  }

  function eliminaCantiere() {
    if (!cantiereSelezionato) return;

    const conferma = window.confirm(
      `Eliminare il cantiere ${cantiereSelezionato.nome}?`
    );

    if (!conferma) return;

    eliminaStorageFotoCantieri(cantiereSelezionato.foto || []);

    const cantieriAggiornati = cantieri.filter(
      (cantiere) => String(cantiere.id) !== String(cantiereSelezionato.id)
    );

    salvaListaCantieri(cantieriAggiornati);
    setCantiereSelezionatoId(cantieriAggiornati[0]?.id || "");
    setMessaggio("Cantiere eliminato.");
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
    aggiornaSelezionato({
      checklist: (cantiereSelezionato.checklist || []).filter(
        (voce) => String(voce.id) !== String(voceId)
      ),
    });
  }

  function aggiornaCampoMateriale(campo, valore) {
    setNuovoMateriale({
      ...nuovoMateriale,
      [campo]: valore,
    });
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
    aggiornaSelezionato({
      materiali: (cantiereSelezionato.materiali || []).filter(
        (materiale) => String(materiale.id) !== String(materialeId)
      ),
    });
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

    if (!file || !cantiereSelezionato) return;

    if (!fileFotoValido(file)) {
      setMessaggio("Seleziona una foto valida.");
      event.target.value = "";
      return;
    }

    try {
      setMessaggio("Elaborazione immagine...");
      const nuovaFoto = await preparaFotoCantiere(file);

      aggiornaSelezionato({
        foto: [...(cantiereSelezionato.foto || []), nuovaFoto],
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
    eliminaCantiere,
    aggiungiChecklist,
    aggiornaChecklist,
    eliminaChecklist,
    aggiornaCampoMateriale,
    aggiungiMateriale,
    eliminaMateriale,
    completaLavoro,
    aggiungiFoto,
    eliminaFoto,
    apriFoto,
  };
}
