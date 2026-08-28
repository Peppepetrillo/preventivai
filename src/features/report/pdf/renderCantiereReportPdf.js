import jsPDF from "jspdf";

import {
  applicaFont,
  areaUtile,
  assicuratiSpazio,
  setFill,
  setStroke,
  setText,
  testoMultilinea,
} from "../../../domain/pdf/pdfLayoutService";
import { isPiattaformaNativa } from "../../../utils/nativeExport";

function riga(valore, fallback = "—") {
  const testo = String(valore ?? "").trim();
  return testo || fallback;
}

function tipoImmagine(src = "") {
  if (String(src).includes("image/png")) return "PNG";
  return "JPEG";
}

function nuovaPagina(doc, settings) {
  doc.addPage();
  return settings.margine + 8;
}

function titoloSezione(doc, settings, titolo, y) {
  const area = areaUtile(settings);
  y = assicuratiSpazio(doc, settings, y, 14, nuovaPagina);
  setFill(doc, settings.colorePrincipale);
  doc.roundedRect(area.x, y, area.width, 8, 2, 2, "F");
  setText(doc, settings.coloreBianco);
  applicaFont(doc, settings, "bold", settings.fontSizeBase + 1);
  doc.text(titolo, area.x + 3, y + 5.5);
  return y + 12;
}

function testo(doc, settings, testoValore, x, y, maxWidth) {
  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "normal", settings.fontSizeBase);
  return testoMultilinea(doc, testoValore, x, y, maxWidth, settings.fontSizeBase + 1.5);
}

function disegnaCopertina(doc, document) {
  const settings = document.settings;
  const area = areaUtile(settings);
  let y = area.yTop + 10;

  if (document.copertina.logo) {
    try {
      doc.addImage(document.copertina.logo, tipoImmagine(document.copertina.logo), area.x, y, 36, 18);
      y += 24;
    } catch {
      y += 4;
    }
  }

  setText(doc, settings.coloreSecondario);
  applicaFont(doc, settings, "bold", settings.fontSizeTitolo + 4);
  doc.text(
    riga(document.copertina.titoloDocumento, "Report Finale di Cantiere"),
    area.x,
    y
  );
  y += 12;

  applicaFont(doc, settings, "bold", settings.fontSizeTitolo);
  doc.text(riga(document.copertina.nomeAzienda), area.x, y);
  y += 10;

  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "normal", settings.fontSizeBase + 1);
  y = testo(doc, settings, `Cliente: ${riga(document.copertina.cliente)}`, area.x, y, area.width);
  y = testo(doc, settings, `Indirizzo: ${riga(document.copertina.indirizzo)}`, area.x, y, area.width);
  if (document.lavoroDiretto && document.copertina.tipoIntervento) {
    y = testo(
      doc,
      settings,
      `Tipo intervento: ${riga(document.copertina.tipoIntervento)}`,
      area.x,
      y,
      area.width
    );
  }
  y = testo(
    doc,
    settings,
    document.lavoroDiretto
      ? `Intervento: ${riga(document.copertina.numeroCantiere)}`
      : `Numero cantiere: ${riga(document.copertina.numeroCantiere)}`,
    area.x,
    y,
    area.width
  );
  y = testo(
    doc,
    settings,
    `Data apertura: ${riga(document.copertina.dataApertura)}`,
    area.x,
    y,
    area.width
  );
  y = testo(
    doc,
    settings,
    `Data conclusione: ${riga(document.copertina.dataConclusione, "In corso")}`,
    area.x,
    y,
    area.width
  );

  return y + 8;
}

function disegnaRiepilogo(doc, document, y) {
  const settings = document.settings;
  const area = areaUtile(settings);
  y = titoloSezione(doc, settings, "Riepilogo", y);

  if (document.lavoroDiretto) {
    if (document.riepilogo.tipoIntervento) {
      y = testo(
        doc,
        settings,
        `Tipo: ${document.riepilogo.tipoIntervento}`,
        area.x,
        y,
        area.width
      );
    }
    if (document.riepilogo.descrizioneIntervento) {
      y = testo(doc, settings, "Descrizione intervento:", area.x, y, area.width);
      y = testo(
        doc,
        settings,
        document.riepilogo.descrizioneIntervento,
        area.x + 2,
        y,
        area.width - 4
      );
    }
    y = testo(
      doc,
      settings,
      `Totale intervento: ${document.riepilogo.totaleFinaleLabel}`,
      area.x,
      y,
      area.width
    );
    return y + 4;
  }

  y = testo(
    doc,
    settings,
    `Preventivo di origine: ${riga(document.riepilogo.preventivoOrigine.numero)} · ${document.riepilogo.preventivoOrigine.totaleLabel}`,
    area.x,
    y,
    area.width
  );
  y = testo(
    doc,
    settings,
    `Totale finale: ${document.riepilogo.totaleFinaleLabel}`,
    area.x,
    y,
    area.width
  );

  if (document.riepilogo.lavorazioni.length > 0) {
    y += 2;
    y = testo(doc, settings, "Lavorazioni eseguite:", area.x, y, area.width);
    for (const voce of document.riepilogo.lavorazioni) {
      y = assicuratiSpazio(doc, settings, y, 8, nuovaPagina);
      y = testo(
        doc,
        settings,
        `• ${voce.nome} (${voce.quantita} ${voce.unita})`,
        area.x + 2,
        y,
        area.width - 4
      );
    }
  }

  if (document.riepilogo.variantiApprovate.length > 0) {
    y += 2;
    y = testo(doc, settings, "Lavori extra approvati:", area.x, y, area.width);
    for (const variante of document.riepilogo.variantiApprovate) {
      y = assicuratiSpazio(doc, settings, y, 8, nuovaPagina);
      y = testo(
        doc,
        settings,
        `• ${variante.titolo} · ${variante.stato} · ${variante.totaleLabel}`,
        area.x + 2,
        y,
        area.width - 4
      );
    }
  }

  return y + 4;
}

function disegnaCronologia(doc, document, y) {
  const settings = document.settings;
  const area = areaUtile(settings);
  y = titoloSezione(doc, settings, "Cronologia", y);

  if (document.cronologia.length === 0) {
    return testo(doc, settings, "Nessun evento registrato nel diario.", area.x, y, area.width);
  }

  for (const evento of document.cronologia) {
    y = assicuratiSpazio(doc, settings, y, 16, nuovaPagina);
    setText(doc, settings.coloreTenue);
    applicaFont(doc, settings, "bold", settings.fontSizePiccolo);
    doc.text(`${evento.data} · ${evento.ora}`, area.x, y);
    y += 4;

    setText(doc, settings.coloreTesto);
    applicaFont(doc, settings, "bold", settings.fontSizeBase);
    doc.text(`${evento.icona || "•"} ${evento.titolo}`, area.x, y);
    y += 5;

    if (evento.descrizione) {
      y = testo(doc, settings, evento.descrizione, area.x + 2, y, area.width - 4);
    }
    y += 2;
  }

  return y;
}

function disegnaFotografie(doc, document, y) {
  const settings = document.settings;
  const area = areaUtile(settings);
  y = titoloSezione(doc, settings, "Fotografie", y);

  if (document.fotografie.length === 0) {
    return testo(doc, settings, "Nessuna fotografia disponibile.", area.x, y, area.width);
  }

  const larghezza = (area.width - 6) / 2;
  const altezza = 42;
  let colonna = 0;

  for (const foto of document.fotografie) {
    y = assicuratiSpazio(doc, settings, y, altezza + 12, nuovaPagina);
    const x = area.x + colonna * (larghezza + 6);
    try {
      doc.addImage(
        foto.thumbnail || foto.src,
        tipoImmagine(foto.thumbnail || foto.src),
        x,
        y,
        larghezza,
        altezza
      );
    } catch {
      setStroke(doc, settings.coloreBordo);
      doc.rect(x, y, larghezza, altezza);
    }

    setText(doc, settings.coloreTenue);
    applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
    doc.text(riga(foto.didascalia), x, y + altezza + 4, { maxWidth: larghezza });

    colonna += 1;
    if (colonna > 1) {
      colonna = 0;
      y += altezza + 10;
    }
  }

  if (colonna !== 0) y += altezza + 10;
  return y;
}

function disegnaMateriali(doc, document, y) {
  const settings = document.settings;
  const area = areaUtile(settings);
  y = titoloSezione(doc, settings, "Materiali", y);

  if (document.materiali.length === 0) {
    return testo(doc, settings, "Nessun materiale registrato.", area.x, y, area.width);
  }

  for (const materiale of document.materiali) {
    y = assicuratiSpazio(doc, settings, y, 8, nuovaPagina);
    const stato = materiale.acquistato ? "acquistato" : "da comprare";
    y = testo(
      doc,
      settings,
      `• ${materiale.nome} · ${materiale.quantita} ${materiale.unita} · ${stato}`,
      area.x,
      y,
      area.width
    );
  }
  return y + 2;
}

function disegnaPagamenti(doc, document, y) {
  const settings = document.settings;
  const area = areaUtile(settings);
  y = titoloSezione(doc, settings, "Pagamenti", y);
  y = testo(doc, settings, `Già incassato: ${document.pagamenti.incassatoLabel || document.pagamenti.accontoLabel}`, area.x, y, area.width);
  y = testo(doc, settings, `Resta da incassare: ${document.pagamenti.rimanenzaLabel || document.pagamenti.saldoLabel}`, area.x, y, area.width);
  y = testo(doc, settings, `Totale: ${document.pagamenti.totaleLabel}`, area.x, y, area.width);
  return y + 2;
}

function disegnaNote(doc, document, y) {
  const settings = document.settings;
  const area = areaUtile(settings);
  y = titoloSezione(doc, settings, "Note", y);

  if (document.note.length === 0) {
    return testo(doc, settings, "Nessuna nota manuale.", area.x, y, area.width);
  }

  for (const nota of document.note) {
    y = assicuratiSpazio(doc, settings, y, 10, nuovaPagina);
    y = testo(doc, settings, `• ${nota}`, area.x, y, area.width);
  }
  return y + 2;
}

function disegnaFirme(doc, document, y) {
  const settings = document.settings;
  const area = areaUtile(settings);
  y = titoloSezione(doc, settings, "Firme", y);
  y = assicuratiSpazio(doc, settings, y, 36, nuovaPagina);

  const meta = area.width / 2 - 4;
  const lineY = y + 18;

  setStroke(doc, settings.coloreBordo);
  doc.line(area.x, lineY, area.x + meta, lineY);
  doc.line(area.x + meta + 8, lineY, area.x + area.width, lineY);

  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "bold", settings.fontSizeBase);
  doc.text(document.firme.tecnicoLabel, area.x, y + 8);
  doc.text(document.firme.clienteLabel, area.x + meta + 8, y + 8);

  setText(doc, settings.coloreTenue);
  applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
  doc.text("________________", area.x, lineY + 6);
  doc.text("________________", area.x + meta + 8, lineY + 6);

  return lineY + 14;
}

/**
 * Renderizza il report cantiere in PDF.
 * @param {ReturnType<typeof import("../builder/buildCantiereReport").buildCantiereReport>} document
 * @param {{ salva?: boolean, nomeFile?: string }} opzioni
 */
export async function renderCantiereReportPdf(document, opzioni = {}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = disegnaCopertina(doc, document);
  y = disegnaRiepilogo(doc, document, y);
  y = disegnaCronologia(doc, document, y);
  y = disegnaFotografie(doc, document, y);
  y = disegnaMateriali(doc, document, y);
  y = disegnaPagamenti(doc, document, y);
  y = disegnaNote(doc, document, y);
  disegnaFirme(doc, document, y);

  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  const nomeFile = opzioni.nomeFile || "Report_Cantiere.pdf";

  if (opzioni.salva !== false && !isPiattaformaNativa()) {
    doc.save(nomeFile);
  }

  return {
    doc,
    pagine: doc.getNumberOfPages(),
    blob,
    blobUrl,
    document,
    nomeFile,
  };
}
