import jsPDF from "jspdf";

import {
  aggregaVociAcquisto,
  raggruppaAcquistiPerLavoro,
} from "../../domain/listaSpesa";
import { unitaAcquistoInLettura } from "../../domain/listaSpesa/listaSpesaDomain";
import {
  applicaFont,
  areaUtile,
  assicuratiSpazio,
  setFill,
  setText,
  testoMultilinea,
} from "../../domain/pdf/pdfLayoutService";
import { risolviPdfSettings } from "../../domain/pdf/pdfTypes";
import { isPiattaformaNativa } from "../../utils/nativeExport";
import { MODALITA_CONDIVIDI_ACQUISTI } from "./acquistiTestoService";

/**
 * PDF Lista acquisti — riusa layout Distinta, non tocca PDF preventivi.
 *
 * @param {{
 *   voci?: object[],
 *   modalita?: string,
 *   mostraPrezzi?: boolean,
 *   includiAcquistati?: boolean,
 *   cantieri?: object[],
 *   datiAzienda?: object,
 *   salva?: boolean,
 * }} opzioni
 */
export async function generaPdfAcquisti({
  voci = [],
  modalita = MODALITA_CONDIVIDI_ACQUISTI.perLavoro,
  mostraPrezzi = false,
  includiAcquistati = false,
  cantieri = [],
  datiAzienda = {},
  salva = false,
} = {}) {
  const settings = risolviPdfSettings({
    colorePrincipale: datiAzienda?.pdfSettings?.colorePrincipale,
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const area = areaUtile(settings);
  let y = area.yTop + 4;

  const soloDaComprare = !includiAcquistati;
  const data = new Date().toLocaleDateString("it-IT");
  const etichettaModalita =
    modalita === MODALITA_CONDIVIDI_ACQUISTI.perFornitore
      ? "Per fornitore (aggregata)"
      : "Per lavoro";

  setText(doc, settings.coloreSecondario);
  applicaFont(doc, settings, "bold", settings.fontSizeTitolo + 2);
  doc.text("Lista acquisti", area.x, y);
  y += 10;

  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "normal", settings.fontSizeBase);
  y = testoMultilinea(
    doc,
    `Data: ${data}`,
    area.x,
    y,
    area.width,
    settings.fontSizeBase + 1.5
  );
  y = testoMultilinea(
    doc,
    `Modalità: ${etichettaModalita}`,
    area.x,
    y,
    area.width,
    settings.fontSizeBase + 1.5
  );
  y += 4;

  let totaleImporto = null;

  if (modalita === MODALITA_CONDIVIDI_ACQUISTI.perFornitore) {
    const aggregati = aggregaVociAcquisto(voci, { soloDaComprare });
    y = disegnaIntestazioneTabella(doc, settings, area, y, mostraPrezzi);

    if (aggregati.length === 0) {
      setText(doc, settings.coloreTesto);
      applicaFont(doc, settings, "normal", settings.fontSizeBase);
      doc.text("Nessun materiale da acquistare.", area.x, y);
      y += 8;
    } else {
      for (const agg of aggregati) {
        y = disegnaRigaMateriale(doc, settings, area, y, {
          nome: agg.nome,
          quantita: agg.quantitaTotale,
          unita: agg.unita,
          prezzoUnitario: prezzoUnitarioAggregato(agg),
          note: provenanceNote(agg),
          mostraPrezzi,
        });
        const rigaTot = importoAggregato(agg);
        if (rigaTot != null) {
          totaleImporto = (totaleImporto || 0) + rigaTot;
        }
      }
    }
  } else {
    const gruppi = raggruppaAcquistiPerLavoro(voci, {
      cantieri,
      soloDaComprare,
    });

    if (gruppi.length === 0) {
      y = disegnaIntestazioneTabella(doc, settings, area, y, mostraPrezzi);
      setText(doc, settings.coloreTesto);
      applicaFont(doc, settings, "normal", settings.fontSizeBase);
      doc.text("Nessun materiale da acquistare.", area.x, y);
      y += 8;
    } else {
      for (const gruppo of gruppi) {
        y = assicuratiSpazio(doc, settings, y, 16, () => {
          doc.addPage();
          return settings.margine + 8;
        });

        const titolo = [gruppo.cliente, gruppo.titoloLavoro]
          .filter(Boolean)
          .join(" — ");
        setText(doc, settings.coloreTesto);
        applicaFont(doc, settings, "bold", settings.fontSizeBase + 1);
        y = testoMultilinea(
          doc,
          titolo || "Lavoro",
          area.x,
          y,
          area.width,
          settings.fontSizeBase + 1.5
        );
        y += 2;

        y = disegnaIntestazioneTabella(doc, settings, area, y, mostraPrezzi);

        for (const voce of gruppo.voci || []) {
          y = disegnaRigaMateriale(doc, settings, area, y, {
            nome: voce.nome,
            quantita: voce.quantita,
            unita: unitaAcquistoInLettura(voce.unita) || voce.unita,
            prezzoUnitario: voce.prezzoUnitario,
            note: voce.note,
            mostraPrezzi,
          });
          if (mostraPrezzi && voce.prezzoUnitario != null) {
            const p = Number(voce.prezzoUnitario);
            const q = Number(voce.quantita);
            if (Number.isFinite(p) && Number.isFinite(q)) {
              totaleImporto = (totaleImporto || 0) + p * q;
            }
          }
        }
        y += 4;
      }
    }
  }

  if (mostraPrezzi && totaleImporto != null) {
    y = assicuratiSpazio(doc, settings, y, 16, () => {
      doc.addPage();
      return settings.margine + 8;
    });
    y += 4;
    setText(doc, settings.coloreTesto);
    applicaFont(doc, settings, "bold", settings.fontSizeBase + 1);
    doc.text(`Totale indicativo: ${formatEuro(totaleImporto)}`, area.x, y);
  }

  const nomeFile = nomeFileAcquistiPdf({ modalita });
  const blob = doc.output("blob");
  const blobUrl =
    typeof URL !== "undefined" ? URL.createObjectURL(blob) : "";

  if (salva && !isPiattaformaNativa()) {
    doc.save(nomeFile);
  }

  return {
    doc,
    blob,
    blobUrl,
    nomeFile,
    pagine: doc.getNumberOfPages(),
  };
}

export function nomeFileAcquistiPdf({ modalita } = {}) {
  const suffix =
    modalita === MODALITA_CONDIVIDI_ACQUISTI.perFornitore
      ? "fornitore"
      : "lavoro";
  return `lista-acquisti-${suffix}.pdf`;
}

function disegnaIntestazioneTabella(doc, settings, area, y, mostraPrezzi) {
  let nextY = assicuratiSpazio(doc, settings, y, 12, () => {
    doc.addPage();
    return settings.margine + 8;
  });
  setFill(doc, settings.colorePrincipale);
  doc.roundedRect(area.x, nextY, area.width, 8, 2, 2, "F");
  setText(doc, settings.coloreBianco);
  applicaFont(doc, settings, "bold", settings.fontSizeBase);
  doc.text("Materiale", area.x + 2, nextY + 5.5);
  doc.text("Q.tà", area.x + area.width - 42, nextY + 5.5);
  if (mostraPrezzi) {
    doc.text("Prezzo", area.x + area.width - 22, nextY + 5.5);
  }
  return nextY + 12;
}

function disegnaRigaMateriale(doc, settings, area, y, riga) {
  let nextY = assicuratiSpazio(doc, settings, y, 14, () => {
    doc.addPage();
    return settings.margine + 8;
  });

  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "bold", settings.fontSizeBase);
  const nomeY = testoMultilinea(
    doc,
    String(riga.nome || "Materiale"),
    area.x,
    nextY,
    area.width - 50,
    settings.fontSizeBase + 1.2
  );

  applicaFont(doc, settings, "normal", settings.fontSizeBase);
  const qty = `${formatQty(riga.quantita)} ${riga.unita || "pz"}`;
  doc.text(qty, area.x + area.width - 42, nextY);

  if (riga.mostraPrezzi && riga.prezzoUnitario != null) {
    const prezzo = Number(riga.prezzoUnitario);
    if (Number.isFinite(prezzo)) {
      doc.text(formatEuro(prezzo), area.x + area.width - 22, nextY);
    }
  }

  nextY = Math.max(nomeY, nextY + 5) + 3;

  if (riga.note) {
    setText(doc, settings.coloreSecondario || settings.coloreTesto);
    applicaFont(doc, settings, "normal", settings.fontSizeBase - 1);
    nextY = testoMultilinea(
      doc,
      String(riga.note),
      area.x + 2,
      nextY,
      area.width - 10,
      settings.fontSizeBase + 0.8
    );
    nextY += 2;
  }

  return nextY;
}

function provenanceNote(aggregato) {
  const voci = Array.isArray(aggregato?.voci) ? aggregato.voci : [];
  if (voci.length <= 1) return "";
  return voci
    .map((v) => {
      const label = [v.cliente, v.titoloLavoro].filter(Boolean).join(" — ");
      const unita = unitaAcquistoInLettura(v.unita) || v.unita || "pz";
      return `${label || "Lavoro"}: ${formatQty(v.quantita)} ${unita}`;
    })
    .join(" · ");
}

function prezzoUnitarioAggregato(aggregato) {
  const voci = Array.isArray(aggregato?.voci) ? aggregato.voci : [];
  const conPrezzo = voci.filter((v) => v?.prezzoUnitario != null);
  if (!conPrezzo.length) return null;
  const prezzi = conPrezzo.map((v) => Number(v.prezzoUnitario));
  if (prezzi.some((p) => !Number.isFinite(p))) return null;
  if (!prezzi.every((p) => p === prezzi[0])) return null;
  return prezzi[0];
}

function importoAggregato(aggregato) {
  const voci = Array.isArray(aggregato?.voci) ? aggregato.voci : [];
  let tot = 0;
  let ha = false;
  for (const v of voci) {
    if (v?.prezzoUnitario == null) continue;
    const p = Number(v.prezzoUnitario);
    const q = Number(v.quantita);
    if (!Number.isFinite(p) || !Number.isFinite(q)) continue;
    ha = true;
    tot += p * q;
  }
  return ha ? tot : null;
}

function formatQty(n) {
  const q = Number(n);
  if (!Number.isFinite(q)) return "0";
  return Number.isInteger(q)
    ? String(q)
    : q.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}

function formatEuro(n) {
  return Number(n).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
}
