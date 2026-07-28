export { INTELLIGENCE_RULES } from "./rules";
export {
  MAX_SUGGERIMENTI,
  PRIORITA,
  GIORNI_PREVENTIVO_INVIATO,
} from "./engine/constants";
export { createSuggestion } from "./engine/createSuggestion";
export { runIntelligenceEngine } from "./engine/runIntelligenceEngine";
export {
  dedupeSuggestions,
  sortSuggestionsByPriority,
  filterSessionSuggestions,
} from "./engine/prioritize";
export {
  leggiSessioneIntelligence,
  ignoraSuggerimentoSessione,
  risolviSuggerimentoSessione,
  resetSessioneIntelligence,
} from "./engine/sessionStore";
export { usePreventivAISuggestions } from "./hooks/usePreventivAISuggestions";
export { default as PreventivAISuggestions } from "./components/PreventivAISuggestions";
