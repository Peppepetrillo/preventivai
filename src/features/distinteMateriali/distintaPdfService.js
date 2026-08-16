import jsPDF from "jspdf";

import {
  applicaFont,
  areaUtile,
  assicuratiSpazio,
  setFill,
  setText,
  testoMultilinea,
} from "../../domain/pdf/pdfLayoutService";
import { risolviPdfSettings } from "../../domain/pdf/pdfTypes";
import { calcolaTotaleMateriali } from "../../domain/distinteMateriali/distintaMaterialiDomain";
import { isPiattaformaNativa } from "../../utils/nativeExport";

/**
 * PDF semplice e professionale della Distinta Materiali.
 * Non tocca il PDF economico dei preventivi.
 *
 * @param {{ distinta: object, datiAzienda?: object, mostraPrezzi?: boolean, salva?: boolean }} opzioni
 */
export async function generaPdfDistintaMateriali({
  distinta,
  datiAzienda = {},
  mostraPrezzi = false,
  salva = false,
} = {}) {
  const settings = risolviPdfSettings({
    colorePrincipale: datiAzienda?.pdfSettings?.colorePrincipale,
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const area = areaUtile(settings);
  let y = area.yTop + 4;

  const titolo = String(distinta?.titolo || "Distinta materiali").trim();
  const cliente = String(distinta?.clienteNome || "").trim();
  const data = formattaDataIt(distinta?.updatedAt || distinta?.createdAt);
  const voci = Array.isArray(distinta?.voci) ? distinta.voci : [];
  const totale = calcolaTotaleMateriali(distinta);

  setText(doc, settings.coloreSecondario);
  applicaFont(doc, settings, "bold", settings.fontSizeTitolo + 2);
  doc.text("Distinta Materiali", area.x, y);
  y += 10;

  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "bold", settings.fontSizeBase + 2);
  doc.text(titolo, area.x, y);
  y += 7;

  applicaFont(doc, settings, "normal", settings.fontSizeBase);
  if (cliente) {
    y = testoMultilinea(
      doc,
      `Cliente: ${cliente}`,
      area.x,
      y,
      area.width,
      settings.fontSizeBase + 1.5
    );
  }
  y = testoMultilinea(
    doc,
    `Data: ${data}`,
    area.x,
    y,
    area.width,
    settings.fontSizeBase + 1.5
  );
  y += 4;

  // Intestazione tabella
  y = assicuratiSpazio(doc, settings, y, 12, () => {
    doc.addPage();
    return settings.margine + 8;
  });
  setFill(doc, settings.colorePrincipale);
  doc.roundedRect(area.x, y, area.width, 8, 2, 2, "F");
  setText(doc, settings.coloreBianco);
  applicaFont(doc, settings, "bold", settings.fontSizeBase);
  doc.text("Materiale", area.x + 2, y + 5.5);
  doc.text("Q.tà", area.x + area.width - 42, y + 5.5);
  if (mostraPrezzi) {
    doc.text("Prezzo", area.x + area.width - 22, y + 5.5);
  }
  y += 12;

  if (voci.length === 0) {
    setText(doc, settings.coloreTesto);
    applicaFont(doc, settings, "normal", settings.fontSizeBase);
    doc.text("Nessun materiale in distinta.", area.x, y);
    y += 8;
  } else {
    for (const voce of voci) {
      y = assicuratiSpazio(doc, settings, y, 14, () => {
        doc.addPage();
        return settings.margine + 8;
      });

      setText(doc, settings.coloreTesto);
      applicaFont(doc, settings, "bold", settings.fontSizeBase);
      const nomeY = testoMultilinea(
        doc,
        String(voce.nome || "Materiale"),
        area.x,
        y,
        area.width - 50,
        settings.fontSizeBase + 1.2
      );

      applicaFont(doc, settings, "normal", settings.fontSizeBase);
      const qty = `${formatQty(voce.quantita)} ${voce.unita || "pz"}`;
      doc.text(qty, area.x + area.width - 42, y);

      if (mostraPrezzi && voce.prezzoUnitario != null) {
        const prezzo = Number(voce.prezzoUnitario);
        if (Number.isFinite(prezzo)) {
          doc.text(
            formatEuro(prezzo),
            area.x + area.width - 22,
            y
          );
        }
      }

      y = Math.max(nomeY, y + 5) + 3;

      if (voce.note) {
        setText(doc, settings.coloreSecondario || settings.coloreTesto);
        applicaFont(doc, settings, "normal", settings.fontSizeBase - 1);
        y = testoMultilinea(
          doc,
          String(voce.note),
          area.x + 2,
          y,
          area.width - 10,
          settings.fontSizeBase + 0.8
        );
        y += 2;
      }
    }
  }

  if (mostraPrezzi && totale.haPrezzi && totale.importoTotale != null) {
    y = assicuratiSpazio(doc, settings, y, 16, () => {
      doc.addPage();
      return settings.margine + 8;
    });
    y += 4;
    setText(doc, settings.coloreTesto);
    applicaFont(doc, settings, "bold", settings.fontSizeBase + 1);
    doc.text(
      `Totale indicativo: ${formatEuro(totale.importoTotale)}`,
      area.x,
      y
    );
  }

  if (distinta?.note) {
    y = assicuratiSpazio(doc, settings, y, 20, () => {
      doc.addPage();
      return settings.margine + 8;
    });
    y += 8;
    setFill(doc, settings.colorePrincipale);
    doc.roundedRect(area.x, y, area.width, 8, 2, 2, "F");
    setText(doc, settings.coloreBianco);
    applicaFont(doc, settings, "bold", settings.fontSizeBase);
    doc.text("Note", area.x + 2, y + 5.5);
    y += 12;
    setText(doc, settings.coloreTesto);
    applicaFont(doc, settings, "normal", settings.fontSizeBase);
    y = testoMultilinea(
      doc,
      String(distinta.note),
      area.x,
      y,
      area.width,
      settings.fontSizeBase + 1.5
    );
  }

  const nomeFile = nomeFileDistintaPdf(distinta);
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

export function nomeFileDistintaPdf(distinta) {
  const base = String(distinta?.titolo || "distinta-materiali")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "distinta-materiali"}.pdf`;
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

function formattaDataIt(iso) {
  if (!iso) return new Date().toLocaleDateString("it-IT");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("it-IT");
}
