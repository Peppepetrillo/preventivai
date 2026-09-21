import {
  BookMarked,
  Cloud,
  Fingerprint,
  Mic,
  NotebookPen,
  Shield,
  Tags,
  Wallet,
} from "lucide-react";

/**
 * Catalogo roadmap 2.0 — solo UI/docs. Nessuna implementazione.
 */
export const PROSSIMAMENTE_VOCI = Object.freeze([
  {
    id: "voce-avanzata",
    titolo: "Preventivo vocale avanzato",
    descrizione:
      "Modifica il preventivo con la voce e amplia il flusso vocale.",
    badge: "IN ARRIVO",
    Icon: Mic,
  },
  {
    id: "face-id",
    titolo: "Accesso con Face ID",
    descrizione: "Accedi ancora più velocemente e in sicurezza.",
    badge: "PROSSIMA VERSIONE",
    Icon: Fingerprint,
  },
  {
    id: "protezione-dati",
    titolo: "Protezione avanzata dei dati",
    descrizione: "Maggiore protezione per i tuoi dati e documenti.",
    badge: "PROSSIMA VERSIONE",
    Icon: Shield,
  },
  {
    id: "economia-avanzata",
    titolo: "Economia avanzata",
    descrizione:
      "Una visione ancora più completa dell’andamento economico.",
    badge: "IN ARRIVO",
    Icon: Wallet,
  },
  {
    id: "diario",
    titolo: "Diario di cantiere evoluto",
    descrizione:
      "Registra e ritrova rapidamente ciò che succede durante il lavoro.",
    badge: "IN ARRIVO",
    Icon: NotebookPen,
  },
  {
    id: "listini-marchi",
    titolo: "Listini e marchi",
    descrizione:
      "Gestisci più listini e lavora più velocemente con i tuoi materiali.",
    badge: "PROSSIMA VERSIONE",
    Icon: Tags,
  },
  {
    id: "backup-evoluto",
    titolo: "Backup evoluto",
    descrizione:
      "Continua a lavorare con maggiore tranquillità anche cambiando dispositivo.",
    badge: "IN ARRIVO",
    Icon: Cloud,
  },
  {
    id: "pdf-voce",
    titolo: "PDF dalla voce",
    descrizione: "Dal comando vocale al documento, con conferma esplicita.",
    badge: "PROSSIMA VERSIONE",
    Icon: BookMarked,
  },
]);
