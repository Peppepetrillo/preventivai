/**
 * Registrazione movimenti da pagina Economia.
 * SoT:
 * - con cantiere → cantiere.pagamenti[] / cantiere.spese[] (nessuna copia in generali)
 * - senza cantiere → preventivai.economia.movimenti
 */

import {
  leggiCantieriTutti,
  salvaCantieri,
} from "../../repositories/cantieriRepository";
import { isRecordCestinato } from "../../domain/cestino";
import {
  aggiungiPagamento,
  TIPI_PAGAMENTO,
} from "../cantieri/services/pagamentiCantiereService";
import {
  aggiungiSpesa,
  CATEGORIE_SPESA,
  normalizzaCategoriaSpesa,
} from "../cantieri/services/speseCantiereService";
import { aggiungiMovimentoEconomiaGenerale } from "./economiaMovimentiRepository";
import {
  CATEGORIE_ENTRATA_ECONOMIA,
  ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA,
  ETICHETTE_CATEGORIA_USCITA_ECONOMIA,
} from "./economiaMovimentiTypes";
import { TIPO_MOVIMENTO_ECONOMIA } from "./economiaService";

function mappaTipoPagamentoDaCategoriaEntrata(categoria) {
  if (categoria === CATEGORIE_ENTRATA_ECONOMIA.acconto) {
    return TIPI_PAGAMENTO.acconto;
  }
  if (categoria === CATEGORIE_ENTRATA_ECONOMIA.saldo) {
    return TIPI_PAGAMENTO.saldo;
  }
  return TIPI_PAGAMENTO.altro;
}

/**
 * @param {{
 *   tipo: "entrata"|"uscita",
 *   importo: number,
 *   data: string,
 *   categoria: string,
 *   descrizione?: string,
 *   cantiereId?: string|null,
 * }} input
 */
export function registraMovimentoEconomia(input = {}) {
  const tipo =
    input.tipo === TIPO_MOVIMENTO_ECONOMIA.entrata ||
    input.tipo === TIPO_MOVIMENTO_ECONOMIA.uscita
      ? input.tipo
      : null;
  const data = String(input.data || "").trim();
  const importo = Number(input.importo);
  const descrizione = String(input.descrizione || "").trim();
  const cantiereId = String(input.cantiereId || "").trim();

  if (!tipo || !data || !(importo > 0)) {
    return { success: false, error: "dati_non_validi" };
  }

  if (cantiereId) {
    const cantieri = leggiCantieriTutti();
    const cantiere = cantieri.find((c) => String(c?.id) === cantiereId);
    if (!cantiere || isRecordCestinato(cantiere)) {
      return { success: false, error: "cantiere_non_trovato" };
    }

    let aggiornato;
    if (tipo === TIPO_MOVIMENTO_ECONOMIA.entrata) {
      const categoria = String(input.categoria || "altra_entrata")
        .trim()
        .toLowerCase();
      const tipoPagamento = mappaTipoPagamentoDaCategoriaEntrata(categoria);
      const note =
        descrizione ||
        ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA[categoria] ||
        "Entrata";
      aggiornato = aggiungiPagamento(cantiere, {
        data,
        importo,
        tipo: tipoPagamento,
        note,
      });
    } else {
      const categoria = normalizzaCategoriaSpesa(
        input.categoria || CATEGORIE_SPESA.altro
      );
      const desc =
        descrizione ||
        ETICHETTE_CATEGORIA_USCITA_ECONOMIA[categoria] ||
        "Uscita";
      aggiornato = aggiungiSpesa(cantiere, {
        data,
        importo,
        categoria,
        descrizione: desc,
      });
    }

    salvaCantieri(
      cantieri.map((c) => (String(c?.id) === cantiereId ? aggiornato : c))
    );

    return {
      success: true,
      origine: "cantiere",
      cantiereId,
      cantiere: aggiornato,
    };
  }

  const categoria =
    tipo === TIPO_MOVIMENTO_ECONOMIA.entrata
      ? String(input.categoria || CATEGORIE_ENTRATA_ECONOMIA.altra_entrata)
          .trim()
          .toLowerCase()
      : normalizzaCategoriaSpesa(input.categoria || CATEGORIE_SPESA.altro);

  const movimento = aggiungiMovimentoEconomiaGenerale({
    tipo,
    data,
    importo,
    categoria,
    descrizione:
      descrizione ||
      (tipo === TIPO_MOVIMENTO_ECONOMIA.entrata
        ? ETICHETTE_CATEGORIA_ENTRATA_ECONOMIA[categoria]
        : ETICHETTE_CATEGORIA_USCITA_ECONOMIA[categoria]) ||
      (tipo === TIPO_MOVIMENTO_ECONOMIA.entrata ? "Entrata" : "Uscita"),
  });

  if (!movimento) {
    return { success: false, error: "movimento_non_valido" };
  }

  return {
    success: true,
    origine: "generale",
    movimento,
  };
}
