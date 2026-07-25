/**
 * PDF Template Service — assembla il DTO e rende il documento.
 * Riceve solo un oggetto completo: nessuna conoscenza di repository.
 */

import jsPDF from "jspdf";

import { calcolaSaldo, formatEuro, normalizzaNumero } from "../../utils/preventivi";
import {
  applicaFont,
  areaUtile,
  assicuratiSpazio,
  colonneLavorazioni,
  setFill,
  setStroke,
  setText,
  stimaAltezzaTesto,
  testoMultilinea,
} from "./pdfLayoutService";
import {
  APP_VERSION,
  creaPreventivoPdfDocument,
  risolviPdfSettings,
} from "./pdfTypes";

function euro(valore) {
  return formatEuro(valore);
}

function riga(valore, fallback = "—") {
  const t = String(valore ?? "").trim();
  return t || fallback;
}

/**
 * Costruisce il DTO PDF da un payload preventivo già risolto.
 * @param {object} input
 * @returns {import("./pdfTypes").PreventivoPdfDocument}
 */
export function buildPreventivoPdfDocument(input = {}) {
  const settings = risolviPdfSettings({
    ...(input.settings || {}),
    ...(input.datiAzienda?.pdfSettings || {}),
    logo: input.settings?.logo ?? input.datiAzienda?.logo ?? null,
  });

  const aziendaSrc = input.azienda || input.datiAzienda || {};
  const clienteSrc =
    typeof input.cliente === "object" && input.cliente
      ? input.cliente
      : { nome: input.cliente || "" };

  const preventivo = input.preventivo || {};
  const totali = input.totali || {};
  const accontoVal = normalizzaNumero(input.acconto);
  const totale = normalizzaNumero(totali.totale);

  const lavorazioni = (Array.isArray(input.lavorazioni) ? input.lavorazioni : []).map(
    (item) => {
      const quantita = normalizzaNumero(item.quantita);
      const prezzoNonConfigurato = item.prezzoConfigurato === false;
      const prezzo = prezzoNonConfigurato
        ? null
        : normalizzaNumero(item.prezzo);
      return {
        descrizione: String(item.nome || item.descrizione || "Lavorazione"),
        quantita,
        unita: String(item.unita || "cad"),
        prezzo: prezzoNonConfigurato ? 0 : prezzo,
        totale: prezzoNonConfigurato ? 0 : quantita * prezzo,
        prezzoNonConfigurato,
        prezzoLabel: prezzoNonConfigurato
          ? "Prezzo non configurato"
          : null,
      };
    }
  );

  return creaPreventivoPdfDocument({
    settings,
    azienda: {
      nome: aziendaSrc.nome || aziendaSrc.nomeDitta || "PreventivAI",
      indirizzo: aziendaSrc.indirizzo || "",
      telefono: aziendaSrc.telefono || "",
      email: aziendaSrc.email || "",
      partitaIva: aziendaSrc.partitaIva || aziendaSrc.pIva || "",
      logo: settings.logo || aziendaSrc.logo || null,
    },
    cliente: {
      nome: clienteSrc.nome || clienteSrc.ragioneSociale || "",
      telefono: clienteSrc.telefono || "",
      email: clienteSrc.email || "",
      indirizzo:
        clienteSrc.indirizzo ||
        preventivo.indirizzo ||
        input.indirizzo ||
        "",
    },
    intestazione: {
      numero: preventivo.numero || (preventivo.id ? `PREV-${preventivo.id}` : ""),
      data: preventivo.data || input.data || "",
      validita: input.validita ?? preventivo.validita ?? "",
      oggetto:
        input.oggetto ||
        preventivo.oggetto ||
        "Preventivo lavori elettrici",
      stato: input.stato || preventivo.stato || "",
      pagamento: input.pagamento || preventivo.pagamento || "",
    },
    lavorazioni,
    riepilogo: {
      subtotale: normalizzaNumero(totali.subtotale),
      scontoPercentuale: normalizzaNumero(input.sconto ?? preventivo.sconto),
      importoSconto: normalizzaNumero(totali.importoSconto),
      imponibile: normalizzaNumero(totali.imponibile),
      ivaPercentuale: normalizzaNumero(input.iva ?? preventivo.iva),
      importoIva: normalizzaNumero(totali.importoIva),
      totale,
    },
    acconto: {
      richiesto: accontoVal,
      residuo: calcolaSaldo(totale, accontoVal),
    },
    condizioni:
      input.condizioni ||
      aziendaSrc.condizioniGenerali ||
      aziendaSrc.condizioni ||
      "",
    note: input.note || preventivo.note || "",
    firme: input.firme,
    meta: {
      appName: "PreventivAI",
      appVersion: APP_VERSION,
      ...(input.meta || {}),
    },
  });
}

function disegnaLogo(doc, settings, azienda, x, y, lato) {
  const logo = settings.logo || azienda.logo;
  if (!logo) {
    setFill(doc, settings.colorePrincipale);
    doc.roundedRect(x, y, lato, lato, 2, 2, "F");
    setText(doc, settings.coloreSecondario);
    applicaFont(doc, settings, "bold", 11);
    doc.text("P", x + lato / 2, y + lato / 2 + 3.2, { align: "center" });
    return;
  }
  try {
    const formato = String(logo).includes("image/jpeg") ? "JPEG" : "PNG";
    doc.addImage(logo, formato, x, y, lato, lato);
  } catch {
    setFill(doc, settings.colorePrincipale);
    doc.roundedRect(x, y, lato, lato, 2, 2, "F");
  }
}

function disegnaHeaderPrincipale(doc, document) {
  const { settings, azienda, intestazione } = document;
  const area = areaUtile(settings);
  const y0 = 10;

  setFill(doc, settings.coloreSecondario);
  doc.rect(0, 0, 210, settings.headerAltezza, "F");

  disegnaLogo(doc, settings, azienda, area.x, y0 + 4, 22);

  const textX = area.x + 28;
  setText(doc, settings.coloreBianco);
  applicaFont(doc, settings, "bold", 14);
  doc.text(riga(azienda.nome, "PreventivAI"), textX, y0 + 11);

  applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
  setText(doc, [220, 224, 230]);
  let yInfo = y0 + 17;
  const info = [
    azienda.indirizzo,
    [azienda.telefono && `Tel. ${azienda.telefono}`, azienda.email]
      .filter(Boolean)
      .join(" · "),
    azienda.partitaIva && `P. IVA ${azienda.partitaIva}`,
  ].filter(Boolean);

  info.forEach((linea) => {
    doc.text(String(linea), textX, yInfo, { maxWidth: 110 });
    yInfo += 4;
  });

  // Badge stato
  if (intestazione.stato) {
    setFill(doc, settings.colorePrincipale);
    doc.roundedRect(158, y0 + 8, 36, 14, 2, 2, "F");
    setText(doc, settings.coloreSecondario);
    applicaFont(doc, settings, "bold", 8);
    doc.text(String(intestazione.stato).slice(0, 14), 176, y0 + 16.5, {
      align: "center",
    });
  }

  return settings.headerAltezza + 6;
}

function disegnaHeaderContinuo(doc, document) {
  const { settings, azienda, intestazione } = document;
  const area = areaUtile(settings);
  setFill(doc, settings.coloreSecondario);
  doc.rect(0, 0, 210, 14, "F");
  setText(doc, settings.coloreBianco);
  applicaFont(doc, settings, "bold", 8);
  doc.text(riga(azienda.nome), area.x, 9);
  applicaFont(doc, settings, "normal", 8);
  doc.text(riga(intestazione.numero), area.x + area.width, 9, {
    align: "right",
  });
  return 20;
}

function disegnaFooterSuPagine(doc, document) {
  const { settings, meta } = document;
  const pages = doc.getNumberOfPages();
  const area = areaUtile(settings);

  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    const y = PDF_PAGE_FOOTER_Y(settings);
    setStroke(doc, settings.coloreBordo);
    doc.setLineWidth(0.2);
    doc.line(area.x, y, area.x + area.width, y);

    setText(doc, settings.coloreTenue);
    applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
    doc.text(
      `Generato con ${meta.appName || "PreventivAI"} · v${meta.appVersion || APP_VERSION}`,
      area.x,
      y + 5
    );
    doc.text(`Pagina ${i} di ${pages}`, area.x + area.width, y + 5, {
      align: "right",
    });
  }
}

function PDF_PAGE_FOOTER_Y(settings) {
  return 297 - settings.footerAltezza + 2;
}

function sezioneTitolo(doc, settings, titolo, y) {
  setText(doc, settings.coloreSecondario);
  applicaFont(doc, settings, "bold", 10);
  doc.text(titolo, areaUtile(settings).x, y);
  setStroke(doc, settings.colorePrincipale);
  doc.setLineWidth(0.6);
  doc.line(
    areaUtile(settings).x,
    y + 2,
    areaUtile(settings).x + 28,
    y + 2
  );
  return y + 8;
}

function bloccoClienteIntestazione(doc, document, y) {
  const { settings, cliente, intestazione } = document;
  const area = areaUtile(settings);
  const colW = (area.width - 6) / 2;

  y = assicuratiSpazio(doc, settings, y, 36, (d) =>
    disegnaHeaderContinuo(d, document)
  );

  // Cliente
  setFill(doc, settings.coloreFondo);
  setStroke(doc, settings.coloreBordo);
  doc.roundedRect(area.x, y, colW, 32, 2, 2, "FD");
  setText(doc, settings.coloreTenue);
  applicaFont(doc, settings, "bold", settings.fontSizePiccolo);
  doc.text("CLIENTE", area.x + 4, y + 6);
  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "bold", 10);
  doc.text(riga(cliente.nome), area.x + 4, y + 12, { maxWidth: colW - 8 });
  applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
  let cy = y + 17;
  [cliente.telefono, cliente.email, cliente.indirizzo]
    .filter((v) => String(v || "").trim())
    .forEach((linea) => {
      doc.text(String(linea), area.x + 4, cy, { maxWidth: colW - 8 });
      cy += 4;
    });

  // Intestazione documento
  const ix = area.x + colW + 6;
  setFill(doc, settings.coloreFondo);
  doc.roundedRect(ix, y, colW, 32, 2, 2, "FD");
  setText(doc, settings.coloreTenue);
  applicaFont(doc, settings, "bold", settings.fontSizePiccolo);
  doc.text("DOCUMENTO", ix + 4, y + 6);
  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "bold", 10);
  doc.text(riga(intestazione.numero), ix + 4, y + 12);
  applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
  doc.text(`Data: ${riga(intestazione.data)}`, ix + 4, y + 17);
  doc.text(
    `Validità: ${
      intestazione.validita === "" || intestazione.validita === null
        ? "—"
        : `${intestazione.validita} gg`
    }`,
    ix + 4,
    y + 22
  );
  doc.text(`Oggetto: ${riga(intestazione.oggetto)}`, ix + 4, y + 27, {
    maxWidth: colW - 8,
  });

  return y + 38;
}

function intestazioneTabella(doc, document, y) {
  const { settings } = document;
  const col = colonneLavorazioni(settings);
  setFill(doc, settings.coloreSecondario);
  doc.roundedRect(col.x0, y, col.width, 7, 1.5, 1.5, "F");
  setText(doc, settings.coloreBianco);
  applicaFont(doc, settings, "bold", settings.fontSizePiccolo);
  doc.text("DESCRIZIONE", col.descrizione, y + 4.8);
  doc.text("Q.TÀ", col.quantita, y + 4.8, { align: "right" });
  doc.text("PREZZO", col.prezzo, y + 4.8, { align: "right" });
  doc.text("TOTALE", col.totale, y + 4.8, { align: "right" });
  return y + 10;
}

function disegnaLavorazioni(doc, document, yStart) {
  const { settings, lavorazioni } = document;
  const col = colonneLavorazioni(settings);
  let y = yStart;

  y = sezioneTitolo(doc, settings, "Lavorazioni", y);
  y = intestazioneTabella(doc, document, y);

  if (lavorazioni.length === 0) {
    setText(doc, settings.coloreTenue);
    applicaFont(doc, settings, "normal", settings.fontSizeBase);
    doc.text("Nessuna lavorazione.", col.descrizione, y);
    return y + 8;
  }

  lavorazioni.forEach((item, index) => {
    const desc = String(item.descrizione || "").slice(0, 80);
    const hTesto = stimaAltezzaTesto(
      doc,
      desc,
      col.descrizioneMax,
      3.8
    );
    const hRiga = Math.max(settings.rigaTabella, hTesto + 2);

    y = assicuratiSpazio(
      doc,
      settings,
      y,
      hRiga + 2,
      (d) => {
        const ny = disegnaHeaderContinuo(d, document);
        return intestazioneTabella(d, document, ny);
      }
    );

    if (index % 2 === 0) {
      setFill(doc, [250, 251, 252]);
      doc.rect(col.x0, y - 4, col.width, hRiga, "F");
    }

    setText(doc, settings.coloreTesto);
    applicaFont(doc, settings, "normal", settings.fontSizeBase);
    const linee = doc.splitTextToSize(desc, col.descrizioneMax);
    doc.text(linee, col.descrizione, y);
    doc.text(
      `${item.quantita || 0} ${item.unita || ""}`.trim(),
      col.quantita,
      y,
      { align: "right" }
    );
    if (item.prezzoNonConfigurato) {
      setText(doc, settings.coloreTenue);
      applicaFont(doc, settings, "normal", Math.max(7, settings.fontSizeBase - 1));
      doc.text("Prezzo non configurato", col.prezzo, y, { align: "right" });
      applicaFont(doc, settings, "bold", settings.fontSizeBase);
      doc.text("—", col.totale, y, { align: "right" });
      setText(doc, settings.coloreTesto);
    } else {
      doc.text(euro(item.prezzo), col.prezzo, y, { align: "right" });
      applicaFont(doc, settings, "bold", settings.fontSizeBase);
      doc.text(euro(item.totale), col.totale, y, { align: "right" });
    }

    y += hRiga;
  });

  return y + 4;
}

function disegnaRiepilogoEAcconto(doc, document, y) {
  const { settings, riepilogo, acconto, intestazione } = document;
  const area = areaUtile(settings);
  const boxW = 88;
  const boxX = area.x + area.width - boxW;
  const h = 48;

  y = assicuratiSpazio(doc, settings, y, h + 8, (d) =>
    disegnaHeaderContinuo(d, document)
  );
  y = sezioneTitolo(doc, settings, "Riepilogo", y);

  setFill(doc, settings.coloreFondo);
  setStroke(doc, settings.coloreBordo);
  doc.roundedRect(boxX, y, boxW, h, 2, 2, "FD");

  const rigaTot = (label, valore, yy, bold = false) => {
    applicaFont(doc, settings, bold ? "bold" : "normal", bold ? 10 : 8);
    setText(doc, bold ? settings.coloreSecondario : settings.coloreTesto);
    doc.text(label, boxX + 4, yy);
    doc.text(valore, boxX + boxW - 4, yy, { align: "right" });
  };

  let ry = y + 7;
  rigaTot("Subtotale", euro(riepilogo.subtotale), ry);
  ry += 5.5;
  if (riepilogo.scontoPercentuale > 0) {
    rigaTot(
      `Sconto ${riepilogo.scontoPercentuale}%`,
      `− ${euro(riepilogo.importoSconto)}`,
      ry
    );
    ry += 5.5;
  }
  rigaTot("Imponibile", euro(riepilogo.imponibile), ry);
  ry += 5.5;
  rigaTot(`IVA ${riepilogo.ivaPercentuale}%`, euro(riepilogo.importoIva), ry);
  ry += 5;
  setStroke(doc, settings.coloreBordo);
  doc.line(boxX + 4, ry - 2, boxX + boxW - 4, ry - 2);
  rigaTot("Totale", euro(riepilogo.totale), ry + 2, true);

  // Acconto a sinistra
  const leftW = area.width - boxW - 8;
  setFill(doc, settings.coloreFondo);
  doc.roundedRect(area.x, y, leftW, h, 2, 2, "FD");
  setText(doc, settings.coloreTenue);
  applicaFont(doc, settings, "bold", settings.fontSizePiccolo);
  doc.text("ACCONTO", area.x + 4, y + 7);
  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "normal", 8);
  doc.text(`Richiesto: ${euro(acconto.richiesto)}`, area.x + 4, y + 14);
  applicaFont(doc, settings, "bold", 10);
  doc.text(`Residuo: ${euro(acconto.residuo)}`, area.x + 4, y + 22);
  if (intestazione.pagamento) {
    applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
    setText(doc, settings.coloreTenue);
    doc.text(`Pagamento: ${intestazione.pagamento}`, area.x + 4, y + 30, {
      maxWidth: leftW - 8,
    });
  }

  return y + h + 8;
}

function disegnaTestoSezione(doc, document, titolo, contenuto, y) {
  const { settings } = document;
  const area = areaUtile(settings);
  const testo = String(contenuto || "").trim();
  if (!testo) return y;

  const hStima = stimaAltezzaTesto(doc, testo, area.width - 8, 4) + 14;
  y = assicuratiSpazio(doc, settings, y, Math.min(hStima, 40), (d) =>
    disegnaHeaderContinuo(d, document)
  );
  y = sezioneTitolo(doc, settings, titolo, y);
  setText(doc, settings.coloreTesto);
  applicaFont(doc, settings, "normal", settings.fontSizeBase);
  return testoMultilinea(doc, testo, area.x, y, area.width, 4.2) + 6;
}

function disegnaFirme(doc, document, y) {
  const { settings, firme } = document;
  const area = areaUtile(settings);
  const haImmagineCliente = Boolean(firme?.clienteImmagine);
  const altezzaBlocco = haImmagineCliente ? 48 : 36;

  y = assicuratiSpazio(doc, settings, y, altezzaBlocco, (d) =>
    disegnaHeaderContinuo(d, document)
  );
  y = sezioneTitolo(doc, settings, "Firme", y);

  const mid = area.x + area.width / 2;
  const colW = area.width / 2 - 12;
  const lineY = y + (haImmagineCliente ? 28 : 16);

  if (haImmagineCliente) {
    try {
      const formato = String(firme.clienteImmagine).includes("image/jpeg")
        ? "JPEG"
        : "PNG";
      const imgH = 18;
      const imgW = Math.min(colW, 55);
      doc.addImage(
        firme.clienteImmagine,
        formato,
        area.x,
        y,
        imgW,
        imgH
      );
    } catch {
      // fallback: solo riga
    }
  }

  // Placeholder installatore (linea vuota / box)
  setStroke(doc, settings.coloreBordo);
  doc.setLineWidth(0.35);
  if (firme?.installatoreImmagine) {
    try {
      const formato = String(firme.installatoreImmagine).includes("image/jpeg")
        ? "JPEG"
        : "PNG";
      doc.addImage(
        firme.installatoreImmagine,
        formato,
        mid + 10,
        y,
        Math.min(colW, 55),
        18
      );
    } catch {
      doc.line(mid + 10, lineY, area.x + area.width, lineY);
    }
  } else {
    doc.line(mid + 10, lineY, area.x + area.width, lineY);
  }

  if (!haImmagineCliente) {
    doc.line(area.x, lineY, mid - 10, lineY);
  } else {
    doc.line(area.x, lineY, mid - 10, lineY);
  }

  setText(doc, settings.coloreTenue);
  applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
  doc.text(firme.clienteLabel || "Firma Cliente", area.x, lineY + 5);
  doc.text(
    firme.installatoreLabel || "Firma Installatore",
    mid + 10,
    lineY + 5
  );

  let yMeta = lineY + 10;
  if (firme?.firmatario || firme?.dataFirma) {
    setText(doc, settings.coloreTesto);
    applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
    if (firme.firmatario) {
      doc.text(String(firme.firmatario), area.x, yMeta);
      yMeta += 4;
    }
    if (firme.dataFirma) {
      doc.text(`Data firma: ${firme.dataFirma}`, area.x, yMeta);
      yMeta += 4;
    }
  }

  if (firme?.installatorePlaceholder && !firme?.installatoreImmagine) {
    setText(doc, settings.coloreTenue);
    applicaFont(doc, settings, "normal", settings.fontSizePiccolo);
    doc.text("(da firmare)", mid + 10, lineY + 10);
  }

  return Math.max(yMeta, lineY + 14) + 6;
}

/**
 * Rendering completo del DTO su jsPDF.
 * @param {import("./pdfTypes").PreventivoPdfDocument} document
 * @param {{ salva?: boolean, nomeFile?: string }=} opzioni
 * @returns {Promise<{ doc: object, pagine: number, blob: Blob, blobUrl: string, document: object }>}
 */
export async function renderPreventivoPdf(document, opzioni = {}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = disegnaHeaderPrincipale(doc, document);

  setText(doc, document.settings.coloreSecondario);
  applicaFont(doc, document.settings, "bold", document.settings.fontSizeTitolo);
  doc.text("Preventivo", areaUtile(document.settings).x, y);
  y += 8;

  y = bloccoClienteIntestazione(doc, document, y);
  y = disegnaLavorazioni(doc, document, y);
  y = disegnaRiepilogoEAcconto(doc, document, y);
  y = disegnaTestoSezione(doc, document, "Condizioni", document.condizioni, y);
  y = disegnaTestoSezione(doc, document, "Note", document.note, y);
  disegnaFirme(doc, document, y);

  disegnaFooterSuPagine(doc, document);

  const pagine = doc.getNumberOfPages();
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);

  const nomeFile =
    opzioni.nomeFile ||
    `${document.intestazione.numero || "preventivo"}-${
      document.cliente.nome || "cliente"
    }.pdf`.replace(/\s+/g, "_");

  if (opzioni.salva !== false) {
    doc.save(nomeFile);
  }

  return { doc, pagine, blob, blobUrl, document, nomeFile };
}

/**
 * Pipeline completa: build DTO + render.
 * @param {object} input
 * @param {{ salva?: boolean }=} opzioni
 */
export async function generaPreventivoPdfDaInput(input = {}, opzioni = {}) {
  const document = buildPreventivoPdfDocument(input);
  return renderPreventivoPdf(document, {
    salva: opzioni.salva !== false,
    nomeFile: opzioni.nomeFile,
  });
}
