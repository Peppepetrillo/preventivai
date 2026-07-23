import jsPDF from "jspdf";
import QRCode from "qrcode";
import { calcolaSaldo, formatEuro, normalizzaNumero } from "../utils/preventivi";

/** A4 utile: ~297mm. Layout compatto per 1 pagina su preventivi brevi. */
const PAGINA = {
  altezza: 297,
  margineBasso: 14,
  rigaLavorazione: 9,
  sogliaNuovaPaginaTabella: 248,
};

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

function spazioRimanente(y) {
  return PAGINA.altezza - PAGINA.margineBasso - y;
}

function assicuratiSpazio(doc, y, necessario) {
  if (spazioRimanente(y) >= necessario) return y;
  doc.addPage();
  return 16;
}

function aggiungiLogo(doc, datiAzienda, x, y, lato) {
  if (!datiAzienda.logo) {
    impostaRiempimento(doc, COLORI.primario);
    doc.roundedRect(x, y, lato, lato, 2.5, 2.5, "F");
    impostaColore(doc, COLORI.inchiostro);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    testo(doc, "P", x + lato / 2, y + lato / 2 + 3.5, { align: "center" });
    return;
  }

  try {
    const formatoLogo = datiAzienda.logo.includes("image/jpeg") ? "JPEG" : "PNG";
    doc.addImage(datiAzienda.logo, formatoLogo, x, y, lato, lato);
  } catch {
    impostaRiempimento(doc, COLORI.primario);
    doc.roundedRect(x, y, lato, lato, 2.5, 2.5, "F");
  }
}

/**
 * Header compatto (~34mm) — riduce il salto a pagina 2 sui preventivi piccoli.
 */
function scriviHeader(doc, { datiAzienda, numero, preventivo, cliente, stato }) {
  impostaRiempimento(doc, COLORI.inchiostro);
  doc.rect(0, 0, 210, 34, "F");

  aggiungiLogo(doc, datiAzienda, 14, 8, 18);

  impostaColore(doc, COLORI.bianco);
  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  testo(doc, datiAzienda.nomeDitta || "PreventivAI", 36, 16);

  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  testo(doc, `Tel. ${datiAzienda.telefono || "-"} · ${datiAzienda.email || "-"}`, 36, 24, {
    maxWidth: 100,
  });

  impostaRiempimento(doc, COLORI.primario);
  doc.roundedRect(152, 9, 44, 16, 2.5, 2.5, "F");
  impostaColore(doc, COLORI.inchiostro);
  doc.setFont(undefined, "bold");
  doc.setFontSize(9);
  testo(doc, stato || "Bozza", 174, 16, { align: "center" });
  doc.setFontSize(7);
  testo(doc, "STATO", 174, 21.5, { align: "center" });

  impostaColore(doc, COLORI.inchiostro);
  doc.setFont(undefined, "bold");
  doc.setFontSize(18);
  testo(doc, "Preventivo", 14, 44);

  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  impostaColore(doc, COLORI.tenue);
  testo(doc, `${numero} · ${preventivo.data || "-"}`, 14, 51);

  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(118, 38, 78, 18, 2.5, 2.5, "FD");

  doc.setFont(undefined, "bold");
  impostaColore(doc, COLORI.inchiostro);
  doc.setFontSize(8);
  testo(doc, "Cliente", 124, 46);
  doc.setFont(undefined, "normal");
  impostaColore(doc, COLORI.testo);
  doc.setFontSize(10);
  testo(doc, cliente || "-", 124, 52, { maxWidth: 68 });
}

function scriviDettagliDocumento(doc, { validita, pagamento }) {
  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(14, 60, 182, 14, 2.5, 2.5, "FD");

  doc.setFontSize(8);
  doc.setFont(undefined, "bold");
  impostaColore(doc, COLORI.tenue);
  testo(doc, "VALIDITÀ", 20, 66);
  testo(doc, "PAGAMENTO", 70, 66);

  doc.setFont(undefined, "normal");
  impostaColore(doc, COLORI.inchiostro);
  testo(doc, `${validita || 0} gg`, 20, 71);
  testo(doc, pagamento || "-", 70, 71, { maxWidth: 118 });
}

function scriviIntestazioneTabella(doc, y) {
  impostaRiempimento(doc, COLORI.inchiostro);
  doc.roundedRect(14, y, 182, 8, 2, 2, "F");

  impostaColore(doc, COLORI.bianco);
  doc.setFont(undefined, "bold");
  doc.setFontSize(7.5);
  testo(doc, "DESCRIZIONE", 18, y + 5.5);
  testo(doc, "Q.TÀ", 114, y + 5.5, { align: "right" });
  testo(doc, "PREZZO", 148, y + 5.5, { align: "right" });
  testo(doc, "TOTALE", 190, y + 5.5, { align: "right" });
}

function nuovaPaginaConTabella(doc) {
  doc.addPage();
  scriviIntestazioneTabella(doc, 14);
  return 28;
}

function scriviRigheLavorazioni(doc, lavorazioni, yIniziale) {
  let y = yIniziale;
  const passo = PAGINA.rigaLavorazione;

  lavorazioni.forEach((item, index) => {
    if (y > PAGINA.sogliaNuovaPaginaTabella) {
      y = nuovaPaginaConTabella(doc);
    }

    if (index % 2 === 0) {
      impostaRiempimento(doc, [250, 251, 253]);
      doc.rect(14, y - 5, 182, passo, "F");
    }

    const totaleRiga =
      normalizzaNumero(item.quantita) * normalizzaNumero(item.prezzo);

    doc.setFont(undefined, "normal");
    doc.setFontSize(8.5);
    impostaColore(doc, COLORI.inchiostro);
    testo(doc, String(item.nome || "Lavorazione").slice(0, 52), 18, y);
    impostaColore(doc, COLORI.testo);
    testo(doc, `${item.quantita || 0} ${item.unita || ""}`.trim(), 114, y, {
      align: "right",
    });
    testo(doc, euro(item.prezzo), 148, y, { align: "right" });
    doc.setFont(undefined, "bold");
    testo(doc, euro(totaleRiga), 190, y, { align: "right" });

    y += passo;
  });

  return y;
}

function scriviRigaTotale(doc, label, valore, y, evidenza = false) {
  doc.setFont(undefined, evidenza ? "bold" : "normal");
  doc.setFontSize(evidenza ? 11 : 8.5);
  impostaColore(doc, evidenza ? COLORI.inchiostro : COLORI.testo);
  testo(doc, label, 122, y);
  testo(doc, valore, 190, y, { align: "right" });
}

function altezzaBloccoRiepilogo() {
  return 52;
}

function scriviRiepilogo(doc, { totali, sconto, iva, acconto }, y) {
  const saldo = calcolaSaldo(totali.totale, acconto);
  const h = altezzaBloccoRiepilogo();
  y = assicuratiSpazio(doc, y, h + 4);

  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(114, y, 82, h, 2.5, 2.5, "FD");

  let riga = y + 8;
  scriviRigaTotale(doc, "Subtotale", euro(totali.subtotale), riga);
  riga += 7;
  scriviRigaTotale(doc, `Sconto ${sconto || 0}%`, `- ${euro(totali.importoSconto)}`, riga);
  riga += 7;
  scriviRigaTotale(doc, "Imponibile", euro(totali.imponibile), riga);
  riga += 7;
  scriviRigaTotale(doc, `IVA ${iva || 0}%`, euro(totali.importoIva), riga);
  riga += 7;

  impostaBordo(doc, COLORI.bordo);
  doc.line(122, riga - 3, 188, riga - 3);
  scriviRigaTotale(doc, "Totale", euro(totali.totale), riga, true);
  riga += 7;
  scriviRigaTotale(doc, "Acconto", euro(acconto), riga);
  riga += 7;
  scriviRigaTotale(doc, "Saldo", euro(saldo), riga, true);

  return y + h + 4;
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
    width: 128,
    color: {
      dark: "#131a29",
      light: "#ffffff",
    },
  });
}

function altezzaBloccoQrNote() {
  return 40;
}

function scriviQrENote(doc, { qrCode, note }, y) {
  const h = altezzaBloccoQrNote();
  y = assicuratiSpazio(doc, y, h + 4);

  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(14, y, 92, h, 2.5, 2.5, "FD");
  doc.addImage(qrCode, "PNG", 18, y + 6, 24, 24);

  doc.setFont(undefined, "bold");
  doc.setFontSize(8);
  impostaColore(doc, COLORI.inchiostro);
  testo(doc, "QR documento", 46, y + 14);
  doc.setFont(undefined, "normal");
  doc.setFontSize(7);
  impostaColore(doc, COLORI.tenue);
  testo(doc, "Riepilogo rapido", 46, y + 20, { maxWidth: 54 });

  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(110, y, 86, h, 2.5, 2.5, "FD");
  doc.setFont(undefined, "bold");
  doc.setFontSize(8);
  impostaColore(doc, COLORI.inchiostro);
  testo(doc, "Note", 116, y + 9);
  doc.setFont(undefined, "normal");
  doc.setFontSize(7.5);
  impostaColore(doc, COLORI.testo);
  testo(doc, note || "-", 116, y + 16, { maxWidth: 74 });

  return y + h + 4;
}

/**
 * Riepilogo a destra + QR/note a sinistra sulla stessa riga (risparmia una pagina).
 */
function scriviRiepilogoConQr(
  doc,
  { totali, sconto, iva, acconto, qrCode, note },
  y
) {
  const h = Math.max(altezzaBloccoRiepilogo(), altezzaBloccoQrNote());
  y = assicuratiSpazio(doc, y, h + 6);

  // QR + note (sinistra, più stretto)
  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(14, y, 94, h, 2.5, 2.5, "FD");
  doc.addImage(qrCode, "PNG", 18, y + 8, 22, 22);
  doc.setFont(undefined, "bold");
  doc.setFontSize(8);
  impostaColore(doc, COLORI.inchiostro);
  testo(doc, "QR · Note", 44, y + 14);
  doc.setFont(undefined, "normal");
  doc.setFontSize(7);
  impostaColore(doc, COLORI.testo);
  testo(doc, note || "Nessuna nota", 44, y + 21, { maxWidth: 58 });

  // Riepilogo (destra)
  const saldo = calcolaSaldo(totali.totale, acconto);
  impostaRiempimento(doc, COLORI.fondo);
  impostaBordo(doc, COLORI.bordo);
  doc.roundedRect(112, y, 84, h, 2.5, 2.5, "FD");

  let riga = y + 8;
  scriviRigaTotale(doc, "Subtotale", euro(totali.subtotale), riga);
  riga += 6.5;
  scriviRigaTotale(doc, `Sconto ${sconto || 0}%`, `- ${euro(totali.importoSconto)}`, riga);
  riga += 6.5;
  scriviRigaTotale(doc, "Imponibile", euro(totali.imponibile), riga);
  riga += 6.5;
  scriviRigaTotale(doc, `IVA ${iva || 0}%`, euro(totali.importoIva), riga);
  riga += 6.5;
  impostaBordo(doc, COLORI.bordo);
  doc.line(120, riga - 2.5, 188, riga - 2.5);
  scriviRigaTotale(doc, "Totale", euro(totali.totale), riga, true);
  riga += 6.5;
  scriviRigaTotale(doc, "Acconto", euro(acconto), riga);
  riga += 6.5;
  scriviRigaTotale(doc, "Saldo", euro(saldo), riga, true);

  return y + h + 4;
}

function scriviFirme(doc, y) {
  y = assicuratiSpazio(doc, y, 28);

  doc.setFont(undefined, "bold");
  doc.setFontSize(8);
  impostaColore(doc, COLORI.tenue);
  testo(doc, "FIRME", 14, y);

  impostaBordo(doc, COLORI.bordo);
  doc.line(14, y + 18, 88, y + 18);
  doc.line(122, y + 18, 196, y + 18);

  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  impostaColore(doc, COLORI.testo);
  testo(doc, "Firma cliente", 14, y + 24);
  testo(doc, "Firma incaricato", 122, y + 24);
}

/**
 * @returns {number} numero pagine dopo generazione (prima del save)
 */
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
  salva = true,
}) {
  const doc = new jsPDF();
  const numero = preventivo.numero || `PREV-${preventivo.id}`;
  const qrCode = await creaQrCode({ numero, cliente, preventivo, totali, acconto });
  const elenco = Array.isArray(lavorazioni) ? lavorazioni : [];

  scriviHeader(doc, { datiAzienda, numero, preventivo, cliente, stato });
  scriviDettagliDocumento(doc, { validita, pagamento });

  let y = 80;
  scriviIntestazioneTabella(doc, y);
  y = scriviRigheLavorazioni(doc, elenco, y + 12);

  const spazioDopoTabella = spazioRimanente(y + 4);
  const serveAffiancato =
    elenco.length <= 12 &&
    spazioDopoTabella >= Math.max(altezzaBloccoRiepilogo(), altezzaBloccoQrNote()) + 32;

  if (serveAffiancato) {
    y = scriviRiepilogoConQr(
      doc,
      { totali, sconto, iva, acconto, qrCode, note },
      y + 4
    );
  } else {
    y = scriviRiepilogo(doc, { totali, sconto, iva, acconto }, y + 4);
    y = scriviQrENote(doc, { qrCode, note }, y);
  }

  scriviFirme(doc, y);

  const pagine = doc.getNumberOfPages();

  if (salva) {
    doc.save(`${numero}-${cliente || "cliente"}.pdf`);
  }

  return { doc, pagine };
}
