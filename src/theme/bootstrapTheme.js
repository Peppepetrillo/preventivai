/**
 * Applica il tema prima del primo paint React (evita flash).
 */
import {
  applicaTemaDom,
  risolviTemaEffettivo,
} from "./themeDomain";
import { leggiPreferenzaTema } from "./themeStorage";

applicaTemaDom(risolviTemaEffettivo(leggiPreferenzaTema()));
