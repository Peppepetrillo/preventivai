import jsPDF from "jspdf";
import QRCode from "qrcode";
import { calcolaSaldo, formatEuro, normalizzaNumero } from "../utils/preventivi";

const COLORI = {
  inchiostro: [19, 26, 41],
  testo: [50, 61, 82],
  tenue: [104, 117, 140],
  bordo: [218, 226, 236],
  fondo: [246, 248, 252],
  primario: [234, 179, 8],
  bianco: [255, 255, 255],
};

function impostaColore(doc, colore) {
  doc.setTextColor(...colore);
}

function impostaRiempimento(doc, colore) {
  doc.setFillColor(...colore);
}

function impostaBordo(doc, colore) {
  doc.setDrawColor(...colore);
}

function testo(doc, valore, x, y, opzioni = {}) {
  doc.text(String(valore ?? ""), x, y, opzioni);
}

function euro(valore) {
  return formatEuro(valore);
}

function aggiungiLogo(doc, datiAzienda, x, y, lato) {
  if (!datiAzienda.logo) {
    impostaRiempimento(doc, COLORI.primario);
    doc.roundedRect(x, y, lato, lato, 3, 3, "F");
    impostaColore(doc, COLORI.inchiostro);
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    testo(doc, "P", x + lato / 2, y + lato / 2 + 4, { align: "center" });
    return;
  }

  try {
    const formatoLogo = datiAzienda.logo.includes("image/jpeg") ? "JPEG" : "PNG";
    doc.addImage(datiAzienda.logo, formatoLogo, x, y, lato, lato);
  } catch {
    impostaRiempimento(doc, COLORI.primario);
    doc.roundedRect(x, y, lato, lato, 3, 3, "F");
  }
}

function scriviHeader(doc, { datiAzienda, numero, preventivo, cliente, stato }) {
  impostaRiempimento(doc, COLORI.inchiostro);
  doc.rect(0, 0, 210, 45, "F");

  aggiungiLogo(doc, datiAzienda, 16, 12, 21);

  impostaColore(doc, COLORI.bianco);
  doc.setFont(undefined, "bold");
  doc.setFontSize(21);
  testo(doc, datiAzienda.nomeDitta || "PreventivAI", 42, 21);

  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  testo(doc, `Tel. ${datiAzienda.telefono || "-"}`, 42, 29);
  testo(doc, datiAzienda.email || "-", 42, 35);

  impostaRiempimento(doc, COLORI.primario);
  doc.roundedRect(150, 12, 44, 22, 3, 3, "F");
  impostaColore(doc, COLORI.inchiostro);
  doc.setFont(undefined, "bold");
  doc.setFontSize(10);
  testo(doc, stato || "Bozza", 172, 21, { align: "center" });
  doc.setFontSize(8);
  testo(doc, "STATO LAVORO", 172, 28, { align: "center" });

  impostaColore(doc, COLORI.inchiostro);
  doc.setFont(undefined, "bold");
  doc.setFontSize(25);
  testo(doc, "Preventivo", 16, 61);

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  impostaColore(doc, COLORI.tenue);
  testo(doc, `Numero ${numero}`, 16, 70);
  testo(doc, `Data ${preventivo.data || "-"}`, 16, 77);

  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(118, 53, 76, 28, 3, 3, "FD");

  doc.setFont(undefined, "bold");
  impostaColore(doc, COLORI.inchiostro);
  doc.setFontSize(10);
  testo(doc, "Cliente", 124, 64);

  doc.setFont(undefined, "normal");
  impostaColore(doc, COLORI.testo);
  doc.setFontSize(11);
  testo(doc, cliente || "-", 124, 72, { maxWidth: 64 });
}

function scriviDettagliDocumento(doc, { validita, pagamento }) {
  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(16, 88, 178, 22, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  impostaColore(doc, COLORI.tenue);
  testo(doc, "VALIDITÀ", 24, 98);
  testo(doc, "PAGAMENTO", 74, 98);

  doc.setFont(undefined, "normal");
  impostaColore(doc, COLORI.inchiostro);
  testo(doc, `${validita || 0} giorni`, 24, 105);
  testo(doc, pagamento || "-", 74, 105, { maxWidth: 110 });
}

function scriviIntestazioneTabella(doc, y) {
  impostaRiempimento(doc, COLORI.inchiostro);
  doc.roundedRect(16, y, 178, 10, 2, 2, "F");

  impostaColore(doc, COLORI.bianco);
  doc.setFont(undefined, "bold");
  doc.setFontSize(8);
  testo(doc, "DESCRIZIONE", 20, y + 7);
  testo(doc, "Q.TÀ", 116, y + 7, { align: "right" });
  testo(doc, "PREZZO", 150, y + 7, { align: "right" });
  testo(doc, "TOTALE", 190, y + 7, { align: "right" });
}

function nuovaPaginaConTabella(doc) {
  doc.addPage();
  scriviIntestazioneTabella(doc, 18);
  return 34;
}

function scriviRigheLavorazioni(doc, lavorazioni, yIniziale) {
  let y = yIniziale;

  lavorazioni.forEach((item, index) => {
    if (y > 260) {
      y = nuovaPaginaConTabella(doc);
    }

    if (index % 2 === 0) {
      impostaRiempimento(doc, [250, 251, 253]);
      doc.rect(16, y - 6, 178, 11, "F");
    }

    const totaleRiga =
      normalizzaNumero(item.quantita) * normalizzaNumero(item.prezzo);

    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    impostaColore(doc, COLORI.inchiostro);
    testo(doc, String(item.nome || "Lavorazione").slice(0, 58), 20, y);
    impostaColore(doc, COLORI.testo);
    testo(doc, `${item.quantita || 0} ${item.unita || ""}`.trim(), 116, y, {
      align: "right",
    });
    testo(doc, euro(item.prezzo), 150, y, { align: "right" });
    doc.setFont(undefined, "bold");
    testo(doc, euro(totaleRiga), 190, y, { align: "right" });

    y += 11;
  });

  return y;
}

function scriviRigaTotale(doc, label, valore, y, evidenza = false) {
  doc.setFont(undefined, evidenza ? "bold" : "normal");
  doc.setFontSize(evidenza ? 12 : 9);
  impostaColore(doc, evidenza ? COLORI.inchiostro : COLORI.testo);
  testo(doc, label, 124, y);
  testo(doc, valore, 190, y, { align: "right" });
}

function scriviRiepilogo(doc, { totali, sconto, iva, acconto }, y) {
  const saldo = calcolaSaldo(totali.totale, acconto);

  if (y > 218) {
    doc.addPage();
    y = 24;
  }

  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(116, y, 78, 62, 3, 3, "FD");

  let riga = y + 10;
  scriviRigaTotale(doc, "Subtotale", euro(totali.subtotale), riga);
  riga += 8;
  scriviRigaTotale(doc, `Sconto ${sconto || 0}%`, `- ${euro(totali.importoSconto)}`, riga);
  riga += 8;
  scriviRigaTotale(doc, "Imponibile", euro(totali.imponibile), riga);
  riga += 8;
  scriviRigaTotale(doc, `IVA ${iva || 0}%`, euro(totali.importoIva), riga);
  riga += 9;

  impostaBordo(doc, COLORI.bordo);
  doc.line(124, riga - 4, 188, riga - 4);
  scriviRigaTotale(doc, "Totale", euro(totali.totale), riga, true);
  riga += 9;
  scriviRigaTotale(doc, "Acconto", euro(acconto), riga);
  riga += 8;
  scriviRigaTotale(doc, "Saldo", euro(saldo), riga, true);

  return y + 72;
}

async function creaQrCode({ numero, cliente, preventivo, totali, acconto }) {
  const contenuto = [
    "PreventivAI",
    `Numero: ${numero}`,
    `Cliente: ${cliente || "-"}`,
    `Data: ${preventivo.data || "-"}`,
    `Totale: ${euro(totali.totale)}`,
    `Acconto: ${euro(acconto)}`,
    `Saldo: ${euro(calcolaSaldo(totali.totale, acconto))}`,
  ].join("\n");

  return QRCode.toDataURL(contenuto, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 160,
    color: {
      dark: "#131a29",
      light: "#ffffff",
    },
  });
}

function scriviQrENote(doc, { qrCode, note }, y) {
  if (y > 210) {
    doc.addPage();
    y = 24;
  }

  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(16, y, 84, 48, 3, 3, "FD");
  doc.addImage(qrCode, "PNG", 22, y + 7, 28, 28);

  doc.setFont(undefined, "bold");
  doc.setFontSize(9);
  impostaColore(doc, COLORI.inchiostro);
  testo(doc, "QR documento", 56, y + 17);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  impostaColore(doc, COLORI.tenue);
  testo(doc, "Riepilogo rapido preventivo", 56, y + 24, { maxWidth: 36 });

  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(106, y, 88, 48, 3, 3, "FD");
  doc.setFont(undefined, "bold");
  doc.setFontSize(9);
  impostaColore(doc, COLORI.inchiostro);
  testo(doc, "Note", 112, y + 10);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  impostaColore(doc, COLORI.testo);
  testo(doc, note || "-", 112, y + 18, { maxWidth: 74 });

  return y + 60;
}

function scriviFirme(doc, y) {
  if (y > 246) {
    doc.addPage();
    y = 28;
  }

  doc.setFont(undefined, "bold");
  doc.setFontSize(9);
  impostaColore(doc, COLORI.tenue);
  testo(doc, "FIRME", 16, y);

  impostaBordo(doc, COLORI.bordo);
  doc.line(16, y + 24, 86, y + 24);
  doc.line(124, y + 24, 194, y + 24);

  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  impostaColore(doc, COLORI.testo);
  testo(doc, "Firma cliente", 16, y + 31);
  testo(doc, "Firma incaricato", 124, y + 31);
}

export async function generaPdfPreventivo({
  preventivo,
  datiAzienda,
  cliente,
  stato,
  lavorazioni,
  validita,
  pagamento,
  note,
  sconto,
  iva,
  acconto = 0,
  totali,
}) {
  const doc = new jsPDF();
  const numero = preventivo.numero || `PREV-${preventivo.id}`;
  const qrCode = await creaQrCode({ numero, cliente, preventivo, totali, acconto });

  scriviHeader(doc, { datiAzienda, numero, preventivo, cliente, stato });
  scriviDettagliDocumento(doc, { validita, pagamento });

  let y = 122;
  scriviIntestazioneTabella(doc, y);
  y = scriviRigheLavorazioni(doc, lavorazioni, y + 16);
  y = scriviRiepilogo(doc, { totali, sconto, iva, acconto }, y + 6);
  y = scriviQrENote(doc, { qrCode, note }, y);
  scriviFirme(doc, y);

  doc.save(`${numero}-${cliente || "cliente"}.pdf`);
}
