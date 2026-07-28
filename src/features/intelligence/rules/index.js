import materialeDaComprare from "./materialeDaComprare";
import checklistIncompleta from "./checklistIncompleta";
import saldoDaIncassare from "./saldoDaIncassare";
import variantiNonSincronizzate from "./variantiNonSincronizzate";
import fotoMancanti from "./fotoMancanti";
import preventivoInviatoScaduto from "./preventivoInviatoScaduto";

/** Catalogo regole Intelligence v1 (ordine di registrazione irrilevante: conta priority). */
export const INTELLIGENCE_RULES = [
  materialeDaComprare,
  checklistIncompleta,
  saldoDaIncassare,
  variantiNonSincronizzate,
  fotoMancanti,
  preventivoInviatoScaduto,
];

export {
  materialeDaComprare,
  checklistIncompleta,
  saldoDaIncassare,
  variantiNonSincronizzate,
  fotoMancanti,
  preventivoInviatoScaduto,
};
