/**
 * Catalogo strumenti Calcoli elettrici (hub).
 */

export const CALCOLATORI = Object.freeze([
  {
    id: "ohm",
    titolo: "Legge di Ohm",
    sottotitolo: "V, I, R",
    pathKey: "calcoliOhm",
    icon: "Zap",
  },
  {
    id: "potenza",
    titolo: "Potenza e corrente",
    sottotitolo: "Monofase e trifase",
    pathKey: "calcoliPotenza",
    icon: "Plug",
  },
  {
    id: "caduta",
    titolo: "Caduta di tensione",
    sottotitolo: "Calcolo indicativo",
    pathKey: "calcoliCaduta",
    icon: "Ruler",
  },
  {
    id: "sezione",
    titolo: "Stima sezione cavo",
    sottotitolo: "Criterio caduta di tensione",
    pathKey: "calcoliSezione",
    icon: "Cable",
  },
  {
    id: "consumo",
    titolo: "Consumo",
    sottotitolo: "Energia e stima costo",
    pathKey: "calcoliConsumo",
    icon: "Battery",
  },
  {
    id: "conversioni",
    titolo: "Conversioni",
    sottotitolo: "W, A, V, Ω, lunghezze",
    pathKey: "calcoliConversioni",
    icon: "ArrowLeftRight",
  },
  {
    id: "carico",
    titolo: "Stima del carico",
    sottotitolo: "Potenza installata",
    pathKey: "calcoliCarico",
    icon: "Home",
  },
]);
