export const DIARIO_EVENT_TYPES = {
  CANTIERE_CREATO: "cantiere-creato",
  CANTIERE_AVVIATO: "cantiere-avviato",
  CANTIERE_COMPLETATO: "cantiere-completato",
  STATO_CAMBIATO: "stato-cambiato",
  FOTO: "foto",
  NOTA: "nota",
  NOTA_MANUALE: "nota-manuale",
  MATERIALE: "materiale",
  CHECKLIST: "checklist",
  PAGAMENTO: "pagamento",
  VARIANTE: "variante",
};

export const DIARIO_FILTERS = [
  { id: "tutti", label: "Tutti" },
  { id: DIARIO_EVENT_TYPES.FOTO, label: "Foto" },
  { id: DIARIO_EVENT_TYPES.NOTA, label: "Note" },
  { id: DIARIO_EVENT_TYPES.MATERIALE, label: "Materiali" },
  { id: DIARIO_EVENT_TYPES.PAGAMENTO, label: "Pagamenti" },
  { id: DIARIO_EVENT_TYPES.VARIANTE, label: "Lavori extra" },
  { id: DIARIO_EVENT_TYPES.CHECKLIST, label: "Checklist" },
];

export const DIARIO_EVENT_TYPE_META = {
  [DIARIO_EVENT_TYPES.CANTIERE_CREATO]: { icon: "🏗", label: "Cantiere creato" },
  [DIARIO_EVENT_TYPES.CANTIERE_AVVIATO]: { icon: "🟢", label: "Cantiere avviato" },
  [DIARIO_EVENT_TYPES.CANTIERE_COMPLETATO]: { icon: "✅", label: "Cantiere completato" },
  [DIARIO_EVENT_TYPES.STATO_CAMBIATO]: { icon: "🔄", label: "Stato cantiere" },
  [DIARIO_EVENT_TYPES.FOTO]: { icon: "📷", label: "Foto aggiunta" },
  [DIARIO_EVENT_TYPES.NOTA]: { icon: "📝", label: "Nota" },
  [DIARIO_EVENT_TYPES.NOTA_MANUALE]: { icon: "📝", label: "Nota" },
  [DIARIO_EVENT_TYPES.MATERIALE]: { icon: "🧰", label: "Materiale" },
  [DIARIO_EVENT_TYPES.CHECKLIST]: { icon: "☑️", label: "Checklist" },
  [DIARIO_EVENT_TYPES.PAGAMENTO]: { icon: "💰", label: "Pagamento" },
  [DIARIO_EVENT_TYPES.VARIANTE]: { icon: "📋", label: "Lavoro extra" },
};
